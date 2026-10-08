import { randomBytes, scryptSync } from 'node:crypto';
import { writeFileSync, existsSync } from 'node:fs';
let input=''; for await (const chunk of process.stdin) input+=chunk;
const password=input.trim(); if(password.length<8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
if(existsSync('.env.local')) throw new Error('Ya existe .env.local. Conserva sus valores y configura el acceso manualmente.');
const salt=randomBytes(16).toString('hex');
writeFileSync('.env.local', `ADMIN_USER=admin\nADMIN_PASSWORD_HASH=${salt}:${scryptSync(password,salt,64).toString('hex')}\nADMIN_SESSION_SECRET=${randomBytes(32).toString('hex')}\n`,{mode:0o600});
console.log('Usuario admin configurado en .env.local; archivo excluido de Git.');
