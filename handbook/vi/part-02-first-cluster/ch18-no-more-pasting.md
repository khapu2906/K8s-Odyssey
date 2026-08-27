# Chương 18 — Không cần dán tay nữa

## Hôm sau

Mở lại `notes-next.md`, hai dòng còn lại:

```
Nhiều người cùng dùng cùng lúc — có cần giới hạn tốc độ, cache
gì không? Chưa rõ, ghi lại để coi thêm.

Cần chỗ lưu tài liệu người dùng upload lên, không phải dán
tay vào ô chat mỗi lần như bây giờ.
```

Dòng đầu vẫn còn "chưa rõ" — chưa có việc gì cụ thể để bắt tay vào. Dòng thứ hai thì khác, biết chính xác cần gì: một chỗ lưu tài liệu, gắn với đúng người dùng đã upload.

Mở `schema.js`, thêm bảng `documents` — gắn `userId` giống hệt cách `conversations` đã làm ở Chương 17.

```js
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

Bảng hoàn toàn mới, không có dữ liệu cũ nào phải lo giữ lại — lần này chỉ cần `CREATE TABLE IF NOT EXISTS` bình thường trong `db.js`, không cần `ALTER` như bài học lần trước.

```js
await pool.query(`
  CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);
```

Thêm hai route vào `index.js`, khoá bằng `jwt()` giống `/api/chat`. Rồi sửa `/api/chat` — thay vì bắt dán nguyên `documentText` mỗi lần, giờ chấp nhận thêm `documentId`, tự tra nội dung tài liệu trong database.

```js
app.use("/api/documents", jwt({ secret: JWT_SECRET, alg: "HS256" }));

app.post("/api/documents", async (c) => {
  const { filename, content } = await c.req.json();
  const { sub: userId } = c.get("jwtPayload");
  const [doc] = await db
    .insert(documents)
    .values({ userId, filename, content })
    .returning({ id: documents.id, filename: documents.filename, createdAt: documents.createdAt });
  return c.json(doc);
});
```

```js
app.post("/api/chat", async (c) => {
  const { message, documentText, documentId } = await c.req.json();
  const { sub: userId } = c.get("jwtPayload");

  let text = documentText;
  if (documentId) {
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.userId, userId)));
    text = doc?.content;
  }

  const reply = answer(message, text);
  ...
});
```

Điều kiện `and(eq(documents.id, documentId), eq(documents.userId, userId))` — không chỉ tìm đúng `id`, mà còn phải đúng `userId` của người đang gọi. Thiếu điều kiện thứ hai, ai đăng nhập cũng đoán được ID rồi đọc tài liệu của người khác — đúng kiểu lỗ hổng đã tránh được từ đầu nhờ filter `userId` trên `/api/conversations` ở Chương 17, giờ áp dụng lại một lần nữa cho chỗ mới.

Build lại, deploy.

```bash
docker build -t ai-workspace/chat-api:dev ./chat-api
kind load docker-image ai-workspace/chat-api:dev --name ai-workspace
kubectl delete pod -n ai-workspace -l app=chat-api
kubectl port-forward deployment/chat-api 8080:8080 -n ai-workspace
```

Đăng nhập lại bằng tài khoản đã tạo hôm qua, lấy token mới.

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@ai-workspace.dev","password":"correct-horse"}'
```

```json
{"token":"eyJhbGciOiJIUzI1NiJ9..."}
```

Upload thử một tài liệu ngắn.

```bash
curl -s -X POST http://localhost:8080/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -d '{"filename":"notes.txt","content":"Kubernetes tu dong khoi dong lai container bi loi. ReplicaSet dam bao dung so luong Pod luon ton tai."}'
```

```json
{"id":1,"filename":"notes.txt","createdAt":"2026-08-25T08:41:02.117Z"}
```

Gửi một câu hỏi, trỏ thẳng vào `documentId: 1` thay vì dán lại nguyên đoạn text.

```bash
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -d '{"message":"ReplicaSet dam bao gi","documentId":1}'
```

```json
{"id":16,"userId":1,"message":"ReplicaSet dam bao gi","reply":"ReplicaSet dam bao dung so luong Pod luon ton tai.","createdAt":"2026-08-25T08:42:15.903Z"}
```

Lần đầu tiên câu trả lời không phải câu từ chối quen thuộc — đúng câu trong tài liệu vừa upload, tìm ra nhờ so từ khoá với câu hỏi. Không cần dán tay `documentText` vào body nữa, chỉ cần nhớ đúng `documentId`.

Trước khi đóng máy, tò mò xem tài liệu vừa lưu chiếm bao nhiêu chỗ thật trên ổ đĩa đã gắn từ Chương 11.

```bash
kubectl exec -it postgres-6b7d4f8c9-p3wln -n ai-workspace -- df -h /var/lib/postgresql/data
```

```
Filesystem                Size  Used Avail Use%
/dev/vda1                 1.0G   45M  980M   5%
```

`1.0G` — đúng con số `1Gi` đã xin trong `postgres-pvc.yaml` hồi đó, giờ mới thấy lại bằng con mắt khác: không phải một con số trừu tượng nữa, mà là một giới hạn thật, đang còn dư 980M. Vài tài liệu ngắn thì chẳng thấm gì, nhưng nếu công ty lớn hơn, mỗi người dùng upload vài chục file thật (không phải mấy dòng test), con số 5% này sẽ tăng lên nhanh hơn tưởng. Ghi lại một dòng, không xử lý vội — bài toán khác, để dành.

Mở `notes-next.md`, gạch dòng vừa xong.

```
Cần chỗ lưu tài liệu người dùng upload lên ✓ bảng documents,
lọc theo userId y hệt conversations. PVC vẫn còn 1Gi từ hồi
Chương 11 — hiện dư dả, nhưng đó là giới hạn thật, không phải
vô hạn. Theo dõi thêm khi dữ liệu tăng.

Nhiều người cùng dùng cùng lúc — có cần giới hạn tốc độ, cache
gì không? Chưa rõ, để sau.
```

Một dòng, không phải hai. Còn đúng một câu hỏi chưa có câu trả lời — nhưng lần này không vội, dòng đó ghi rõ "chưa rõ" từ đầu, không phải việc đang dang dở.
