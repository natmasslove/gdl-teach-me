// Publish only reviewed learning materials, never the repository root.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.resolve(root, 'site-output');
if (fs.existsSync(output)) throw new Error('site-output already exists; choose a clean checkout.');
fs.mkdirSync(output);
const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function write(relative, text) {
  const target = path.join(output, relative);
  fs.mkdirSync(path.dirname(target), {recursive:true});
  fs.writeFileSync(target, text);
}
function rewrite(text) {
  return text.replaceAll('../README.md','../index.html')
    .replaceAll('../RESOURCES.md','../sources.html')
    .replaceAll('../research/characters-basic-facts.md','../characters.html');
}
const allowed = {atlas:['index.html','style.css','atlas.js','land.js'], assets:['course.css']};
for (const folder of ['lessons','reference']) allowed[folder] = fs.readdirSync(path.join(root,folder)).filter(name=>name.endsWith('.html'));
allowed.input = fs.readdirSync(path.join(root,'input')).filter(name=>name.endsWith('.png'));
for (const [folder, files] of Object.entries(allowed)) for (const name of files) {
  const relative = folder+'/'+name;
  const data = fs.readFileSync(path.join(root,relative));
  if (name.endsWith('.html')) write(relative,rewrite(data.toString('utf8')));
  else { const target=path.join(output,relative); fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,data); }
}
for (const [source, destination, title] of [
  ['RESOURCES.md','sources.html','Источники'],
  ['research/characters-basic-facts.md','characters.html','Базовые сведения о персонажах']
]) {
  const text = escape(fs.readFileSync(path.join(root,source),'utf8')).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2">$1</a>');
  write(destination,`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="assets/course.css"><body><a href="index.html">← Главная</a><h1>${title}</h1><div style="white-space:pre-wrap;overflow-wrap:anywhere">${text}</div></body></html>`);
}
write('index.html','<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>История ВКЛ</title><link rel="stylesheet" href="assets/course.css"><body><h1>История Великого княжества Литовского</h1><p>Учебные материалы через персонажей подарочной колоды.</p><ul><li><a href="atlas/index.html">Исторический атлас: ВКЛ на карте Европы</a></li><li><a href="lessons/index.html">12 уроков по персонажам</a></li><li><a href="sources.html">Источники</a></li><li><a href="characters.html">Базовые сведения о персонажах</a></li></ul></body></html>');
const publicFiles=[];
function inspect(folder) { for(const entry of fs.readdirSync(folder,{withFileTypes:true})) {const file=path.join(folder,entry.name);if(entry.isDirectory())inspect(file);else{publicFiles.push(path.relative(output,file));if(file.endsWith('.html'))for(const match of fs.readFileSync(file,'utf8').matchAll(/(?:href|src)="([^"]+)"/g)){const ref=match[1];if(/^(https?:|#)/.test(ref))continue;const target=path.resolve(path.dirname(file),decodeURIComponent(ref.split('#')[0]));if(!target.startsWith(output+path.sep)||!fs.existsSync(target))throw new Error(`Broken public link: ${file} -> ${ref}`);}}}}
inspect(output);
console.log(`Verified ${publicFiles.length} public files and all local HTML links.`);
console.log(publicFiles.join('\n'));
