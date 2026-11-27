const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createServer } = require('./server');

async function withServer(t, run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'expense-tracker-'));
  const dataFile = path.join(directory, 'expenses.json');
  const server = createServer({ dataFile }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  await run('http://127.0.0.1:' + server.address().port, dataFile);
}

test('health endpoint responds', async t => {
  await withServer(t, async base => {
    const response = await fetch(base + '/health');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });
});

test('creates, lists and persists expenses to disk', async t => {
  await withServer(t, async (base, dataFile) => {
    const response = await fetch(base + '/api/expenses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '  Travel  ', amount: 250 })
    });
    assert.equal(response.status, 201);
    const created = await response.json();
    assert.equal(created.title, 'Travel');
    assert.equal(created.amount, 250);
    assert.equal(created.category, 'Other');
    assert.ok(Number.isInteger(created.id));
    assert.deepEqual(JSON.parse(fs.readFileSync(dataFile, 'utf8')), [created]);
    assert.deepEqual(await (await fetch(base + '/api/expenses')).json(), [created]);
  });
});

test('rejects invalid expense values and malformed JSON', async t => {
  await withServer(t, async base => {
    for (const body of [
      { title: ' ', amount: 10 }, { title: 'Bad', amount: 0 },
      { title: 'Bad', amount: -3 }, { title: 'Bad', amount: 'not-a-number' },
      { title: 'Bad', amount: 'Infinity' }
    ]) {
      const response = await fetch(base + '/api/expenses', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
      });
      assert.equal(response.status, 400);
    }
    const malformed = await fetch(base + '/api/expenses', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{'
    });
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { error: 'invalid JSON' });
    assert.deepEqual(await (await fetch(base + '/api/expenses')).json(), []);
  });
});

test('deletes an expense from both API and persistent storage', async t => {
  await withServer(t, async (base, dataFile) => {
    const response = await fetch(base + '/api/expenses', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Books', amount: 500 })
    });
    const item = await response.json();
    const deleted = await fetch(base + '/api/expenses/' + item.id, { method: 'DELETE' });
    assert.equal(deleted.status, 200);
    assert.deepEqual(await deleted.json(), { deleted: true, expense: item });
    assert.deepEqual(JSON.parse(fs.readFileSync(dataFile, 'utf8')), []);
    const missing = await fetch(base + '/api/expenses/' + item.id, { method: 'DELETE' });
    assert.equal(missing.status, 404);
  });
});

test('rejects malformed expense IDs', async t => {
  await withServer(t, async base => {
    const response = await fetch(base + '/api/expenses/not-an-id', { method: 'DELETE' });
    assert.equal(response.status, 400);
  });
});
