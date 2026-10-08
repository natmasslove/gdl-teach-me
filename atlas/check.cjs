const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const nodes = new Map();
function node(id) { if (!nodes.has(id)) nodes.set(id, {innerHTML:'',textContent:'',value:0,checked:true,disabled:false,setAttribute(){},addEventListener(){}}); return nodes.get(id); }
const context = vm.createContext({ document:{getElementById:node}, console });
vm.runInContext(fs.readFileSync(__dirname+'/land.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/atlas.js','utf8'),context);
assert.equal(vm.runInContext('stages.length',context),10);
for(let i=0;i<10;i++) {
  vm.runInContext(`render(${i})`,context);
  assert.ok(node('regional').innerHTML.includes('<path'));
  assert.ok(node('europe').innerHTML.includes('<path'));
  assert.ok(!/NaN|undefined/.test(node('regional').innerHTML));
  assert.ok(node('heading').textContent.length>5);
  assert.equal(node('previous').disabled,i===0);
  assert.equal(node('next').disabled,i===9);
}
vm.runInContext('render(0)',context);
const first = node('regional').innerHTML;
vm.runInContext('render(3)',context);
assert.notEqual(node('regional').innerHTML,first);
vm.runInContext('render(9)',context);
assert.ok(!node('regional').innerHTML.includes('class="territory"'));
console.log('PASS: 10 stages, both maps, navigation limits, territory changes, end of statehood.');
