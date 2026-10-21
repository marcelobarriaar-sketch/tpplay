import { Client } from "pg";
const email = process.argv[2];
if (
  !email ||
  !process.env.DATABASE_URL ||
  process.env.TPPLAY_BOOTSTRAP_ADMIN !== "true"
)
  throw Error(
    "Requiere correo del responsable, DATABASE_URL privado y TPPLAY_BOOTSTRAP_ADMIN=true.",
  );
const db = new Client({ connectionString: process.env.DATABASE_URL });
try {
  await db.connect();
  await db.query("begin");
  await db.query(
    "select pg_advisory_xact_lock(hashtextextended('tpplay-admin-accounts',0))",
  );
  if (
    (
      await db.query(
        "select 1 from profiles where role='admin' and status='active' limit 1",
      )
    ).rowCount
  )
    throw Error(
      "Ya existe un administrador activo. Usa su panel y reautenticación para cambios posteriores.",
    );
  const r = await db.query(
    "select id,email,raw_user_meta_data from auth.users where lower(email)=lower($1) and email_confirmed_at is not null",
    [email],
  );
  if (r.rowCount !== 1)
    throw Error(
      "Debe existir una única cuenta con ese correo verificado. Regístrala y verifica el correo primero.",
    );
  const u = r.rows[0],
    first = String(
      u.raw_user_meta_data.first_name ||
        u.raw_user_meta_data.name ||
        "Responsable",
    ).slice(0, 60),
    last = String(u.raw_user_meta_data.last_name || "TP PLAY").slice(0, 60);
  await db.query(
    "insert into profiles(id,name,first_name,last_name,email,email_verified,role,status,active) values($1,$2,$3,$4,$5,true,'admin','active',true) on conflict(id) do update set role='admin',status='active',active=true",
    [u.id, first + " " + last, first, last, u.email],
  );
  await db.query(
    "insert into audit(actor_id,action,target_id,details) values($1,'identity.bootstrap',$1::text,'{\"method\":\"private_operator_script\"}')",
    [u.id],
  );
  await db.query("commit");
  console.log(
    "Primer administrador confirmado y registrado en auditoría. Ingresa nuevamente para abrir /admin.",
  );
} catch (e) {
  await db.query("rollback").catch(() => {});
  console.error(
    e.message.startsWith("Ya existe") || e.message.startsWith("Debe existir")
      ? e.message
      : "No se completó el bootstrap. Revisa conexión y migraciones sin publicar credenciales.",
  );
  process.exitCode = 1;
} finally {
  await db.end();
}
