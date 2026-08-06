# Chương 2 — Ai đó đã giải quyết chuyện này rồi

## Tối hôm đó

Bạn về nhà, ăn tối qua loa, rồi lại mở laptop ra — không phải để làm gì cụ thể, chỉ là không thể không nghĩ về cái danh sách đó.

```
Need scaling.
Need restart.
Need deployment.
Need networking.
Need service discovery.
Need scheduling.
Need storage.
Need secrets.
Need health checks.
Need observability.
```

Bạn zoom cái ảnh chụp trang sổ tay trên điện thoại, đọc lại lần thứ năm trong tối nay. Không có dòng nào trong đó khó hiểu. Nhưng gộp lại, nó trông như một hệ thống hoàn chỉnh đang đòi được xây — mà bạn thì chẳng biết bắt đầu từ đâu.

Bạn nghĩ đến Minh. Hai công ty trước, hai đứa từng làm chung một dự án outsource không bao giờ ra mắt, nhưng Minh là kiểu người thích đọc postmortem của công ty khác chỉ vì tò mò. Giờ nghe nói đang làm ở đâu đó có traffic thật.

Bạn nhắn tin.

```
Bạn
ê, hỏi ngu tí. bên mình mới startup, scale còn bé xíu
(312 user, thật sự buồn cười) nhưng cứ hễ có hơn
chục request cùng lúc là có gì đó hỏng

Bạn
cảm giác như đang tự phát minh lại thứ gì đó
chắc chắn đã có người làm rồi
```

```
Minh
lol yes. classic. 2s
```

### Cuộc gọi

Điện thoại rung. Nền có tiếng nhạc, tiếng người nói chuyện — Minh đang ở đâu đó ồn ào, chắc vẫn còn ở văn phòng.

> "Ê." Có tiếng ghế kéo, tiếng Minh chắc đang tìm chỗ yên tĩnh hơn. "Rồi, gửi tao xem cái list đi, đọc miệng lâu."

Bạn chụp lại trang sổ, gửi qua.

Vài giây im lặng — Minh đang đọc.

> "Ừ. Cái này có tên rồi. Kubernetes."

> "Nó là cái gì vậy?"

> "Uhm..." Tiếng thở dài nhẹ, kiểu người sắp phải giải thích một thứ đã quá quen tới mức quên mất lúc đầu mình học nó khó thế nào. "Tao giải thích dở lắm, thật. Nói ngắn gọn là — mày biết Docker chạy một container. Cái này chạy *nhiều* container, trên *nhiều* máy, và tự lo phần mày đang phải lo bằng tay."

> "Kiểu... auto-restart á?"

> "Đó chỉ là một phần thôi. Nó không phải 'chạy lệnh một lần rồi xong' như compose. Nó cứ chạy hoài, kiểm tra liên tục — cái đang chạy có đúng cái đáng lẽ phải chạy không, sai thì tự sửa."

> "Ba giờ sáng, container chết, có gì tự restart giùm tao là được rồi."

> "Đúng, đó là một ví dụ. Còn chục cái khác nữa."

Có tiếng ai đó gọi Minh ở đầu dây bên kia — nghe không rõ, nhưng Minh trả lời "ừ hai phút" rồi quay lại máy.

> "Nghe, tao đang phải chạy. Mày cứ tự mò trước đi, cài thử một cluster nhỏ trên laptop, không cần cloud gì hết. Học nhanh hơn nghe tao giảng nhiều."

> "Được rồi... một câu thôi. 312 user thì có cần cái này không, hay đang làm quá?"

> "Thật lòng?" Minh cười. "Hơi quá, nếu tính deploy tuần này. Nhưng học thì không quá đâu — traffic mày chỉ có tăng, không giảm. Thôi tao chạy đây, làm gì không hiểu nhắn tao."

Cuộc gọi kết thúc, đột ngột hơn bạn tưởng. Bạn nhìn màn hình điện thoại — 4 phút 12 giây. Không phải là một buổi giảng bài. Chỉ là xác nhận: đúng, cái này có tên, đúng hướng đi tìm hiểu tiếp là ở đó.

### Tự mò

Bạn gõ vào ô tìm kiếm:

```
what is kubernetes
```

Kết quả đầu tiên là trang chủ chính thức — một đoạn định nghĩa nghe rất chững chạc, rất... không giúp ích gì mấy. Bạn cuộn xuống, mở thêm năm tab.

Một bài blog năm 2019 giải thích Kubernetes bằng ẩn dụ container vận chuyển đường biển, dài 4000 từ, bạn bỏ cuộc ở đoạn thứ ba.

Một thread trên Reddit, top comment: *"honestly for your scale just use a VPS and a bash script, k8s will eat your team alive."* Comment thứ hai, 200 upvote, cãi lại: *"terrible advice, you'll rebuild half of k8s badly by hand within a year."* Hai người tranh luận nhau dài dằng dặc, không ai chịu ai.

Một trang so sánh Kubernetes với Docker Swarm với Nomad với "just use ECS if you're on AWS", mỗi cột đều tự nhận mình đơn giản hơn cột bên cạnh.

Một tweet: *"kubernetes almost killed my startup"*, thả trong quote-tweet là ảnh chụp hoá đơn cloud sáu chữ số. Ngay bên dưới gợi ý, một tweet khác: *"switched to k8s, best decision we made, here's why 🧵"*.

Bạn ngồi tựa lưng ra ghế. Không có một câu trả lời sạch sẽ nào cả — chỉ có một đống người đã từng đứng đúng chỗ bạn đang đứng, mỗi người rút ra một bài học khác nhau, đôi khi ngược hẳn nhau.

Nhưng có một thứ lặp lại ở gần như mọi bài, dưới mọi hình thức khác nhau: *đừng học hết lý thuyết rồi mới bắt đầu — cứ chạy thử một cái nhỏ, rồi học dần từ đó.*

Đúng điều Minh vừa nói, chỉ có điều lần này bạn tự tìm ra, không phải được kể cho nghe.

Bạn đóng hết mấy cái tab tranh cãi lại, gõ một câu tìm kiếm khác — câu mà thật ra bạn muốn biết hơn cả:

```
how to actually try kubernetes on my laptop
```
