# Chương 27 — Cloud không với tới laptop này

## Tuần sau

Đếm lại mới thấy: từ hồi mới học tới giờ, đúng bốn dòng lệnh gõ đi gõ lại không biết bao nhiêu lần mỗi khi đổi code — `docker build`, `kind load docker-image`, `kubectl apply`, `kubectl delete pod -l app=...`. Tối qua đổi một dòng trong `answer.js`, quên mất bước `kind load`, ngồi tự hỏi mười phút vì sao Pod mới vẫn chạy code cũ. Đúng dòng ghi từ tuần trước: "tự động hoá deploy" — chưa ai đụng tới.

Repo đã nằm trên GitHub từ đầu (mỗi chương một tag, một Release — cách đã làm suốt từ lúc bắt đầu). GitHub có sẵn `Actions` — chạy được một quy trình mỗi khi có push, không cần cài thêm dịch vụ ngoài.

### CI — phần dễ, không có gì bất ngờ

```yaml
# .github/workflows/chat-api.yml
name: chat-api CI/CD

on:
  push:
    branches: [main]
    paths: ["project/chat-api/**"]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      packages: write
    steps:
      - uses: actions/checkout@v4
      - name: Log in to GHCR
        run: echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
      - name: Build and push
        run: |
          docker build -t ghcr.io/${{ github.repository }}/chat-api:${{ github.sha }} project/chat-api
          docker push ghcr.io/${{ github.repository }}/chat-api:${{ github.sha }}
```

Push thử một sửa nhỏ trong `answer.js`, vào tab Actions xem — job chạy, xanh, image mới nằm trong GHCR, gắn tag đúng bằng git SHA của commit vừa đẩy lên. Không còn `docker build` gõ tay nữa. Một điều tiện thể nhận ra: giờ có registry thật, image không còn "chỉ tồn tại trên máy host" như hồi mới học — nghĩa là bước `kind load docker-image` (đã gõ hàng chục lần suốt mấy tuần) sắp không cần nữa, vì `kind` có thể tự kéo image từ GHCR qua mạng, y hệt một cluster thật.

### CD — phần tưởng dễ, hoá ra vướng ngay từ đầu

Thêm job thứ hai, deploy sau khi build xong.

```yaml
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Set image
        run: kubectl set image deployment/chat-api chat-api=ghcr.io/${{ github.repository }}/chat-api:${{ github.sha }} -n ai-workspace
```

Chạy thử — lỗi ngay: `kubectl` trên runner không có `~/.kube/config` nào trỏ tới cluster cả, và dù có copy đúng file config vào, `kind` cluster đang chạy trên chính laptop của bạn, không có địa chỉ IP công khai nào cho một máy ảo nằm đâu đó trên hạ tầng GitHub gọi tới được. Không phải thiếu quyền — là không có đường mạng nào tồn tại giữa hai nơi đó cả, đúng kiểu vấn đề đã gặp hồi trước, chỉ đảo ngược hướng: lần đó là "người ngoài không vào được cluster", lần này là "GitHub không vào được cluster", cùng một lý do — cluster chỉ tồn tại trên đúng một laptop.

### Runner tự host — chạy Actions ngay trên máy đang có cluster

GitHub Actions không bắt buộc phải chạy trên máy ảo của GitHub — có thể tự cài một "runner" ngay trên máy mình, để job chạy tại chỗ, có sẵn `kubectl`/`kind` đã cấu hình từ trước.

```bash
# tải runner từ trang Settings > Actions > Runners > New self-hosted runner
./config.sh --url https://github.com/<bạn>/kubernetes-odyssey --token <token>
./run.sh
```

```
√ Connected to GitHub
Listening for Jobs
```

Sửa `runs-on` của job `deploy` thành `self-hosted`.

```yaml
  deploy:
    needs: build-and-push
    runs-on: self-hosted
    steps:
      - name: Set image
        run: kubectl set image deployment/chat-api chat-api=ghcr.io/${{ github.repository }}/chat-api:${{ github.sha }} -n ai-workspace
```

Push lại đúng sửa đổi cũ. Terminal đang chạy `./run.sh` nhảy dòng ngay lập tức — job `deploy` chạy thẳng trên máy bạn, dùng đúng `kubectl` đã đăng nhập sẵn, đúng cluster đang chạy ngay đó.

```bash
kubectl get pods -n ai-workspace -w
```

```
chat-api-...   1/1   Running   0   8s
```

Pod mới lên, chạy đúng image vừa build, không một dòng lệnh nào bạn tự gõ tay — từ lúc `git push` tới lúc Pod mới chạy, không còn khoảng trống nào cần con người đứng vào giữa nữa.

Mở lại ghi chú từ mấy tuần trước, gạch dòng áp chót.

```
tự động hoá deploy ✓ GitHub Actions build + push GHCR, deploy
qua self-hosted runner (vì cluster kind chỉ tồn tại trên máy
này, GitHub-hosted runner không có đường mạng nào tới được).
kind load docker-image không cần nữa, image kéo thẳng từ GHCR.

chạy được ở đâu đó ngoài laptop này — vẫn treo.
```

Đúng dòng cuối cùng còn lại. Runner tự host vẫn đang chạy trên đúng cái laptop này — tiện hơn hẳn, nhưng "tiện hơn" và "không còn phụ thuộc một cái máy duy nhất" là hai chuyện khác nhau, bạn biết rõ điều đó, không tự nhận vơ là đã xong.
