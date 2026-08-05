# Lời nói đầu

Hầu hết các cuốn sách về Kubernetes đều bắt đầu bằng cách dạy bạn các câu lệnh.

Cuốn sách này bắt đầu bằng một startup.

Ngày đầu tiên, bạn sẽ gia nhập một team nhỏ đang xây dựng **AI Workspace** — một ứng dụng nơi người dùng trò chuyện với AI và nhận câu trả lời dựa trên chính tài liệu của họ. Ban đầu, mọi thứ vừa gọn trên một chiếc laptop. Một repository. Ba container. Một lệnh duy nhất:

```bash
docker compose up
```

Nó hoạt động.

Cho đến khi không còn hoạt động nữa.

Vài tuần sau, traffic tăng lên. Container crash. Deployment gặp lỗi. Ai đó vô tình xoá mất một Pod. Một Node chuyển sang trạng thái `NotReady` giữa ban ngày. Khách hàng bắt đầu báo lỗi trước khi bất kỳ ai trong team kịp nhận ra có gì đó đang hỏng.

Không ai dừng câu chuyện lại để giải thích Kubernetes là gì.

Thay vào đó, mỗi sự cố production buộc bạn phải học một khái niệm mới, vừa đủ để giải quyết đúng vấn đề trước mắt. Đến khi đọc xong cuốn sách, bạn sẽ không chỉ *biết* Kubernetes — bạn sẽ *hiểu vì sao* mỗi thành phần tồn tại, bởi vì bạn đã cần đến nó trước khi biết tên gọi của nó.

Cuốn sách này đi theo đúng hành trình mà hàng nghìn engineering team đã trải qua: từ một lệnh `docker compose up` duy nhất, đến việc vận hành một platform production trên nhiều máy, với networking, storage, service discovery, autoscaling, observability, security, và CI/CD.

Kubernetes không phải là đích đến.

Nó đơn giản là thứ bạn khám phá ra sau khi đã giải quyết đủ nhiều vấn đề thật.

---

# Cuốn sách này dành cho ai

Cuốn sách này được viết cho các software engineer đã nắm được kiến thức cơ bản về container. Nếu bạn từng build một ứng dụng bằng Docker, hoặc từng chạy `docker compose up`, bạn đã sẵn sàng để bắt đầu.

Không yêu cầu kinh nghiệm về Kubernetes.

Nếu bạn từng thử đọc tài liệu chính thức hoặc một cuốn sách tham khảo về Kubernetes, và nhận ra mình nhớ được câu lệnh nhưng lại quên mất *vì sao* chúng quan trọng, thì cuốn sách này được viết cho bạn.

Mục tiêu không phải là học thuộc API.

Mục tiêu là xây dựng trực giác.

---

# Cuốn sách này được tổ chức như thế nào

Câu chuyện triển khai theo đúng thứ tự mà một sản phẩm thật sự tiến hoá.

* **Phần I — Foundation** giới thiệu những ý tưởng đứng sau container, orchestration, và Kubernetes. Các chương này thuần lý thuyết — không có terminal, không có cluster, không có YAML nào cần viết. Mục tiêu là hiểu *vì sao* Kubernetes tồn tại trước khi bắt đầu sử dụng nó.

* **Từ Phần II trở đi**, mỗi chương đều bắt đầu bằng một vấn đề bên trong AI Workspace. Một sự cố production, một yêu cầu tính năng, hoặc một thách thức về scaling sẽ đẩy hệ thống tiến lên phía trước. Bạn chỉ học đúng những khái niệm cần thiết để giải quyết vấn đề cụ thể đó, rồi áp dụng ngay lập tức.

* Không có các phần "Lý thuyết" hay "Thực hành" tách biệt để nhảy qua lại. Mỗi chương là một cảnh liền mạch — một vấn đề xuất hiện, bạn điều tra, bạn tìm ra nó được gọi là gì, bạn sửa nó, đôi khi bạn còn cố tình làm nó hỏng trước. Các câu lệnh và YAML xuất hiện đúng vào lúc bạn thực sự cần đến chúng, ngay giữa dòng câu chuyện.

* **Under the Hood** đi theo một hướng khác. Thay vì vận hành Kubernetes, bạn sẽ tự xây một phiên bản thu nhỏ của nó bằng Go — từng thành phần một — để hiểu điều gì thực sự xảy ra phía sau mỗi lệnh `kubectl apply`.

Đến cuối cuốn sách, bạn sẽ đã chứng kiến AI Workspace tiến hoá từ một ứng dụng Docker Compose đơn giản thành một platform sẵn sàng cho production, chạy trên Kubernetes.
