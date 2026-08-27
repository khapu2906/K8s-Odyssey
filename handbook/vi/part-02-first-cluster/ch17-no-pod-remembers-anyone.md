# Chương 17 — Không Pod nào nhớ ai

## Đầu tuần sau

Bạn mở lại `notes-next.md`, dòng đầu tiên vẫn nằm y nguyên từ thứ Sáu:

```
Cần tài khoản riêng cho từng người — không share 1 session
chung nữa. Login/logout, biết ai đang là ai.
```

Câu hỏi đầu tiên không phải "làm sao", mà là "lưu trạng thái đăng nhập ở đâu". Cách quen thuộc nhất — session lưu trong bộ nhớ của process, mỗi lần login thì server nhớ luôn người đó. Bạn gõ nửa chừng rồi dừng lại, nhớ ra một chuyện đã tự tay thấy mấy tuần trước: `chat-api` đang chạy ba bản sao, không bản nào biết bản kia đang giữ gì trong RAM. Ai đó login trúng Pod A, request tiếp theo `kubectl`/load balancer đưa qua Pod B, Pod B chưa từng nghe tên người này — coi như chưa đăng nhập. Ba Pod, ba bộ nhớ tách biệt, không có gì tự đồng bộ giữa chúng cả.

Cách khác — không lưu trạng thái ở server nào hết, đóng gói thẳng thông tin người dùng vào một chuỗi ký tự, ký tên bằng một khoá bí mật, gửi thẳng cho client giữ. Server nào nhận request cũng tự verify được chữ ký, không cần hỏi "Pod nào đang nhớ người này" — vì chẳng Pod nào cần nhớ cả. Đúng chữ hay gặp trong mấy bài blog là JWT.

### Bảng users, và một cột mới trên bảng cũ

Bạn mở `schema.js`, thêm bảng `users`, và một cột `userId` vào bảng `conversations` đã có sẵn.

```js
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  message: text("message").notNull(),
  reply: text("reply").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

Định sửa luôn `CREATE TABLE conversations` trong `db.js` cho khớp, bạn khựng lại. Bảng đó đã tồn tại thật trên Postgres — nhớ rõ, y hệt cái ổ đĩa PVC gắn thêm hôm nọ, dữ liệu vẫn còn nguyên qua bao lần Pod chết sống. `CREATE TABLE IF NOT EXISTS` sẽ không đụng gì vào một bảng đã tồn tại, kể cả khi định nghĩa trong code đã đổi khác. Phải `ALTER` riêng.

```js
await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    reply TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);
await pool.query(`
  ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
`);
```

Dữ liệu cũ giữ nguyên đúng bằng chứng minh dữ liệu thật sự sống lâu hơn Pod — giờ mới thấy hệ quả của việc đó, không phải lúc nào cũng thuận tiện, đôi khi phải viết thêm một dòng `ALTER` chỉ vì dữ liệu không còn biến mất mỗi lần Pod chết như hồi trước nữa.

### Signup, login

File mới, `auth.js` — băm password bằng `bcryptjs`, ký JWT bằng module có sẵn trong `hono`, không cần cài thêm gì cho phần token.

```js
import bcrypt from "bcryptjs";
import { sign } from "hono/jwt";
import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { users } from "./schema.js";

const JWT_SECRET = process.env.JWT_SECRET;

export async function signup(email, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning();
  return user;
}

export async function login(email, password) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return sign({ sub: user.id, email: user.email }, JWT_SECRET);
}
```

`index.js` gắn thêm hai route, rồi khoá `/api/chat` và `/api/conversations` lại bằng middleware `jwt()` — request nào không có token hợp lệ bị chặn ngay từ đầu, không tới được tay hàm xử lý thật.

```js
app.use("/api/chat", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/conversations", jwt({ secret: JWT_SECRET, alg: "HS256" }));

app.post("/api/chat", async (c) => {
  const { message, documentText } = await c.req.json();
  const { sub: userId } = c.get("jwtPayload");
  ...
  const [conversation] = await db
    .insert(conversations)
    .values({ userId, message, reply })
    .returning();
  return c.json(conversation);
});

app.get("/api/conversations", async (c) => {
  const { sub: userId } = c.get("jwtPayload");
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(asc(conversations.createdAt));
  return c.json(rows);
});
```

### Một Secret nữa

`JWT_SECRET` cần một giá trị thật, không phải chữ gõ đại như `postgres` hồi trước — cái này ký lên mọi token, lộ ra là ai cũng tự tạo được token giả. Sinh một chuỗi ngẫu nhiên đàng hoàng.

```bash
openssl rand -hex 32
```

```
3f9a1c8e2b7d4f6a0e5c9b2d8f1a4e7c6b3d9f2a5e8c1b4d7f0a3e6c9b2d5f8a
```

Đúng bài cũ, chỉ đổi tên Secret và key.

```bash
kubectl create secret generic chat-api-secret \
  --from-literal=JWT_SECRET=3f9a1c8e2b7d4f6a0e5c9b2d8f1a4e7c6b3d9f2a5e8c1b4d7f0a3e6c9b2d5f8a \
  -n ai-workspace \
  --dry-run=client -o yaml > chat-api-secret.yaml

kubectl apply -f chat-api-secret.yaml
```

```
secret/chat-api-secret created
```

Thêm vào `chat-api-deployment.yaml`, ngay cạnh mấy biến `POSTGRES_*` đã quen mắt.

```yaml
- name: JWT_SECRET
  valueFrom:
    secretKeyRef:
      name: chat-api-secret
      key: JWT_SECRET
```

### Build lại, thử thật

```bash
docker build -t ai-workspace/chat-api:dev ./chat-api
kind load docker-image ai-workspace/chat-api:dev --name ai-workspace
kubectl apply -f chat-api-deployment.yaml
kubectl delete pod -n ai-workspace -l app=chat-api
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

`port-forward` không kết nối được. Kiểm tra lại Pod.

```bash
kubectl get pods -n ai-workspace
```

```
NAME                        READY   STATUS             RESTARTS   AGE
chat-api-586cbb45d8-fghkt   0/1     CrashLoopBackOff   5          3m
```

```bash
kubectl logs chat-api-586cbb45d8-fghkt -n ai-workspace
```

```
Error: JWT auth middleware requires options for "alg"
    at jwt (file:///app/node_modules/hono/dist/middleware/jwt/jwt.js:12:11)
    at file:///app/src/index.js:44:22
```

Bản `hono/jwt` đang cài không tự suy ra thuật toán ký mặc định như bạn nghĩ — phải khai rõ `alg`. Sửa lại đúng hai dòng vừa viết.

```js
app.use("/api/chat", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.use("/api/conversations", jwt({ secret: JWT_SECRET, alg: "HS256" }));
```

`HS256` — cùng thuật toán `sign()` trong `auth.js` đang dùng ngầm định, giờ chỉ là khai rõ ra cho middleware biết. Build lại, apply lại.

```bash
docker build -t ai-workspace/chat-api:dev ./chat-api
kind load docker-image ai-workspace/chat-api:dev --name ai-workspace
kubectl delete pod -n ai-workspace -l app=chat-api
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

Lần này lên `1/1 Running` thật. Thử chưa có tài khoản trước.

```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hi"}'
```

```json
{"message":"Unauthorized"}
```

Đúng cái vừa gắn — không token, không vào được. Đăng ký thử.

```bash
curl -s -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@ai-workspace.dev","password":"correct-horse"}'
```

```json
{"id":1,"email":"you@ai-workspace.dev"}
```

Đăng nhập, lấy token.

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@ai-workspace.dev","password":"correct-horse"}'
```

```json
{"token":"eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsImVtYWlsIjoieW91QGFpLXdvcmtzcGFjZS5kZXYifQ.k3f8..."}
```

Gắn token vào header, thử lại đúng request lúc nãy bị chặn.

```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsImVtYWlsIjoieW91QGFpLXdvcmtzcGFjZS5kZXYifQ.k3f8..." \
  -d '{"message":"hi"}'
```

```json
{"id":15,"userId":1,"message":"hi","reply":"I don't have a document to work from yet — paste some text in and ask me again.","createdAt":"2026-08-24T09:03:11.204Z"}
```

Qua rồi. `userId: 1`, đúng người vừa đăng nhập. Request này có thể rớt vào bất kỳ Pod nào trong ba bản `chat-api`, không quan trọng Pod nào — chỉ cần cùng đọc được `JWT_SECRET` từ đúng một Secret, verify chữ ký là xong, không Pod nào cần "nhớ" bạn trước đó cả.

Bạn mở `notes-next.md`, gạch dòng đầu tiên.

```
Cần tài khoản riêng cho từng người ✓ JWT — không lưu session
ở server, token tự chứa danh tính, ký/verify bằng JWT_SECRET
dùng chung qua Secret. Pod nào trả lời cũng được, không cần
"nhớ" ai đã login ở đâu.

Nhiều người cùng dùng cùng lúc — có cần giới hạn tốc độ, cache
gì không? Chưa rõ, ghi lại để coi thêm.

Cần chỗ lưu tài liệu người dùng upload lên, không phải dán
tay vào ô chat mỗi lần như bây giờ.
```

Hai dòng còn lại. Tối nay để đó, mai tính tiếp.
