import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import { createSession, readSession, verifyPassword } from '../server/admin';
test('password hash rejects incorrect and malformed credentials',()=>{const hash='test-salt:'+scryptSync('a-test-password','test-salt',64).toString('hex');assert.equal(verifyPassword('a-test-password',hash),true);assert.equal(verifyPassword('incorrect',hash),false);assert.equal(verifyPassword('anything','invalid'),false);});
test('admin session rejects tampering, expiry, another user and another secret',()=>{const secret='a'.repeat(64);const token=createSession('admin',secret,1000);assert.equal(readSession(token,secret,'admin',2000),true);assert.equal(readSession(token+'x',secret,'admin',2000),false);assert.equal(readSession(token,secret,'admin',3601001),false);assert.equal(readSession(token,secret,'other',2000),false);assert.equal(readSession(token,'b'.repeat(64),'admin',2000),false);});
