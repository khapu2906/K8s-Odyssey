# Chương 3 — Không cần thẻ tín dụng

## Vẫn tối đó

```
how to actually try kubernetes on my laptop
```

Kết quả đầu tiên làm bạn nhẹ cả người: không cần tài khoản cloud, không cần thẻ tín dụng, không cần mua máy chủ nào cả. Kubernetes chạy được ngay trên laptop, y như Docker vẫn đang chạy.

Nhưng đến đoạn "cài cái gì để chạy", bạn lại đứng hình lần nữa. Không phải một lựa chọn. Là năm.

```
minikube
kind
k3s
k3d
OrbStack → Enable Kubernetes
```

Mỗi cái một bài hướng dẫn riêng, mỗi bài lại nói cái của mình là "chuẩn nhất". Bạn lướt qua từng cái, cố ghi lại điểm khác nhau thực sự là gì, chứ không phải chỉ đọc marketing.

```
minikube
→ chạy Kubernetes trong 1 VM riêng. lâu đời nhất, tài liệu
  nhiều nhất, nhưng cần cài thêm phần mềm ảo hoá, khởi động
  cũng chậm hơn

kind
→ "Kubernetes in Docker" — chạy cả cluster như các container
  Docker bình thường, không cần VM riêng. nhẹ, khởi động nhanh,
  dân CI/CD hay dùng để test

k3s
→ bản Kubernetes rút gọn của Rancher, thường dùng cho production
  thật trên máy yếu (edge, IoT) chứ không hẳn để học trên laptop

k3d
→ chạy k3s bên trong Docker, giống kind nhưng dùng bản k3s thay
  vì Kubernetes gốc

OrbStack
→ cái bạn đang dùng thay Docker Desktop, nhẹ hơn hẳn, cũng có
  sẵn nút bật Kubernetes, khỏi cài gì thêm — nhưng vẫn chỉ là
  một cluster cố định, không tiện tạo/xoá nhanh qua CLI như kind
```

Bạn nhắn Martin một câu, không mong chờ gì nhiều vì biết ổng đang bận.

```
Bạn
> giữa mấy cái minikube/kind/k3d thì m hay dùng cái nào để test
```

Trả lời đến sau mười phút.

```
Martin
> kind, xong việc là xoá, tạo lại 5s
> đừng nghĩ nhiều, cái nào chả được, học đc concept là chính
```

Đúng cái bạn cần nghe — không phải cái nào "đúng nhất", chỉ cần cái nào đủ nhẹ để tạo đi tạo lại mà không phải ngồi đợi. Bạn chọn kind.

Máy bạn là Mac, nên cài qua Homebrew là nhanh nhất. OrbStack thì có sẵn trên máy từ lâu rồi — ngày đầu tiên đi làm bạn đã dùng nó để chạy cả AI Workspace — kind chỉ cần một Docker daemon đang chạy, không quan tâm đó là OrbStack hay Docker Desktop, nên không cần cài thêm gì khác.

```bash
brew install kind
brew install kubectl
```

Cả hai tải về trong chưa đầy một phút. Con trỏ nhấp nháy sau dấu `$`, chờ lệnh tiếp theo — cái lệnh sẽ thật sự tạo ra cluster đầu tiên trong đời bạn.

Bạn chưa gõ vội. Đêm nay đã đủ dài rồi.
