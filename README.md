# Expense Tracker Web Application

[![CI](https://github.com/swarajsalve042/Expense-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/swarajsalve042/Expense-tracker/actions/workflows/ci.yml)

Dependency-free Node.js REST API for recording expenses.

## Features
- Add and list expense records.
- Delete an expense by ID.
- Validate non-empty titles and positive amounts.
- Health endpoint at `/health`.
- Automated API tests using Node's built-in test runner.

## Requirements
Node.js 22 or later.

## Run
`npm start`

Endpoints:
- `GET /api/expenses`
- `POST /api/expenses`
- `DELETE /api/expenses/:id`
- `GET /health`

## Test
`npm test`

## Scope
This API uses in-memory storage; records reset when the process restarts. Browser UI, accounts, persistent database, budgets and charts are future enhancements.