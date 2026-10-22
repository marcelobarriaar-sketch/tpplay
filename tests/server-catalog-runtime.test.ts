import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
test('deployed mission catalog imports in plain Node ESM without tsx or Vite resolution',()=>{
 const dir=mkdtempSync(join(tmpdir(),'tpplay-runtime-'));
 try{
  writeFileSync(join(dir,'package.json'),JSON.stringify({type:'module'}));
  for(const file of ['src/data.ts','src/administrationCurriculum.ts','src/normativeReferences.ts','src/games/inicio/content.ts']){
   const target=join(dir,file.replace(/\.ts$/,'.js'));mkdirSync(dirname(target),{recursive:true});
   writeFileSync(target,ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
  }
  const script=`const {missions}=await import(${JSON.stringify(pathToFileURL(join(dir,'src/data.js')).href)});if(!missions.some(m=>m.slug==='inicio-actividades'))throw new Error('Missing Camila');console.log('catalog-loaded');`;
  assert.match(execFileSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8'}),/catalog-loaded/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
