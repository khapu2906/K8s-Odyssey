# Chương 30 — Hai cluster, một chỗ nhìn

## Cuối tuần

`ai-workspace-staging` chạy chung cluster với `ai-workspace` mấy ngày nay, chỉ khác namespace. Founder hỏi một câu khiến bạn khựng lại: QA team lỡ tay chạy một job nặng làm hết CPU của node, cả hai namespace — kể cả bản chính đang chạy thật — cùng chậm theo. Namespace tách được tên, tách được nhãn, nhưng không tách được node vật lý đứng sau. Muốn cách ly thật, cần một cluster khác hẳn, không chỉ một namespace khác.

```bash
kind create cluster --name ai-workspace-staging --config kind-config.yaml
```

```
Creating cluster "ai-workspace-staging" ...
Set kubectl context to "kind-ai-workspace-staging"
```

Giờ có hai cluster thật, không phải hai namespace nữa. Nhưng ngay lập tức lộ ra một vấn đề khác.

```bash
kubectl config get-contexts
```

```
CURRENT   NAME                          CLUSTER
          kind-ai-workspace             kind-ai-workspace
*         kind-ai-workspace-staging     kind-ai-workspace-staging
```

Gõ nhầm `kubectl apply -f ...` khi context đang trỏ vào `staging` thay vì `ai-workspace` thật — không báo lỗi gì cả, chỉ lặng lẽ apply nhầm cluster. Dấu `*` là manh mối duy nhất, dễ bỏ sót giữa lúc đang tập trung việc khác.

### Rancher — một nơi quản lý nhiều cluster, không phải kubectl context nữa

Cài Rancher lên đúng cluster `ai-workspace` (dùng làm cluster "quản trị"), qua Helm — đúng công cụ đã quen từ mấy tuần trước.

```bash
helm repo add rancher-stable https://releases.rancher.com/server-charts/stable
helm repo update
kubectl create namespace cattle-system
helm install rancher rancher-stable/rancher \
  --namespace cattle-system \
  --set hostname=rancher.localhost \
  --set bootstrapPassword=admin
```

```
NAME: rancher
STATUS: deployed
```

Mở `https://rancher.localhost` (qua `port-forward svc/rancher -n cattle-system 8443:443`), đăng nhập bằng `bootstrapPassword` vừa khai. Vào mục "Cluster Management" → "Import Existing" — Rancher đưa ra một dòng lệnh `kubectl apply` để chạy trên cluster `staging`, cài một agent nhỏ (`cattle-cluster-agent`) tự động báo cáo trạng thái ngược về Rancher.

```bash
kubectl --context kind-ai-workspace-staging apply -f https://rancher.localhost/v3/import/<token>.yaml
```

Vài phút sau, cluster `staging` xuất hiện trong danh sách của Rancher, cạnh `ai-workspace` — cả hai cùng hiện trên một màn hình, không cần nhớ tên context nào ứng với cluster nào nữa.

### Không còn đoán context bằng dấu `*`

Chọn cluster từ dropdown trên UI Rancher thay vì gõ `kubectl config use-context`, xem Pod, Deployment, log của cả hai cluster ngay trong một trình duyệt — không đổi gì bên dưới cả, Rancher chỉ là một lớp giao diện gọi `kubectl`/API server giùm, đúng namespace/cluster đã chọn rõ ràng trên màn hình, không còn dựa vào một dấu `*` dễ lướt qua.

Mở lại ghi chú, thêm dòng mới.

```
Hai cluster thật (ai-workspace, ai-workspace-staging), quản
lý qua Rancher — không còn tự tin gõ nhầm context nữa, chọn
bằng mắt trên UI. Rancher chạy trên chính ai-workspace, đóng
vai "cluster quản trị".
```

Bụng vẫn còn thắc mắc một điều chưa dám ghi thành dòng "đã xong": cả hai cluster — kể cả cluster đóng vai "quản trị" — vẫn đang chạy trên đúng một cái laptop, trong cùng một Docker daemon. Rancher giải quyết được bài toán "nhiều cluster, một chỗ nhìn", nhưng chưa hề đụng tới câu hỏi cũ nhất còn treo: một trong số các cluster đó có thể nằm ở một nơi khác hẳn cái bàn làm việc này không. Để đó, biết rõ đó vẫn là câu hỏi thật, không phải đã trả lời được.
