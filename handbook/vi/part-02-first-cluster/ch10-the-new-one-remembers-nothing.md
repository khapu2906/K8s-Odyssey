# Chương 10 — Cái mới không nhớ gì cả

## Sáng hôm sau

Bạn tới sớm hơn thường lệ, vẫn còn hưng phấn từ chiều hôm qua. Terminal vẫn mở nguyên, bốn Pod vẫn xanh, AGE giờ đã tính bằng giờ chứ không phải giây phút như hôm đầu nữa.

```bash
kubectl get pods -n ai-workspace
```

```
NAME                              READY   STATUS    RESTARTS   AGE
chat-api-7d8f9c6b4d-2q8fn         1/1     Running   0          18h
chat-api-7d8f9c6b4d-9tqlr         1/1     Running   0          18h
chat-api-7d8f9c6b4d-kd82x         1/1     Running   0          18h
postgres-5f8b9d7c6-vn2kt          1/1     Running   0          22h
```

Có một câu hỏi bạn để dở từ hôm qua: `chat-api` chết thì tự sống lại, đã tận mắt thấy hai lần rồi. Còn `postgres` — mới chỉ thấy nó lên `Running` lần đầu tiên, chưa từng thử xoá nó xem có sống lại giống vậy không. Muốn cho chắc, thử luôn.

```bash
kubectl delete pod postgres-5f8b9d7c6-vn2kt -n ai-workspace
```

```
pod "postgres-5f8b9d7c6-vn2kt" deleted
```

```bash
kubectl get pods -n ai-workspace -w
```

```
postgres-5f8b9d7c6-qz8mn   0/1   ContainerCreating   0   2s
postgres-5f8b9d7c6-qz8mn   0/1   Running              0   4s
postgres-5f8b9d7c6-qz8mn   1/1   Running              0   7s
```

Bảy giây. Nhanh hơn cả bạn tưởng. Đúng như ReplicaSet đã hứa — thiếu một cái, tạo lại ngay, tên khác nhưng số lượng luôn đúng. Bạn mỉm cười, coi như bài test cuối cùng đã pass, mở terminal khác để xác nhận `chat-api` vẫn nói chuyện được với bản `postgres` mới này, y hệt cách làm chiều qua.

```bash
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

```bash
curl -s http://localhost:8080/api/conversations
```

```
Internal Server Error
```

Không phải mảng hai phần tử bạn mong. Cũng không phải mảng rỗng. Một dòng chữ ngắn gọn, chẳng nói gì thêm. Bạn `logs` thử Pod `chat-api` đang đứng sau `port-forward` để xem thật ra chuyện gì.

```bash
kubectl logs chat-api-7d8f9c6b4d-2q8fn -n ai-workspace --tail 20
```

```
error: relation "conversations" does not exist
```

Bụng bạn thắt lại. Cái bảng `conversations` — nơi giữ hai câu hỏi bạn gõ chiều qua — không còn tồn tại nữa. Không phải lỗi kết nối, không phải sai tên, chỉ đơn giản là cái bảng đó không có ở đây, như thể chưa từng được tạo ra bao giờ. Bạn vào thẳng bên trong Pod `postgres` mới, dùng lại đúng lệnh `exec` quen thuộc từ hồi còn xài Docker, giờ gõ y hệt qua `kubectl`.

```bash
kubectl exec -it postgres-5f8b9d7c6-qz8mn -n ai-workspace -- psql -U postgres -d aiworkspace -c "\dt"
```

```
Did not find any relations.
```

Trống trơn. Không một bảng nào. Cứ như bạn vừa nối vào một Postgres hoàn toàn mới tinh, chưa từng có `chat-api` nào chạy qua đây, chưa từng có ai hỏi "chào, còn ai không" hay "con mèo có bay được không" cả. Vì đúng là như vậy thật.

Bạn ngồi im vài giây, ráp lại từng mảnh. Pod `postgres` cũ đã bị xoá — không phải container bên trong nó chết rồi tự khởi động lại như `chat-api` hồi tuần trước, mà là xoá đứt cả Pod. ReplicaSet thấy thiếu một, tạo bù một, đúng lời hứa. Nhưng Pod mới đó là một container Postgres hoàn toàn mới, chạy từ đúng image `postgres:16`, và bên trong image đó, thư mục dữ liệu vốn dĩ trống rỗng — mọi dữ liệu Postgres tạo ra khi chạy đều nằm ngay trong lớp ghi của chính container ấy. Container cũ mất, lớp ghi đó mất theo, không có gì tách rời khỏi container để tồn tại lâu hơn tuổi thọ của nó cả.

Bạn hiểu ra hôm qua mình đã nhầm điều gì. ReplicaSet giữ cho *có* một Pod tên `postgres` chạy trong `ai-workspace`, giữ đúng port `5432` mở sẵn, giữ đúng cái Service trỏ đúng chỗ — tất cả những cái đó vẫn còn nguyên, không sai một chữ nào. Chỉ có điều nó chưa từng hứa sẽ giữ *nội dung* bên trong. `chat-api` sống lại mà không mất gì vì nó chẳng giữ gì để mất — mọi trạng thái nó cần đều nằm ở Postgres. Còn `postgres` chính là nơi giữ trạng thái đó, và chẳng có ai đứng ra giữ giùm cái trạng thái của chính nó cả.

Bạn mở ghi chú, không gạch dòng nào, chỉ viết thêm dòng mới, thẳng thắn hơn những note trước:

```
postgres xoá Pod là mất sạch dữ liệu, kể cả bảng cũng biến
mất theo — dữ liệu đang nằm bên trong chính container, không
tách rời ra đâu cả. ReplicaSet chỉ giữ ĐỦ SỐ LƯỢNG, không
giữ NỘI DUNG. Cần thứ gì đó sống lâu hơn cái Pod, gắn ngoài
vào chứ không nằm trong.
```

Bạn ngồi tựa lưng ra ghế, không còn thấy nhẹ nhõm như tối qua nữa. Nhưng lần này, ít nhất bạn biết chính xác câu hỏi tiếp theo cần trả lời là gì.
