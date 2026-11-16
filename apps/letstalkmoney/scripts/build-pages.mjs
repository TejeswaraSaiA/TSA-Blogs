import {build} from 'esbuild';import{mkdir,writeFile,cp}from'node:fs/promises';
await mkdir('dist/pages',{recursive:true});
await build({entryPoints:['src/main.tsx'],bundle:true,outfile:'dist/pages/app.js',format:'esm',minify:true,target:'es2022',define:{'import.meta.env.DEV':'false','process.env.NODE_ENV':'"production"'}});
await writeFile('dist/pages/index.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#183f35"><link rel="icon" type="image/svg+xml" href="./favicon.svg"><link rel="icon" href="./favicon.ico" sizes="any"><link rel="apple-touch-icon" href="./apple-touch-icon.png"><link rel="manifest" href="./site.webmanifest"><title>Let’s Talk Money — Shared expenses, simplified</title><meta name="description" content="Good friends. Clear balances. Your private shared expense workspace."><link rel="stylesheet" href="./app.css"></head><body><div id="root"></div><script type="module" src="./app.js"></script></body></html>');

await cp('public','dist/pages',{recursive:true});
