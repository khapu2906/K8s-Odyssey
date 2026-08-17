# Chương 12 — Bí mật không hẳn là bí mật

## Mấy ngày sau

Cluster chạy êm suốt mấy ngày, không CrashLoopBackOff nào mới. Sáng nay founder ghé qua bàn, nói chuyện với ai đó về một khách hàng doanh nghiệp đang hỏi "hệ thống lưu password thế nào" trước khi ký hợp đồng. Không nói với bạn, nhưng câu đó lọt vào tai, nằm lại đó cả buổi.

Đang định `git add project/infs/` để commit nốt đống YAML mấy hôm nay, bạn dừng tay giữa chừng. Mở lại `postgres.yaml`, nhìn thẳng vào dòng đó — cái dòng đã gõ tay từ Chương 8, chưa từng nghĩ lại:

```yaml
env:
  - name: POSTGRES_PASSWORD
    value: postgres
```

Plaintext. Nằm ngay trong file sắp commit, sắp lên GitHub, ai xem history repo cũng đọc được. Ba tuần trước có ghi sẵn một dòng cho đúng chuyện này:

```
Need secrets
→ có object riêng tên "Secret" để lưu password/API key, và
"ConfigMap" cho mấy cái config không nhạy cảm — không commit
thẳng vào code hay file compose như hiện tại
```

```bash
kubectl explain secret
```

```
KIND:     Secret
VERSION:  v1

DESCRIPTION:
    Secret holds secret data of a certain type. The total bytes of
    the values in the Data field must be less than MaxSecretSize
    bytes.
```

Không nói gì về mã hoá cả, chỉ nói "holds secret data". Bạn tạo thử bằng lệnh trực tiếp trước, nhưng nhớ bài học "viết file trước" từ hồi Chương 5, thêm `--dry-run=client -o yaml` để lấy ra bản YAML thay vì tạo thẳng.

```bash
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD=postgres \
  -n ai-workspace \
  --dry-run=client -o yaml > postgres-secret.yaml
```

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: ai-workspace
data:
  POSTGRES_PASSWORD: cG9zdGdyZXM=
type: Opaque
```

`cG9zdGdyZXM=`. Trông có vẻ đã được giấu đi đâu đó. Tò mò, bạn thử giải mã xem nó thật sự "an toàn" cỡ nào.

```bash
echo "cG9zdGdyZXM=" | base64 -d
```

```
postgres
```

Ra ngay lập tức, không cần khoá, không cần quyền gì đặc biệt. À. `Secret` không hề mã hoá cái gì cả — chỉ là base64, một kiểu *encode* để nhét dữ liệu bất kỳ vào YAML dạng text, không phải *encrypt*. Ai có quyền `kubectl get secret -o yaml` trong cluster này đều đọc được y hệt bạn vừa làm, chỉ mất một lệnh. An toàn hơn hẳn so với ghi thẳng `value: postgres` là ở chỗ khác: không nằm lồ lộ trong file YAML thường, tách quyền truy cập được qua RBAC (dù bạn chưa cấu hình RBAC nào cả) — chứ không phải vì bị khoá lại.

```bash
kubectl apply -f postgres-secret.yaml
```

```
secret/postgres-secret created
```

Bạn sửa `postgres.yaml`, thay dòng `value: postgres` bằng cách trỏ tới đúng Secret vừa tạo.

```yaml
env:
  - name: POSTGRES_PASSWORD
    valueFrom:
      secretKeyRef:
        name: postgres-secret
        key: POSTGRES_PASSWORD
  - name: POSTGRES_DB
    value: aiworkspace
```

Xong phần `postgres`, quay sang `chat-api-deployment.yaml`, định làm y hệt — nhưng khựng lại. `DATABASE_URL` của `chat-api` là một chuỗi duy nhất, password nằm lẫn ở giữa:

```
postgres://postgres:postgres@postgres:5432/aiworkspace
```

`secretKeyRef` thay được nguyên giá trị của một biến môi trường, không thay được một mẩu nằm giữa chuỗi. Không có cách nào lấy đúng khúc `postgres` thứ hai ra khỏi đó bằng YAML thuần. Muốn dùng Secret cho đúng nghĩa, phải tách `DATABASE_URL` thành từng mảnh riêng, để `chat-api` tự ráp lại lúc chạy.

Bạn mở `chat-api/src/db.js`, đổi cách tạo `Pool`:

```js
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});
```

Thay vì một `connectionString` dài, giờ năm biến riêng biệt — bốn cái không nhạy cảm cứ để `value` bình thường, chỉ một cái duy nhất — password — trỏ qua `secretKeyRef`, dùng chung đúng Secret vừa tạo cho `postgres`.

```yaml
env:
  - name: POSTGRES_HOST
    value: postgres
  - name: POSTGRES_PORT
    value: "5432"
  - name: POSTGRES_USER
    value: postgres
  - name: POSTGRES_DB
    value: aiworkspace
  - name: POSTGRES_PASSWORD
    valueFrom:
      secretKeyRef:
        name: postgres-secret
        key: POSTGRES_PASSWORD
```

Đổi code thì phải build lại image, đúng bài cũ từ Chương 6.

```bash
docker build -t ai-workspace/chat-api:dev ./chat-api
kind load docker-image ai-workspace/chat-api:dev --name ai-workspace
kubectl apply -f postgres-secret.yaml -f postgres.yaml -f chat-api-deployment.yaml
kubectl delete pod -n ai-workspace -l app=chat-api
```

```
secret/postgres-secret unchanged
deployment.apps/postgres configured
deployment.apps/chat-api configured
```

Chờ Pod mới lên, `port-forward` lại kiểm tra như mọi lần.

```bash
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

```bash
curl -s http://localhost:8080/api/conversations
```

```json
[{"id":1,"message":"does it remember this time","reply":"I don't have a document to work from yet — paste some text in and ask me again.","createdAt":"2026-08-16T08:12:03.447Z"}]
```

Dữ liệu cũ vẫn còn nguyên, `chat-api` vẫn nối được `postgres` — chỉ có điều giờ không còn dòng nào trong hai file YAML lộ ra password thật nữa.

Bạn mở ghi chú từ tối đọc README, gạch thêm một dòng nữa trong danh sách chín dòng ba tuần trước:

```
Need secrets ✓ Secret — chỉ base64, KHÔNG PHẢI mã hoá, ai
có quyền đọc secret trong cluster vẫn xem được password y
hệt, chỉ là tách khỏi việc nằm lồ lộ trong file YAML thường.
DATABASE_URL không thể trộn Secret giữa chuỗi được, phải tách
riêng từng biến — chat-api/src/db.js đổi luôn.
```

Chín dòng ba tuần trước, giờ sáu dòng đã có dấu ✓ — còn lại scheduling, health checks, và đúng dòng `???` — "Need observability" — vẫn y nguyên như lúc mới viết, chưa đụng tới. Bạn `git add` lại `project/`, lần này an tâm hơn hẳn lúc nãy.
