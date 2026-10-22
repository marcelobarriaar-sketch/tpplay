import { createHash, randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "../src/accounts/model.js";
import { replayLocalCoihue } from "./coihueImport.js";
import { contentVersion } from "../src/games/coihue/content.js";
import { missions } from "../src/data.js";
import { demand, text, uuid, LearningError } from "./learningDomain.js";
import {
  freshAttempt,
  importAttempt,
  missionFor,
  reduceMission,
  scoreAttempt,
  type MissionEvent,
} from "./missionDomain.js";
import type { Attempt } from "../src/progress.js";
async function read<T>(q: PromiseLike<{ data: T; error: unknown }>) {
  const r = await q;
  if (r.error)
    throw new LearningError(
      "No pudimos consultar o guardar tus datos. Reintenta.",
      503,
    );
  return r.data;
}
export async function identityAction(
  db: SupabaseClient,
  actor: Profile,
  action: string | null,
  b: Record<string, unknown>,
  params: URLSearchParams,
) {
  const available = [
    "identityProfile",
    "dashboard",
    "mission",
    "missionEvent",
    "importLocal",
    "adminUsers",
    "adminIdentity",
    "institution",
    "roleAccess",
  ];
  if (!available.includes(action || "")) return null;
  const privileged = () =>
    demand(
      actor.role === "admin",
      "No tienes permiso para administrar cuentas.",
      403,
    );
  if (
    [
      "identityProfile",
      "missionEvent",
      "importLocal",
      "adminIdentity",
    ].includes(action!)
  ) {
    const allowed = await read(
      db.rpc("consume_limit", {
        p_bucket: `identity:${actor.id}`,
        p_max: 120,
        p_seconds: 60,
      }),
    );
    demand(
      allowed,
      "Has realizado demasiadas solicitudes. Espera un minuto.",
      429,
    );
  }
  if (action === "identityProfile") {
    demand(
      Object.keys(b).every((k) => ["first_name", "last_name"].includes(k)),
      "No puedes modificar permisos ni estadísticas.",
      403,
    );
    const first = text(b.first_name, 60, 2),
      last = text(b.last_name, 60, 2);
    await read(
      db
        .from("profiles")
        .update({
          first_name: first,
          last_name: last,
          name: first + " " + last,
        })
        .eq("id", actor.id),
    );
    return { ok: true };
  }
  if (action === "roleAccess") {
    const roles: Record<string, string[]> = {
      account: ["student", "teacher", "institution_admin", "admin"],
      student: ["student"],
      teacher: ["teacher", "admin"],
      institution: ["institution_admin", "admin"],
      admin: ["admin"],
    };
    demand(
      roles[params.get("role") || ""]?.includes(actor.role),
      "No tienes permiso para acceder a este espacio.",
      403,
    );
    return { ok: true };
  }
  if (action === "institution") {
    demand(
      ["institution_admin", "admin"].includes(actor.role),
      "Acceso institucional no autorizado.",
      403,
    );
    const institution = actor.school_id
      ? await read(
          db
            .from("schools")
            .select("id,name")
            .eq("id", actor.school_id)
            .maybeSingle(),
        )
      : null;
    return { institution };
  }
  if (action === "dashboard") {
    demand(
      actor.role === "student",
      "Este progreso corresponde a estudiantes.",
      403,
    );
    const [progress, attempts, xp, achievements, catalog, imports] =
      await Promise.all([
        read(
          db
            .from("mission_progress")
            .select("*")
            .eq("student_id", actor.id)
            .order("last_activity_at", { ascending: false }),
        ),
        read(
          db
            .from("mission_attempts")
            .select(
              "id,mission_id,state,revision,last_activity_at,completed_at",
            )
            .eq("student_id", actor.id)
            .order("last_activity_at", { ascending: false })
            .limit(100),
        ),
        read(db.from("xp_events").select("amount").eq("student_id", actor.id)),
        read(
          db.from("user_achievements").select("*").eq("student_id", actor.id),
        ),
        read(db.from("achievements").select("*").eq("active", true)),
        read(
          db
            .from("local_imports")
            .select("source,source_id")
            .eq("student_id", actor.id),
        ),
      ]);
    return {
      progress,
      attempts,
      xp: (xp || []).reduce((n, r) => n + r.amount, 0),
      achievements: (achievements || []).map((a) => ({
        ...a,
        ...catalog?.find((c) => c.code === a.achievement_code),
      })),
      imports,
      totalMissions: missions.length + 7,
    };
  }
  if (
    action === "mission" ||
    action === "missionEvent" ||
    action === "importLocal"
  ) {
    demand(
      actor.role === "student",
      "Se necesita una cuenta de estudiante.",
      403,
    );
    demand(
      !b.userId &&
        !b.user_id &&
        !b.student_id &&
        !("xp" in b) &&
        !("xpEarned" in b) &&
        !b.role &&
        !params.get("user"),
      "No puedes modificar identidad, XP ni progreso ajeno.",
      403,
    );
    if (action === "mission") {
      const id = params.get("id");
      const m = params.get("mission");
      let q = db
        .from("mission_attempts")
        .select("state,revision,score")
        .eq("student_id", actor.id);
      if (id) q = q.eq("id", uuid(id));
      else {
        missionFor(m);
        q = q.eq("mission_id", m).is("completed_at", null);
      }
      const saved = await read(q.maybeSingle());
      if (saved) {
        const progress = await read(
          db
            .from("mission_progress")
            .select("xp_earned,attempts")
            .eq("student_id", actor.id)
            .eq("mission_id", saved.state.missionSlug)
            .maybeSingle(),
        );
        return {
          ...saved,
          xpEarned: progress?.xp_earned || 0,
          attempts: progress?.attempts || 1,
        };
      }
      return { state: null, revision: 0 };
    }
    if (action === "importLocal") {
      if (b.source === "coihue") {
        demand(Object.keys(b).every((k) => ["source", "state"].includes(k)));
        const old = await read(
          db
            .from("game_progress")
            .select("state,revision")
            .eq("student_id", actor.id)
            .eq("game_id", "mision-tributos")
            .maybeSingle(),
        );
        const imported = await read(
          db
            .from("local_imports")
            .select("source_id")
            .eq("student_id", actor.id)
            .eq("source", "coihue")
            .maybeSingle(),
        );
        if (imported) return { ok: true, duplicate: true };
        demand(
          !old || !old.state.started,
          "Ya existe una aventura guardada. Conservamos ambos recorridos sin sobrescribir el avance de tu cuenta.",
          409,
        );
        const reduced = replayLocalCoihue(b.state);
        await read(
          db.rpc("commit_game", {
            p_student: actor.id,
            p_game: "mision-tributos",
            p_version: contentVersion,
            p_revision: old?.revision || 0,
            p_state: reduced.state,
            p_event_id: randomUUID(),
            p_event: { type: "local_import" },
            p_details: reduced.details,
          }),
        );
        await read(
          db.from("local_imports").insert({
            student_id: actor.id,
            source: "coihue",
            source_id: "v1",
          }),
        );
        return { ok: true };
      }
      demand(
        Object.keys(b).every((k) => ["attempt"].includes(k)),
        "Campos no permitidos.",
        403,
      );
      const local = b.attempt as Attempt;
      const source = uuid(local?.id);
      const imported = await read(
        db
          .from("local_imports")
          .select("source_id")
          .eq("student_id", actor.id)
          .eq("source", "demo")
          .eq("source_id", source)
          .maybeSingle(),
      );
      if (imported) return { ok: true, duplicate: true };
      // Deterministic per-owner ID prevents claiming another student's browser attempt UUID.
      const hash = createHash("sha256")
        .update(`${actor.id}:${source}`)
        .digest("hex");
      const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
      const existing = await read(
        db
          .from("mission_attempts")
          .select("id")
          .eq("student_id", actor.id)
          .eq("id", id)
          .maybeSingle(),
      );
      if (existing) return { ok: true, duplicate: true };
      const state = importAttempt(local, id);
      const m = missionFor(state.missionSlug);
      const draft = await read(
        db
          .from("mission_attempts")
          .select("id")
          .eq("student_id", actor.id)
          .eq("mission_id", m.slug)
          .is("completed_at", null)
          .maybeSingle(),
      );
      demand(
        !draft || state.completedAt,
        "Ya tienes una misión en curso. Termínala antes de importar otro borrador.",
        409,
      );
      const saved = await read(
        db.rpc("commit_mission", {
          p_student: actor.id,
          p_id: id,
          p_mission: m.slug,
          p_version: m.version,
          p_revision: 0,
          p_state: state,
          p_score: scoreAttempt(state),
          p_steps: m.steps.length,
          p_event: randomUUID(),
          p_import: true,
        }),
      );
      await read(
        db.from("local_imports").upsert(
          { student_id: actor.id, source: "demo", source_id: source },
          {
            onConflict: "student_id,source,source_id",
            ignoreDuplicates: true,
          },
        ),
      );
      return { ...saved, ok: true };
    }
    demand(
      Object.keys(b).every((k) =>
        ["id", "mission", "event_id", "revision", "event"].includes(k),
      ),
      "No puedes enviar XP, resultados ni campos extra.",
      403,
    );
    const id = uuid(b.id),
      eventId = uuid(b.event_id);
    const m = missionFor(b.mission);
    demand(Number.isInteger(b.revision) && Number(b.revision) >= 0);
    const saved = await read(
      db
        .from("mission_attempts")
        .select("state,revision,student_id")
        .eq("id", id)
        .maybeSingle(),
    );
    demand(
      !saved || saved.student_id === actor.id,
      "Intento no disponible.",
      403,
    );
    const duplicate = await read(
      db
        .from("mission_events")
        .select("event_id")
        .eq("student_id", actor.id)
        .eq("event_id", eventId)
        .maybeSingle(),
    );
    if (duplicate) return { state: saved?.state, revision: saved?.revision };
    demand(
      (saved?.revision || 0) === b.revision,
      "Tu progreso cambió en otra sesión. Recarga el avance antes de continuar.",
      409,
    );
    demand(!saved || saved.state.missionSlug === m.slug);
    const event = b.event as MissionEvent;
    demand(
      event && Object.keys(event).every((k) => ["type", "value"].includes(k)),
    );
    const state =
      event.type === "start" && !saved
        ? freshAttempt(id, m.slug)
        : reduceMission(saved?.state || freshAttempt(id, m.slug), event);
    const committed = await db.rpc("commit_mission", {
      p_student: actor.id,
      p_id: id,
      p_mission: m.slug,
      p_version: m.version,
      p_revision: b.revision,
      p_state: state,
      p_score: scoreAttempt(state),
      p_steps: m.steps.length,
      p_event: eventId,
    });
    if (committed.error)
      throw new LearningError(
        "No se guardó el avance: pudo cambiar en otra sesión. Recarga y reintenta.",
        409,
      );
    return committed.data;
  }
  privileged();
  if (action === "adminUsers") {
    const page = Number(params.get("page") || 0);
    demand(Number.isInteger(page) && page >= 0 && page < 100000);
    const search = (params.get("search") || "")
      .replace(/[%_,()]/g, "")
      .slice(0, 100);
    let q = db
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id");
    const role = params.get("role"),
      status = params.get("status");
    if (role) {
      demand(
        ["student", "teacher", "institution_admin", "admin"].includes(role),
      );
      q = q.eq("role", role);
    }
    if (status) {
      demand(["active", "pending", "suspended"].includes(status));
      q = q.eq("status", status);
    }
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    const response = await q.range(page * 20, page * 20 + 19);
    demand(!response.error, "No pudimos consultar las cuentas.", 503);
    const stats = await read(db.rpc("identity_counts"));
    return { users: response.data, total: response.count, page, stats };
  }
  if (action === "adminIdentity") {
    demand(
      Object.keys(b).every((k) =>
        ["id", "status", "role", "password"].includes(k),
      ),
    );
    const id = uuid(b.id);
    demand(
      id !== actor.id,
      "Otro administrador debe modificar tu cuenta.",
      403,
    );
    const target = await read(
      db.from("profiles").select("*").eq("id", id).maybeSingle(),
    );
    demand(target, "Usuario no encontrado.", 404);
    const updates: Record<string, unknown> = {};
    if (b.status !== undefined) {
      demand(["active", "pending", "suspended"].includes(String(b.status)));
      updates.status = b.status;
      updates.active = b.status === "active";
    }
    if (b.role !== undefined) {
      demand(
        ["student", "teacher", "institution_admin", "admin"].includes(
          String(b.role),
        ),
      );
      updates.role = b.role;
    }
    if ((b.role && b.role !== target.role) || target.role === "admin") {
      demand(
        typeof b.password === "string" && b.password.length <= 256,
        "Confirma tu contraseña para esta operación privilegiada.",
        403,
      );
      const isolated = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      const verified = await isolated.auth.signInWithPassword({
        email: actor.email!,
        password: b.password,
      });
      demand(
        !verified.error && verified.data.user?.id === actor.id,
        "No pudimos confirmar tu identidad.",
        403,
      );
      if (verified.data.session)
        await isolated.auth.signOut({ scope: "local" });
    }
    await read(
      db.rpc("admin_identity", {
        p_actor: actor.id,
        p_target: id,
        p_updates: updates,
      }),
    );
    return { ok: true };
  }
  throw new LearningError("Acción no disponible.", 404);
}
