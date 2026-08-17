# Chương 11 — Gắn từ bên ngoài vào

## Vẫn sáng hôm đó

Bạn lật lại ghi chú từ tối đọc README hôm mới nghe Martin nhắc tới Kubernetes lần đầu. Đúng, có ghi sẵn từ hồi đó rồi, dòng bạn chưa từng đụng tới:

```
Need storage
→ có khái niệm "Volume" tách rời khỏi container, còn cái giữ
dữ liệu lâu dài dù container chết/dời máy thì gọi là
"PersistentVolume" (PV) và "PersistentVolumeClaim" (PVC)
```

Ba tuần trước dòng này chỉ là một cái tên nghe qua. Giờ nó là đúng thứ bạn cần, ngay lúc này. Lướt mắt lên mấy dòng phía trên, bạn khựng lại — `Need scaling`, `Need restart`, `Need deployment` — ba dòng này chưa từng gạch, dù `ReplicaSet`/`Deployment` đã giải quyết xong xuôi từ hồi viết `chat-api-deployment.yaml`. Chỉ là lúc đó bạn mải làm, quên quay lại đối chiếu với đúng cái danh sách gốc này. Tiện tay, bạn gạch luôn cả ba.

```
Need scaling ✓ replicas trong Deployment
Need restart ✓ ReplicaSet tự tạo lại Pod
Need deployment ✓ Deployment (bọc ReplicaSet + rolling update)
```

```bash
kubectl explain persistentvolumeclaim
```

```
KIND:     PersistentVolumeClaim
VERSION:  v1

DESCRIPTION:
    PersistentVolumeClaim is a user's request for and claim to a
    persistent volume
```

"Request for and claim to" — không phải bản thân ổ đĩa, mà là một *yêu cầu* xin cấp ổ đĩa. Ai cấp? Bạn gõ thêm một lệnh, tò mò xem cluster này đã có sẵn gì chưa.

```bash
kubectl get storageclass
```

```
NAME                 PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE      AGE
standard (default)   rancher.io/local-path   Delete          WaitForFirstConsumer   3d
```

`3d` — có từ ba ngày trước, đúng lúc bạn gõ `kind create cluster` lần đầu. Bạn nhớ lại dòng log hôm đó: `✓ Installing StorageClass 💾`, lúc ấy đọc lướt qua chẳng hiểu để làm gì. Ra là nó đã đứng chờ sẵn ở đây suốt ba ngày, chỉ chưa ai xin cấp ổ đĩa nào cả.

Bạn viết file `postgres-pvc.yaml`, xin một ổ 1Gi, đơn giản nhất có thể trước đã.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: ai-workspace
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

```bash
kubectl apply -f postgres-pvc.yaml
```

```
persistentvolumeclaim/postgres-data created
```

```bash
kubectl get pvc -n ai-workspace
```

```
NAME            STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
postgres-data   Pending                                      standard       4s
```

`Pending`. Bạn tưởng đã sai chỗ nào, nhưng nhìn lại cột `VOLUMEBINDINGMODE` ở `storageclass` lúc nãy: `WaitForFirstConsumer`. Đọc từng chữ mới thấy nó khá thẳng — không cấp ổ đĩa cho tới khi có ai *thật sự dùng* nó trước đã. Cái PVC này chưa gắn vào Pod nào cả, nên nó cứ chờ, chưa việc gì phải vội.

Bạn mở `postgres.yaml`, thêm phần `volumes` ở cấp Pod và `volumeMounts` ở trong container, gắn đúng đường dẫn đã thấy quen mắt từ hồi đọc `docker-compose.yml` ngày đầu tiên: `/var/lib/postgresql/data`.

```yaml
    spec:
      containers:
        - name: postgres
          image: postgres:16
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_PASSWORD
              value: postgres
            - name: POSTGRES_DB
              value: aiworkspace
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
      volumes:
        - name: postgres-data
          persistentVolumeClaim:
            claimName: postgres-data
```

Cùng một cái tên `postgres-data` xuất hiện hai lần, một bên khai `persistentVolumeClaim.claimName` để nói "lấy dữ liệu từ cái PVC này", một bên khai `volumeMounts.name` để nói "gắn nó vào đường dẫn này trong container" — hai chỗ khớp tên với nhau, y hệt kiểu nhãn khớp label đã quen từ hôm qua, chỉ khác là lần này không phải `matchLabels`, mà là khớp tên volume.

```bash
kubectl apply -f postgres.yaml
```

```
deployment.apps/postgres configured
service/postgres unchanged
```

```bash
kubectl get pods -n ai-workspace -w
```

```
postgres-6b7d4f8c9-h3nkq   0/1   ContainerCreating   0   3s
postgres-6b7d4f8c9-h3nkq   1/1   Running              0   6s
```

Pod `postgres` cũ bị thay bằng bản mới, lần này có ổ đĩa đi kèm. Kiểm tra lại PVC:

```bash
kubectl get pvc -n ai-workspace
```

```
NAME            STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
postgres-data   Bound    pvc-a1e6c9f2-8b3d-4f11-9e2a-7c5d3f8b91a0   1Gi        RWO            standard       41s
```

`Bound` — đúng lúc Pod mới cần tới nó. Cột `VOLUME` là tên một `PersistentVolume` (PV) thật sự vừa được tạo ra đứng sau cái PVC này — bạn xin (Claim), cluster tự cấp (Volume), hai object khác nhau nhưng giờ đã nối vào nhau.

Bảng `conversations` giờ cũng không còn, vì Postgres này là bản chưa từng chạy `chat-api` nào qua. Bạn xoá luôn ba Pod `chat-api` cũ, ép chúng khởi động lại để tự tạo bảng, đúng cách đã học hôm qua.

```bash
kubectl delete pod -n ai-workspace -l app=chat-api
```

```bash
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"lần này có nhớ không"}'
```

```json
{"id":1,"message":"lần này có nhớ không","reply":"I don't have a document to work from yet — paste some text in and ask me again.","createdAt":"2026-08-16T08:12:03.447Z"}
```

`id: 1`. Giờ mới tới phần quan trọng — lặp lại đúng bài test hôm qua, lần này xem có khác gì không.

```bash
kubectl delete pod postgres-6b7d4f8c9-h3nkq -n ai-workspace
```

```
pod "postgres-6b7d4f8c9-h3nkq" deleted
```

```bash
kubectl get pods -n ai-workspace -w
```

```
postgres-6b7d4f8c9-r9zwm   0/1   ContainerCreating   0   2s
postgres-6b7d4f8c9-r9zwm   1/1   Running              0   9s
```

Tên Pod lại đổi, như mọi lần. Bạn hít một hơi, gõ lại đúng lệnh hôm qua từng cho ra `Internal Server Error`.

```bash
curl -s http://localhost:8080/api/conversations
```

```json
[{"id":1,"message":"lần này có nhớ không","reply":"I don't have a document to work from yet — paste some text in and ask me again.","createdAt":"2026-08-16T08:12:03.447Z"}]
```

Còn nguyên. Pod cũ đã biến mất, Pod mới hoàn toàn khác tên, nhưng dữ liệu vẫn ở đó — vì lần này dữ liệu chưa bao giờ thực sự nằm *trong* Pod cả, nó nằm ở PV, đứng ngoài vòng đời của bất kỳ Pod nào. Pod chỉ là cái gắn tạm vào, dùng xong tháo ra, ổ đĩa vẫn ở lại chờ Pod tiếp theo tới gắn vào.

Bạn mở ghi chú từ tối hôm đọc README, tìm đúng dòng ba tuần trước, gạch thêm một dòng nữa:

```
Need storage ✓ PersistentVolumeClaim xin ổ đĩa, cluster tự
cấp PersistentVolume đứng sau — gắn vào Pod qua volumeMounts,
Pod chết đi thay Pod khác, ổ đĩa vẫn còn nguyên vì nó chưa
từng thuộc về Pod nào cả.
```

Năm trên chín dòng giờ đã có chữ ✓ thật sự, không chỉ trên lý thuyết nữa — còn lại scheduling, secrets, health checks, và observability. Bạn đóng laptop, lần này thấy vững hơn hẳn cảm giác nhẹ nhõm hời hợt của chiều hôm qua.
