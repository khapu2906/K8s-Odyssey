# Chương 8 — Một cái tên không đổi

## Gần trưa

Bụng bắt đầu réo, nhưng bạn chưa muốn dừng. Bạn mở lại ghi chú, đọc dòng cuối cùng mình vừa viết: `postgres` vẫn chưa tồn tại trong cluster.

`docker-compose.yml` vẫn còn mở bên cạnh. Bạn nhìn phần `postgres` trong đó — image `postgres:16`, hai biến môi trường `POSTGRES_PASSWORD` và `POSTGRES_DB`, port `5432`. Không có gì lạ, cùng công thức bạn đã làm với `chat-api`: viết Deployment, cùng image, cùng env, cùng port.

Nhưng có một câu hỏi bạn phải tự trả lời trước khi gõ: `replicas` để mấy? `chat-api` để `3` vì mỗi bản sao đều giống hệt nhau, không bản nào giữ gì cả. Postgres thì khác — ba bản sao postgres chạy song song, mỗi cái sẽ tự ghi dữ liệu vào ổ đĩa riêng của chính nó, ba nguồn sự thật khác nhau, không đồng bộ gì với nhau hết. Bạn chưa biết cách nào để ba cái đó dùng chung một chỗ lưu trữ. Để `1` thôi, ghi thêm một dòng vào ghi chú: "postgres 1 bản là tạm, chưa xử lý phần lưu trữ dùng chung, để sau."

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: ai-workspace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
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
```

Định lưu file, bạn khựng lại. `chat-api` gọi database qua địa chỉ `postgres:5432` — cái tên đó phải trỏ đi đâu đó chứ. Một Deployment tự nó không có tên nào để người khác gọi tới cả, mấy Pod bên trong tên toàn kiểu `postgres-6d8f...-x7k2p`, đổi liên tục mỗi lần bị xoá tạo lại, y hệt `chat-api` hồi sáng. Cần thêm một thứ khác nữa.

Thói quen cũ lại phát huy tác dụng — nghi ngờ tên gì cứ `explain` trước, đỡ đoán mò.

```bash
kubectl explain service
```

```
KIND:     Service
VERSION:  v1

DESCRIPTION:
    Service is a named abstraction of software service (for example, mysql)
    consisting of local port (for example 3306) that the proxy listens on,
    and the selector that determines which pods will answer requests sent
    through the proxy.
```

"Named abstraction" — nói dễ hiểu hơn, một cái tên đứng thay mặt cho cả nhóm Pod. "Selector" — cái quyết định Pod nào sẽ trả lời khi có request gửi tới cái tên đó. Đúng thứ đang thiếu: một lớp đứng giữa, giữ cố định cái tên `postgres`, còn phía sau tên đó thật ra là Pod nào, nó tự lo, không liên quan gì tới `chat-api` phải biết.

Tối hôm bữa đọc mấy bài blog dựng cluster, bạn nhớ có vài file mẫu gộp chung nhiều resource vào một file bằng dấu `---`, thay vì tách riêng từng file. Thử áp dụng luôn, viết tiếp ngay dưới, không mở file mới.

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: ai-workspace
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
```

`port` và `targetPort` trông dư thừa vì trùng số, nhưng không phải luôn vậy. `port` là cổng chính Service lắng nghe — cái `chat-api` sẽ gọi tới qua tên `postgres:5432`. `targetPort` là cổng thật container `postgres` đang mở bên trong Pod. Hai số này hoàn toàn có thể khác nhau, Service đứng giữa tự chuyển đổi — chỉ tình cờ Postgres nghe đúng `5432` nên viết trùng cho dễ nhớ.

Lưu thành `postgres.yaml`, một file, hai resource.

```bash
kubectl apply -f postgres.yaml
```

```
deployment.apps/postgres created
service/postgres created
```

Hai dòng, đúng hai thứ vừa viết. Bạn gõ tiếp để chắc chắn cả hai đều đứng vững, dùng luôn cú pháp phẩy học được hôm qua.

```bash
kubectl get deployments,pods,svc -n ai-workspace
```

```
NAME                        READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/chat-api    0/3     3            0           4h
deployment.apps/postgres    1/1     1            1           22s

NAME                              READY   STATUS             RESTARTS   AGE
pod/chat-api-7d8f9c6b4d-8mznw     0/1     CrashLoopBackOff   47         4h
pod/chat-api-7d8f9c6b4d-r4jkl     0/1     CrashLoopBackOff   47         4h
pod/chat-api-7d8f9c6b4d-x9wtp     0/1     CrashLoopBackOff   46         4h
pod/postgres-5f8b9d7c6-vn2kt      1/1     Running            0          22s

NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
postgres     ClusterIP   10.96.142.88    <none>        5432/TCP   22s
```

`postgres` chạy `Running` ngay. `svc/postgres` cũng đã có, một địa chỉ IP nội bộ riêng, `10.96.142.88` — cái mà trước giờ bạn chưa từng thấy ai nhắc tới. Bạn tò mò xem kỹ hơn.

```bash
kubectl describe svc postgres -n ai-workspace
```

```
Name:              postgres
Namespace:         ai-workspace
Selector:          app=postgres
Type:              ClusterIP
IP:                10.96.142.88
Port:               5432/TCP
TargetPort:         5432/TCP
Endpoints:          10.244.0.23:5432
```

`Selector: app=postgres` — cùng cơ chế `matchLabels` đã thấy ở Deployment và ReplicaSet, chỉ khác là lần này nó không đếm số lượng, nó đi tìm đúng Pod đang mang nhãn đó rồi ghi địa chỉ thật của Pod ấy vào `Endpoints`. `10.244.0.23` chính là IP riêng của Pod `postgres-5f8b9d7c6-vn2kt` phía trên. Còn `10.96.142.88` mới là địa chỉ ổn định — cái mà `chat-api` sẽ gọi tới, không phải địa chỉ Pod thật.

Có một điều bạn suýt hiểu lầm: Service này không hề biết Deployment `postgres` tồn tại. Nó chỉ quét khắp namespace, tìm Pod nào đang mang đúng nhãn `app: postgres`, rồi ghi vào `Endpoints` — không cần biết Pod đó do Deployment, StatefulSet, hay do chính tay bạn `apply` một Pod trần mà ra. Cái khớp giữa Service và Deployment `postgres` sáng nay thành hình chỉ vì bạn tự tay đặt trùng nhãn `app: postgres` ở cả hai chỗ — `template.metadata.labels` bên Deployment, `selector` bên Service. Kubernetes không tự suy luận cái này giùm bạn; đổi nhãn một bên mà quên bên kia, `Endpoints` trống trơn ngay lập tức, dù Deployment vẫn chạy `1/1` bình thường như không có chuyện gì.

À, hoá ra là vậy — khắp Kubernetes, các thành phần không trỏ thẳng vào nhau bằng tên hay ID cụ thể nào cả. Chúng map với nhau bằng nhãn. ReplicaSet tìm Pod của mình qua nhãn. Service tìm Pod của mình cũng qua nhãn, y hệt cách đó. Không ai gọi thẳng tên object của ai — chỉ cần nhãn khớp, tự động nối lại; nhãn sai hoặc thiếu, hai thứ đứng cạnh nhau mà chẳng biết gì về nhau.

Bạn nhận ra ra vấn đề nằm ở đâu suốt từ sáng giờ. Không phải `chat-api` gõ sai địa chỉ. Là chưa từng có ai đứng ra giữ cái tên `postgres` cả — không Service nào tồn tại thì DNS nội bộ không có gì để tra, gõ đúng cỡ nào cũng ra `ENOTFOUND`. Giờ tên đã có chủ, dù Pod `postgres` phía sau có chết đi sống lại, đổi IP bao nhiêu lần, cái tên `postgres` vẫn luôn trỏ đúng chỗ, tự động cập nhật `Endpoints` mỗi lần.

`chat-api` thì vẫn `CrashLoopBackOff`, RESTARTS đã tới 47 — mấy Pod này cứ chết rồi chờ, thời gian chờ giữa mỗi lần retry giờ đã giãn ra khá dài. Đợi tới lượt chờ tiếp theo cũng được, nhưng bạn nhớ ra bài học từ ban nãy: ReplicaSet không quan tâm Pod nào tên gì, chỉ cần đúng số lượng. Vậy thì việc gì phải chờ, xoá luôn ba cái đang treo, để ReplicaSet dựng bản mới ngay bây giờ, lúc `postgres` đã sẵn sàng.

```bash
kubectl delete pod -n ai-workspace -l app=chat-api
```

```
pod "chat-api-7d8f9c6b4d-8mznw" deleted
pod "chat-api-7d8f9c6b4d-r4jkl" deleted
pod "chat-api-7d8f9c6b4d-x9wtp" deleted
```

`-l app=chat-api` — chọn theo nhãn thay vì gõ tên từng Pod một, đúng cái nhãn bạn vừa thấy trong `describe svc` phía trên, hoá ra dùng được ở chỗ khác luôn. Ba Pod cũ biến mất, ba Pod mới lập tức mọc lên thay thế.

```bash
kubectl get pods -n ai-workspace -w
```

```
chat-api-7d8f9c6b4d-2q8fn     0/1     ContainerCreating   0          2s
chat-api-7d8f9c6b4d-2q8fn     0/1     Running              0          4s
chat-api-7d8f9c6b4d-2q8fn     1/1     Running              0          6s
```

`1/1 Running`. Không chết lại. Bạn đợi thêm chục giây, không thấy đổi trạng thái, thở phào, kiểm tra log cho chắc.

```bash
kubectl logs chat-api-7d8f9c6b4d-2q8fn -n ai-workspace
```

```
Postgres not ready yet (attempt 1/10), retrying in 1000ms...
chat-api listening on port 8080
```

Một lần retry duy nhất — đúng lúc `chat-api` bật lên thì `postgres` chưa kịp nhận kết nối trong mili-giây đầu, thử lại một phát là xong ngay, không phải mười lần liên tiếp rồi tắt như hồi sáng nữa. Ba Pod còn lại bạn kiểm tra tiếp, cả ba cùng một dạng log, cùng `1/1 Running`.

Bạn mở lại ghi chú, gạch thêm một dòng.

```
Need networking / service discovery ✓ Service 
  —> cấp một tên + IP nội bộ cố định, tự trỏ tới đúng Pod đang mang nhãn tương ứng qua Endpoints, 
     Pod chết/đổi vẫn không ảnh hưởng cái tên. postgres đang chạy 1 bản, 
       chưa có lưu trữ dùng chung — bài toán khác, để sau.
```

Bụng vẫn réo. Lần này bạn đứng dậy thật, đi kiếm gì đó ăn, để nguyên terminal lại — ba Pod `chat-api`, một Pod `postgres`, tất cả đều xanh.
