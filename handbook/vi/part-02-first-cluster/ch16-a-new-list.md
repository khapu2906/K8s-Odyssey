# Chương 16 — Danh sách mới

## Thứ Sáu tuần đó

Standup cuối tuần, founder đứng trước cả team, cười tươi hơn mọi khi.

> "Tuần này có tin vui — ba công ty ký hợp đồng cùng lúc. Nhiều nhất từ trước giờ."

Vài người vỗ tay, không khí thoải mái đúng kiểu thứ Sáu.

Founder nói tiếp, giọng vẫn vui nhưng bắt đầu chuyển hướng.

> "Cái đó kéo theo cái này — mấy công ty đó không phải chỉ một người dùng đâu, mỗi bên tầm chục người trở lên. Mỗi người một tài khoản riêng, không share chung một phiên như tụi mình đang test. Với lại có người hỏi upload tài liệu công ty lên được không, thay vì cứ phải dán nguyên đoạn text vào ô chat mỗi lần."

> "Bao giờ cần?" ai đó hỏi.

> "Tháng sau. Không gấp, nhưng cũng không phải sang năm."

Cuộc họp tan, bạn ngồi lại bàn, mở `answer.js` ra nhìn lại — cái hàm nhận `documentText` làm tham số, không lưu ở đâu cả, mỗi lần chat phải tự dán lại từ đầu. Ba tuần nay mọi command bạn gõ đều xoay quanh giữ cho đúng ba thành phần — `frontend`, `chat-api`, `postgres` — sống sót, nói chuyện được với nhau. Chưa từng có khái niệm "người dùng" nào trong hệ thống cả, chỉ có một cuộc trò chuyện duy nhất, ai vào cũng thấy chung một danh sách.

Bạn mở lại `docker-compose.yml`, nhìn đúng ba service quen thuộc từ ngày đầu tiên. Đơn giản, dễ hiểu trong năm phút, đúng như lúc mới vào làm. Nhưng "hàng chục người dùng, mỗi người một tài khoản" và "lưu tài liệu công ty" không phải thứ chỉnh vài dòng YAML là xong — không có Deployment nào giải quyết được việc hai người đăng nhập không dẫm chân lên nhau, không có Service nào tự sinh ra chỗ lưu file người dùng tải lên.

Đây không còn là bài toán "làm sao chạy được trên Kubernetes" nữa. Đây là bài toán khác hẳn: hệ thống cần thêm phần thật, code thật, trước khi có gì để đưa lên cluster cả.

Bạn mở một file trống, đặt tên `notes-next.md`, style quen thuộc từ cái đêm ba tuần trước ngồi đối chiếu danh sách "Need...". Lần này không đối chiếu với thứ đã học — chỉ đơn giản ghi lại những gì vừa nghe, còn nguyên dạng thô.

```
Cần tài khoản riêng cho từng người — không share 1 session
chung nữa. Login/logout, biết ai đang là ai.

Nhiều người cùng dùng cùng lúc — có cần giới hạn tốc độ, cache
gì không? Chưa rõ, ghi lại để coi thêm.

Cần chỗ lưu tài liệu người dùng upload lên, không phải dán
tay vào ô chat mỗi lần như bây giờ.
```

Ba dòng, không có mũi tên chỉ sang tên nào cả — khác hẳn cái danh sách chín dòng ngày xưa, lúc đó ít nhất đã biết "Kubernetes" là từ khoá cần tra. Lần này còn chưa biết gọi đúng tên. Bạn gấp laptop lại, không vội — tháng sau mới cần, nhưng bụng đã bắt đầu nghĩ tới rồi.
