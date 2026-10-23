import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "../src/accounts/model.js";
import {
  validateRoster,
  type RosterStudent,
} from "../src/accounts/rosterValidation.js";
import { demand, uuid, LearningError } from "./learningDomain.js";
import { readAcademic } from "./academics.js";
export async function rosterAssignment(
  db: SupabaseClient,
  actor: Profile,
  id: unknown,
) {
  demand(
    ["teacher", "admin"].includes(actor.role),
    "Acceso reservado a docentes.",
    403,
  );
  const a = await readAcademic(
    db
      .from("teaching_assignments")
      .select("*,class_groups(*)")
      .eq("id", uuid(id))
      .maybeSingle(),
  );
  demand(
    a &&
      a.status === "approved" &&
      (actor.role === "admin" || a.teacher_id === actor.id),
    "Selecciona una asignatura y curso validados de tu cuenta.",
    403,
  );
  return a;
}
async function existing(db: SupabaseClient, email: string) {
  return await readAcademic(
    db
      .from("profiles")
      .select("id,role,school_id,active,onboarding_required")
      .ilike("email", email.replace(/[\\%_]/g, "\\$&"))
      .maybeSingle(),
  );
}
export async function checkRoster(
  db: SupabaseClient,
  school: string,
  input: unknown,
) {
  const result = validateRoster(input);
  if (result.errors.length) return { ...result, existing: 0 };
  let count = 0;
  for (let i = 0; i < result.students.length; i += 10) {
    await Promise.all(
      result.students.slice(i, i + 10).map(async (row) => {
        const p = await existing(db, row.email);
        if (p) {
          if (p.role !== "student" || !p.active || p.school_id !== school)
            result.errors.push(
              `Fila ${row.row}: ese correo no se puede incorporar a este curso. Solicita revisión a administración.`,
            );
          else count++;
        }
      }),
    );
  }
  return { ...result, existing: count };
}
export function mailFailure(error: {
  code?: string;
  message?: string;
  status?: number;
}) {
  const text = (error.message || "").toLowerCase();
  if (error.status === 429 || /rate|limit|quota/.test(text))
    return "El proveedor de correo alcanzó su límite de envíos. Espera a que se restablezca la cuota y reintenta; la lista quedó guardada.";
  if (/smtp|email.*send|sending|mailer/.test(text))
    return "El proveedor no pudo enviar la invitación. Revisa el SMTP y la cuota de correo en Supabase antes de reintentar.";
  if (/already|registered|exists/.test(text))
    return "El correo ya tiene una cuenta. Reintenta para comprobar su matrícula sin cambiar su contraseña.";
  return "No se pudo completar la invitación. Comprueba el registro de Auth de Supabase y vuelve a intentar; no se modificó la contraseña de ninguna cuenta existente.";
}
export async function rosterAction(
  db: SupabaseClient,
  actor: Profile,
  action: string | null,
  b: Record<string, unknown>,
  params: URLSearchParams,
  origin: string,
) {
  if (
    ![
      "rosterPreview",
      "rosterCreate",
      "rosterProcess",
      "rosterRetry",
      "rosterStatus",
      "rosterHistory",
    ].includes(action || "")
  )
    return null;
  if (action === "rosterHistory") {
    const a = await rosterAssignment(db, actor, params.get("assignment"));
    return {
      imports: await readAcademic(
        db
          .from("roster_imports")
          .select("id,created_at")
          .eq("teacher_id", actor.id)
          .eq("assignment_id", a.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ),
    };
  }
  if (action === "rosterPreview" || action === "rosterCreate") {
    const a = await rosterAssignment(db, actor, b.assignment);
    const checked = await checkRoster(db, a.class_groups.school_id, b.rows);
    if (action === "rosterPreview") return checked;
    demand(!checked.errors.length, checked.errors.join(" "));
    const id = uuid(b.id),
      fingerprint = createHash("sha256")
        .update(JSON.stringify(checked.students))
        .digest("hex");
    const prior = await readAcademic(
      db.from("roster_imports").select("*").eq("id", id).maybeSingle(),
    );
    if (prior)
      demand(
        prior.teacher_id === actor.id &&
          prior.assignment_id === a.id &&
          prior.fingerprint === fingerprint,
        "La carga ya existe con otros datos.",
        409,
      );
    else {
      const recent = await readAcademic(
        db
          .from("roster_imports")
          .select("id")
          .eq("teacher_id", actor.id)
          .gte("created_at", new Date(Date.now() - 86400000).toISOString())
          .limit(6),
      );
      demand(
        (recent || []).length < 5,
        "Alcanzaste el límite de cinco cargas diarias. Puedes continuar las ya registradas.",
        429,
      );
      await readAcademic(
        db
          .from("roster_imports")
          .upsert(
            { id, teacher_id: actor.id, assignment_id: a.id, fingerprint },
            { onConflict: "id", ignoreDuplicates: true },
          ),
      );
    }
    const saved = await readAcademic(
      db.from("roster_imports").select("*").eq("id", id).maybeSingle(),
    );
    demand(
      saved &&
        saved.teacher_id === actor.id &&
        saved.assignment_id === a.id &&
        saved.fingerprint === fingerprint,
      "La carga ya existe con otros datos.",
      409,
    );
    await readAcademic(
      db.from("roster_import_rows").upsert(
        checked.students.map((r, i) => ({
          import_id: id,
          position: i + 1,
          first_name: r.first_name,
          last_name: r.last_name,
          email: r.email,
        })),
        { onConflict: "import_id,position", ignoreDuplicates: true },
      ),
    );
    return { id };
  }
  const id = uuid(action === "rosterStatus" ? params.get("id") : b.id);
  const batch = await readAcademic(
    db.from("roster_imports").select("*").eq("id", id).maybeSingle(),
  );
  demand(
    batch && (batch.teacher_id === actor.id || actor.role === "admin"),
    "Carga no disponible.",
    403,
  );
  const a = await rosterAssignment(db, actor, batch.assignment_id);
  if (action === "rosterRetry") {
    await readAcademic(
      db
        .from("roster_import_rows")
        .update({ status: "pending", message: "" })
        .eq("import_id", id)
        .eq("status", "error"),
    );
    return { ok: true };
  }
  if (action === "rosterProcess") {
    const claimed = await readAcademic(
      db.rpc("claim_roster_row", { p_import: id }),
    );
    const row = claimed?.[0];
    if (!row) return { processed: false };
    try {
      let p = await existing(db, row.email),
        invited = false;
      if (!p) {
        const invitation = await db.auth.admin.inviteUserByEmail(row.email, {
          redirectTo: origin + "/cuenta/activar",
          data: {
            first_name: row.first_name,
            last_name: row.last_name,
            initial_role: "student",
            registration_source: "teacher_excel",
            academic_setup: {
              school_id: a.class_groups.school_id,
              year: a.class_groups.school_year,
              pairs: [{ group_id: a.group_id, subject_id: a.subject_id }],
            },
          },
        });
        if (invitation.error)
          throw new LearningError(mailFailure(invitation.error), 503);
        p = await existing(db, row.email);
        invited = true;
      }
      demand(
        p &&
          p.role === "student" &&
          p.active &&
          p.school_id === a.class_groups.school_id,
        "El correo requiere revisión de administración.",
        403,
      );
      await readAcademic(
        db.rpc("finish_roster_row", {
          p_row: row.id,
          p_lease: row.lease,
          p_student: p.id,
          p_invited: invited,
        }),
      );
    } catch (error) {
      await readAcademic(
        db
          .from("roster_import_rows")
          .update({
            status: "error",
            message:
              error instanceof LearningError
                ? error.message
                : "No se pudo guardar la matrícula. Reintenta para recuperar la cuenta creada sin volver a invitarla.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("lease", row.lease)
          .eq("status", "processing"),
      );
    }
    return { processed: true };
  }
  const rows = await readAcademic(
    db
      .from("roster_import_rows")
      .select("position,first_name,last_name,email,status,message,updated_at")
      .eq("import_id", id)
      .order("position"),
  );
  return {
    id,
    assignment: batch.assignment_id,
    created_at: batch.created_at,
    rows,
  };
}
