# Chapter 22 — No More curl

## Start of the week

Two notes from last weekend are still hanging there:

```
Frontend still 401s with no login UI, noted yesterday, still open.
```

Three weeks now, every single test has gone through `curl`, typing an `Authorization: Bearer ...` header by hand. No customer does that. Open `App.jsx`, and what's missing isn't anything complicated — just a login screen, and remembering to attach the token to every request.

```jsx
const [token, setToken] = useState(() => localStorage.getItem("token"));
```

`localStorage` — the one place holding the token across page reloads, living in the user's own browser, nothing to do with the cluster or any Pod at all. Close the tab, reopen it, the token's still there, no need to log in again every time.

No token, and it shows the login form directly, never the chat UI.

```jsx
if (!token) {
  return <LoginForm onLogin={handleLogin} />;
}
```

`LoginForm` calls the exact two routes that have existed for a while now — `/api/auth/signup` and `/api/auth/login` — switching between them with a button toggling `mode`. Log in successfully, store the token, every request after that attaches it.

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

One extra line checking for `401` — an expired or revoked token logs the user out automatically, back to the login screen, instead of just sitting there with an unclear error.

Rebuild, load into the cluster, deploy.

```bash
docker build -t ai-workspace/frontend:dev ./frontend
kind load docker-image ai-workspace/frontend:dev --name ai-workspace
kubectl delete pod -n ai-workspace -l app=frontend
```

Open a browser, type exactly `http://localhost/` — no `port-forward`, no `-n` flag, no second terminal open at all. First time, exactly what an end user would see: a login form, not a chat UI sitting wide open.

Sign up for a new account right on the form, no `curl` needed. Log in. The chat UI shows up. Paste some text into the Document box, ask a question — an answer comes back, matching exactly what was just pasted. Close the tab, reopen `http://localhost/` — the token's still sitting in `localStorage`, no need to log in again, straight into the chat UI.

This is the first time the entire system has been tried exactly the way a real customer would experience it — no `kubectl` running in the background, no `curl` typed by hand, no second terminal. The actual path: `http://localhost/` → Ingress → `frontend` Service → browser loads the React app → the React app calls the Ingress → `chat-api` Service → Pod → Postgres/Redis. Three weeks ago, the first thing typed was `kind create cluster`. Now the only thing that needs typing is an address in a browser.

Open `notes-next.md` one last time — empty, nothing to fix. The one note still open lives back in the last chapter, the line about `LoadBalancer`/a real cloud, untouched, still there. That's fine — knowing exactly where the line sits between what's done and what's left is, on its own, a reasonable place to stop.
