# Chương 29 — Một chart, hai môi trường

## Đầu tuần

`project/infs/` giờ có mười hai file: `postgres.yaml`, `postgres-pvc.yaml`, `postgres-secret.yaml`, `chat-api-deployment.yaml`, `chat-api-service.yaml`, `chat-api-secret.yaml`, `redis.yaml`, `frontend-deployment.yaml`, `ingress.yaml`, `ai-workspace-alerts.yaml`, `argocd-application.yaml`, `kind-config.yaml`. Founder hỏi một câu mới: có dựng được một bản y hệt để team QA test riêng không, tách khỏi bản đang chạy hằng ngày?

Copy cả thư mục, đổi vài chỗ (`replicas`, `resources`, tên namespace) — làm được, nhưng từ nay mỗi lần sửa `chat-api-deployment.yaml` thật, phải nhớ sửa luôn bản copy, không ai đảm bảo hai bản không lệch nhau sau vài tuần. Đúng vấn đề Helm được sinh ra để giải quyết — không phải chỉ để cài chart người khác viết như mấy lần trước, mà để **viết chart của chính mình**.

### Từ file tĩnh sang template

Một chart tối thiểu cần đúng hai thứ: `Chart.yaml` (khai tên, version) và thư mục `templates/` chứa các file YAML, chỉ khác YAML thường ở chỗ có thể chèn biến.

```yaml
# project/chart/Chart.yaml
apiVersion: v2
name: ai-workspace
version: 0.1.0
```

Lấy `chat-api-deployment.yaml`, thay các con số hay đổi giữa môi trường bằng biến.

```yaml
# project/chart/templates/chat-api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-api
  namespace: {{ .Values.namespace }}
spec:
  replicas: {{ .Values.chatApi.replicas }}
  selector:
    matchLabels:
      app: chat-api
  template:
    metadata:
      labels:
        app: chat-api
    spec:
      containers:
        - name: chat-api
          image: "{{ .Values.chatApi.image }}:{{ .Values.chatApi.tag }}"
          resources:
            requests:
              cpu: {{ .Values.chatApi.resources.requests.cpu }}
              memory: {{ .Values.chatApi.resources.requests.memory }}
            limits:
              cpu: {{ .Values.chatApi.resources.limits.cpu }}
              memory: {{ .Values.chatApi.resources.limits.memory }}
```

`{{ .Values.xxx }}` — cú pháp template của Helm (nền Go template), điền giá trị thật từ file `values.yaml` vào đúng chỗ lúc `helm install`/`helm template` chạy. YAML sau khi render ra vẫn là YAML Kubernetes bình thường, không có gì bí ẩn cả — chỉ là sinh ra từ một khuôn thay vì gõ tay từng bản.

```yaml
# project/chart/values.yaml — bản mặc định, coi như "production"
namespace: ai-workspace
chatApi:
  image: ghcr.io/khapu2906/kubernetes-odyssey/chat-api
  tag: latest
  replicas: 3
  resources:
    requests: { cpu: 100m, memory: 128Mi }
    limits: { cpu: 250m, memory: 256Mi }
```

```yaml
# project/chart/values-staging.yaml — chỉ ghi những gì KHÁC với mặc định
namespace: ai-workspace-staging
chatApi:
  replicas: 1
  resources:
    requests: { cpu: 50m, memory: 64Mi }
    limits: { cpu: 100m, memory: 128Mi }
```

`values-staging.yaml` không lặp lại toàn bộ — chỉ ghi phần lệch so với `values.yaml` mặc định, Helm tự gộp hai file lại (file sau ghi đè file trước).

### Một lệnh, hai môi trường

```bash
helm install ai-workspace ./project/chart -n ai-workspace --create-namespace
helm install ai-workspace-staging ./project/chart \
  -f project/chart/values-staging.yaml \
  -n ai-workspace-staging --create-namespace
```

```
NAME: ai-workspace
STATUS: deployed
---
NAME: ai-workspace-staging
STATUS: deployed
```

```bash
kubectl get deployment chat-api -n ai-workspace-staging
```

```
NAME       READY   UP-TO-DATE   AVAILABLE
chat-api   1/1     1            1
```

Đúng một `replicas: 1` như khai trong `values-staging.yaml`, trong khi bản `ai-workspace` gốc vẫn chạy `3`. Cùng một chart, cùng một nguồn sự thật, hai bản chạy song song không đụng nhau — nhờ namespace khác và giá trị khác, không phải nhờ hai bộ file YAML tách rời.

### ArgoCD giờ trỏ vào chart, không phải thư mục nữa

```yaml
# project/infs/argocd-application.yaml
spec:
  source:
    repoURL: https://github.com/khapu2906/kubernetes-odyssey
    path: project/chart
    helm:
      valueFiles:
        - values.yaml
```

Chỉ sửa đúng `path` và thêm `helm.valueFiles` — ArgoCD hỗ trợ Helm chart làm nguồn ngay từ đầu, không cần thêm plugin gì. Bản `staging` có thể khai một `Application` thứ hai, cùng chart, khác `valueFiles` và `destination.namespace`.

Mở lại ghi chú, thêm một dòng không nằm trong ba dòng cũ nữa.

```
project/infs giờ là một Helm chart thật (project/chart), không
còn 12 file rời rạc. Một bộ giá trị mặc định, một bộ lệch cho
staging — hai môi trường từ đúng một nguồn. ArgoCD trỏ Helm
chart trực tiếp, không qua thư mục YAML tĩnh nữa.
```

Không giải quyết dòng cuối cùng còn treo từ nhiều tuần trước — "chạy được ở đâu đó ngoài laptop này" — nhưng giờ có `ai-workspace-staging` đứng cạnh `ai-workspace`, cùng trên một cluster. Bước đầu tiên để nghĩ tới chuyện có nhiều hơn một cluster, trước khi nghĩ tới việc một trong số đó nằm ở một nơi khác hẳn.
