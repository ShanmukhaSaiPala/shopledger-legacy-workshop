# ShopLedger

## Stack

- Node.js CommonJS application using Express and `body-parser`.
- Static browser UI in `public/`.
- File-backed persistence in `data/db.json`; no database service or ORM.

## Module map

- `server.js`: Express setup, static assets, API router mounting, and the printable invoice route.
- `routes/`: HTTP endpoints for products, orders, customers, and reports.
- `lib/`: pricing, tax, coupons, inventory, orders, credit ledger, invoices, reports, dates, and JSON storage.
- `config.js`: shop, tax, inventory, and coupon configuration.
- `data/db.json`: application data.

## Commands

- `npm start` starts the application with `node server.js`.
- `npm test` currently exits with an error; no test runner is configured.

## Change rules

- Write characterization tests before changing existing behavior.
- Change only the module the ticket is about.
- Tests must never read from or write to `data/db.json`; use isolated fixtures instead.
- Do not add dependencies.
