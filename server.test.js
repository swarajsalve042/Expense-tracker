const test=require('node:test');
const assert=require('node:assert/strict');
const {createServer,expenses}=require('./server');

async function withServer(t, run) {
  const server=createServer().listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  await run('http://127.0.0.1:'+server.address().port);
}

test('health endpoint responds',async(t)=>{
  await withServer(t,async base=>{
    const response=await fetch(base+'/health');
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{status:'ok'});
  });
});

test('expense creation trims title, applies category default and lists records',async(t)=>{
  expenses.length=0;
  await withServer(t,async base=>{
    const response=await fetch(base+'/api/expenses',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:'  Travel  ',amount:250})});
    assert.equal(response.status,201);
    assert.deepEqual(await response.json(),{id:1,title:'Travel',amount:250,category:'Other'});
    const list=await fetch(base+'/api/expenses');
    assert.equal((await list.json()).length,1);
  });
});

test('rejects empty titles, non-positive amounts and malformed JSON',async(t)=>{
  expenses.length=0;
  await withServer(t,async base=>{
    for(const body of [{title:' ',amount:10},{title:'Bad',amount:0},{title:'Bad',amount:-3},{title:'Bad',amount:'not-a-number'}]){
      const response=await fetch(base+'/api/expenses',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      assert.equal(response.status,400);
    }
    const malformed=await fetch(base+'/api/expenses',{method:'POST',headers:{'content-type':'application/json'},body:'{'});
    assert.equal(malformed.status,400);
    assert.deepEqual(await malformed.json(),{error:'invalid JSON'});
    assert.equal(expenses.length,0);
  });
});

test('deletes an existing expense and returns 404 for an unknown ID',async(t)=>{
  expenses.length=0;
  await withServer(t,async base=>{
    const created=await fetch(base+'/api/expenses',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:'Books',amount:500})});
    assert.equal(created.status,201);
    const item=await created.json();
    const deleted=await fetch(base+'/api/expenses/'+item.id,{method:'DELETE'});
    assert.equal(deleted.status,200);
    assert.deepEqual(await deleted.json(),{deleted:true});
    const missing=await fetch(base+'/api/expenses/'+item.id,{method:'DELETE'});
    assert.equal(missing.status,404);
    assert.deepEqual(await missing.json(),{error:'not found'});
    assert.equal((await (await fetch(base+'/api/expenses')).json()).length,0);
  });
});
