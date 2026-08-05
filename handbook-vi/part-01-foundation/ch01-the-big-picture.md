# Chương 1 — Bắt đầu từ sự đơn giản nhất


## Ngày đầu tiên
```
Monday. 9:07 AM.
```

Bạn đứng trước cửa văn phòng một lúc trước khi bước vào. Sau từng ấy năm làm freelancer—nay team này mai team khác, chỗ ngồi nay đây mai đó—đây là lần đầu tiên bạn chính thức bước chân vào một văn phòng làm việc và có những đồng nghiệp thực thụ. Ngày đầu tiên bạn đi làm ở một startup nhỏ, công ty đầu tiên theo đúng nghĩa đen của từ đó.

Sản phẩm của họ mang tên **AI Workspace**. Người dùng chỉ cần tải tài liệu lên, đặt câu hỏi bằng ngôn ngữ tự nhiên, và AI sẽ trả lời dựa chính xác trên nội dung của những tài liệu đó.

Đội ngũ nhỏ đến mức đếm trên đầu ngón tay: một founder, tính cả bạn là ba engineer, và một designer. Không DevOps. Không SRE. Không platform team. Chỉ có vài con người đang oằn mình ship tính năng trước ngày ra mắt.

Ngày đầu tiên, nhiệm vụ của bạn rất đơn giản: tìm hiểu dự án và đọc tài liệu. Bạn bước qua bàn founder và hỏi xem nên bắt đầu từ đâu. Anh gật đầu, gõ vài dòng rồi bắn qua một đường link.

Bạn mở ra, đọc, rồi đọc lại lần nữa—không phải vì khó hiểu, mà vì không dám tin nó lại ngắn ngủi đến thế. Cả một dự án, cả một hệ thống đang cận kề ngày ra mắt, mà tài liệu onboarding lại chỉ vỏn vẹn vài dòng:

```
The code is the most accurate documentation.
Clone the repository.
Run `docker compose up`.
You're ready.
```

Vậy thôi. Không VPN. Không tài khoản cloud. Không tài liệu setup năm mươi trang. Chỉ một lệnh duy nhất.

```bash
docker compose up
```

Vài giây sau, ba container xuất hiện.

```
✔ frontend
✔ chat-api
✔ postgres
```

Bạn mở trình duyệt, upload một file PDF, đặt câu hỏi. AI trả lời đúng. Mọi thứ hoạt động.

Trước khi viết dòng code đầu tiên, thì cứ đọc qua source cái nào. Bạn mở `docker-compose.yml` để xem thực ra hệ thống này chạy như thế nào.

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - chat-api

  chat-api:
    build: ./chat-api
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/aiworkspace
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Bạn đọc từng khối một.

`frontend` và `chat-api` đều có dòng `build:` — Docker build một image từ source code trong thư mục đó, rồi chạy nó. `postgres` thì bỏ qua bước này: nó chỉ dùng `image: postgres:16`, một image có sẵn mà chẳng ai trong team từng build.

`chat-api` có một biến môi trường, `DATABASE_URL`, trỏ tới `postgres` bằng tên — đó là cách nó tìm ra database mà không cần biết địa chỉ IP. Mạng nội bộ của Docker để mỗi container tìm nhau chỉ bằng tên service.

Và `postgres` ghi dữ liệu vào một named volume, nên restart container không xoá sạch database.

Bạn không lạ gì với file kiểu này. Ở vài dự án trước — một con API viết bằng Node, một dashboard nội bộ chưa ai buồn đặt tên đàng hoàng — bạn cũng đã ngồi đọc đúng kiểu file `docker-compose.yml` như thế này, đủ nhiều lần để những khái niệm đằng sau nó không còn cần suy nghĩ nữa.

**Image** là một bản đóng gói: code, thư viện, cấu hình, mọi thứ ứng dụng cần để chạy, gói gọn lại thành một khối tĩnh, bất biến. Bạn không sửa một image — bạn build một cái mới.

**Container** là image đó, đang thực sự chạy. Cùng một image có thể sinh ra nhiều container, mỗi cái có vòng đời riêng, tắt đi là mất, trừ khi dữ liệu được ghi ra ngoài như named volume mà `postgres` đang dùng.

**Docker** là công cụ đứng giữa hai thứ đó — build image, chạy container, quản lý mạng và storage cho chúng.

Còn **Compose** là lớp mỏng phía trên Docker: một file YAML mô tả nhiều container nên chạy cùng nhau như thế nào — cái nào phụ thuộc cái nào, mở port nào, biến môi trường nào — rồi gói tất cả thành một lệnh `up` duy nhất.

Không có gì trong file này khiến bạn phải dừng lại suy nghĩ. Ba container, một laptop, một lệnh duy nhất. 

Nhìn lại hôm nay, thật khó tưởng tượng file này sẽ trở thành vấn đề trong tương lại. Nhưng gần như mọi siêu sản phẩm trên thế giới đều bắt đầu từ một thứ trông giống hệt thế này.

---

## Ba tuần sau đó

Ba tuần trôi qua. 
Sản phẩm đã ra mắt được gần một tuần, lác đác vài user đi ra đi vô như khách đến thăm Phú Quốc một lần duy nhất và không bao giờ muốn quay lại. Còn bạn, bạn đã quen dần với công việc và mọi người ở đây. Ngày nào cũng giống ngày nào. Sáng đứng lên báo cáo hôm qua làm gì, hôm nay làm gì, có blocker gì không — thường là không. Rồi ngồi xuống, code, fix bug, code tiếp. Chiều họp nhanh với designer về một cái nút bấm nên nằm bên trái hay bên phải. Tối đóng laptop, về nhà, hôm sau lặp lại.
Không có gì đáng nhớ. Không có gì đáng lo. Cứ êm đềm như vậy, êm đềm đến mức tẻ nhạt — kiểu bình yên mà sau này nhìn lại, bạn mới nhận ra nó đáng sợ đến thế nào.

Rồi một sáng thứ Hai, mọi thứ thay đổi.

Dashboard không trông ấn tượng gì.

```
Friday:
47 active users

Monday:
312 active users
```

Vẫn nhỏ. Chẳng ai gọi đây là "internet scale". Nhưng kênh Slack bắt đầu đầy tin nhắn.

```
Customer
The AI keeps timing out.
```

Một phút sau.

```
Customer
Sometimes it works.
Sometimes it doesn't.
```

Một tin khác đến.

```
Customer
Did you deploy something?
```

Bạn không hề deploy gì cả. Không có gì thay đổi. Chỉ là có thêm người dùng.

### Cuộc họp giao ban

Trong buổi stand-up sáng hôm đó, ai cũng có vẻ hơi bối rối. Founder phá vỡ sự im lặng.

> "Good news."

Anh mỉm cười.

> "People are actually using the product."

Mọi người cười theo. Rồi anh mở một biểu đồ khác.

```
CPU. 100%.
```

Memory. Gần đầy.

Nụ cười biến mất.

> "Production went down twice yesterday."

Không ai cười nữa.

Ai đó hỏi câu hỏi hiển nhiên nhất:

> "Can't we just run more API containers?"

Mọi ánh mắt đổ về phía bạn. Cũng phải thôi — bạn mang danh Founding Engineer, nên mặc định mấy vấn đề kiểu này là việc của bạn. Nghe có vẻ hợp lý — ba bản sao của ứng dụng thì lẽ ra phải chịu được gấp ba lần traffic. Ít nhất, đó là cách hầu hết chúng ta tưởng tượng về scaling khi lần đầu nghĩ đến nó.

Bạn gật đầu. "Sure. Let's try."

### Thử nghiệm

Về lại máy, bạn gõ:

```bash
docker compose up --scale chat-api=3
```

Compose bắt đầu tạo container.

```
chat-api-1
chat-api-2
chat-api-3
```

Trong một giây, cảm giác như thắng lợi. Ba server. Vấn đề đã giải quyết.

Rồi thực tế ập tới. Lệnh này thậm chí không chạy sạch sẽ, vì ba container không thể cùng expose port `8080` trên cùng một máy. Nhưng ẩn dưới lỗi đó là một câu hỏi lớn hơn mà `--scale` chưa bao giờ trả lời:

>**Ai gửi traffic đến ba container này?**

Không ai cả. Không có phần mềm nào đang theo dõi cả ba, quyết định container nào đang rảnh, rồi route request tới đó. Bạn sẽ phải tự xây cái đó.

Vấn đề không phải là tạo thêm container. Vấn đề là mọi thứ **xung quanh** những container đó.

### Vấn đề đang lớn dần

Càng nghĩ, danh sách càng dài ra. Một khi bạn kéo sợi chỉ đó, những vấn đề khác lần lượt xuất hiện, cùng một hình dạng:

- Bạn cần **thêm một máy khác**, vì ba container cộng với mọi thứ khác sẽ không mãi vừa trên một máy.
- Bạn cần một cơ chế **restart** container chết lặng lẽ lúc 3 giờ sáng, vì hiện tại không có gì làm việc đó.
- Bạn cần cách **rollout phiên bản mới** mà không phải dừng cả ba container cùng lúc.
- Bạn cần **service discovery** — cách nào đó để `frontend` tìm ra "một `chat-api` đang khoẻ mạnh" mà không hardcode container nào trong ba cái đó.
- Bạn cần thứ gì đó quyết định container mới nên chạy trên **máy nào**, khi hạ tầng lớn dần.

Bạn lấy sổ tay ra và bắt đầu viết:

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

Bạn dừng lại. Đọc lại danh sách một lần nữa. Không cái nào trong số này thực sự khó — riêng lẻ, mỗi cái chỉ là một câu hỏi bình thường. Nhưng chúng không đến từ nhau. Chúng đến từ cùng một nguồn, cùng một lúc. Và một khi mười vấn đề nhỏ cùng đổ ập xuống đầu bạn trong cùng một buổi chiều, chúng không còn giống mười vấn đề nhỏ nữa. Chúng giống một hệ thống hoàn toàn khác đang đòi được xây.

```mermaid
flowchart TD
    A[docker compose up --scale chat-api=3] --> M[Port conflict trên 1 máy]
    M --> X[Buộc phải trải ra nhiều máy]
    X --> Y[Mất khả năng tự tay theo dõi]
    Y --> C[Need restart]
    Y --> D[Need rollout]
    Y --> E[Need service discovery]
    Y --> F[Need scheduling]
    Y --> G[Need storage]
    Y --> H[Need observability]
    C --> I["?"]
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I
```

### Kết thúc ngày dài

Văn phòng gần như trống. Đèn chuyển sang chế độ ban đêm. Laptop của bạn vẫn còn mở.

Docker Compose đã làm đúng những gì nó được thiết kế để làm: chạy container trên một máy. Không hơn.

Sai lầm không phải là dùng Docker Compose. Sai lầm là yêu cầu nó giải quyết những vấn đề nó chưa bao giờ được xây để giải quyết.

Bạn nhìn danh sách lần cuối. Bạn không có tên gọi nào cho thứ có thể giải quyết tất cả những điều này. Nhưng chắc hẳn phải có lý do vì sao gần như mọi engineering team đang tăng trưởng, sớm hay muộn, đều viết ra gần như đúng những vấn đề y hệt nhau.

Chắc chắn... đã có ai đó giải quyết chúng trước rồi. Rồi bạn sẽ tìm ra thôi
