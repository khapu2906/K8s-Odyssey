# Chương 6 — Chạy được 12 giây

## Vẫn sáng đó

File `chat-api-pod.yaml` vẫn còn trống. Bạn mở lại `docker-compose.yml` bên cạnh để so, rồi bắt đầu gõ.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: chat-api
  namespace: ai-workspace
  labels:
    app: chat-api
spec:
  containers:
    - name: chat-api
      image: ai-workspace/chat-api:dev
      ports:
        - containerPort: 8080
      env:
        - name: DATABASE_URL
          value: postgres://postgres:postgres@postgres:5432/aiworkspace
```

Không khác `docker-compose.yml` bao nhiêu — cùng image, cùng port, cùng biến môi trường. Bạn thấy dễ thở hơn hẳn so với tưởng tượng ban đầu.

```bash
kubectl apply -f chat-api-pod.yaml
```

```
pod/chat-api created
```

```bash
kubectl get pods -n ai-workspace
```

```
NAME       READY   STATUS         RESTARTS   AGE
chat-api   0/1     ErrImagePull   0          8s
```

Không phải cái bạn mong đợi. Bạn `describe` thử xem sao.

```bash
kubectl describe pod chat-api -n ai-workspace
```

```
Events:
  Type     Reason   Age               From     Message
  ----     ------   ----              ----     -------
  Normal   Pulling  6s (x2 over 8s)   kubelet  Pulling image "ai-workspace/chat-api:dev"
  Warning  Failed   4s (x2 over 6s)   kubelet  Failed to pull image "ai-workspace/chat-api:dev": failed to resolve reference: docker.io/ai-workspace/chat-api:dev: not found
  Warning  Failed   4s (x2 over 6s)   kubelet  Error: ErrImagePull
```

`docker.io` — kubelet đang cố tải image này từ Docker Hub, như thể nó là một image public ai đó đã đăng lên. Nhưng image này bạn build trên chính máy mình, chưa từng push lên đâu cả. Bạn thử kiểm tra xem nó có thật sự tồn tại trên máy không, đúng cái tên đó không.

```bash
docker images | grep chat-api
```

```
project-chat-api   latest   83d2fa3ec246   2 days ago   208MB
```

Không phải `ai-workspace/chat-api:dev` như trong YAML. Là `project-chat-api:latest`. Bạn nhớ ra — image này được build từ hồi `docker compose up --build` những ngày đầu, và Compose tự đặt tên image theo công thức `<tên-thư-mục-dự-án>-<tên-service>`. Thư mục dự án tên là `project`, service tên `chat-api`, ra `project-chat-api`. Chẳng liên quan gì đến cái tên bạn gõ trong Pod YAML — bạn chỉ đang gõ đại một cái tên nghe hợp lý, không kiểm tra lại image thật sự tên gì.

Cái tên tự sinh đó còn phụ thuộc vào tên thư mục — máy người khác clone repo vào thư mục tên khác, image lại ra tên khác nữa. Không thể dựa vào đó cho một YAML sẽ chia sẻ cho người khác dùng. Cách đúng là tự đặt tên rõ ràng khi build.

```bash
docker build -t ai-workspace/chat-api:dev ./chat-api
```

```
[+] Building 4.2s (10/10) FINISHED
 => => naming to docker.io/ai-workspace/chat-api:dev
```

Giờ thì đúng tên rồi. Vẫn còn một vấn đề: `kind` không chạy chung container runtime với Docker/OrbStack trên máy host — nó có image store riêng, bên trong mấy container giả lập node. Docker Compose thấy được image vì nó dùng thẳng Docker daemon của máy; `kind` thì không, trừ khi bạn chủ động đưa image vào.

```bash
kind load docker-image ai-workspace/chat-api:dev --name ai-workspace
```

```
Image: "ai-workspace/chat-api:dev" with ID "sha256:a3f8c9e2b1d4..." not yet
present on node "ai-workspace-control-plane", loading...
```

Không phải lỗi — chỉ là `kind` đang nói thẳng nó đang làm gì: image này node chưa có, nên nó copy vào. Vài giây sau là xong.

```bash
kubectl get pods -n ai-workspace -w
```

```
NAME       READY   STATUS    RESTARTS   AGE
chat-api   1/1     Running   0          1m42s
```

`Running`. AGE vẫn tính từ lúc `apply` đầu tiên — cùng một Pod, không có gì bị xoá tạo lại, chỉ là cuối cùng cũng kéo được đúng image về. Bạn khoái chí, để cửa sổ `-w` chạy tiếp — theo đúng nghĩa đen, `-w` là watch mà.

Mười hai giây sau, dòng chữ đổi.

```
NAME       READY   STATUS             RESTARTS   AGE
chat-api   0/1     CrashLoopBackOff   1          12s
```

Nụ cười tắt ngay. Bạn để cửa sổ đó chạy tiếp, mở terminal khác.

```bash
kubectl describe pod chat-api -n ai-workspace
```

Cuộn xuống phần `Events` ở cuối — thói quen bạn nhặt được từ đống blog tối hôm trước, câu nào cũng lặp lại một câu: có gì sai thì `describe` trước, đừng đoán mò.

```
Events:
  Type     Reason     Age                From     Message
  ----     ------     ----               ----     -------
  Normal   Scheduled  114s               default-scheduler  Successfully assigned ai-workspace/chat-api to ai-workspace-control-plane
  Normal   Pulled     19s                kubelet            Container image "ai-workspace/chat-api:dev" already present on machine
  Normal   Created    19s                kubelet            Created container chat-api
  Normal   Started    19s                kubelet            Started container chat-api
  Warning  BackOff    5s (x2 over 13s)   kubelet            Back-off restarting failed container
```

Không nói cụ thể sai ở đâu — chỉ nói container đã khởi động rồi tự chết, giờ đang bị "back off" trước khi thử lại. Muốn biết vì sao chết, phải xem log của chính container đó.

```bash
kubectl logs chat-api -n ai-workspace
```

```
chat-api listening on port 8080
Postgres not ready yet (attempt 1/10), retrying in 1000ms...
Postgres not ready yet (attempt 2/10), retrying in 1000ms...
...
Postgres not ready yet (attempt 10/10), retrying in 1000ms...
Error: getaddrinfo ENOTFOUND postgres
```

À. Không phải lỗi ở `chat-api`. `ENOTFOUND` — không phải "kết nối bị từ chối", mà là DNS còn chưa tìm ra cái tên `postgres` này ở đâu cả. Đúng vậy, vì bạn chưa hề tạo `postgres` trong cluster này — chỉ có mỗi `chat-api` đang cô đơn tìm một database không tồn tại, đến cả tên cũng không phân giải nổi. Retry đủ 10 lần rồi bỏ cuộc, thoát process, kubelet thấy container chết thì khởi động lại, rồi lặp lại y hệt.

Bạn gõ thêm để chắc chắn.

```bash
kubectl get pods -n ai-workspace -w
```

```
chat-api   0/1   CrashLoopBackOff   3   47s
chat-api   1/1   Running            4   61s
chat-api   0/1   CrashLoopBackOff   4   73s
```

Cứ thế. Chạy — chết — chờ — chạy lại. Đúng thứ Martin nói tối hôm trước: container chết, tự động có cái mới thay vào, không cần ai gõ lệnh. Bạn đang nhìn thấy tận mắt, thật một trăm phần trăm.

Nhưng có một câu bạn chưa trả lời: cái đang tự phục hồi kia là *container*, hay là *Pod*? Nghe giống nhau, nhưng không phải một thứ. Bạn thử xoá thẳng cả Pod xem sao — không phải giết container bên trong nữa, mà xoá luôn cái đơn vị chứa nó.

```bash
kubectl delete pod chat-api -n ai-workspace
kubectl get pods -n ai-workspace
```

```
No resources found in ai-workspace namespace.
```

Trống trơn. Không ai tạo lại.

À, ra vậy. Thứ vừa tự phục hồi suốt nãy giờ là **kubelet** — nó chạy ngay trên máy này, việc của nó chỉ đơn giản: nhìn vào các Pod đã được giao cho nó, thấy container nào chết thì khởi động lại đúng container đó, bên trong đúng Pod đó. Có đúng một việc thôi — nó không bao giờ tự tạo Pod mới. Chỉ khởi động lại cái đã tồn tại sẵn.

Còn cái README hôm qua mô tả là chuyện khác hẳn: một thứ đứng ngoài Pod, đếm xem có đủ số lượng đang tồn tại chưa, thiếu thì tự tạo Pod mới từ đầu. Cái Pod `chat-api` bạn vừa xoá không có thứ nào đứng ngoài đếm cả — không ReplicaSet, không Deployment, chẳng có gì ngoài đúng một Pod trơ trọi. Xoá nó đi, không ai phát hiện ra thiếu — vì chẳng có ai đang đếm.

Bạn gõ vào ghi chú, ngay dưới dòng cũ:

```
chat-api cần postgres trước đã.
Pod chết là mất luôn, không tự sinh lại — cần thứ gì
đó đứng trên Pod để canh việc đó (chắc là ReplicaSet
với Deployment ghi ở note trước?)
```
