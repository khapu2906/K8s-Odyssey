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

Kết quả đầu tiên là trang chủ chính thức, chững chạc mà chẳng giúp được gì. Nửa tiếng sau, cả chục tab mở ra, bạn đã tìm ra một cái README ngắn của một dự án demo nào đó, viết bởi người rõ ràng cũng từng bực bội y như bạn tối nay:

> Bạn không ra lệnh cho Kubernetes phải làm gì. Bạn viết ra *bạn muốn cái gì* — kiểu "tôi muốn 3 bản sao của app này, luôn luôn chạy, luôn truy cập được ở địa chỉ này" — rồi lưu lại. Cái đó gọi là *desired state*. Có một thứ (gọi là control plane) liên tục nhìn vào hệ thống thật, so với cái bạn viết, thấy khác là tự sửa cho khớp. Container thật sự chạy trên các máy khác, gọi là node — control plane không chạy app của bạn, nó chỉ ra lệnh và theo dõi thôi.

Bạn đọc lại lần nữa. À. Không phải bạn "chạy Kubernetes" như chạy một lệnh rồi xong. Bạn *mô tả* hệ thống bạn muốn có, rồi có một thứ luôn thức, liên tục làm cho thực tế khớp với mô tả đó.

Bạn mở một file trống, gõ thẳng vào đó, đối chiếu ngược lại với chính cái danh sách bạn viết ba tuần trước:

```
Need scaling
→ có field tên là "replicas", khai N thay vì 1 là nó tự thêm/bớt container. đọc lướt còn thấy chữ HPA (Horizontal Pod Autoscaler) — chắc là bản tự động theo traffic, chưa rõ chi tiết

Need restart
→ cái đứng ra canh số lượng container gọi là "ReplicaSet". container chết là nó tự tạo cái mới, không cần ai gõ lệnh lúc 3h sáng

Need deployment
→ toàn bộ cái vụ ReplicaSet + rolling update này nằm trong 1 object gọi là "Deployment". đổi version thì dựng bản mới song song bản cũ, chuyển traffic từ từ, lỗi thì rollback lại được luôn

Need networking / service discovery
→ có object tên "Service", cho mỗi nhóm container 1 tên cố định, container khác cứ gọi theo tên đó (qua DNS nội bộ) là kết nối được, không cần biết IP thật

Need scheduling
→ có 1 thành phần tên "Scheduler" trong control plane, biết máy nào (gọi là "Node") còn CPU/RAM trống, tự đặt container mới vào đó

Need storage
→ có khái niệm "Volume" tách rời khỏi container, còn cái giữ dữ liệu lâu dài dù container chết/dời máy thì gọi là "PersistentVolume" (PV) và "PersistentVolumeClaim" (PVC)

Need secrets
→ có object riêng tên "Secret" để lưu password/API key, và "ConfigMap" cho mấy cái config không nhạy cảm — không commit thẳng vào code hay file compose như hiện tại

Need health checks
→ 2 loại check tên "liveness probe" (còn sống không, chết thì restart) và "readiness probe" (sẵn sàng nhận request chưa, chưa sẵn sàng thì tạm ngưng route traffic, không cần restart)

Need observability
→ ??? đọc thấy nhắc tới Prometheus, Grafana, metrics-server nhưng mỗi bài dùng khác nhau, không rõ cái nào là "chuẩn" của Kubernetes hay là add-on bên thứ 3. để sau
```

Không phải dòng nào cũng rõ ràng — riêng "observability" đọc ba nguồn khác nhau vẫn chưa hình dung nổi cụ thể là gì. Nhưng bảy trên chín dòng, giờ bạn đã có câu trả lời, dù mới chỉ ở mức khái niệm. Ba tuần trước, danh sách này trông như một bức tường. Giờ nó trông như bản tính năng của một phần mềm đã có sẵn — chỉ là bạn chưa từng đụng tới.

Bạn ngồi tựa lưng ra ghế. Không có một câu trả lời sạch sẽ nào cho "nên học Kubernetes kiểu gì" — chỉ có một đống người từng đứng đúng chỗ bạn đang đứng, mỗi người rút ra một bài học khác nhau, đôi khi ngược hẳn nhau. Nhưng riêng cái ý *desired state*, và bảy dòng vừa đối chiếu xong, thì bạn nắm được rồi, chắc chắn.

Và có một thứ khác lặp lại ở gần như mọi bài, dưới mọi hình thức khác nhau: *đừng học hết lý thuyết rồi mới bắt đầu — cứ chạy thử một cái nhỏ, rồi học dần từ đó.*

Đúng điều Martin vừa nói, chỉ có điều lần này bạn tự tìm ra, không phải được kể cho nghe.

Bạn đóng hết mấy cái tab tranh cãi lại, gõ một câu tìm kiếm khác — câu mà thật ra bạn muốn biết hơn cả:

```
how to actually try kubernetes on my laptop
```
