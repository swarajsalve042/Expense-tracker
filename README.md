# Expense Tracker Web Application

[![CI](https://github.com/swarajsalve042/Expense-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/swarajsalve042/Expense-tracker/actions/workflows/ci.yml)

A dependency-free Node.js expense tracker with a responsive browser interface and a JSON-backed REST API.

## Features

- Add, list and delete expenses from the browser.
- Show total spending and the number of recorded expenses.
- Categorize expenses (Food, Travel, Shopping, Bills, Health, Education or Other).
- Validate non-empty descriptions and positive finite amounts.
- Persist records in a local JSON file across application restarts.
- Health endpoint at `/health`.
- Automated API tests using Node's built-in test runner.

## Requirements

Node.js 22 or later.

## Run locally

```bash
npm start
```

Open http://localhost:3000 in your browser.

By default, records are saved to `data/expenses.json`. Set `EXPENSES_FILE` to choose another file location. The `data/` directory is ignored by Git so personal records are not committed.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Create an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |
| GET | `/health` | Health check |
| GET | `/` | Browser interface |

Example request:

```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Groceries","amount":450,"category":"Food"}'
```

## Test

```bash
npm test
```

Tests cover the browser route, health endpoint, expense creation/listing, input validation, deletion and persistence to the configured data file.

## Architecture and limitations

The application uses Node.js built-in HTTP, filesystem and test modules; no third-party runtime dependencies are required. The JSON file is suitable for a local learning/demo application, not concurrent multi-user or production financial workloads. A database such as PostgreSQL or MySQL, authentication, authorization, backups, audit history, and deployment hardening are future enhancements.

Do not store real financial or personal information in a publicly hosted demo.

## CI evidence

GitHub Actions runs the Node.js test suite on pushes and pull requests. The latest workflow status is shown by the badge at the top of this README. Successful automated tests demonstrate the tested application behavior; they are not evidence of a production deployment.
