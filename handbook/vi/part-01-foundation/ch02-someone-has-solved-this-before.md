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

Bạn nghĩ đến Martin. Hai công ty trước, hai đứa từng làm chung một dự án outsource không bao giờ ra mắt, nhưng Martin là kiểu người thích đọc postmortem của công ty khác chỉ vì tò mò. Giờ nghe nói đang làm ở đâu đó có traffic thật.

Bạn nhắn tin.

```
Bạn
ê hỏi ngu tí

Bạn
startup t giờ có 312 user thôi

Bạn
mà hơn chục request 1 lúc là auto sập 🙃

Bạn
cảm giác đang reinvent cái gì đó chắc có
người làm rồi
```

```
Martin
haha đúng rồi đó, kinh điển

Martin
gọi đc ko
```

### Cuộc gọi

> "Gửi cái list coi."

Bạn chụp lại trang sổ, gửi qua.

Vài giây im lặng.

> "Ờ. Có tên rồi đó. Kubernetes."

> "Là cái gì vậy?"

> "Ừm... tao giải thích dở lắm nha. Nói kiểu ngắn nhất là — Docker chạy một container, cái này chạy cả đống container, trên cả đống máy, tự lo mấy cái mày đang phải làm bằng tay."

> "Kiểu tự restart á?"

> "Một phần thôi. Nó không phải chạy lệnh một phát rồi xong như compose đâu. Nó chạy hoài, kiểm tra liên tục, sai là tự sửa."

> "Vậy đúng ý t rồi, ba giờ sáng container chết có gì tự dựng lại giùm."

> "Ừ ví dụ vậy. Còn nhiều cái khác nữa."

> "Tao đang chạy đây, mày tự mò đi, cài thử một cluster nhỏ trên laptop, không cần cloud gì hết. Học vậy nhanh hơn nghe tao nói nhiều."

> "Ok... một câu thôi. 312 user thì có cần cái này không hay t đang làm quá?"

> "Thiệt tình á? Deploy tuần này thì hơi quá. Học thì không quá đâu, traffic mày chỉ có tăng thôi. Thôi tao chạy đây."

Cuộc gọi kết thúc, đột ngột hơn bạn tưởng. Bốn phút mười hai giây. Không phải một buổi giảng bài. Chỉ đủ để biết: đúng, cái này có tên, và hướng đi tiếp theo là ở đó.

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

Đúng điều Martin vừa nói, chỉ có điều lần này bạn tự tìm ra, không phải được kể cho nghe.

Bạn đóng hết mấy cái tab tranh cãi lại, gõ một câu tìm kiếm khác — câu mà thật ra bạn muốn biết hơn cả:

```
how to actually try kubernetes on my laptop
```
