# Chương 7 — Cuối cùng cũng có người đếm

## Vẫn sáng đó

Ghi chú tối/sáng nay vẫn còn mở:

```
cần thứ gì đó đứng trên Pod để canh việc đó
(chắc là ReplicaSet với Deployment ghi ở note trước?)
```

Bạn lật lại file ghi chú từ tối đọc README — chỗ đối chiếu từng dòng "Need..." với tên thật của nó. Đúng, có ghi rồi: `ReplicaSet` là cái đếm số lượng container. `Deployment` bọc ngoài `ReplicaSet`, lo thêm phần update. Không cần tự viết `ReplicaSet` — viết `Deployment` thôi, nó tự tạo `ReplicaSet` bên dưới.

Bạn sửa lại file, không xoá `chat-api-pod.yaml` cũ, tạo file mới `chat-api-deployment.yaml`.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-api
  namespace: ai-workspace
spec:
  replicas: 3
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
          image: ai-workspace/chat-api:dev
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              value: postgres://postgres:postgres@postgres:5432/aiworkspace
```

Phần `spec.template` giống hệt cái Pod cũ, chỉ lồng sâu thêm một lớp. `replicas: 3` là dòng mới duy nhất thật sự quan trọng. Bạn xoá Pod trần cũ trước, tránh trùng tên.

```bash
kubectl delete pod chat-api -n ai-workspace
kubectl apply -f chat-api-deployment.yaml
```

```
deployment.apps/chat-api created
```

Muốn xem hết mấy tầng cùng lúc, bạn nhớ ra hồi nãy lướt `kubectl --help` có thấy ví dụ gõ nhiều loại resource cách nhau bằng dấu phẩy. Thử luôn.

```bash
kubectl get deployments,replicasets,pods -n ai-workspace
```

```
NAME                       READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/chat-api   0/3     3            0           6s

NAME                                  DESIRED   CURRENT   READY   AGE
replicaset.apps/chat-api-7d8f9c6b4d   3         3         0       6s

NAME                              READY   STATUS             RESTARTS   AGE
pod/chat-api-7d8f9c6b4d-2xvqk     0/1     CrashLoopBackOff   1          6s
pod/chat-api-7d8f9c6b4d-8mznw     0/1     CrashLoopBackOff   1          6s
pod/chat-api-7d8f9c6b4d-r4jkl     0/1     CrashLoopBackOff   1          6s
```

Ba dòng, không phải một. Bạn chỉ viết một file YAML, gõ một lệnh `apply`, mà giờ có ba Pod, một ReplicaSet, một Deployment — ba tầng, tự động sinh ra từ tầng trên xuống tầng dưới.

Vẫn `CrashLoopBackOff` cả ba — dĩ nhiên, `postgres` vẫn chưa tồn tại, đó là chuyện khác, để sau. Nhưng có một việc bạn muốn thử ngay bây giờ, trước khi lo tới Postgres.

```bash
kubectl get pods -n ai-workspace
```

```
NAME                          READY   STATUS             RESTARTS   AGE
chat-api-7d8f9c6b4d-2xvqk     0/1     CrashLoopBackOff   3          58s
chat-api-7d8f9c6b4d-8mznw     0/1     CrashLoopBackOff   3          58s
chat-api-7d8f9c6b4d-r4jkl     0/1     CrashLoopBackOff   3          58s
```

Bạn chọn đại một cái, xoá thẳng — đúng kiểu bạn đã làm lúc nãy, chỉ khác lần này có Deployment đứng phía sau.

```bash
kubectl delete pod chat-api-7d8f9c6b4d-2xvqk -n ai-workspace
kubectl get pods -n ai-workspace -w
```

```
chat-api-7d8f9c6b4d-2xvqk     0/1     Terminating        3          71s
chat-api-7d8f9c6b4d-8mznw     0/1     CrashLoopBackOff   3          71s
chat-api-7d8f9c6b4d-r4jkl     0/1     CrashLoopBackOff   3          71s
chat-api-7d8f9c6b4d-x9wtp     0/1     Pending            0          0s
chat-api-7d8f9c6b4d-x9wtp     0/1     ContainerCreating  0          1s
```

Chưa đầy một giây sau khi cái cũ biến mất, một cái tên hoàn toàn mới đã xuất hiện — `x9wtp`, không phải `2xvqk` được hồi sinh, mà là một Pod khác hẳn, mới tinh, cùng khuôn `spec.template`. Đây chính là thứ còn thiếu lúc nãy: xoá cả Pod, vẫn có cái khác mọc lên thay — vì lần này, có một thứ đang *đếm*.

Bạn xem lại `ReplicaSet` để chắc chắn.

```bash
kubectl describe replicaset -n ai-workspace | grep -A2 "Pods Status"
```

```
Pods Status:  0 Running / 3 Waiting / 0 Succeeded / 0 Failed
```

Nó không quan tâm Pod nào tên gì. Nó chỉ quan tâm đúng một con số: `3`. Thiếu là tạo, dư là xoá, tên là gì không thành vấn đề — miễn tổng luôn đúng bằng con số ghi trong `replicas`.

Bạn mở lại ghi chú, gạch dòng cũ, viết dòng mới:

```
cần thứ gì đó đứng trên Pod để canh việc đó ✓ ReplicaSet
(bên trong Deployment) — không canh "Pod cụ thể nào",
canh đúng MỘT con số. Postgres vẫn chưa xong, đó là
việc tiếp theo.
```
