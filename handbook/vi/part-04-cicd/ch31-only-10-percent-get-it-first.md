# Chương 31 — Chỉ 10% nhận trước

## Đầu tuần

Bản deploy tối qua có lỗi thật — một điều kiện sai trong `answer.js` khiến `chat-api` trả về lỗi 500 cho khoảng một phần ba câu hỏi. ArgoCD làm đúng việc của nó: thấy Git đổi, apply ngay, `RollingUpdate` thay hết Pod cũ bằng Pod mới trong vài chục giây. Vấn đề không nằm ở tốc độ — nằm ở việc TẤT CẢ traffic đều hứng bản lỗi cùng lúc, không có cách nào cho một phần nhỏ người dùng thử trước.

`Deployment` có `RollingUpdate`, nhưng nó chỉ kiểm soát được **số lượng Pod** thay thế theo thời gian (`maxSurge`, `maxUnavailable`) — không kiểm soát được bao nhiêu phần trăm **request** đi vào bản cũ hay bản mới. Trong lúc rolling update đang diễn ra, tỉ lệ request rơi vào Pod mới hoàn toàn ngẫu nhiên, phụ thuộc `kube-proxy` chọn Pod nào lúc đó, không phải một con số bạn tự quyết định được.

### Istio — thêm một lớp định tuyến, không thay Service

```bash
istioctl install --set profile=default -y
```

```
✔ Istio core installed
✔ Istiod installed
✔ Ingress gateways installed
✔ Installation complete
```

Bật sidecar injection cho namespace `ai-workspace` — mọi Pod tạo sau đó tự động có thêm một container `istio-proxy` (Envoy) đứng trước container thật, chặn hết traffic ra vào để tự quyết định route đi đâu.

```bash
kubectl label namespace ai-workspace istio-injection=enabled
kubectl rollout restart deployment/chat-api -n ai-workspace
```

```bash
kubectl get pods -n ai-workspace -l app=chat-api
```

```
NAME                          READY   STATUS
chat-api-...                  2/2     Running
```

`2/2` — không phải `1/1` nữa. Container thứ hai chính là `istio-proxy`, tự chèn vào, không cần sửa gì trong `chat-api-deployment.yaml`.

### Deploy song song hai bản, gắn nhãn version

Sửa image tag `chat-api` về bản cũ ổn định, gắn nhãn `version: v1`. Deploy thêm một bản riêng cho code mới, `version: v2`, cùng `app: chat-api`, cùng bị Service `chat-api` chọn trúng như nhau (Service chỉ lọc theo `app`, không quan tâm `version`).

```yaml
# chat-api-v2 — Deployment riêng, chỉ khác tag image và nhãn version
metadata:
  labels:
    app: chat-api
    version: v2
```

Viết `DestinationRule` — khai cho Istio biết `version` là tiêu chí để tách "subset".

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: chat-api
  namespace: ai-workspace
spec:
  host: chat-api
  subsets:
    - name: v1
      labels: { version: v1 }
    - name: v2
      labels: { version: v2 }
```

Viết `VirtualService` — luật định tuyến thật, chia đúng tỉ lệ mong muốn.

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: chat-api
  namespace: ai-workspace
spec:
  hosts: [chat-api]
  http:
    - route:
        - destination: { host: chat-api, subset: v1 }
          weight: 90
        - destination: { host: chat-api, subset: v2 }
          weight: 10
```

```bash
kubectl apply -f destinationrule.yaml -f virtualservice.yaml
```

Trước khi test, thêm một dòng nhỏ vào `index.js` để tự biết request nào vừa được bản nào trả lời — không có cách nào khác để phân biệt từ phía client.

```js
return c.json({ ...conversation, servedBy: process.env.APP_VERSION || "unknown" });
```

`APP_VERSION` là biến môi trường mới, khai khác nhau giữa hai Deployment (`v1` set `APP_VERSION=v1`, `v2` set `APP_VERSION=v2`) — không liên quan gì tới Istio, chỉ là cách thô sơ nhất để mắt thường thấy được sự khác biệt.

### Thử thật — gửi nhiều request, đếm tỉ lệ

```bash
for i in $(seq 1 50); do
  curl -s http://localhost/api/chat -H "Authorization: Bearer $TOKEN" \
    -d '{"message":"ping"}' | jq -r .servedBy
done | sort | uniq -c
```

```
 45 v1
  5 v2
```

Không đúng tuyệt đối `90/10` — với 50 request, dao động quanh tỉ lệ khai báo là bình thường, số càng lớn càng gần đúng tỉ lệ thật. Quan trọng là `v2` thật sự chỉ nhận một phần nhỏ, không phải toàn bộ như hồi tối qua.

Theo dõi log/Grafana (đã có sẵn từ mấy tuần trước) của riêng `v2` trong vài giờ, không thấy lỗi nào tăng bất thường — sửa `weight` lên `50/50`, rồi `0/100`, gỡ hẳn `v1` khi đã chắc chắn.

Mở lại ghi chú, thêm dòng mới.

```
Rolling update của Deployment thay Pod, không chia được % request
thật. Istio + DestinationRule/VirtualService định tuyến theo %
chính xác, độc lập với việc Pod nào đang chạy. Sidecar istio-proxy
tự chèn vào mọi Pod trong namespace, không sửa code app.
```

Dòng cuối cùng từ nhiều tuần trước — "chạy được ở đâu đó ngoài laptop này" — vẫn còn nguyên, chưa ai đụng tới. Nhưng danh sách những thứ *biết cách làm* giờ dài hơn hẳn danh sách những thứ *còn chưa biết*, và đó là một cảm giác khác hẳn so với đêm đầu tiên đọc chín dòng không hiểu nổi.
