# Octen Merchant Dashboard

Merchant operations UI for the existing NestJS API. The backend remains the source of truth for account authorization, order totals, inventory, payments, and ledger balances.

## Run locally

1. Copy `.env.example` to `.env.local` and set `BACKEND_API_URL` to the backend's `/api/v1` base URL. The default is `http://localhost:8000/api/v1`.
2. Start the NestJS backend and make sure it is reachable from this Next.js server.
3. Run `npm run dev` and open `http://localhost:3000`.

Merchant access uses the backend's `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh`, and `POST /auth/logout` APIs. Access and rotating refresh tokens are stored in HttpOnly, SameSite cookies; browser code only calls the same-origin BFF.

## Implemented API-backed areas

- Dashboard overview: orders, customers, products, deliveries, outstanding ledger, and payments.
- Customers: list, details, and create.
- Products and stock: list, details, create, activate/deactivate, and stock adjustments.
- Orders: list, details, and CONFIRM/REJECT for PLACED orders; create invoices from CONFIRMED orders.
- Invoices: list, details, and browser print.
- Payments: list, details, and record.
- Khata: outstanding balances.
- Deliveries: list, details, schedule for confirmed orders, and update delivery status.
- Routes: list and create.
- Notifications: unread count, list, mark one read, and mark all read.

## Backend capabilities not present in this repository

The NestJS app currently has no returns/damage or promotions module. Those pages explain this integration gap and do not create local placeholder records. Customer creation DTO does not accept a delivery-route assignment. Customer editing, product unit definitions/history, general delivery editing, route editing, and richer customer/payment filters are not implemented. Invoice generation also requires the backend's supplier GST environment values.

## Verification

`npm run lint`, `npx tsc --noEmit`, and `npm run build` verify lint, types, and the production build. The build script uses Next.js's Webpack builder because the installed Turbopack CSS worker exits before connecting in this Windows environment.
