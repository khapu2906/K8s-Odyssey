# Chương 15 — Không phải đoán nữa

## Vẫn hôm đó

`128Mi`, `256Mi` — mấy con số bạn gõ vào `resources` sáng nay, thật ra chỉ là ước chừng, "cỡ một app Node.js nhỏ". Không dựa trên số liệu gì cả. Câu hỏi lởn vởn cả buổi: `chat-api` thật sự đang ăn bao nhiêu RAM, hay bạn vừa bịa ra một con số nghe hợp lý rồi thôi?

Bạn gõ thử lệnh đầu tiên nghĩ tới.

```bash
kubectl top nodes
```

```
error: Metrics API not available
```

Ghi chú cuối cùng còn sót lại từ đêm đọc README hiện ra trong đầu:

```
Need observability
→ ??? đọc thấy nhắc tới Prometheus, Grafana, metrics-server
nhưng mỗi bài dùng khác nhau, không rõ cái nào là "chuẩn" của
Kubernetes hay là add-on bên thứ 3. để sau
```

`để sau` — ba tuần trước bạn viết vậy. Giờ mới thật sự cần tới. Tìm hiểu thêm một chút, hoá ra `kubectl top` không tự nhiên chạy được — nó cần một thứ tên `metrics-server` chạy sẵn trong cluster, không phải mặc định có, kể cả trên `kind`.

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

```
serviceaccount/metrics-server created
deployment.apps/metrics-server created
service/metrics-server created
...
```

Đợi một lúc, thử lại.

```bash
kubectl top nodes
```

```
error: Metrics API not available
```

Vẫn vậy. Kiểm tra Pod của nó xem sao.

```bash
kubectl get pods -n kube-system | grep metrics
```

```
metrics-server-6c47b8d9f5-x2vqp   0/1     Running   0          62s
```

`0/1` — Pod chạy nhưng chưa sẵn sàng. `logs` thử.

```bash
kubectl logs -n kube-system deployment/metrics-server
```

```
E0817 09:12:44.118301       1 scraper.go:140] "Failed to scrape node"
err="... x509: cannot validate certificate for 172.18.0.2 because it
doesn't contain any IP SANs" node="ai-workspace-control-plane"
```

Chứng chỉ TLS của kubelet trên `kind` là tự ký, không có IP thật trong danh sách hợp lệ — `metrics-server` mặc định không tin chứng chỉ kiểu đó, từ chối kết nối. Tìm thêm, hoá ra đây là chuyện quen thuộc trên `kind`: cần thêm cờ `--kubelet-insecure-tls` để nó bỏ qua bước xác thực chứng chỉ đó (chấp nhận được trên cluster local, không phải thứ mang lên production).

```bash
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
```

```
deployment.apps/metrics-server patched
```

Đợi Pod khởi động lại, thử lại lần nữa.

```bash
kubectl top nodes
```

```
NAME                         CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
ai-workspace-control-plane   324m         4%     1051Mi          13%
```

`CPU(cores)` — `324m`, tức 0.324 lõi CPU đang dùng, đơn vị `m` (millicores) đã quen từ hồi viết `resources.requests` ở Chương 14. `MEMORY(bytes)` — `1051Mi`, RAM thực tế đang chiếm. Hai cột `%` bên cạnh không tự nhiên mà có — đúng là phần trăm so với `Allocatable` đã thấy trong `kubectl describe node` hôm qua (`cpu: 6`, `memory: 7841234Ki`): `324m` trên `6` lõi ra đúng cỡ `4%`, `1051Mi` trên `~7.5Gi` ra đúng cỡ `13%`. Không phải hai con số rời rạc, mà là cùng một phép chia, chỉ khác cách trình bày. Con số thật, không phải đoán nữa. Bạn thử tiếp trên đúng namespace của mình.

```bash
kubectl top pods -n ai-workspace
```

```
NAME                          CPU(cores)   MEMORY(bytes)
chat-api-bc6659b9f-8j9fj      2m           35Mi
chat-api-bc6659b9f-jt4b8      2m           44Mi
chat-api-bc6659b9f-w687d      2m           30Mi
postgres-76bbc54bd4-ffwdj     5m           57Mi
```

`chat-api` ăn khoảng 30-44Mi mỗi bản — con số `128Mi` bạn ước chừng sáng nay hoá ra rộng rãi hơn cần thiết, dư gần gấp ba lần thực tế. `postgres` ăn 57Mi, cũng lọt thỏm trong `256Mi` đã xin.

Nhưng bạn cũng nhận ra ngay giới hạn của thứ vừa dựng: `kubectl top` chỉ cho con số *ngay lúc này*, không có gì lưu lại. Tắt terminal đi, con số vừa xem biến mất, không có biểu đồ, không có lịch sử, không cảnh báo khi nào vượt ngưỡng. Đúng thứ mấy bài blog tối hôm đó nhắc mập mờ — `metrics-server` chỉ là bước đầu, còn `Prometheus`/`Grafana` là chuyện khác hẳn, dựng cả một hệ thống lưu trữ và biểu diễn dữ liệu theo thời gian. Việc đó để dành, hôm nay biết được con số thật đã là một bước tiến rõ ràng.

Bạn mở ghi chú, gạch dòng cuối cùng trong danh sách chín dòng viết từ đêm đó.

```
Need observability ✓ (một phần) — metrics-server cho số
CPU/memory thật qua `kubectl top`, nhưng chỉ là ảnh chụp
tức thời, tắt terminal là mất, không lưu lịch sử, không cảnh
báo. Prometheus/Grafana là bước tiếp theo, không phải hôm nay.
```

Chín dòng, giờ cả chín đều đã có gì đó đánh dấu — dòng cuối cùng không phải dấu ✓ sạch như mấy dòng kia, mà là "một phần", đúng với những gì bạn thật sự đã làm được. Bạn đóng laptop, không thấy nhẹ nhõm kiểu "xong hết rồi" — chỉ thấy rõ ràng hơn hẳn so với đêm đầu tiên đọc cái danh sách này, khi mọi thứ còn là chín cái tên xa lạ.
