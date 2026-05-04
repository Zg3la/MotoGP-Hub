# MotoGP Hub 🏁

https://motogp-hub-1.onrender.com/

MotoGP Hub is a simple social platform built around MotoGP riders and fans.  
Users can post updates, follow riders, like posts, and join discussions around races and riders.

It’s a lightweight full-stack project using Node.js and NeDB.

---

## What it does

- Riders and fans can create posts
- Like and comment on posts
- Follow riders and other users
- Feed with approved and pending posts
- Basic admin role included

---

## Tech stack

- Node.js
- Express
- NeDB (file-based database)
- bcryptjs

---

## Database

Uses NeDB with 5 collections:
- users
- posts
- comments
- likes
- follows

The app auto-seeds data on first run with:
- 22 MotoGP riders (2026 grid)
- Fan accounts
- Admin account
- Sample posts, likes, and comments

---

## Default accounts

**Admin**
- admin@motogp.com / admin123

**Driver**
- fabio_quartararo@motogp.com / motogp123

**Fan**
- alex@fans.com / fan123

---

## MotoGP riders included

Includes current MotoGP grid riders like:
- Marc Márquez
- Francesco Bagnaia
- Fabio Quartararo
- Pedro Acosta
- Jorge Martín
- Brad Binder
- and others from the 2026 grid

---

## Run locally

```bash
npm install
npm run dev
