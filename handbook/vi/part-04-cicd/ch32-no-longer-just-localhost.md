# Chương 32 — Không còn là localhost nữa

## Cuối tháng

Founder thông báo trong buổi họp: khách hàng lớn nhất sắp ký yêu cầu một điều khoản cụ thể — hệ thống phải có SLA, phải có địa chỉ thật, không được ghi "chạy trên máy engineer" trong tài liệu kỹ thuật gửi cho họ. Câu đùa của Martin từ tháng trước bỗng dưng không còn là đùa nữa.

Mọi thứ cần cho việc này thật ra đã có sẵn từ lâu — chỉ chưa từng ráp lại với nhau: một Helm chart hoàn chỉnh (biết dựng lại toàn bộ hệ thống chỉ bằng vài lệnh), một pipeline CI/CD biết tự build/deploy, một ArgoCD biết tự đồng bộ theo Git, một Rancher biết quản lý nhiều cluster cùng lúc. Thứ duy nhất chưa từng thử: một cluster không nằm trên chính laptop này.

### Chọn nơi đặt cluster thật

Không cần phức tạp ngay từ đầu — chọn DigitalOcean Kubernetes (DOKS), một dịch vụ Kubernetes quản lý sẵn: control plane do nhà cung cấp lo, không cần tự dựng `etcd`/`kube-apiserver` như đã từng đọc qua `kind` hồi tuần đầu tiên.

```bash
doctl kubernetes cluster create ai-workspace-prod \
  --region sgp1 \
  --node-pool "name=default;size=s-2vcpu-4gb;count=3"
```

```
Notice: Cluster is provisioning, waited for cluster to be running
Notice: Cluster created, fetching credentials
Notice: Adding cluster credentials to kubeconfig file found in "/Users/you/.kube/config"
Notice: Setting current-context to do-sgp1-ai-workspace-prod
```

```bash
kubectl config get-contexts
```

```
CURRENT   NAME
          kind-ai-workspace
          kind-ai-workspace-staging
*         do-sgp1-ai-workspace-prod
```

Ba context, không phải hai nữa — hai cái đầu vẫn là container trên chính máy này, cái thứ ba là ba máy ảo thật, chạy ở một trung tâm dữ liệu tại Singapore, không liên quan gì tới laptop đang gõ những dòng lệnh này.

### Cùng một chart, không sửa gì cả

```bash
helm install ai-workspace ./project/chart -n ai-workspace --create-namespace
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

Khác một chữ so với hồi cài trên `kind` — bản `provider/cloud` thay vì `provider/kind`, vì lần này không cần giả lập port mapping thủ công nữa.

```bash
kubectl get svc -n ingress-nginx
```

```
NAME                       TYPE           EXTERNAL-IP      PORT(S)
ingress-nginx-controller   LoadBalancer   146.190.42.107   80:31234/TCP,443:31456/TCP
```

`EXTERNAL-IP` không còn là `<pending>` hay `localhost` nữa — một địa chỉ IP thật, do chính DigitalOcean tự tạo ra một Load Balancer thật đứng phía trước cluster, ngay khi thấy có Service kiểu `LoadBalancer` cần cấp. Đây chính là điều `kind` không bao giờ làm được, dù có `extraPortMappings` cỡ nào — `kind` không có hạ tầng mạng thật đứng sau để tự cấp một IP công khai.

### Nhờ người khác thử — không phải tự thử

Nhắn Martin một dòng địa chỉ, không kèm giải thích gì thêm.

```
Bạn
> thử coi: http://146.190.42.107
```

```
Martin
> ơ chạy thiệt à
> không cần vpn gì luôn hả
```

Không cần. Martin đang ngồi ở một thành phố khác, mạng khác, máy khác — gõ đúng một địa chỉ, ra đúng giao diện đăng nhập, y hệt những gì thấy trên `http://localhost/` bấy lâu nay. Lần đầu tiên có ai khác ngoài chính bạn chạm được vào hệ thống mà không cần `kubectl`, không cần biết `kind` là gì, không cần đứng trong cùng một mạng.

### Rancher và ArgoCD nối luôn cluster thứ ba

Vào Rancher, "Import Existing" thêm đúng một lần nữa cho `do-sgp1-ai-workspace-prod` — giờ ba cluster cùng hiện trên một màn hình: `ai-workspace` (dev), `ai-workspace-staging`, `ai-workspace-prod`. Sửa `argocd-application.yaml`, thêm `destination.server` trỏ đúng địa chỉ API server của cluster mới — ArgoCD đồng bộ Git vào đúng cluster đó, y hệt cơ chế đã hoạt động với cluster local từ lâu, chỉ khác đích đến.

Mở lại ghi chú, cuối cùng cũng gạch được dòng cuối cùng.

```
chạy được ở đâu đó ngoài laptop này ✓ DigitalOcean Kubernetes,
LoadBalancer thật cấp IP công khai thật, Martin test được từ xa
không cần vpn/tunnel gì. Cùng chart, cùng pipeline CI/CD, cùng
ArgoCD/Rancher đã dựng từ trước — chỉ thêm một cluster đích,
không phải viết lại gì.
```

Không còn dòng nào nữa. Chín dòng đầu tiên từ đêm đọc README, ba dòng từ ngày viết xong Auth/Documents/Redis, ba dòng cuối cùng từ ngày nhìn lại thấy hệ thống không còn đơn giản như xưa — tất cả đều đã có câu trả lời, không phải vì mọi thứ hoàn hảo, mà vì mỗi câu trả lời đều đến từ một sự cố thật, một buổi tối thật, không phải học thuộc lòng từ đâu đó. Bạn đóng laptop, lần đầu tiên sau nhiều tháng, không có dòng ghi chú nào mới cần viết thêm.
