# Chương 13 — Chạy không có nghĩa là ổn

## Chiều hôm đó

Đỡ hẳn một mối lo sau vụ Secret sáng nay, bạn lật lại ghi chú, tính nhặt nốt một dòng dễ trong mấy dòng còn sót:

```
Need health checks
→ 2 loại check tên "liveness probe" (còn sống không, chết thì
restart) và "readiness probe" (sẵn sàng nhận request chưa, chưa
sẵn sàng thì tạm ngưng route traffic, không cần restart)
```

Ba tuần trước đọc chỉ hiểu khái niệm. Giờ bạn thử tra kỹ hơn xem hai cái đó viết trong YAML ra sao.

```bash
kubectl explain deployment.spec.template.spec.containers.livenessProbe
```

```
KIND:     Deployment
VERSION:  apps/v1

FIELD:    livenessProbe <Object>

DESCRIPTION:
    Periodic probe of container liveness. Container will be restarted
    if the probe fails.

    FIELDS:
      httpGet	<Object>
      exec	<Object>
      tcpSocket	<Object>
      initialDelaySeconds	<integer>
      periodSeconds	<integer>
```

`httpGet` — gọi vào một route HTTP có sẵn, đúng nghĩa. `chat-api` đã có route `/health` từ hồi đọc code `index.js` những ngày đầu, chưa từng dùng tới. Giờ mới có lý do.

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
```

Không cần build lại image gì cả — route đã có sẵn từ lâu, chỉ là chưa ai gọi tới. Bạn thêm cả hai vào `chat-api-deployment.yaml`, `apply` lại.

```bash
kubectl apply -f chat-api-deployment.yaml
```

```
deployment.apps/chat-api configured
```

```bash
kubectl describe pod chat-api-7d8f9c6b4d-2q8fn -n ai-workspace | grep -A1 "Liveness\|Readiness"
```

```
Liveness:   http-get http://:8080/health delay=5s timeout=1s period=10s #success=1 #failure=3
Readiness:  http-get http://:8080/health delay=5s timeout=1s period=10s #success=1 #failure=3
```

Đúng như khai báo. `#failure=3` — phải trượt ba lần liên tiếp mới coi là thật sự hỏng, không tính một lần lag ngẫu nhiên là chết ngay.

Nhớ lại thói quen mấy hôm nay — hễ nghi ngờ gì cứ tự tay phá thử xem — bạn muốn xem hai cái probe này phản ứng ra sao khi có chuyện thật xảy ra. Xoá `postgres` một lần nữa, y hệt bài Chương 10, lần này không lo mất dữ liệu (đã có PVC), chỉ tò mò xem `chat-api` phản ứng thế nào.

```bash
kubectl delete pod -n ai-workspace -l app=postgres
```

```bash
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

```bash
curl -s http://localhost:8080/health
```

```json
{"status":"ok"}
```

`ok`. Ngay cả khi `postgres` đang giữa chừng khởi động lại. Bạn thử tiếp:

```bash
curl -s http://localhost:8080/api/conversations
```

```
Internal Server Error
```

Route thật sự dùng database thì lỗi, nhưng `/health` vẫn xanh rờn — vì `/health` trong code chỉ trả thẳng `{"status": "ok"}`, không hề chạm vào Postgres. Bạn hiểu ra: hai cái probe vừa thêm chỉ đang kiểm tra "process còn sống, còn nghe HTTP không", không hề kiểm tra "còn làm được việc thật không". Nếu `postgres` sập hẳn nhiều ngày, `chat-api` vẫn cứ báo `Running`, `READY 1/1`, không ai buồn restart, dù mọi request thật đều lỗi.

Bạn cân nhắc sửa `/health` để tự query thử Postgres bên trong, nhưng dừng lại kịp — đọc lại đúng lúc thấy có người cảnh báo chuyện này trong một bài blog tối hôm đọc README: health check gọi luôn xuống database dễ gây hiệu ứng dây chuyền, Postgres chỉ chậm một chút thôi là hàng loạt Pod bị đánh rớt cùng lúc, đúng lúc hệ thống cần chạy nhất. Không sửa vội, chỉ ghi lại làm giới hạn đã biết.

```bash
kubectl get pods -n ai-workspace
```

```
NAME                          READY   STATUS    RESTARTS   AGE
chat-api-7d8f9c6b4d-2q8fn     1/1     Running   0          6d
chat-api-7d8f9c6b4d-9tqlr     1/1     Running   0          6d
chat-api-7d8f9c6b4d-kd82x     1/1     Running   0          6d
postgres-6b7d4f8c9-p3wln      1/1     Running   0          14s
```

Cả ba `chat-api` vẫn `1/1`, không cái nào bị đánh rớt — đúng như vừa thấy, vì `/health` không hề biết `postgres` vừa chết đi sống lại.

Bạn mở ghi chú, gạch thêm dòng cuối cùng còn dễ trong danh sách:

```
Need health checks ✓ liveness + readiness, cả hai đang trỏ
/health — chỉ biết "process còn sống", KHÔNG biết "còn làm
được việc". Postgres chết mà chat-api vẫn xanh 1/1, mọi
request thật vẫn lỗi. Sửa /health để tự check DB thì risk
dây chuyền lúc DB chậm — để nguyên vậy, biết giới hạn là đủ.
```

Chín dòng ba tuần trước, giờ bảy dòng đã có dấu ✓. Còn lại đúng hai: scheduling, và cái `???` chưa ai đụng tới — observability.
