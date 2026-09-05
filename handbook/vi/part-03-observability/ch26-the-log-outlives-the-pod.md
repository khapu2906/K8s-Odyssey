# Chương 26 — Nhật ký sống lâu hơn Pod

## Cuối tuần đó

Một Pod `chat-api` restart lúc 3 giờ sáng, tự phục hồi trước khi ai kịp thấy — đúng cách ReplicaSet vẫn luôn làm. Sáng hôm sau, tò mò muốn xem log lúc đó ghi gì, bạn gõ đúng lệnh quen thuộc.

```bash
kubectl logs chat-api-7784dd7b79-9fx74 -n ai-workspace --previous
```

```
Error from server (NotFound): previous terminated container "chat-api" in pod "chat-api-7784dd7b79-9fx74" not found
```

`--previous` chỉ giữ log của đúng một lần chạy ngay trước đó — Pod này đã restart nhiều lần từ tối qua, log 3 giờ sáng đã bị log của những lần sau đè mất. Không có gì lưu lại ngoài đúng bộ nhớ tạm bên trong Pod, y hệt bài học đã học từ hồi Postgres mất dữ liệu — log cũng chỉ sống chừng nào Pod (hoặc đúng container instance đó) còn sống.

### Giải pháp không mới — chỉ là chưa từng làm

Log cần một nơi lưu **ngoài** Pod, giống hệt lý do Postgres cần PVC. Nhưng log không phải file trên đĩa của riêng một Pod — nó là dòng chữ in ra `stdout` của mọi Pod, mọi lúc, cần một thứ đứng ra **thu thập** trước khi nghĩ tới chuyện lưu ở đâu.

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
helm install loki grafana/loki-stack -n monitoring \
  --set grafana.enabled=false
```

`loki-stack` cài hai thứ cùng lúc: `Loki` (nơi lưu log, giống Prometheus nhưng cho log thay vì số liệu) và `Promtail` (thứ đi thu thập log). Tắt cờ `grafana.enabled` vì Grafana đã có sẵn từ tuần trước, không cần cài thêm bản thứ hai.

```bash
kubectl get pods -n monitoring -l app=promtail
```

```
NAME             READY   STATUS    RESTARTS   AGE
loki-promtail-4x8kp   1/1   Running   0   40s
loki-promtail-9m2wq   1/1   Running   0   40s
```

Đúng hai Pod — chưa cấu hình `replicas` nào cả, cũng chẳng phải Deployment. `kubectl get daemonset -n monitoring` xác nhận: `DaemonSet`, không phải ReplicaSet đếm theo con số cố định. `DaemonSet` đảm bảo đúng **một** Pod trên **mỗi** node, tự động, không cần khai số lượng — thêm node mới, tự có thêm một Pod `promtail`; bớt node, tự bớt Pod theo. `kube-proxy` gặp từ hồi mới dựng cluster, `node-exporter` gặp từ tuần trước — cả hai đều chính là `DaemonSet`, chỉ là chưa ai gọi tên nó ra.

`Promtail` đọc thẳng file log container ghi lại trên chính node đó (không qua `kubectl logs`, không qua API server) — đây là lý do nó phải chạy trên MỌI node, không phải một bản duy nhất như Loki hay Prometheus.

### Tìm lại đúng log tưởng đã mất

Vào Grafana, mục "Explore", tìm datasource `Loki` trong danh sách — không thấy đâu cả, chỉ có `Prometheus` từ tuần trước. Tắt `grafana.enabled` cũng tắt luôn cơ chế tự thêm datasource — cơ chế đó chỉ nối vào đúng Grafana con của chart `loki-stack` (Grafana đã tắt), không hề biết tới Grafana đã cài riêng từ trước. Hai bản Helm release độc lập, không có dây nối nào giữa chúng cả.

Thêm tay: Configuration → Data sources → Add data source → chọn `Loki`, URL điền đúng tên Service nội bộ đã cài — `http://loki:3100` — đúng cách gọi Service bằng tên đã quen từ lâu, chỉ khác đối tượng gọi.

```
Type: Loki
URL: http://loki:3100
```

Bấm "Save & Test" — ra dòng đỏ: `Unable to connect with Loki. Please check the server logs for more details.` Xem log Grafana (`kubectl logs deployment/kube-prometheus-stack-grafana -c grafana -n monitoring`), lỗi thật không phải "không kết nối được" như dòng đỏ nói — là `parse error at line 1, col 1: syntax error: unexpected IDENTIFIER`. Grafana đã chạm được tới Loki, chỉ là câu query nội bộ dùng để tự kiểm tra sức khoẻ (`checkHealth`) bị Loki từ chối vì lệch cú pháp — version Loki đóng gói trong chart `loki-stack` khá cũ, không hoàn toàn khớp câu query mà bản Grafana mới hơn gửi lên.

Kiểm tra thẳng Loki, bỏ qua nút "Test": `curl http://localhost:3100/loki/api/v1/labels` (sau khi `port-forward svc/loki` tạm) — trả về đúng danh sách nhãn thật (`app`, `namespace`, `pod`...). Loki hoàn toàn khoẻ, chỉ mỗi câu tự kiểm tra của Grafana là gãy. Bấm "Save" thẳng, bỏ qua cảnh báo đỏ. Chọn lại datasource `Loki` trong Explore, giờ đã có. Gõ một truy vấn LogQL, tương tự cú pháp PromQL đã quen từ mấy hôm trước nhưng lọc theo nhãn thay vì số liệu.

```
{namespace="ai-workspace", pod=~"chat-api.*"} |= "error"
```

Kéo về đúng khung giờ 3 giờ sáng — dòng log đã tưởng mất hẳn hiện ra nguyên vẹn, kèm đúng tên Pod cũ `chat-api-7784dd7b79-9fx74`, dù Pod đó giờ đã restart thêm vài lần, log hiện tại của nó không còn dấu vết gì từ 3 giờ sáng nữa. Loki giữ lại đúng dòng đó, tách rời hoàn toàn khỏi vòng đời của Pod đã sinh ra nó.

Thử thêm một truy vấn khác — gộp log của cả ba bản `chat-api` cùng lúc, không cần biết log đó nằm ở Pod nào.

```
{namespace="ai-workspace", app="chat-api"}
```

Việc `kubectl logs` không bao giờ làm được một mình — phải tự viết loop qua từng Pod, tự ghép kết quả lại — giờ chỉ là một dòng truy vấn.

Mở lại notes, thêm một dòng mới, không thuộc ba dòng cũ từ tuần trước nữa — một mảng quan sát khác hẳn, vừa lộ ra vì đã có công cụ để thấy được nó thiếu.

```
Log giờ sống ngoài Pod, tìm lại được cả log của Pod đã bị xoá
từ lâu. Vẫn còn một câu hỏi chưa tự hỏi tới: log giữ bao lâu
thì Loki tự xoá? Chưa cấu hình retention, dùng mặc định — coi
lại sau.
```

Không phải kết thúc, chỉ là một câu hỏi mới, rõ ràng hơn hẳn câu hỏi mơ hồ sáng nay khi log 3 giờ sáng tưởng đã mất trắng.
