import {build} from 'esbuild';
import {readFile,mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await build({entryPoints:['src/main.tsx'],bundle:true,outfile:'dist/client/app.js',format:'esm',minify:true,target:'es2022',define:{'import.meta.env.DEV':'false','process.env.NODE_ENV':'"production"'}});
const js=await readFile('dist/client/app.js','utf8'),css=await readFile('dist/client/app.css','utf8');
await build({entryPoints:['worker/index.ts'],bundle:true,outfile:'dist/server/index.js',format:'esm',platform:'browser',target:'es2022',minify:true,define:{'__APP_JS__':JSON.stringify(js),'__APP_CSS__':JSON.stringify(css),'import.meta.env.DEV':'false'}});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built React UI and authenticated storage-backed Worker.');
