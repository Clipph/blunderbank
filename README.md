# Blunderbank

[cloudflarebutton]

## Overview

Blunderbank is a production-ready full-stack chat application built on Cloudflare Workers. It demonstrates a scalable architecture using Durable Objects for entity persistence (Users, Chat Boards with Messages), Hono for API routing, and a modern React frontend with Shadcn/UI components. The app supports CRUD operations for users and chats, real-time message sending, pagination, and mock seed data for quick testing.

This template is optimized for Cloudflare's edge network, providing low-latency global performance with zero cold starts via Durable Objects.

## Key Features

- **Entity-Based Persistence**: Users and ChatBoards stored in individual Durable Object instances with prefix-based indexes for efficient listing and pagination.
- **Full API Coverage**: RESTful endpoints for users, chats, and messages (list, create, delete, paginate).
- **Modern React Frontend**: Responsive UI with Tailwind CSS, Shadcn/UI, Tanstack Query for data fetching, dark mode, sidebar layout, and error boundaries.
- **Type-Safe**: End-to-end TypeScript with shared types between frontend and worker.
- **Production-Ready**: CORS, logging, error handling, health checks, and client error reporting.
- **Seamless Deployment**: One-command deploys to Cloudflare Workers with static asset serving.
- **Extensible**: Easy to add new entities by extending `IndexedEntity` in `worker/entities.ts` and routes in `worker/user-routes.ts`.

## Tech Stack

- **Backend**: Cloudflare Workers, Hono, Durable Objects, TypeScript
- **Frontend**: React 18, Vite, Tailwind CSS, Shadcn/UI, Lucide Icons, Tanstack Query, React Router, Sonner (toasts), Framer Motion
- **Utilities**: Bun (package manager/build tool), Zod (validation), Immer (state), UUID
- **Dev Tools**: ESLint, TypeScript 5, Wrangler

## Prerequisites

- [Bun](https://bun.sh/) installed (recommended package manager)
- [Cloudflare Account](https://dash.cloudflare.com/) with Workers enabled
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install/) (installed via `bunx wrangler`)

## Installation

1. Clone the repository.
2. Install dependencies:

   ```bash
   bun install
   ```

3. (Optional) Generate Worker types:

   ```bash
   bunx wrangler types
   ```

## Development

Start the development server (proxies API calls to Workers preview):

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `PORT=8080 bun run dev`).

### Key Development Notes

- Frontend hot-reloads automatically.
- API routes auto-reload via dynamic import.
- Mock data seeds on first API call (Users, Chats, Messages).
- Test endpoints via browser or tools like Postman/cURL.

**Example API Usage** (replace `YOUR_WORKER_URL`):

```bash
# List users
curl "YOUR_WORKER_URL/api/users?limit=10"

# Create user
curl -X POST "YOUR_WORKER_URL/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe"}'

# List chats
curl "YOUR_WORKER_URL/api/chats"

# Create chat
curl -X POST "YOUR_WORKER_URL/api/chats" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Chat"}'

# Send message
curl -X POST "YOUR_WORKER_URL/api/chats/c1/messages" \
  -H "Content-Type: application/json" \
  -d '{"userId": "u1", "text": "Hello!"}'
```

Available endpoints: `/api/users`, `/api/chats`, `/api/chats/:id/messages`, delete endpoints, health check at `/api/health`.

## Building

```bash
bun run build
```

Outputs optimized static assets to `dist/`.

## Local Preview

```bash
bun run preview
```

Serves the built app locally.

## Deployment

Deploy to Cloudflare Workers with a single command:

```bash
bun run deploy
```

Or manually:

```bash
bun run build
bunx wrangler deploy
```

[cloudflarebutton]

**Post-Deployment**:
- Access your app at `https://your-worker.your-subdomain.workers.dev`.
- Configure custom domain via Wrangler or Cloudflare Dashboard.
- View logs/metrics in Cloudflare Dashboard > Workers > Your Worker.
- Durable Objects auto-migrate via `wrangler.jsonc`.

**Environment Variables**: None required (Durable Objects handle storage).

## Extending the App

1. **New Entities**: Extend `IndexedEntity` in `worker/entities.ts`, add `seedData` and routes in `worker/user-routes.ts`.
2. **Frontend Pages**: Add routes in `src/main.tsx`, create pages in `src/pages/`.
3. **Components**: Use Shadcn/UI (`npx shadcn@latest add <component>`).
4. **API Client**: Use `api()` from `src/lib/api-client.ts` with Tanstack Query.

## Troubleshooting

- **Type Errors**: Run `bunx wrangler types`.
- **Deploy Fails**: Ensure `wrangler login` and valid account.
- **CORS Issues**: Pre-configured for `*`.
- **Linting**: `bun run lint`.

## License

MIT License. See [LICENSE](LICENSE) for details.

---

Built with ❤️ for Cloudflare Workers. Questions? Open an issue!