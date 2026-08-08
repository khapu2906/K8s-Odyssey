# Chương 4 — Không còn là khái niệm nữa

## Sáng hôm sau

Bạn dậy sớm hơn thường lệ. Terminal từ tối qua vẫn còn mở, con trỏ vẫn nhấp nháy sau dấu `$`, chờ đúng cái lệnh bạn để dành lại.

```bash
kind create cluster --name ai-workspace
```

```
Creating cluster "ai-workspace" ...
 ✓ Ensuring node image (kindest/node:v1.31.0) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-ai-workspace"
```

Chưa đầy một phút. Không có gì nổ tung, không có màn hình xanh nào cả. Bạn gõ tiếp lệnh đầu tiên học được tối qua.

```bash
kubectl get nodes
```

```
NAME                         STATUS   ROLES           AGE   VERSION
ai-workspace-control-plane   Ready    control-plane   52s   v1.31.0
```

Một dòng duy nhất. Bạn nhìn lại cột `ROLES`: `control-plane`. Chỉ một máy — không phải "control plane" và "node chạy container" là hai thứ tách biệt như cái README tối qua mô tả. Cùng một máy, đóng luôn cả hai vai, vì đây chỉ là `kind` giả lập trên laptop của bạn. Thật ra vẫn đúng như mô tả — chỉ là quy mô nhỏ nhất có thể.

Bạn tò mò, gõ thêm một lệnh không nằm trong hướng dẫn nào cả — chỉ vì muốn xem "cái đang theo dõi mọi thứ" mà Martin với cái README nói tới, trông thật sự như thế nào.

```bash
kubectl get pods -n kube-system
```

```
NAME                                                 READY   STATUS    RESTARTS   AGE
coredns-7db6d8ff4d-8x2kp                             1/1     Running   0          58s
coredns-7db6d8ff4d-vqz4n                             1/1     Running   0          58s
etcd-ai-workspace-control-plane                      1/1     Running   0          70s
kindnet-w4jbl                                        1/1     Running   0          58s
kube-apiserver-ai-workspace-control-plane            1/1     Running   0          70s
kube-controller-manager-ai-workspace-control-plane   1/1     Running   0          70s
kube-proxy-2f9kd                                     1/1     Running   0          58s
kube-scheduler-ai-workspace-control-plane            1/1     Running   0          70s
```

Bạn ngồi thẳng lại. Đây không phải danh sách khái niệm trừu tượng nữa — mấy cái tên này đang chạy thật, ngay trên laptop của bạn.

- `etcd` — cái README tối qua gọi chung chung là "hệ thống thật", giờ hoá ra chính là dòng này. Nơi lưu lại "desired state" bạn đọc được. 
- `kube-apiserver` — cửa duy nhất mà mọi lệnh `kubectl` bạn gõ đi qua. 
- `kube-scheduler` — cái quyết định container mới chạy ở máy nào, dù ở đây chỉ có đúng một máy để chọn.
- `kube-controller-manager` — nơi chạy cái vòng lặp Martin tả tối qua, "chạy hoài, kiểm tra liên tục, sai là tự sửa".

Bạn thử một việc nữa — gõ vào chính API server để xem nó trả lời gì.

```bash
kubectl get pods -n kube-system -o wide
kubectl logs -n kube-system kube-apiserver-ai-workspace-control-plane --tail 5
```

Vài dòng log hiện ra, khô khan, kỹ thuật, chẳng có gì đặc biệt để đọc. Nhưng đó chính là nó — cùng một process đang trả lời câu `kubectl get nodes` bạn vừa gõ, đang ghi log ngay trước mắt bạn.

Tối qua, tất cả những cái tên này chỉ là chữ trong một bài blog. Sáng nay, chúng là process thật, có PID thật, đang chạy trên chính cái máy bạn đang gõ phím.

Bạn mở lại cái ghi chú tối qua, thêm một dòng mới vào cuối:

```
Note to self: "control plane" không phải một khái niệm mơ hồ.
Nó là 4-5 cái pod cụ thể, chạy trong namespace kube-system,
mình vừa nhìn thấy tận mắt.
```

Cluster đã có, chạy thật, không còn là hình dung trong đầu nữa. Cốc cà phê vẫn chưa pha. Bạn đứng dậy đi pha, để cái terminal mở nguyên đó — tám cái pod vẫn đang chạy, chờ bạn quay lại.
