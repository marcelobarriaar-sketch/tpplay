import { missions as townMissions } from "../src/games/coihue/content.js";
import { completed, type Progress } from "../src/games/coihue/progress.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "../src/accounts/model.js";
import { demand, uuid, text, LearningError } from "./learningDomain.js";
import { missions } from "../src/data.js";
import { gradeFor, type Scale } from "../src/accounts/grading.js";
export async function readAcademic<T>(
  query: PromiseLike<{ data: T; error: unknown }>,
) {
  const r = await query;
  if (r.error) {
    const provider = r.error as { message?: string; code?: string };
    const known = provider.message?.match(
      /INVALID_ACADEMIC_SETUP|GROUP_NOT_AVAILABLE|INVALID_GROUP|INVALID_SUBJECT|DENIED/,
    )?.[0];
    if (known)
      throw new LearningError(
        known === "GROUP_NOT_AVAILABLE"
          ? "Selecciona un curso y asignatura validados del establecimiento elegido."
          : known === "DENIED"
            ? "Tu perfil no puede registrar esta organización académica."
            : "Revisa el establecimiento, año, cursos y asignaturas del formulario.",
        400,
      );
    throw new LearningError(
      "No se pudo consultar la organización académica. Revisa que la migración académica esté aplicada.",
      503,
    );
  }
  return r.data;
}
export async function academicCatalog(
  db: SupabaseClient,
  school?: string | null,
) {
  const [subjects, groups, scales, links] = await Promise.all([
    readAcademic(db.from("subjects").select("id,name").order("name")),
    school
      ? readAcademic(
          db
            .from("class_groups")
            .select("*")
            .eq("school_id", uuid(school))
            .order("name"),
        )
      : [],
    readAcademic(db.from("grading_scales").select("*").order("mission_id")),
    readAcademic(db.from("challenge_subjects").select("*")),
  ]);
  const assignments = groups?.length ? await readAcademic(db.from("teaching_assignments").select("group_id,subject_id").in("group_id",(groups||[]).map(g=>g.id)).eq("status","approved")) : [];
  return {
    subjects,
    groups,
    scales,
    links,
    assignments,
    missions: [
      ...missions.map((m) => ({ id: m.slug, title: m.title })),
      { id: "mision-tributos", title: "Tributos en Valle del Coihue" },
    ],
  };
}
export async function academicAction(
  db: SupabaseClient,
  actor: Profile,
  action: string | null,
  b: Record<string, unknown>,
  params: URLSearchParams,
) {
  if (
    ![
      "academicMe",
      "academicSetup",
      "academicSelect",
      "academicAssignments",
      "academicApprove",
      "academicRows",
      "academicDetail",
      "academicScale",
      "academicLink",
    ].includes(action || "")
  )
    return null;
  if (action === "academicSetup") {
    uuid(b.school_id);
    demand(
      Number.isInteger(b.year) &&
        Number(b.year) >= 2020 &&
        Number(b.year) <= 2100,
      "Selecciona un año escolar válido.",
    );
    demand(
      Array.isArray(b.pairs) && b.pairs.length >= 1 && b.pairs.length <= 20,
      "Agrega entre una y veinte clases.",
    );
    for (const raw of b.pairs as Record<string, unknown>[]) {
      demand(raw && typeof raw === "object");
      if (actor.role === "student") {
        uuid(raw.group_id);
        uuid(raw.subject_id);
      } else {
        text(raw.group_name, 120, 2);
        text(raw.subject_name, 120, 2);
      }
    }
    const data = await readAcademic(
      db.rpc("save_academic_setup", { p_user: actor.id, p_data: b }),
    );
    return data;
  }
  if (action === "academicMe") {
    const [assignments, enrollments] = await Promise.all([
      readAcademic(
        db
          .from("teaching_assignments")
          .select("*,class_groups(*,schools(name)),subjects(name)")
          .eq("teacher_id", actor.id),
      ),
      readAcademic(
        db
          .from("academic_enrollments")
          .select("*,class_groups(*,schools(name)),subjects(name)")
          .eq("student_id", actor.id),
      ),
    ]);
    return { assignments, enrollments, active: actor.active_enrollment_id };
  }
  if (action === "academicSelect") {
    demand(actor.role === "student");
    const id = uuid(b.id);
    const enrollment = await readAcademic(
      db
        .from("academic_enrollments")
        .select("id")
        .eq("id", id)
        .eq("student_id", actor.id)
        .maybeSingle(),
    );
    demand(enrollment, "Matrícula no disponible.", 403);
    await readAcademic(
      db
        .from("profiles")
        .update({ active_enrollment_id: id })
        .eq("id", actor.id),
    );
    return { ok: true };
  }
  if (action === "academicAssignments") {
    demand(actor.role === "admin", "Acceso reservado a administración.", 403);
    return {
      assignments: await readAcademic(
        db
          .from("teaching_assignments")
          .select(
            "*,profiles!teaching_assignments_teacher_id_fkey(name,email),class_groups(*,schools(name)),subjects(name)",
          )
          .order("created_at", { ascending: false })
          .limit(500),
      ),
    };
  }
  if (action === "academicApprove") {
    demand(
      actor.role === "admin",
      "Solo administración puede validar la asignación.",
      403,
    );
    demand(["approved", "rejected"].includes(String(b.status)));
    const id = uuid(b.id);
    await readAcademic(
      db
        .from("teaching_assignments")
        .update({ status: b.status, approved_by: actor.id })
        .eq("id", id),
    );
    await readAcademic(
      db.from("audit").insert({
        actor_id: actor.id,
        action: "academic.assignment",
        target_id: id,
        details: { status: b.status },
      }),
    );
    return { ok: true };
  }
  if (action === "academicScale") {
    demand(
      actor.role === "admin",
      "Solo administración puede cambiar la escala global.",
      403,
    );
    demand(
      [...missions.map((m) => m.slug), "mision-tributos"].includes(
        String(b.mission_id),
      ),
    );
    const scale = {
      ...b,
      minimum: Number(b.minimum),
      optimum: Number(b.optimum),
      grade_min: Number(b.grade_min),
      grade_pass: Number(b.grade_pass),
      grade_max: Number(b.grade_max),
      requirement: Number(b.requirement),
    } as Scale;
    try {
      gradeFor(scale.minimum, scale);
    } catch {
      demand(
        false,
        "Revisa la escala: el óptimo debe superar al mínimo, las notas deben estar entre 1 y 7 y la exigencia entre 0 y 100%.",
      );
    }
    demand(["money", "performance"].includes(scale.metric));
    demand(
      scale.metric !== "money" || scale.mission_id === "inicio-actividades",
      "Este desafío todavía no registra dinero. Selecciona desempeño.",
    );
    const previous = await readAcademic(
      db
        .from("grading_scales")
        .select("version")
        .eq("mission_id", scale.mission_id)
        .maybeSingle(),
    );
    await readAcademic(
      db.from("grading_scales").upsert({
        mission_id: scale.mission_id,
        minimum: scale.minimum,
        optimum: scale.optimum,
        grade_min: scale.grade_min,
        grade_pass: scale.grade_pass,
        grade_max: scale.grade_max,
        requirement: scale.requirement,
        metric: scale.metric,
        version: (previous?.version || 0) + 1,
        updated_by: actor.id,
        updated_at: new Date().toISOString(),
      }),
    );
    return { ok: true };
  }
  if (action === "academicLink") {
    demand(
      actor.role === "admin",
      "Solo administración vincula desafíos y asignaturas.",
      403,
    );
    demand(
      [...missions.map((m) => m.slug), "mision-tributos"].includes(
        String(b.mission_id),
      ),
    );
    await readAcademic(
      db
        .from("challenge_subjects")
        .upsert({ mission_id: b.mission_id, subject_id: uuid(b.subject_id) }),
    );
    return { ok: true };
  }
  demand(
    ["teacher", "admin"].includes(actor.role),
    "No tienes acceso a nóminas docentes.",
    403,
  );
  const assignment = await readAcademic(
    db
      .from("teaching_assignments")
      .select("*,class_groups(*,schools(name)),subjects(name)")
      .eq("id", uuid(params.get("assignment")))
      .maybeSingle(),
  );
  demand(
    assignment &&
      assignment.status === "approved" &&
      (actor.role === "admin" || assignment.teacher_id === actor.id),
    "Esta asignatura no está asignada a tu cuenta.",
    403,
  );
  const enrollments = await readAcademic(
    db
      .from("academic_enrollments")
      .select(
        "id,student_id,profiles!academic_enrollments_student_id_fkey(id,name),class_groups(*,schools(name)),subjects(name)",
      )
      .eq("group_id", assignment.group_id)
      .eq("subject_id", assignment.subject_id),
  );
  const ids = (enrollments || []).map((e) => e.id);
  if (action === "academicDetail") {
    const record = await readAcademic(
      db
        .from("academic_results")
        .select("*")
        .eq("id", uuid(params.get("id")))
        .in(
          "enrollment_id",
          ids.length ? ids : ["00000000-0000-4000-8000-000000000000"],
        )
        .maybeSingle(),
    );
    demand(
      record,
      "Resultado no disponible para este curso y asignatura.",
      403,
    );
    const detail = record.state_snapshot
      ? { state: record.state_snapshot }
      : record.attempt_id
        ? await readAcademic(
            db
              .from("mission_attempts")
              .select("state,started_at,last_activity_at,completed_at")
              .eq("id", record.attempt_id)
              .eq("student_id", record.student_id)
              .maybeSingle(),
          )
        : await readAcademic(
            db
              .from("game_progress")
              .select("state,updated_at")
              .eq("student_id", record.student_id)
              .eq("game_id", record.game_id)
              .maybeSingle(),
          );
    return { record, detail };
  }
  const offset = Number(params.get("offset") || 0);
  demand(Number.isInteger(offset) && offset >= 0 && offset <= 100000);
  let q = db
    .from("academic_results")
    .select("*")
    .in(
      "enrollment_id",
      ids.length ? ids : ["00000000-0000-4000-8000-000000000000"],
    )
    .order("recorded_at", { ascending: false })
    .order("id")
    .range(
      Number(params.get("offset") || 0),
      Number(params.get("offset") || 0) + 199,
    );
  if (params.get("mission"))
    q = q.eq("mission_id", text(params.get("mission"), 100));
  if (params.get("status")) q = q.eq("status", text(params.get("status"), 40));
  if (params.get("from")) {
    demand(/^\d{4}-\d{2}-\d{2}$/.test(params.get("from")!));
    q = q.gte("recorded_at", chileBoundary(params.get("from")!));
  }
  if (params.get("to")) {
    demand(/^\d{4}-\d{2}-\d{2}$/.test(params.get("to")!));
    q = q.lte("recorded_at", chileBoundary(params.get("to")!, true));
  }
  const results = await readAcademic(q);
  let bookQuery = db
    .from("academic_gradebook")
    .select("*")
    .in(
      "enrollment_id",
      ids.length ? ids : ["00000000-0000-4000-8000-000000000000"],
    );
  if (params.get("mission"))
    bookQuery = bookQuery.eq("mission_id", params.get("mission"));
  if (params.get("status"))
    bookQuery = bookQuery.eq("status", params.get("status"));
  if (params.get("from"))
    bookQuery = bookQuery.gte(
      "recorded_at",
      chileBoundary(params.get("from")!),
    );
  if (params.get("to"))
    bookQuery = bookQuery.lte(
      "recorded_at",
      chileBoundary(params.get("to")!, true),
    );
  const book = await readAcademic(bookQuery.limit(5000));
  demand(
    !book || book.length < 5000,
    "Acota los filtros para consultar el libro completo.",
    400,
  );
  return {
    assignment,
    enrollments,
    results,
    book,
    next:
      results?.length === 200 ? Number(params.get("offset") || 0) + 200 : null,
  };
}

export async function requireAcademicContext(
  db: SupabaseClient,
  actor: Profile,
  mission: string,
) {
  const e = actor.active_enrollment_id
    ? await readAcademic(
        db
          .from("academic_enrollments")
          .select("id,subject_id")
          .eq("id", actor.active_enrollment_id)
          .eq("student_id", actor.id)
          .maybeSingle(),
      )
    : null;
  demand(
    e,
    "Selecciona establecimiento, curso y asignatura antes de comenzar.",
    409,
  );
  const linked = await readAcademic(
    db
      .from("challenge_subjects")
      .select("mission_id")
      .eq("subject_id", e.subject_id)
      .eq("mission_id", mission)
      .maybeSingle(),
  );
  demand(
    linked,
    "Este desafío no está vinculado a tu asignatura seleccionada.",
    409,
  );
}

export function academicGamePerformance(state: Progress) {
  const items = townMissions.flatMap((m) =>
    m.challenges.flatMap((c) => c.items),
  );
  return {
    score: items.length
      ? (items.filter((i) => state.answers[i.id]?.correct).length /
          items.length) *
        100
      : 0,
    completed: townMissions.every((m) => completed(state, m.id)),
  };
}

export function chileBoundary(day: string, end = false) {
  const base = new Date(day + "T12:00:00Z");
  demand(
    Number.isFinite(base.getTime()) && base.toISOString().slice(0, 10) === day,
    "Selecciona una fecha válida.",
  );
  const hour = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(base),
  );
  const offset = hour - 12;
  const sign = offset < 0 ? "-" : "+";
  return (
    day +
    (end ? "T23:59:59.999" : "T00:00:00.000") +
    sign +
    String(Math.abs(offset)).padStart(2, "0") +
    ":00"
  );
}
