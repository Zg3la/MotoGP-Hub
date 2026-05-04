# 🏁 MotoGP Social Hub

A full-stack social network for MotoGP fans. Built with **Node.js + Express** (backend), **NeDB** (file-based database), and **Vanilla HTML/CSS/JS** (frontend SPA).

---

## 📁 Project Structure

```
motogp-hub/
├── server.js              # Entry point – Express server
├── package.json
├── db/
│   ├── database.js        # NeDB setup + seeding
│   ├── users.db           # Auto-created on first run
│   ├── posts.db
│   ├── comments.db
│   ├── likes.db
│   └── follows.db
├── routes/
│   ├── auth.js            # /api/auth – register, login, me
│   ├── posts.js           # /api/posts – CRUD, votes, comments
│   ├── users.js           # /api/users – drivers, follow, profile
│   └── auth.middleware.js # JWT middleware
└── public/                # Frontend SPA (served statically)
    ├── index.html
    ├── references.html    # Literature / sources page
    ├── css/style.css
    └── js/
        ├── api.js         # All AJAX calls (Fetch API)
        ├── auth.js        # Login/register module
        ├── posts.js       # Feed, vote, comments
        ├── drivers.js     # Driver grid + follow
        └── app.js         # Router, profile, init
```

---

## ✅ Requirements Met

| Requirement | Status |
|---|---|
| HTML, CSS, JavaScript | ✅ |
| Server-side: Node.js + Express | ✅ |
| Custom own API (backend) | ✅ `/api/auth`, `/api/posts`, `/api/users` |
| Database (NeDB – file-based, 5 collections) | ✅ users, posts, comments, likes, follows |
| Minimum 3 tables/collections | ✅ 5 collections |
| Responsive design (Flexbox + Grid + own CSS) | ✅ |
| Dynamic content (JS DOM manipulation) | ✅ |
| Navigation dynamically updates | ✅ |
| Client-side form validation | ✅ |
| AJAX calls to own API | ✅ (Fetch API throughout) |
| JSON data exchange | ✅ |
| Login + Register with validation | ✅ |
| References page (separate HTML doc) | ✅ `/references.html` |
| SPA (Single Page Application) | ✅ |
| No Lorem Ipsum | ✅ |

---

## 🚀 Running Locally

### Requirements
- Node.js 18+

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start the server
node server.js

# 3. Open in browser
# http://localhost:3000
```

The database files are created automatically on first run. Drivers are seeded automatically.

---

## 🌐 Hosting on Render.com (Free)

1. Push your project to a **GitHub repository**
2. Go to [render.com](https://render.com) and create an account
3. Click **New → Web Service**
4. Connect your GitHub repo
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
6. Click **Deploy**

> ⚠️ **Important for Render:** NeDB stores files locally. On Render's free tier, the disk resets on each deploy. For persistent data, use **Railway.app** (has persistent disk) or switch to **Firebase/MongoDB Atlas**.

### Alternative: Railway.app (Persistent Storage)

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add environment variable: `JWT_SECRET=your_secret_here`
4. Railway auto-detects Node.js and deploys

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user (auth required) |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/posts | Get paginated feed |
| POST | /api/posts | Create post (auth) |
| DELETE | /api/posts/:id | Delete post (auth, own) |
| POST | /api/posts/:id/vote | Like or dislike (auth) |
| GET | /api/posts/:id/comments | Get comments |
| POST | /api/posts/:id/comments | Add comment (auth) |
| DELETE | /api/posts/:postId/comments/:id | Delete comment (auth, own) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users/drivers | Get all drivers |
| GET | /api/users/:username | Get user profile |
| GET | /api/users/:username/posts | Get user's posts |
| POST | /api/users/:username/follow | Follow/unfollow (auth) |
| PATCH | /api/users/me/bio | Update bio (auth) |

---

## 🏍️ Pre-seeded Drivers

- **Fabio Quartararo** (#20) – Monster Energy Yamaha
- **Pedro Acosta** (#31) – Red Bull KTM Factory Racing
- **Marc Márquez** (#93) – Gresini Racing MotoGP
- **Jorge Martín** (#89) – Prima Pramac Racing

---

## 🔐 Authentication

Uses **JWT (JSON Web Tokens)** with a 7-day expiry. Tokens are stored in `localStorage`. Passwords are hashed with **bcryptjs**.

---

## 📖 References

See [`/references.html`](http://localhost:3000/references.html) in the running app, or open `public/references.html`.
