# Khunhong Computer Shop — Frontend

React frontend for the Khunhong Computer Shop management system. Connects to a Laravel backend via REST API with Sanctum token auth.

## Stack

| Layer | Tool |
|---|---|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 8 |
| Styling | Tailwind CSS 3 + @tailwindcss/forms |
| Routing | React Router 7 |
| HTTP | Axios |
| Testing | Vitest + Testing Library |
| Lint | ESLint 10 + typescript-eslint |

## Getting started

```bash
npm install
```

Create a `.env` file (copy `.env.example` if present, or create manually):

```env
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build locally
npm run lint       # ESLint
npm run test       # Vitest watch mode
npm run test:run   # Vitest single run (CI)
```

## Auth

Authentication uses Laravel Sanctum Bearer tokens. The token is stored in `localStorage` under the key `auth_token`. On app mount the client calls `GET /auth/user-details` to validate the session. Any 401 response dispatches an `auth:unauthorized` CustomEvent, which `AuthContext` catches to trigger logout and redirect.

## API

All requests go to `VITE_API_URL` (default `http://localhost:8000`). Response envelope:

```json
{ "status": "...", "message": "...", "data": { ... } }
```

Paginated responses also include `links` and `meta` (`meta.current_page`, `meta.last_page`).

File uploads use POST with `_method: 'PUT'` in FormData for method spoofing. Booleans are sent as `"1"` / `"0"`. Image paths from the API are relative to `/storage/`.

API modules live in `src/api/`: `auth`, `products`, `categories`, `orders`, `invoices`, `payments`, `shipments`, `addresses`.

## Pages

**Admin** (`/admin/...`): Dashboard, Products, Categories, Orders, Invoices, Payments, Shipments

**Customer** (`/...`): Products, Categories, Orders, Invoices, Shipments, Addresses

## Deployment

```bash
npm run deploy
```

`deploy.js` reads `DEPLOY_DIR` from `.env`, copies `dist/` into a timestamped release directory, performs an atomic symlink swap, and prunes to the 5 most recent releases.
