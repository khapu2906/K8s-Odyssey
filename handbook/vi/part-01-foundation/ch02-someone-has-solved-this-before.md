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

Bạn nghĩ đến Minh.

Hai công ty trước, bạn và Minh từng làm chung một dự án outsource cho một công ty logistics — dự án cuối cùng không bao giờ ra mắt, nhưng bốn tháng làm chung đó là khoảng thời gian bạn học được nhiều nhất về vận hành hệ thống. Minh là kiểu kỹ sư hiếm có: thích đọc postmortem của các công ty khác chỉ vì tò mò, không phải vì bị bắt buộc. Lần cuối bạn nghe tin, Minh đang làm staff engineer ở một công ty có traffic thật — cái loại traffic khiến 312 user nghe như một con số làm tròn.

Bạn nhắn tin.

```
Bạn
ê, hỏi ngu tí. bên mình mới startup, scale còn bé xíu
(312 user, thật sự buồn cười) nhưng cứ hễ có hơn
chục request cùng lúc là có gì đó hỏng.

Bạn
sáng nay họp đứng, có người hỏi câu hiển nhiên nhất
"sao không chạy thêm container là được" — thế là
mở ra cả chục vấn đề khác

Bạn
cảm giác như đang tự phát minh lại thứ gì đó
chắc chắn đã có người làm rồi
```

Ba chấm hiện lên gần như ngay lập tức.

```
Minh
lol yes. classic.

Minh
gọi 5 phút nữa đc ko?
```

### Cuộc gọi

Điện thoại rung đúng năm phút sau.

> "Kể tao nghe," Minh nói, không rào trước đón sau. "Danh sách thế nào?"

Bạn đọc từng dòng. Minh không ngắt lời, chỉ thỉnh thoảng ừ nhẹ — cái kiểu ừ của người đã nghe câu chuyện này quá nhiều lần rồi.

> "Ok," Minh nói khi bạn đọc xong. "Tin vui là mày không điên. Tin vui hơn nữa là cái này có tên rồi, không cần tự phát minh lại đâu."

> "Tên gì?"

> "Kubernetes."

Bạn gõ vội vào Google Docs đang mở sẵn. Đúng cái từ bạn từng lướt qua trong vài tin tuyển dụng, chưa bao giờ để tâm.

> "Được rồi," bạn nói. "Nó là cái gì?"

> "Để tao đi từ đầu. Docker mày biết rồi — đóng gói app thành container, chạy y hệt nhau ở bất cứ đâu. Cái đó mày đã giải quyết xong, không phải nghĩ nữa."

> "Ừ."

> "Vấn đề của mày không nằm ở *một* container. Nó nằm ở việc mày có nhiều container, trên nhiều máy, và không có gì đứng ra *trông coi* tất cả. Ai theo dõi container nào đang sống, cái nào vừa chết. Ai quyết định container mới nên chạy trên máy nào. Ai route request tới cái đang rảnh. Ai restart cái vừa crash lúc 3 giờ sáng, trước khi khách hàng kịp nhận ra."

> "Đúng y chang danh sách của tao."

> "Vì đó chính xác là danh sách của *mọi người*, khi họ đi tới đúng điểm này. Kubernetes là phần mềm làm đúng việc đó — trông coi một đống container, trên một đống máy, liên tục so sánh 'cái gì đang chạy' với 'cái gì lẽ ra nên chạy', rồi tự sửa chênh lệch. Không cần mày thức dậy lúc 3 giờ sáng để gõ lệnh restart bằng tay."

Bạn im lặng một lúc, để câu đó ngấm.

> "Nghe hơi... to tát. Cho một app có 312 user."

Minh cười.

> "Đúng vậy. Và đây là phần tao sẽ không nói dối mày: Kubernetes không hề đơn giản. Nó có đường cong học tập thật, có rất nhiều khái niệm mới, và với 312 user thì đúng là hơi quá tay nếu mày định set up một cluster ba node ngay tuần này."

> "Vậy sao mày lại khuyên tao học nó?"

> "Vì tao không khuyên mày *deploy* nó tuần này. Tao khuyên mày *hiểu* nó, vì cái danh sách mày vừa đọc không tự biến mất đâu. Traffic sẽ còn tăng. Càng tăng, mày càng phải tự tay vá từng vấn đề một — cho tới khi mày nhận ra mình đang viết lại, chậm hơn và tệ hơn, đúng thứ Kubernetes đã làm sẵn cho hàng nghìn công ty khác rồi."

### Câu hỏi khó

> "Sao không phải Docker Swarm? Tao nhớ có nghe cái tên đó."

> "Đơn giản hơn thật, và với team nhỏ như bên mày thì không phải lựa chọn tồi. Nhưng gần như cả ngành đã dồn về Kubernetes — nghĩa là tài liệu nhiều hơn, công cụ nhiều hơn, người biết dùng nhiều hơn khi mày cần tuyển. Không hẳn Swarm dở hơn. Chỉ là ván bài đã ngã ngũ rồi."

> "Được. Vậy về cơ bản, nó hoạt động kiểu gì?"

> "Mày mô tả cái mày *muốn* — 'tao muốn ba bản sao của chat-api, luôn luôn chạy' — rồi Kubernetes lo phần còn lại. Nó không chạy lệnh một lần rồi thôi như `docker compose up`. Nó chạy một vòng lặp, mãi mãi: nhìn vào cái đang chạy thật, so với cái mày yêu cầu, sửa chênh lệch, lặp lại. Pod chết — nó thấy, nó tạo cái mới. Traffic tăng — nếu mày cấu hình đúng, nó tự thêm bản sao. Mày deploy version mới — nó rollout từng chút một, không tắt hết cùng lúc."

> "Nghe như một thứ luôn thức, luôn theo dõi."

> "Đúng vậy đó. Cái mà cái danh sách của mày đang thiếu, chính xác là một thứ luôn thức."

### Kết thúc cuộc gọi

Bạn nói chuyện thêm mười lăm phút nữa — về việc học từ đâu, về việc một cluster nhỏ chạy ngay trên laptop cũng đủ để bắt đầu, không cần tài khoản cloud, không cần thẻ tín dụng.

> "Một điều cuối," Minh nói trước khi cúp máy. "Đừng cố học hết một lần. Mày sẽ thấy cả trăm khái niệm mới trong vài tuần tới — Pod, Deployment, Service, đủ thứ. Đừng hoảng. Học từng cái, đúng lúc mày cần, y như cách mày vừa học được lý do vì sao mày cần Kubernetes tối nay — chứ không phải đọc hết tài liệu trước rồi mới bắt đầu."

Bạn cúp máy. Ngồi im một lúc trong phòng khách tối om, chỉ có ánh sáng từ màn hình laptop.

Danh sách vẫn còn đó. Nhưng giờ nó có tên rồi.

Bạn gõ vào ô tìm kiếm:

```
what is kubernetes
```

Rồi dừng lại, xóa đi, gõ lại câu khác — câu mà thật ra bạn muốn biết hơn:

```
how to actually try kubernetes on my laptop
```
