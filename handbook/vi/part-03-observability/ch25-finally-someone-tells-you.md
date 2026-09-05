# Chương 25 — Cuối cùng có ai báo

## Vẫn tuần đó

Dòng cuối chưa gạch: Alertmanager đã cài sẵn cùng bộ Prometheus, nhưng chưa có rule nào cả — nghĩa là dù có sự cố thật, không ai được báo, trừ khi tự tay mở Grafana lên nhìn. Bạn muốn ít nhất một cảnh báo thật: Pod nào trong `ai-workspace` rơi vào `CrashLoopBackOff`.

`Prometheus Operator` (cài kèm `kube-prometheus-stack`) đọc rule không phải từ một file config tĩnh, mà từ một CRD riêng: `PrometheusRule`. Viết thử.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ai-workspace-alerts
  namespace: monitoring
spec:
  groups:
    - name: ai-workspace
      rules:
        - alert: PodCrashLooping
          expr: increase(kube_pod_container_status_restarts_total{namespace="ai-workspace"}[10m]) > 3
          for: 1m
          labels:
            severity: warning
          annotations:
            summary: "Pod {{ $labels.pod }} đang crash loop"
```

`expr` là một câu truy vấn PromQL — đếm số lần restart tăng thêm trong 10 phút gần nhất của mọi container trong namespace `ai-workspace`, vượt quá 3 thì coi là bất thường.

```bash
kubectl apply -f ai-workspace-alerts.yaml
```

```
prometheusrule.monitoring.coreos.com/ai-workspace-alerts created
```

Vào Prometheus UI (`kubectl port-forward svc/kube-prometheus-stack-prometheus 9090:9090 -n monitoring`), mục "Rules" — không thấy rule vừa viết đâu cả. Object đã tạo thật trên cluster (`kubectl get prometheusrules -n monitoring` vẫn liệt kê ra), nhưng Prometheus không hề đọc nó.

### Không phải cứ tạo CRD là Prometheus tự đọc

Tìm thêm, hoá ra Prometheus Operator không quét toàn bộ `PrometheusRule` trong cluster — nó chỉ đọc những cái khớp `ruleSelector` đã khai trong cấu hình chính của Prometheus, mặc định (theo `kube-prometheus-stack`) chỉ nhận rule có nhãn `release: kube-prometheus-stack`. Thiếu nhãn đó, rule coi như vô hình, dù nằm đúng namespace, đúng cú pháp, đúng mọi thứ khác.

```yaml
metadata:
  name: ai-workspace-alerts
  namespace: monitoring
  labels:
    release: kube-prometheus-stack
```

Thêm đúng một dòng nhãn, `apply` lại.

```bash
kubectl apply -f ai-workspace-alerts.yaml
```

Vào lại Prometheus UI, mục "Rules" — `PodCrashLooping` xuất hiện, trạng thái `inactive` (rule đã nạp, điều kiện chưa xảy ra).

### Ép nó kích hoạt thật

Nhớ lại cách gây `CrashLoopBackOff` từ hồi mới học — sửa tạm `livenessProbe` của `chat-api` trỏ vào một path không tồn tại, `apply`, đợi restart tăng dần.

```bash
kubectl get pods -n ai-workspace -w
```

```
chat-api-...   0/1   CrashLoopBackOff   4   3m12s
```

Quay lại Prometheus UI sau vài phút — `PodCrashLooping` chuyển từ `inactive` sang `pending`, rồi `firing`. Mở tiếp Alertmanager (`kubectl port-forward svc/kube-prometheus-stack-alertmanager 9093:9093 -n monitoring`), thấy đúng alert đó nằm trong danh sách đang active, kèm nhãn `pod`, `namespace` đã điền tự động từ `{{ $labels.pod }}`.

Alert đã "kêu" thật — nhưng kêu vào đâu? Alertmanager mặc định chỉ có một receiver tên `null`, không gửi đi đâu cả, chỉ ghi nhận. Nối nó vào Slack/email thật cần một webhook URL hoặc SMTP credentials thật — thứ không có gì để gõ vào sách một cách an toàn, dành cho lúc nào có kênh thật để nối. Sửa xong `livenessProbe` về lại `/health` như cũ, Pod ổn định trở lại, alert tự chuyển về `resolved`.

Mở lại ghi chú từ tuần trước, gạch dòng cuối cùng thuộc mục quan sát hệ thống.

```
còn treo: quan sát hệ thống đầy đủ theo thời gian ✓✓ Prometheus
+ Grafana (lịch sử), PrometheusRule + Alertmanager (cảnh báo tự
động, đã test thật bằng CrashLoopBackOff cố ý). Route cảnh báo
tới Slack/email thật — cần webhook thật, để lúc nào có kênh
chính thức.

còn treo: tự động hoá deploy, chạy được ở đâu đó ngoài laptop này.
```

Dòng "quan sát hệ thống" — từ chữ `???` viết đêm đầu tiên đọc README, qua "một phần" ở `kubectl top`, giờ mới thật sự đóng lại. Không phải vì đã hoàn hảo — receiver vẫn là `null`, chưa gửi đi đâu thật — mà vì từng mảnh ghép đã có mặt và đã được tận mắt thấy chạy đúng, không còn gì mơ hồ như ba tuần trước nữa.
