import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
test('administrator contact does not require or create a student profile; client metadata cannot bypass registration',async()=>{
 const db=new PGlite();try{
 await db.exec("create schema auth;create role anon;create role authenticated;create role service_role bypassrls;create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null default '{}',raw_app_meta_data jsonb not null default '{}');create function auth.uid() returns uuid language sql as $$select null::uuid$$;");
 for(const file of ['001_learning.sql','004_admin_recovery.sql','005_admin_profile.sql'])await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
 await db.exec("insert into auth.users(id,raw_app_meta_data) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{\"tpplay_admin_contact\":true}');");
 assert.equal((await db.query('select * from profiles')).rows.length,0);
 await assert.rejects(db.exec("insert into auth.users(id,raw_user_meta_data) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','{\"tpplay_admin_contact\":true}');"));
 await db.exec("insert into admin_recovery(id,pending_auth_user_id,display_name) values('primary','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Docente');set role authenticated;");
 await assert.rejects(db.exec("select * from admin_recovery"));
 }finally{await db.close();}
});
