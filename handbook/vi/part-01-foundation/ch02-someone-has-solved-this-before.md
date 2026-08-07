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

Bạn mở cái ảnh chụp trang sổ tay trên điện thoại, đọc lại không biết bao nhiêu lần trong tối nay. Không có dòng nào trong đó khó hiểu. Nhưng khi bạn đọc, nó làm bạn ngứa ngáy khó chịu, vì đúng là một bài toán khó thuật sự. Bạn đã nghĩ sẽ dùng một hệ thống gì đó đề kiểm soát, nhưng không biết nó là gì.

Bạn nghĩ đến Martin. Hai đứa từng làm chung một dự án outsource không bao giờ ra mắt, nhưng Martin là kiểu người thích đọc postmortem của công ty khác chỉ vì tò mò. Giờ nghe nói đang làm ở đâu đó có traffic khủng lắm, chắc cu cháu biết nên làm gì với trường hợp này.

Bạn nhắn tin.

```
Bạn
> ê cu hỏi ngu tí
> quả startup bên t giờ mới có hơn 300 cháu vào thôi
> mà hơn chục ccu là auto sập 🙃
> thử horizontal scale rồi  mà vẫn chết, éo biết giờ làm sao, cứu giá phát
> t ghi ra mấy vấn đề xem check hộ bạn phát nào
[gửi kèm ảnh check list]
```

```
Martin
> Đâu xem nào :3
> Gọi thầy đi :)) rồi làm gì làm tiếp
```

### Cuộc gọi

> MT: "Lol :)) cái này mày phải dùng K8s cho tao."

> Bạn: "Là cái gì vậy?"

> MT: "Ừm... éo biết giải thích như nào nhỉ. Đơn giản là — Docker chạy một container, cái này chạy cả đống container, trên cả đống máy, K8s lo mấy cái mày đang phải làm bằng tay."

> Bạn: "Kiểu tự restart á?"

> MT: "Một phần thôi. Nó không phải chạy lệnh một phát rồi xong như compose đâu. Nó chạy hoài, kiểm tra liên tục, sai là tự sửa."

> Bạn "Nghe thơm nhỉ, ba giờ sáng container chết có gì tự dựng lại giùm."

> MT: "Ừ ví dụ vậy. Còn nhiều cái khác nữa."

> MT: "Tao đi chạy đây, mày tự mò đi, dựng một cluster nhỏ trên laptop xem"

> Bạn: "Ok... một câu thôi. hơn 300 user thì có cần cái này không nhỉ?"

> MT: "Thiệt tình á? Áp vào quả hệ thống bây giờ thì hơi có vấn đề. Nhưng nên học, nó giải quyết được triệt đề đấy, traffic mày chỉ có tăng thôi. Thôi tao chạy đây."

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

Nhưng đến tab thứ tám, bạn dừng lại thật sự lâu.

Không phải một bài blog dài dòng. Một cái README ngắn của một dự án demo nào đó, viết bởi người rõ ràng cũng từng bực bội y như bạn tối nay. Chỉ bốn dòng, nhưng bạn phải đọc lại lần hai để chắc mình hiểu đúng:

> Bạn không ra lệnh cho Kubernetes phải làm gì. Bạn viết ra *bạn muốn cái gì* — kiểu "tôi muốn 3 bản sao của app này, luôn luôn chạy, luôn truy cập được ở địa chỉ này" — rồi lưu lại. Cái đó gọi là *desired state*. Có một thứ (gọi là control plane) liên tục nhìn vào hệ thống thật, so với cái bạn viết, thấy khác là tự sửa cho khớp. Container thật sự chạy trên các máy khác, gọi là node — control plane không chạy app của bạn, nó chỉ ra lệnh và theo dõi thôi.

Bạn đọc lại lần nữa. À. Không phải bạn "chạy Kubernetes" như chạy một lệnh rồi xong. Bạn *mô tả* hệ thống bạn muốn có, rồi có một thứ luôn thức, liên tục làm cho thực tế khớp với mô tả đó. Cái Martin nói lúc nãy — "chạy hoài, kiểm tra liên tục, sai là tự sửa" — giờ bạn mới thực sự hình dung được nó trông như thế nào.

Bạn ngồi tựa lưng ra ghế. Không có một câu trả lời sạch sẽ nào cho "nên học Kubernetes kiểu gì" — chỉ có một đống người từng đứng đúng chỗ bạn đang đứng, mỗi người rút ra một bài học khác nhau, đôi khi ngược hẳn nhau. Nhưng riêng cái ý *desired state* thì bạn nắm được rồi, chắc chắn.

Và có một thứ khác lặp lại ở gần như mọi bài, dưới mọi hình thức khác nhau: *đừng học hết lý thuyết rồi mới bắt đầu — cứ chạy thử một cái nhỏ, rồi học dần từ đó.*

Đúng điều Martin vừa nói, chỉ có điều lần này bạn tự tìm ra, không phải được kể cho nghe.

Bạn đóng hết mấy cái tab tranh cãi lại, gõ một câu tìm kiếm khác — câu mà thật ra bạn muốn biết hơn cả:

```
how to actually try kubernetes on my laptop
```
