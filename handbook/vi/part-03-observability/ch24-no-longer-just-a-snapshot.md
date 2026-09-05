# Chương 24 — Không chỉ là ảnh chụp nữa

## Tuần sau

Dòng ghi từ hồi cài `metrics-server` vẫn còn đó, chưa ai đụng tới: `kubectl top` chỉ cho số liệu tức thời, tắt terminal là mất, không lịch sử, không cảnh báo. Founder tuần này hỏi một câu tưởng đơn giản mà bạn không trả lời được: "tuần trước `chat-api` có lúc nào gần hết RAM không?" Không biết. Không có gì lưu lại để tra ngược.

Bạn tìm cách cài "Prometheus" — cái tên đã đọc lướt qua từ tối đầu tiên đọc README, ba tuần trước. Vào thẳng trang chủ, thấy một danh sách YAML cần apply: CRD định nghĩa `ServiceMonitor`, `PrometheusRule`, Deployment cho Prometheus server, cho Alertmanager, cho Grafana, RBAC riêng cho từng thứ, ConfigMap chứa sẵn hàng chục dashboard... Đếm sơ cũng hơn 40 file. Viết tay từng cái, như đã làm với `postgres.yaml` hay `redis.yaml`, là không thực tế — chỉ riêng việc giữ chúng đồng bộ mỗi khi có bản cập nhật mới đã là một công việc toàn thời gian.

### Helm — không phải kubectl, nhưng cũng không xa lạ

Đọc thêm, thấy mọi hướng dẫn đều bắt đầu bằng một lệnh chưa từng gõ: `helm install`. `Helm` là một công cụ quản lý gói cho Kubernetes — đóng gói cả một cụm YAML phức tạp (gọi là "chart") thành một đơn vị cài đặt/gỡ/nâng cấp bằng đúng một lệnh, tương tự cách `npm install` cài một package thay vì tự tay chép từng file `.js`.

```bash
brew install helm
```

```
==> Installing helm
🍺  /opt/homebrew/Cellar/helm/3.16.1: 8 files, 55.4MB
```

Thêm "repo" — nơi Helm biết tìm chart, y hệt việc `npm` biết tìm package trên registry.

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

```
"prometheus-community" has been added to your repositories
Update Complete. ⎈ Happy Helming!⎈
```

Cài thẳng bộ `kube-prometheus-stack` — một chart gộp sẵn Prometheus, Grafana, Alertmanager, và vài thành phần thu thập số liệu khác, tất cả cấu hình ăn khớp nhau ngay từ đầu.

```bash
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace
```

```
NAME: kube-prometheus-stack
NAMESPACE: monitoring
STATUS: deployed
REVISION: 1
```

Một namespace mới, `monitoring`, tách hẳn khỏi `ai-workspace` — đúng chỗ nên đứng, vì đây là hạ tầng quan sát cả cluster, không phải một phần của AI Workspace.

```bash
kubectl get pods -n monitoring
```

```
NAME                                                     READY   STATUS    RESTARTS   AGE
kube-prometheus-stack-grafana-...                        3/3     Running   0          58s
kube-prometheus-stack-kube-state-metrics-...              1/1     Running   0          58s
kube-prometheus-stack-operator-...                        1/1     Running   0          58s
kube-prometheus-stack-prometheus-node-exporter-...         1/1     Running   0          58s
alertmanager-kube-prometheus-stack-alertmanager-0         2/2     Running   0          50s
prometheus-kube-prometheus-stack-prometheus-0             2/2     Running   0          50s
```

Sáu Pod, mọc lên chỉ từ đúng hai lệnh `helm`. Không viết tay dòng YAML nào.

### Vào Grafana, thấy đúng thứ `kubectl top` chưa từng cho thấy

```bash
kubectl port-forward svc/kube-prometheus-stack-grafana 3000:80 -n monitoring
```

Lấy mật khẩu admin mặc định, được Helm tự sinh và lưu vào một Secret.

```bash
kubectl get secret kube-prometheus-stack-grafana -n monitoring \
  -o jsonpath="{.data.admin-password}" | base64 -d
```

Mở `localhost:3000`, đăng nhập, vào mục dashboard có sẵn "Kubernetes / Compute Resources / Namespace (Pods)", chọn namespace `ai-workspace`. Một biểu đồ hiện ra — đường CPU/memory của cả ba Pod `chat-api` kéo dài suốt mấy tiếng vừa qua, không phải một con số đứng yên như `kubectl top` nữa. Kéo lùi về sáng nay, thấy rõ một đợt tăng nhẹ đúng lúc bạn chạy thử load test hôm qua.

Đúng câu hỏi founder hỏi sáng nay — giờ trả lời được, không cần đoán: kéo biểu đồ về tuần trước, nhìn thẳng vào đường `MEMORY(bytes)`, thấy đỉnh cao nhất chưa từng chạm `limits.memory` đã đặt từ hồi trước.

Bạn mở lại ghi chú cuối cùng từ tuần trước, gạch bớt một dòng.

```
còn treo: quan sát hệ thống đầy đủ theo thời gian ✓ Prometheus
+ Grafana qua Helm, có lịch sử thật, kéo lùi xem được. Alert
tự động khi có sự cố — Alertmanager đã cài sẵn cùng bộ, nhưng
chưa cấu hình rule nào cả. Để riêng, chưa phải hôm nay.

còn treo: tự động hoá deploy, chạy được ở đâu đó ngoài laptop này.
```

Hai dòng còn lại, không đổi. Nhưng dòng đầu tiên trong ba dòng đó, giờ chỉ còn một nửa — có số liệu thật, có lịch sử thật, chỉ chưa có ai tự động báo khi có chuyện. Bạn đóng laptop, biết chính xác việc tiếp theo là gì.
