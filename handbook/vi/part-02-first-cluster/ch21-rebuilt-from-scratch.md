# Chương 21 — Xây lại từ đầu

## Cuối tuần đó

Ghi chú tối qua vẫn còn nguyên: cần một cách để người ngoài cluster gọi vào được, không cần `kubectl`. Bạn tìm được đúng cái tên: `Ingress`.

```bash
kubectl explain ingress
```

```
KIND:     Ingress
VERSION:  networking.k8s.io/v1

DESCRIPTION:
    Ingress is a collection of rules that allow inbound connections to
    reach the endpoints defined by a backend.
```

Đọc thêm vài bài, hiểu ra `Ingress` chỉ là **luật** — bản thân nó không tự chạy được gì, cần có một `Ingress Controller` (thường là Nginx đóng gói riêng cho việc này) thật sự đứng ra lắng nghe port 80/443, đọc luật, rồi route request tới đúng Service.

### Cái bẫy chỉ có trên `kind`

Tìm cách cài `ingress-nginx` cho `kind`, thấy ngay một dòng cảnh báo trong hướng dẫn chính thức: cluster `kind` bình thường **không mở port 80/443** ra máy host — muốn Ingress Controller thật sự truy cập được từ bên ngoài container node, cluster phải được tạo với cấu hình đặc biệt, khai báo sẵn `extraPortMappings` ngay từ lệnh `kind create cluster`.

Cluster hiện tại được tạo từ buổi sáng đầu tiên, bằng đúng một dòng:

```bash
kind create cluster --name ai-workspace
```

Không có `extraPortMappings` nào cả. Không có lệnh `kind` nào để "thêm" port mapping vào cluster đã tồn tại — cấu hình đó chỉ được đọc đúng một lần, lúc tạo cluster. Muốn có, phải xoá cluster này, tạo lại từ đầu.

Bụng bạn thắt lại một chút. Cluster này đã sống 3 tuần, đang giữ dữ liệu Postgres thật — không phải dữ liệu test rỗng như hồi mới bắt đầu nữa.

### Sao lưu trước khi làm gì liều lĩnh

```bash
kubectl exec -it postgres-6b7d4f8c9-p3wln -n ai-workspace -- \
  pg_dump -U postgres aiworkspace > backup.sql
```

Một file `.sql` thuần text, chứa toàn bộ `users`, `documents`, `conversations` hiện có. Mở thử vài dòng đầu, thấy đúng các câu lệnh `INSERT` quen mắt.

### Xoá cluster, tạo lại với cấu hình đúng

```bash
kind delete cluster --name ai-workspace
```

```
Deleting cluster "ai-workspace" ...
```

Không do dự được nữa — cluster đã mất, cùng với mọi Pod, mọi Service, mọi thứ từng gõ tay suốt 3 tuần qua. Viết file cấu hình mới, `kind-config.yaml`:

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    kubeadmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
        protocol: TCP
      - containerPort: 443
        hostPort: 443
        protocol: TCP
```

```bash
kind create cluster --name ai-workspace --config kind-config.yaml
```

Cluster mới, hoàn toàn trống — không namespace `ai-workspace`, không Deployment, không gì cả, y hệt sáng đầu tiên dựng cluster này.

### Dựng lại toàn bộ — và nhận ra điều đó dễ hơn tưởng

```bash
kubectl create namespace ai-workspace
kubectl apply -f postgres-secret.yaml -f chat-api-secret.yaml
kubectl apply -f postgres-pvc.yaml
kubectl apply -f postgres.yaml
kubectl apply -f redis.yaml
kubectl apply -f chat-api-deployment.yaml
kubectl apply -f frontend-deployment.yaml
```

Không phải nhớ lại xem đã cấu hình gì — mọi thứ vẫn nằm nguyên trong các file `.yaml` đã viết từ suốt 3 tuần qua, mỗi file một object, mỗi lần `apply` một dòng lệnh. Đúng điều học được hồi mới viết YAML: viết file trước, `apply` sau — giờ mới thấy hết giá trị thật của nó. Cluster có thể xoá sạch, nhưng **mô tả** về cluster đó chưa từng nằm trong cluster — nó nằm trong Git, sống sót qua chuyện vừa xảy ra mà không hề hấn gì.

Thứ duy nhất KHÔNG nằm trong bất kỳ file YAML nào: dữ liệu thật bên trong Postgres. Khôi phục lại từ bản backup.

```bash
kubectl exec -i postgres-<pod-mới> -n ai-workspace -- \
  psql -U postgres aiworkspace < backup.sql
```

```bash
kubectl exec -it postgres-<pod-mới> -n ai-workspace -- \
  psql -U postgres -d aiworkspace -c "SELECT count(*) FROM conversations;"
```

```
 count
-------
    17
```

Đúng số dòng như trước khi xoá. Cấu hình thì tự động dựng lại từ YAML; dữ liệu thì phải tự tay sao lưu/khôi phục — hai thứ khác nhau hoàn toàn, không cái nào thay được cái kia.

### Cài `ingress-nginx`, viết luật routing

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

Đúng bản dành riêng cho `kind` — dùng `hostPort` thay vì `LoadBalancer` (thứ chỉ có ý nghĩa trên cloud thật), khớp với `extraPortMappings` vừa khai báo.

Bắt đầu viết luật routing, gõ tới dòng trỏ vào Service `chat-api` thì khựng lại — làm gì có Service nào tên vậy. Từ hồi Chương 9 tới giờ, `chat-api` chưa từng cần Service, chỉ toàn `port-forward` thẳng vào Deployment, vì trong cluster chưa ai gọi tới nó cả. Giờ mới có kẻ đầu tiên cần gọi: chính `ingress-nginx`. Viết thêm một Service, đơn giản như đã làm với `postgres` hồi đó.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: chat-api
  namespace: ai-workspace
spec:
  selector:
    app: chat-api
  ports:
    - port: 8080
      targetPort: 8080
```

```bash
kubectl apply -f chat-api-service.yaml
```

```
service/chat-api created
```

Giờ mới viết `Ingress`, trỏ đúng vào Service vừa tạo.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-workspace
  namespace: ai-workspace
spec:
  ingressClassName: nginx
  rules:
    - http:
        paths:
          - path: /health
            pathType: Exact
            backend:
              service:
                name: chat-api
                port:
                  number: 8080
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: chat-api
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 3000
```

`/health` khai riêng một dòng, `pathType: Exact` — route `/health` trong `chat-api` chưa từng mang tiền tố `/api` (viết từ hồi Chương 13, trước khi có Ingress), nên phải khai đúng path thật, không thể gộp chung vào luật `/api`. `/api` khai trước `/` — request `/api/chat` khớp cả hai luật, nhưng `ingress-nginx` tự ưu tiên đường dẫn khớp dài/cụ thể hơn, dù thứ tự viết trong file không thật sự bắt buộc theo đúng nghĩa đó.

```bash
kubectl apply -f ingress.yaml
```

### Lần đầu tiên gọi vào mà không cần `kubectl` gì cả

```bash
curl http://localhost/health
```

```json
{"status":"ok"}
```

Không `port-forward`, không cờ `-n`, không cần biết cluster tên gì. Đúng request curl bình thường, đi qua port 80 thật trên máy — cổng đó giờ đã được `kind` map thẳng vào container node, container node route qua `ingress-nginx`, `ingress-nginx` đọc luật vừa viết, chuyển tới đúng Service.

Sửa nốt `API_URL` trong `frontend/src/App.jsx` — không còn hardcode `http://localhost:8080` nữa, để trống, gọi tương đối theo đúng domain trang đang tải.

```js
const API_URL = "";
```

Build lại, load vào cluster mới, apply lại `frontend-deployment.yaml`. Mở trình duyệt vào `http://localhost/` — không mở port-forward nào, không có gì đang chạy ngầm trên máy ngoài chính `kind` — giao diện hiện ra.

Gõ thử một câu hỏi, `chat-api` trả về `401` — vẫn còn nguyên vấn đề đã ghi hôm qua: `frontend` chưa có màn hình đăng nhập, chưa biết lưu token ở đâu. Không phải hôm nay giải quyết. Nhưng phần networking — phần khiến bạn phải xoá cả cluster để làm cho đúng — coi như xong.

### Điều còn giới hạn, nói thẳng

`http://localhost/` chỉ có nghĩa trên chính máy bạn — một khách hàng ở xa gõ đúng địa chỉ đó trên máy họ vẫn chẳng thấy gì, vì "localhost" của họ khác "localhost" của bạn. Cluster `kind` là một cluster thật, nhưng vẫn chỉ chạy trên một laptop — không có địa chỉ IP công khai nào để cả thế giới gọi vào. Muốn thật sự expose ra internet, cần một cluster chạy trên hạ tầng có địa chỉ công khai (cloud) và một `LoadBalancer` Service thật — câu chuyện của một chương khác, không phải hôm nay.

Ghi lại một dòng cuối:

```
Ingress hoạt động đúng trên kind, nhưng http://localhost vẫn
chỉ mình máy mình thấy. Expose thật ra internet cần cluster
trên cloud + LoadBalancer thật — chưa phải bây giờ. Frontend
vẫn 401 vì chưa có login UI, ghi hôm qua, vẫn còn đó.
```

Đóng laptop. Cluster đã khác hẳn cluster sáng nay — cùng một cái tên, `ai-workspace`, nhưng là một cluster hoàn toàn mới, dựng lại từ những file chưa từng đổi.
