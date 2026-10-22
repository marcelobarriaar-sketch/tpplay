import {createClient} from '@supabase/supabase-js';
export function recoveryClient(){const url=process.env.SUPABASE_URL;const key=process.env.SUPABASE_SECRET_KEY;if(!url||!key)throw new Error('Recuperación no configurada.');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
export function canRecoverAdmin(user:{id:string;email_confirmed_at?:string;email?:string}|null,linkedId:string){return !!user?.email_confirmed_at&&!!user.email&&user.id===linkedId;}
export async function recoveryIdentity(token:unknown){if(typeof token!=='string'||token.length>8000)throw new Error('Sesión inválida.');const db=recoveryClient();const {data,error}=await db.auth.getUser(token);if(error||!data.user?.email_confirmed_at||!data.user.email)throw new Error('Verifica tu correo e ingresa a tu cuenta.');return {db,user:data.user};}
export async function recoveryEmail(){try{const db=recoveryClient();const {data,error}=await db.from('admin_recovery').select('auth_user_id').eq('id','primary').maybeSingle();if(error)throw error;if(!data)return null;const identity=await db.auth.admin.getUserById(data.auth_user_id);return identity.error?null:identity.data.user.email||null;}catch{return null;}}

export async function adminProfile(){const db=recoveryClient();const {data,error}=await db.from('admin_recovery').select('display_name,phone,auth_user_id,pending_auth_user_id').eq('id','primary').maybeSingle();if(error)throw error;let email='';const id=data?.pending_auth_user_id||data?.auth_user_id;if(id){const u=await db.auth.admin.getUserById(id);email=u.data.user?.email||'';}return {name:data?.display_name||'',phone:data?.phone||'',email,pending:!!data?.pending_auth_user_id};}
export async function saveAdminProfile(body:{name?:unknown;phone?:unknown;email?:unknown}) {
 if(typeof body.name!=='string'||body.name.trim().length<2||body.name.length>120||typeof body.phone!=='string'||body.phone.length>40||typeof body.email!=='string'||body.email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))throw new Error('Revisa tu nombre, teléfono y correo.');
 const db=recoveryClient();const email=body.email.trim().toLowerCase();const name=body.name.trim();
 const {data:current,error:readError}=await db.from('admin_recovery').select('*').eq('id','primary').maybeSingle();if(readError)throw readError;
 let target:string|undefined;
 for(let page=1;page<=20;page++){const result=await db.auth.admin.listUsers({page,perPage:100});if(result.error)throw result.error;target=result.data.users.find(u=>u.email?.toLowerCase()===email)?.id;if(target||result.data.users.length<100)break;}
 if(!target){const created=await db.auth.admin.createUser({email,email_confirm:false,app_metadata:{tpplay_admin_contact:true}});if(created.error||!created.data.user)throw new Error('No pudimos preparar el correo. Intenta nuevamente.');target=created.data.user.id;}
 const same=target===current?.auth_user_id;
 const {error}=await db.from('admin_recovery').upsert({id:'primary',auth_user_id:current?.auth_user_id||null,pending_auth_user_id:same?null:target,display_name:name,phone:body.phone.trim(),updated_at:new Date().toISOString()});if(error)throw error;
 if(!same){const origin=process.env.TPPLAY_APP_ORIGIN;if(!origin)throw new Error('No está configurada la dirección del sitio.');const sent=await db.auth.resetPasswordForEmail(email,{redirectTo:origin+'/cuenta/recuperar'});if(sent.error)throw new Error('Tus datos quedaron guardados, pero no pudimos enviar el enlace. Vuelve a guardar para reintentar.');}
 return {name,phone:body.phone.trim(),email,pending:!same};
}
