# Chương 14 — Không đủ chỗ

## Hôm sau

Chỉ còn hai dòng chưa đụng tới trong danh sách chín dòng ba tuần trước: scheduling, và observability. Observability để đó — mấy bài đọc được vẫn mỗi nơi nói một kiểu, chưa đủ tự tin bắt tay vào. Scheduling thì khác, bạn nhớ ngay tới buổi sáng đầu tiên với cluster, dòng ghi chú viết tay:

```
Note to self: "control plane" isn't a fuzzy concept.
It's 4-5 specific pods, running in the kube-system
namespace. Just saw them with my own eyes.
```

`kube-scheduler` nằm trong đó, nhưng tới giờ bạn chưa từng thấy nó *quyết định* gì cả — cluster chỉ có một node, đặt Pod vào đâu cũng chỉ có một chỗ để chọn. Không có gì để "chọn" thật sự. Tò mò, bạn tra xem cái quyết định đó dựa trên cơ sở nào.

```bash
kubectl explain deployment.spec.template.spec.containers.resources
```

```
KIND:     Deployment
VERSION:  apps/v1

FIELD:    resources <Object>

DESCRIPTION:
    Compute Resources required by this container.

    FIELDS:
      limits	<map[string]string>
      requests	<map[string]string>
```

`requests` — con số Scheduler nhìn vào để quyết định node còn đủ chỗ hay không. `limits` — trần container không được vượt qua lúc chạy thật. Hai cái khác nhau, một cái ảnh hưởng lúc *đặt* Pod, một cái ảnh hưởng lúc Pod *đang chạy*.

Bạn thêm một cặp số hợp lý vào cả hai Deployment, ước chừng theo cỡ một app Node.js nhỏ.

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "250m"
    memory: "256Mi"
```

```bash
kubectl apply -f chat-api-deployment.yaml -f postgres.yaml
kubectl get pods -n ai-workspace
```

```
NAME                          READY   STATUS    RESTARTS   AGE
chat-api-8f6c9d7b5-4nvxr      1/1     Running   0          9s
chat-api-8f6c9d7b5-h2qkm      1/1     Running   0          9s
chat-api-8f6c9d7b5-wz8lt      1/1     Running   0          9s
postgres-6b7d4f8c9-p3wln      1/1     Running   0          6d
```

Vẫn `Running` hết, chẳng có gì khác biệt để nhìn thấy. Số bạn ghi quá nhỏ so với node để tạo ra sự khác biệt nào. Bạn muốn thấy Scheduler thật sự *từ chối* một lần, xem thông báo trông ra sao. Trước tiên, xem node này thật ra có bao nhiêu để cho.

```bash
kubectl describe node ai-workspace-control-plane | grep -A6 "Allocatable:"
```

```
Allocatable:
  cpu:                6
  ephemeral-storage:  253725Mi
  memory:             7841234Ki
  pods:               110
```

`7841234Ki`, tầm 7.5Gi. Bạn sửa tạm `chat-api-deployment.yaml`, xin `requests.memory: "64Gi"` — nhiều gấp cả chục lần cái node có, chỉ để xem chuyện gì xảy ra. `limits.memory` để nguyên `256Mi`, chưa nghĩ tới.

```bash
kubectl apply -f chat-api-deployment.yaml
```

```
The Deployment "chat-api" is invalid: spec.template.spec.containers[0].resources.requests:
Invalid value: "64Gi": must be less than or equal to memory limit of 256Mi
```

Chưa tới lượt Scheduler nói gì cả — bị chặn ngay từ cửa. `requests` không được phép lớn hơn `limits` của chính resource đó, API server kiểm tra cái này ngay lúc nhận YAML, trước khi kịp lưu vào etcd. Xin nhiều hơn node có là một chuyện, xin nhiều hơn cả cái trần bạn tự đặt cho chính container là chuyện khác — hai lớp kiểm tra khác nhau. Bạn sửa luôn `limits.memory` lên `64Gi` theo, để hai con số không còn mâu thuẫn nhau nữa.

```bash
kubectl apply -f chat-api-deployment.yaml
kubectl get pods -n ai-workspace
```

```
NAME                          READY   STATUS    RESTARTS   AGE
chat-api-7c9f6d8b4-2mwxz      0/1     Pending   0          8s
chat-api-8f6c9d7b5-h2qkm      1/1     Running   0          4m
chat-api-8f6c9d7b5-wz8lt      1/1     Running   0          4m
postgres-6b7d4f8c9-p3wln      1/1     Running   0          6d
```

`Pending`. Không `ContainerCreating`, không `ErrImagePull` — đứng nguyên tại chỗ, chưa từng được gán vào node nào cả. `describe` để xem lý do.

```bash
kubectl describe pod chat-api-7c9f6d8b4-2mwxz -n ai-workspace | grep -A3 "Events:"
```

```
Events:
  Type     Reason            Age   From               Message
  ----     ------            ----  ----                -------
  Warning  FailedScheduling  10s   default-scheduler   0/1 nodes are
  available: 1 Insufficient memory. preemption: 0/1 nodes are
  available: 1 No preemption victims found for incoming pod.
```

`default-scheduler` — đúng cái tên Pod bạn từng thấy trong `kube-system` từ sáng đầu tiên, giờ mới thật sự lên tiếng. `0/1 nodes are available` — không phải image sai, không phải postgres sập, chỉ đơn giản là không có node nào đủ chỗ cho con số bạn vừa xin. Ba Pod cũ vẫn `Running` bình thường, vì chúng được tạo trước, node đã cấp chỗ cho chúng từ lúc `requests` còn hợp lý — chỉ riêng bản mới, vừa sinh ra đã bị chặn ngay từ vòng xét duyệt đầu tiên.

Bạn sửa lại cả `requests.memory` lẫn `limits.memory` về đúng `128Mi`/`256Mi` như cũ, `apply` lần nữa.

```bash
kubectl apply -f chat-api-deployment.yaml
kubectl get pods -n ai-workspace
```

```
NAME                          READY   STATUS    RESTARTS   AGE
chat-api-8f6c9d7b5-4nvxr      1/1     Running   0          6m
chat-api-8f6c9d7b5-h2qkm      1/1     Running   0          6m
chat-api-8f6c9d7b5-wz8lt      1/1     Running   0          6m
postgres-6b7d4f8c9-p3wln      1/1     Running   0          6d
```

Pod `Pending` biến mất, thay bằng một bản `Running` bình thường — đúng số lượng ba, ReplicaSet vẫn làm đúng việc của nó, chỉ là lần này Scheduler chịu gật đầu.

Bạn mở ghi chú, gạch thêm một dòng.

```
Need scheduling ✓ Scheduler dựa vào "requests" để quyết định
node còn đủ chỗ không — xin quá tay thì Pod đứng "Pending"
mãi, không lỗi, không crash, chỉ đơn giản chưa ai nhận. Trên
cluster 1 node như hiện tại, chưa có gì để "chọn giữa nhiều
node" cả — cái đó chỉ thật sự có ý nghĩa khi có nhiều hơn một
node để so.
```

Chín dòng ba tuần trước, giờ tám dòng đã có dấu ✓. Còn đúng một dòng cuối cùng — `???`, observability — vẫn y nguyên như đêm đầu tiên đọc README.
