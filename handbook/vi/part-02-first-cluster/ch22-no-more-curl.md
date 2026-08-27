# Chương 22 — Không cần curl nữa

## Đầu tuần

Hai dòng ghi chú từ cuối tuần trước vẫn còn treo:

```
frontend vẫn 401 vì chưa có login UI, ghi hôm qua, vẫn còn đó.
```

Ba tuần nay, mọi lần test đều qua `curl`, tự tay gõ header `Authorization: Bearer ...`. Không khách hàng nào làm vậy cả. Mở `App.jsx`, phần còn thiếu không phải gì cao siêu — chỉ là màn hình đăng nhập, và nhớ đính token vào mọi request.

```jsx
const [token, setToken] = useState(() => localStorage.getItem("token"));
```

`localStorage` — chỗ duy nhất giữ token sau khi tải lại trang, sống trong chính trình duyệt của người dùng, không liên quan gì tới cluster hay Pod nào cả. Đóng tab, mở lại, token vẫn còn, không cần đăng nhập lại mỗi lần.

Chưa có token thì hiện thẳng form đăng nhập, chưa cho thấy giao diện chat.

```jsx
if (!token) {
  return <LoginForm onLogin={handleLogin} />;
}
```

`LoginForm` gọi đúng hai route đã có sẵn từ lâu — `/api/auth/signup` và `/api/auth/login` — chọn qua một cái nút bấm chuyển `mode`. Đăng nhập xong, lưu token, mọi request sau đó đều đính kèm.

```jsx
const res = await fetch(`${API_URL}/api/chat`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ message, documentText }),
});

if (res.status === 401) {
  handleLogout();
  return;
}
```

Thêm đúng một dòng kiểm tra `401` — token hết hạn hoặc bị thu hồi thì tự động đăng xuất, quay lại màn hình login, thay vì cứ đứng đơ báo lỗi không rõ ràng.

Build lại, load vào cluster, deploy.

```bash
docker build -t ai-workspace/frontend:dev ./frontend
kind load docker-image ai-workspace/frontend:dev --name ai-workspace
kubectl delete pod -n ai-workspace -l app=frontend
```

Mở trình duyệt, gõ đúng `http://localhost/` — không `port-forward`, không cờ `-n`, không mở terminal thứ hai nào cả. Lần đầu tiên, đúng cái người dùng cuối sẽ thấy: một form đăng nhập, không phải giao diện chat lộ thiên.

Đăng ký một tài khoản mới ngay trên form, không cần `curl`. Đăng nhập. Giao diện chat hiện ra. Dán một đoạn text vào ô Document, hỏi một câu — có trả lời, đúng dòng vừa dán. Đóng tab, mở lại `http://localhost/` — token còn nguyên trong `localStorage`, không phải đăng nhập lại, thẳng vào giao diện chat luôn.

Đây là lần đầu tiên toàn bộ hệ thống được thử đúng như cách một khách hàng thật sẽ trải nghiệm — không có `kubectl` nào chạy ngầm, không có `curl` nào phải tự tay gõ, không có terminal thứ hai. Đúng con đường: `http://localhost/` → Ingress → Service `frontend` → trình duyệt tải React app → React app gọi `Ingress` → Service `chat-api` → Pod → Postgres/Redis. Ba tuần trước, câu đầu tiên gõ là `kind create cluster`. Giờ câu duy nhất cần gõ là một địa chỉ trên trình duyệt.

Mở lại `notes-next.md` lần cuối — trống trơn, không sửa gì. Ghi chú còn lại duy nhất nằm ở `ch21`, dòng về `LoadBalancer`/cloud thật, vẫn còn nguyên, chưa đụng tới. Không sao — biết rõ ranh giới giữa cái đã xong và cái còn lại, tự nó đã là một điểm dừng chấp nhận được.
