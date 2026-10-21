import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
const url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_SECRET_KEY;
if (
  process.env.TPPLAY_ALLOW_TEST_SEED !== "true" ||
  process.env.VERCEL_ENV === "production" ||
  url?.includes("rrlhmjaixdzpxodfofib") ||
  !url ||
  !key
)
  throw Error(
    "Seed bloqueado: requiere un proyecto de prueba separado, claves privadas y TPPLAY_ALLOW_TEST_SEED=true.",
  );
const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const suffix = randomBytes(5).toString("hex"),
  accounts = [];
for (const role of ["student", "teacher", "institution_admin", "admin"]) {
  const password = randomBytes(24).toString("base64url"),
    email = `tpplay-${role}-${suffix}@example.test`;
  const r = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: "Prueba",
      last_name: role,
      initial_role: role === "teacher" ? "teacher" : "student",
      terms_version: "2026-10",
    },
  });
  if (r.error)
    throw Error(
      "No pudimos crear la cuenta de prueba; revisa el proyecto aislado.",
    );
  if (!["student", "teacher"].includes(role)) {
    const p = await db
      .from("profiles")
      .update({ role })
      .eq("id", r.data.user.id);
    if (p.error) throw Error("No pudimos asignar el rol de prueba.");
  }
  accounts.push({ id: r.data.user.id, email, password, role });
}
mkdirSync("work", { recursive: true });
writeFileSync(
  "work/identity-test-accounts.local.json",
  JSON.stringify(accounts, null, 2),
  { mode: 0o600 },
);
console.log(
  "Cuatro cuentas creadas en el proyecto aislado. Credenciales guardadas en work/identity-test-accounts.local.json; no publicarlas.",
);
