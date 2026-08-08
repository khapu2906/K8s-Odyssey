# Chương 5 — Trước khi vứt cả đống lên đó

## Vẫn sáng đó

Cà phê xong, bạn xách laptop ra khỏi nhà, chạy thẳng tới văn phòng — đóng nắp laptop lại lúc ra cửa, mở lên là y nguyên như cũ, cluster vẫn chạy.

Vừa đặt máy xuống bàn thì standup bắt đầu, trong lúc bạn còn đang lơ mơ vì mới ngủ được bốn tiếng.

> "Sao rồi?" founder hỏi, thấy bạn cắm mặt vào terminal cả buổi sáng.

> "Em sắp ra rồi, đang thử  chạy trên laptop rồi"

> "Ổn, cứ từ từ." Founder quay sang hỏi người khác, không truy thêm.

Bạn định gõ luôn YAML cho `chat-api` rồi `kubectl apply`, đẩy hết lên cluster cho xong. Nhưng khựng lại — bạn còn chưa thật sự biết `kubectl` có gì ngoài `get nodes` với `get pods`. Ném cả đống thứ vào một cluster mà mình chưa hiểu cách tổ chức, nghe không ổn.

`get nodes`, `get pods` — cùng một chữ `get`. Bạn đánh liều đoán `kubectl` chắc theo một khuôn cố định: `get` cộng với tên loại thứ muốn xem. Thử áp dụng cho thứ chưa từng gõ bao giờ.

```bash
kubectl get namespaces
```

```
NAME                 STATUS   AGE
default              Active   18m
kube-node-lease      Active   18m
kube-public          Active   18m
kube-system          Active   18m
```

`kube-system` thì quen mặt rồi — chỗ mấy cái pod control plane đang ở. Còn `default` — chỗ mọi thứ rơi vào nếu bạn không nói gì khác. Bạn không thích ý tưởng nhét AI Workspace chung một chỗ với rác thử nghiệm sau này. Tạo namespace riêng có vẻ hợp lý hơn.

```bash
kubectl create namespace ai-workspace
```

```
namespace/ai-workspace created
```

Namespace, hoá ra, đơn giản hơn bạn tưởng: chỉ là một cách chia cùng một cluster thành nhiều ngăn riêng biệt. `ai-workspace` và `kube-system` vẫn dùng chung một control plane, chung mấy cái node y hệt như lúc nãy — chỉ là tên trong ngăn này không đụng tên trong ngăn kia. Một Pod tên `chat-api` ở `ai-workspace` và một Pod tên `chat-api` ở namespace khác (nếu có) là hai thứ hoàn toàn tách biệt, không xung đột. Không phải cluster riêng — chỉ là ngăn kéo riêng trong cùng một tủ.

Xong việc tổ chức chỗ ở. Giờ đến việc bạn thật sự tò mò: `kubectl` còn biết làm gì mà bạn chưa từng gõ. Bạn gõ đại `kubectl --help`, chỉ để xem hết danh sách.

```
Basic Commands (Intermediate):
  explain         Get documentation for a resource
  get             Display one or many resources
  edit            Edit a resource on the server
  delete          Delete resources by file names, stdin, resources and names, or by resources and label selector

...

Other Commands:
  api-resources   Print the supported API resources on the server
  ...
```

Hai dòng đập vào mắt cùng lúc: `api-resources` và `explain`. Thử cái đầu trước.

```bash
kubectl api-resources | head -20
```

Một danh sách dài — `pods`, `deployments`, `services`, `configmaps`, `secrets`, hàng chục cái tên khác bạn còn chưa từng nghe. Đây là bản đồ đầy đủ của mọi thứ Kubernetes biết tạo ra. Bạn không đọc hết, nhưng lưu lại trong đầu: có gì không nhớ, tra ở đây trước.

Giờ tới dòng còn lại. `explain` — "Get documentation for a resource". Thử luôn, chỉ vì tò mò `pod` thật ra gồm những gì:

```bash
kubectl explain pod
```

```
KIND:     Pod
VERSION:  v1

DESCRIPTION:
    Pod is a collection of containers that can run on a host.
    ...

FIELDS:
  apiVersion	<string>
  kind	<string>
  metadata	<Object>
  spec	<Object>
  status	<Object>
```

Dòng đầu tiên trả lời đúng câu bạn định hỏi từ tối qua mà chưa ai giải thích rõ: Pod là *một nhóm container*, chạy cùng nhau trên cùng một máy. Không phải một container — một nhóm, dù nhóm đó thường xuyên chỉ có một thành viên, như `chat-api` sắp sửa là.

Không phải tài liệu bên thứ ba, không phải blog ai đó viết — đây là schema thật, do chính cluster trả lời, luôn khớp đúng phiên bản đang chạy. Bạn gõ tiếp một bậc sâu hơn:

```bash
kubectl explain pod.spec.containers
```

Danh sách field hiện ra — `image`, `name`, `ports`, `env`, những chữ bạn đã quen từ hồi đọc `docker-compose.yml`. Không hoàn toàn giống, nhưng đủ gần để không thấy xa lạ.

Bạn nhận ra một điều trong lúc gõ mấy lệnh này: từ nãy giờ toàn bộ là `kubectl create namespace ...`, `kubectl get ...` — ra lệnh trực tiếp, một lệnh một hành động. Nhưng cái README hôm qua rõ ràng nói khác — *bạn viết ra bạn muốn gì, rồi lưu lại*. Hai kiểu đó không giống nhau.

Bạn thử tra:

```bash
kubectl create namespace test-imperative
kubectl get namespace test-imperative -o yaml
```

Ra một file YAML đầy đủ, dù bạn chưa từng viết dòng YAML nào. Té ra `kubectl create` cũng đang sinh ra đúng loại "bản mô tả" đó ở phía sau — chỉ là nó tự viết giùm bạn, và bạn không có bản lưu nào để applied lại lần hai nếu chót lỡ xoá. Còn cách kia — viết file YAML trước, `kubectl apply -f` sau — bạn có bản lưu, sửa được, đưa vào git được, chạy lại y hệt trên máy khác được.

```bash
kubectl delete namespace test-imperative
```

Bạn xoá cái namespace thử nghiệm đi, giữ lại `ai-workspace`. Giờ thì rõ rồi: mọi thứ từ đây trở đi, bạn sẽ viết ra file trước.

Bạn mở một file trống, đặt tên `chat-api-pod.yaml`. Chưa gõ chữ nào. Nhưng lần đầu tiên từ đầu tuần, bạn thấy chắc tay hơn hẳn.
