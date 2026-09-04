# Chương 23 — Không đơn giản như xưa nữa

## Cuối tháng đó

Buổi họp cuối tháng, founder chiếu lên màn hình một biểu đồ tăng trưởng, đường kẻ đi lên đều đặn. Không ai vỗ tay ầm ĩ như hồi ký được ba hợp đồng cùng lúc — chỉ là một buổi họp bình thường, mọi người ghi chép, hỏi vài câu về roadmap quý sau, rồi giải tán.

Bạn về bàn, mở lại thứ vẫn luôn mở mỗi lần cần nhìn lại: file ghi chú từ đêm đầu tiên đọc README, ngay dưới cái danh sách chín dòng đã gạch hết từ nhiều tuần trước. Cuộn xuống, đúng ba dòng của `notes-next.md`, cũng đã gạch hết từ tuần này. Hai danh sách, cách nhau đúng một tháng, giờ đều trống trơn như nhau.

Bạn thử làm thứ chưa từng làm: hình dung lại đúng câu hỏi hồi tuần đầu tiên, cái câu tự đặt ra lúc đọc `docker-compose.yml` lần đầu — "dự án này có gì". Hồi đó trả lời được trong đúng năm phút: ba service, một frontend, một backend, một database. Giờ thử trả lời lại câu đó, y hệt vậy.

Không được nữa. Sáu Deployment, hai Secret, một PVC, một Ingress, một Redis chỉ để đếm số lần đăng nhập sai, một bảng `users` gắn `userId` vào khắp nơi. Muốn giải thích trọn vẹn cho ai đó mới vào, chắc chắn không xong trong năm phút — có khi phải nửa tiếng, có khi phải chính người đó tự bỏ ra vài ngày mới nắm được, đúng như bạn đã từng.

Bạn không thấy tệ vì điều đó. Mỗi thứ trong sáu Deployment kia đều có một lý do cụ thể, một sự cố cụ thể đứng đằng sau — không có gì được thêm vào "cho chắc" hay "phòng khi cần". `Secret` có vì một dòng password nằm phơi trong YAML. `PVC` có vì một lần xoá Pod mất sạch dữ liệu. `Redis` có vì hai mươi dòng `401` liên tiếp không ai chặn lại. Phức tạp hơn, nhưng không phải phức tạp vô cớ.

Bạn nhắn Martin, không khoe khoang, chỉ đơn giản là muốn kể.

```
Bạn
> hồi đó m bảo t cứ từ từ
> giờ nhìn lại đúng là từ từ thật, cái gì cũng phải có lý do mới thêm
> nhưng đống YAML giờ đọc lại thấy... nhiều thật á
```

```
Martin
> :)) đúng r đó
> lúc nào thấy 1 file YAML mà giải thích được cả câu chuyện đằng sau nó
> thì coi như xong bài học rồi đó
```

Bạn không hỏi lại "xong bài học nào" — không cần thiết nữa, tự hiểu được luôn.

Nhưng có những thứ vẫn còn nguyên, không lảng tránh được. `kubectl top` vẫn chỉ là ảnh chụp tức thời, không lịch sử, không cảnh báo — dòng ghi từ hồi quan sát được "một phần" vẫn đang chờ. Mỗi lần đổi code vẫn phải tự tay `docker build`, tự tay `kind load`, tự tay `kubectl apply` — không có gì tự động chạy khi có commit mới cả. `http://localhost/` vẫn chỉ chạy trên đúng một cái laptop, chưa từng có ai ngoài chính bạn gõ được địa chỉ đó.

Ba khoảng trống, không phải chuyện của hôm nay. Bạn gõ nốt vào file ghi chú, một dòng cuối cùng, không thuộc `notes-next.md` cũ nữa — một file mới.

```
đã xong: tự phục hồi, kết nối ổn định, lưu trữ bền, bí mật
tách riêng, biết giới hạn tài nguyên, biết số liệu thật, có
người dùng thật, expose ra được ngoài kubectl.

còn treo, biết rõ là treo: quan sát hệ thống đầy đủ theo thời
gian, tự động hoá deploy, chạy được ở đâu đó ngoài laptop này.
```

Đóng laptop lại, không có cảm giác "đã xong việc" nào cả — chỉ là biết rõ hơn hẳn ranh giới giữa cái đã làm và cái chưa làm, so với đêm đầu tiên khi ranh giới đó còn mờ mịt, chín dòng chữ nhìn như một bức tường không hiểu nổi.
