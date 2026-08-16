# Chương 9 — Một câu hỏi, một câu trả lời

## Chiều hôm đó

Làm bữa no nê, bạn ngồi lại xuống ghế, mở terminal ra đúng như lúc để lại — ba Pod `chat-api`, một Pod `postgres`, vẫn xanh hết. Nhưng nhìn cái bảng toàn chữ `Running` này mãi cũng chẳng chứng minh được gì. Máy nói là chạy được, còn cái app thật sự trả lời được câu hỏi hay không thì chưa ai biết.

Bạn muốn tự tay thử. Gõ một câu hỏi thật, xem có trả lời thật không.

Vấn đề đầu tiên: `chat-api` không có `Service` như `postgres`. Không cần — bên trong cluster có ai gọi tới `chat-api` đâu, chỉ có `chat-api` gọi ra ngoài tới `postgres` thôi. Nhưng giờ bạn đứng ở ngoài cluster, trên chính laptop, muốn gọi vào trong. `curl` thẳng địa chỉ Pod thì không được, IP đó chỉ cluster nội bộ mới thấy.

Bạn gõ lại `kubectl --help`, lần này để ý một mục khác hẳn, nằm dưới nhóm `Troubleshooting and Debugging Commands`:

```
  port-forward    Forward one or more local ports to a pod
```

Đúng thứ cần. Mở một cửa sổ terminal, để nguyên đó.

```bash
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

```
Forwarding from 127.0.0.1:8080 -> 8080
Forwarding from [::1]:8080 -> 8080
```

Không cần biết trong ba Pod, nó chọn đúng cái nào — `kubectl` tự lo phần đó, chỉ cần một cổng trên máy bạn nối thẳng vào một cổng bên trong cluster. Mở terminal thứ hai, để cửa sổ kia chạy nguyên.

```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"chào, còn ai không"}'
```

```json
{"id":1,"message":"chào, còn ai không","reply":"I don't have a document to work from yet — paste some text in and ask me again.","createdAt":"2026-08-15T09:42:11.203Z"}
```

Bạn bật cười. Không phải câu trả lời bạn mong, nhưng đúng là nó *có* trả lời — chỉ là chưa đưa tài liệu nào cho nó đọc, nên nó thành thật nói thẳng vậy thôi. Đúng logic từ hồi đọc code `answer.js` những ngày đầu: không có `documentText` thì chịu, chào thua lịch sự.

Cái làm bạn để ý không phải câu trả lời — mà là `id: 1`. Một hàng vừa được tạo, thật sự lưu ở đâu đó, không phải chỉ nằm trong RAM của process rồi bốc hơi. Bạn thử xác nhận.

```bash
curl -s http://localhost:8080/api/conversations
```

```json
[{"id":1,"message":"chào, còn ai không","reply":"I don't have a document to work from yet — paste some text in and ask me again.","createdAt":"2026-08-15T09:42:11.203Z"}]
```

Còn nguyên. Bạn gõ thêm một câu nữa, khác hẳn, để chắc không phải trùng hợp.

```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"con mèo có bay được không"}'
```

```json
{"id":2,"message":"con mèo có bay được không","reply":"I don't have a document to work from yet — paste some text in and ask me again.","createdAt":"2026-08-15T09:44:57.881Z"}
```

`id: 2`. Gõ lại `/api/conversations`, giờ có đủ hai hàng, đúng thứ tự, đúng nội dung. HTTP request từ laptop bạn, chui qua `port-forward`, tới một trong ba Pod `chat-api` bất kỳ, Pod đó gọi qua cái tên `postgres` — cái Service mới tạo sáng nay — chạm tới đúng Pod `postgres` đang giữ dữ liệu, ghi xuống, trả lại. Cả một chuỗi, không đứt đoạn nào, chạy đúng như một hệ thống thật, dù vẫn chỉ nằm trên một cái laptop.

Bạn chụp lại màn hình, nhắn cho Martin.

```
Bạn
> ê chạy được rồi đó
> chat api nói chuyện được, lưu vô postgres đàng hoàng
> full trong k8s luôn, không phải compose nữa
[gửi kèm ảnh]
```

```
Martin
> ê ngon vậy
> cũng được, nhưng cháu cứ từ từ :))
```

Bạn không hỏi lại câu cuối là ý gì. Kệ, để mai tính.

Bạn đóng terminal `port-forward` lại, gõ `kubectl get pods -n ai-workspace` một lần cuối trước khi tắt máy. Vẫn bốn Pod, vẫn xanh, `RESTARTS` không tăng thêm cái nào từ lúc nãy tới giờ. Bạn tắt laptop, lòng nhẹ hẳn — lần đầu tiên trong ba ngày, mọi thứ *thật sự* chạy được, không phải chỉ trông có vẻ chạy được.
