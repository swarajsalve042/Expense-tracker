const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

function reply(res, status, data) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readExpenses(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function createServer({ dataFile = process.env.EXPENSES_FILE || path.join(__dirname, 'data', 'expenses.json') } = {}) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  let expenses = readExpenses(dataFile);
  let nextId = expenses.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;

  function persist() {
    const temporaryFile = dataFile + '.tmp';
    fs.writeFileSync(temporaryFile, JSON.stringify(expenses, null, 2), { mode: 0o600 });
    fs.renameSync(temporaryFile, dataFile);
  }

  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/health') {
      return reply(res, 200, { status: 'ok' });
    }
    if (req.method === 'GET' && url.pathname === '/api/expenses') {
      return reply(res, 200, expenses);
    }
    if (req.method === 'POST' && url.pathname === '/api/expenses') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 16_384) {
          reply(res, 413, { error: 'request body too large' });
          req.destroy();
        }
      });
      req.on('end', () => {
        if (res.writableEnded) return;
        try {
          const input = JSON.parse(body);
          const amount = Number(input.amount);
          if (typeof input.title !== 'string' || !input.title.trim() ||
              !Number.isFinite(amount) || amount <= 0) {
            return reply(res, 400, { error: 'title and positive amount required' });
          }
          const item = {
            id: nextId++,
            title: input.title.trim().slice(0, 120),
            amount,
            category: typeof input.category === 'string' && input.category.trim()
              ? input.category.trim().slice(0, 40) : 'Other'
          };
          expenses.push(item);
          persist();
          return reply(res, 201, item);
        } catch (error) {
          if (error instanceof SyntaxError) return reply(res, 400, { error: 'invalid JSON' });
          return reply(res, 500, { error: 'could not save expense' });
        }
      });
      return;
    }
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/expenses/')) {
      const idText = url.pathname.split('/').pop();
      if (!/^\\d+$/.test(idText)) return reply(res, 400, { error: 'invalid expense ID' });
      const id = Number(idText);
      const index = expenses.findIndex(item => item.id === id);
      if (index < 0) return reply(res, 404, { error: 'not found' });
      const [removed] = expenses.splice(index, 1);
      try {
        persist();
        return reply(res, 200, { deleted: true, expense: removed });
      } catch {
        expenses.splice(index, 0, removed);
        return reply(res, 500, { error: 'could not save expense deletion' });
      }
    }
    return reply(res, 404, { error: 'not found' });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createServer().listen(port, () => console.log('Expense tracker listening on ' + port));
}

module.exports = { createServer };
