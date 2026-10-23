import { rosterAction } from "./rosterImport.js";
import { academicAction, academicCatalog, requireAcademicContext, academicGamePerformance } from './academics.js';
import type { IncomingMessage, ServerResponse } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { contentVersion } from "../src/games/coihue/content.js";
import {
  initialProgress,
  type Progress,
} from "../src/games/coihue/progress.js";
import {
  initialRubric,
  type Profile,
  type Rubric,
} from "../src/accounts/model.js";
import {
  LearningError,
  demand,
  requireRole,
  text,
  uuid,
  reduceGame,
  suggestions,
  validateEvaluation,
  validateRubric,
  csvCell,
  type GameEvent,
} from "./learningDomain.js";
import { identityAction } from "./identity.js";
import { missions as coihueMissions } from "../src/games/coihue/content.js";
import { completed, challengesFor } from "../src/games/coihue/progress.js";
const game = "mision-tributos";
async function result<T>(query: PromiseLike<{ data: T; error: unknown }>) {
  const { data, error } = await query;
  if (error)
    throw new LearningError(
      "No pudimos guardar o consultar los datos. Revisa la configuración del servicio.",
      503,
    );
  return data;
}
async function bodyOf(req: IncomingMessage & { body?: unknown }) {
  const checked = (value: unknown) => {
    demand(
      value && typeof value === "object" && !Array.isArray(value),
      "Solicitud inválida.",
    );
    demand(
      Buffer.byteLength(JSON.stringify(value)) <= 48000,
      "Solicitud demasiado grande.",
      413,
    );
    return value as Record<string, unknown>;
  };
  if (req.body !== undefined) {
    try {
      return checked(
        typeof req.body === "string" ? JSON.parse(req.body) : req.body,
      );
    } catch (e) {
      if (e instanceof LearningError) throw e;
      throw new LearningError("Solicitud inválida.");
    }
  }
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    demand(Buffer.byteLength(raw) <= 48000, "Solicitud demasiado grande.", 413);
  }
  try {
    return checked(JSON.parse(raw));
  } catch (e) {
    if (e instanceof LearningError) throw e;
    throw new LearningError("Solicitud inválida.");
  }
}
export async function authorizedCourse(
  db: SupabaseClient,
  actor: Profile,
  id: string,
) {
  const course = await result(
    db.from("courses").select("*").eq("id", uuid(id)).maybeSingle(),
  );
  demand(
    course &&
      (actor.role === "admin" ||
        (actor.role === "teacher" && course.teacher_id === actor.id)),
    "Este curso no está asignado a tu cuenta.",
    403,
  );
  return course;
}
export async function authorizedStudent(
  db: SupabaseClient,
  actor: Profile,
  student: string,
  course: string,
) {
  await authorizedCourse(db, actor, course);
  const membership = await result(
    db
      .from("memberships")
      .select("student_id")
      .eq("course_id", course)
      .eq("student_id", uuid(student))
      .maybeSingle(),
  );
  demand(membership, "El estudiante no pertenece a este curso.", 403);
}
async function rubricFor(db: SupabaseClient, course: string): Promise<Rubric> {
  const rows = await result(
    db
      .from("rubrics")
      .select("definition")
      .eq("course_id", course)
      .order("version", { ascending: false })
      .limit(1),
  );
  return rows?.[0]?.definition ?? initialRubric;
}
async function audit(
  db: SupabaseClient,
  actor: Profile,
  action: string,
  target: string,
  details: object = {},
) {
  await result(
    db
      .from("audit")
      .insert({ actor_id: actor.id, action, target_id: target, details }),
  );
}
export function learningHandler(
  clientFactory: typeof createClient = createClient,
) {
  return async function handler(
    req: IncomingMessage & { body?: unknown },
    res: ServerResponse,
  ) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const send = (status: number, value: unknown) => {
      res.statusCode = status;
      res.end(JSON.stringify(value));
    };
    try {
      const url = process.env.SUPABASE_URL;
      const secret = process.env.SUPABASE_SECRET_KEY;
      const origin = process.env.TPPLAY_APP_ORIGIN;
      demand(
        url && secret && origin,
        "Las cuentas de Valle del Coihue todavía no están habilitadas.",
        503,
      );
      const db = clientFactory(url, secret, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const action = new URL(req.url || "/", origin).searchParams.get("action");
      demand(
        req.method === "GET" || req.method === "POST",
        "Método no permitido.",
        405,
      );
      const writeActions = [
        "rosterPreview", "rosterCreate", "rosterProcess", "rosterRetry", "activateStudent",
        "academicSetup", "academicSelect", "academicApprove", "academicScale", "academicLink",
        "identityProfile",
        "missionEvent",
        "importLocal",
        "adminIdentity",
        "profile",
        "join",
        "schoolRequest",
        "event",
        "createCourse",
        "invite",
        "rubric",
        "evaluation",
        "adminUser",
        "adminSchool",
        "adminCity",
        "adminMembership",
        "recovery",
        "approveSchool",
        "adminCourse",
      ];
      if (writeActions.includes(action || ""))
        demand(req.method === "POST", "Método no permitido.", 405);
      else demand(req.method === "GET", "Método no permitido.", 405);
      if (req.method === "POST") {
        demand(
          req.headers.origin === origin ||
            (!process.env.VERCEL &&
              req.headers.origin &&
              new URL(req.headers.origin).host === req.headers.host),
          "Solicitud no permitida.",
          403,
        );
        demand(
          req.headers["content-type"]?.startsWith("application/json"),
          "Formato inválido.",
          415,
        );
      }
      if (action === "academicCatalog") return send(200,await academicCatalog(db,new URL(req.url || "/", origin).searchParams.get("school")));
      if (action === "registry") {
        const [cities, schools] = await Promise.all([
          result(db.from("cities").select("id,name").order("name")),
          result(db.from("schools").select("id,name,city_id").is("merged_into_id", null).order("name")),
        ]);
        return send(200, { cities, schools });
      }
      const bearer = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
      demand(bearer, "Ingresa para continuar.", 401);
      const verified = await db.auth.getUser(bearer);
      demand(
        !verified.error && verified.data.user,
        "La sesión venció. Ingresa de nuevo.",
        401,
      );
      let claims: { sub?: string; session_id?: string } = {};
      try {
        claims = JSON.parse(
          Buffer.from(bearer.split(".")[1], "base64url").toString(),
        );
      } catch {
        /* Invalid claims are rejected below. */
      }
      demand(
        claims.sub === verified.data.user.id && claims.session_id,
        "La sesión no es válida. Ingresa nuevamente.",
        401,
      );
      const validSession = await db.rpc("identity_session_active", {
        p_user: verified.data.user.id,
        p_session: uuid(claims.session_id),
      });
      demand(
        !validSession.error && validSession.data,
        "La sesión fue cerrada. Ingresa nuevamente.",
        401,
      );
      demand(
        verified.data.user.email_confirmed_at,
        "Verifica tu correo antes de comenzar.",
        403,
      );
      const actor = (await result(
        db
          .from("profiles")
          .select("*")
          .eq("id", verified.data.user.id)
          .maybeSingle(),
      )) as Profile | null;
      demand(
        actor && actor.active && (!actor.status || actor.status === "active"),
        "Esta cuenta está desactivada. Contacta al docente.",
        403,
      );
      const b = req.method === "POST" ? await bodyOf(req) : {};
      const params = new URL(req.url || "/", origin).searchParams;
      if (
        req.method === "POST" &&
        ![
          "adminIdentity",
          "adminUser",
          "evaluation",
          "adminMembership",
        ].includes(action || "")
      )
        demand(
          ![
            "role",
            "xp",
            "xpEarned",
            "xp_earned",
            "userId",
            "user_id",
            "student_id",
          ].some((k) => k in b),
          "No puedes modificar identidad, permisos ni XP.",
          403,
        );
      if (action === "adminUser") {
        requireRole(actor, "admin");
        demand(
          b.role === undefined && b.active === undefined,
          "Utiliza la gestión de identidad con confirmación para cambiar permisos y estado.",
          403,
        );
      }
      if (action === "activateStudent") {
        demand(actor.role === "student" && b.accepted === true, "Acepta los términos y privacidad para activar tu cuenta.");
        await result(db.from("profiles").update({onboarding_required:false,terms_version:"2026-10",terms_accepted_at:new Date().toISOString()}).eq("id",actor.id));
        return send(200,{ok:true});
      }
      demand(!actor.onboarding_required || action === "me", "Activa tu cuenta y define tu contraseña antes de continuar.",403);
      const roster = await rosterAction(db,actor,action,b,params,origin!);
      if(roster!==null)return send(200,roster);
      const academic = await academicAction(db, actor, action, b, params);
      if(academic!==null)return send(200,academic);
      const identity = await identityAction(db, actor, action, b, params);
      if (identity !== null) return send(200, identity);
      if (action === "me") {
        const courses = await result(
          db
            .from("memberships")
            .select("course_id,courses(id,name)")
            .eq("student_id", actor.id),
        );
        const feedback = await result(
          db
            .from("evaluations")
            .select("*")
            .eq("student_id", actor.id)
            .eq("published", true),
        );
        const requests = await result(
          db
            .from("school_requests")
            .select("id,name,status")
            .eq("student_id", actor.id)
            .eq("status", "pending"),
        );
        return send(200, { profile: actor, courses, feedback, requests });
      }
      if (action === "profile") {
        const name = text(b.name, 120, 2);
        const parts = name.split(/\s+/);
        const first = parts.shift()!;
        const last = parts.join(" ");
        demand(first.length <= 60 && last.length <= 60);
        const updates: Record<string, unknown> = {
          name,
          first_name: first,
          last_name: last,
        };
        if (["student", "teacher"].includes(actor.role)) {
          const city = b.city_id ? uuid(b.city_id) : null,
            school = b.school_id ? uuid(b.school_id) : null;
          if (city)
            demand(
              await result(
                db.from("cities").select("id").eq("id", city).maybeSingle(),
              ),
            );
          if (school)
            demand(
              city &&
                (await result(
                  db
                    .from("schools")
                    .select("id")
                    .eq("id", school)
                    .eq("city_id", city)
                    .maybeSingle(),
                )),
            );
          Object.assign(updates, { city_id: city, school_id: school });
        } else
          demand(
            (!b.school_id || b.school_id === actor.school_id) &&
              (!b.city_id || b.city_id === actor.city_id),
            "La institución de un administrador se asigna mediante una operación autorizada.",
            403,
          );
        await result(db.from("profiles").update(updates).eq("id", actor.id));
        return send(200, { ok: true });
      }
      if (action === "schoolRequest") {
        requireRole(actor, "student", "teacher");
        const city = uuid(b.city_id);
        demand(
          await result(
            db.from("cities").select("id").eq("id", city).maybeSingle(),
          ),
        );
        const pending = await result(
          db
            .from("school_requests")
            .select("id")
            .eq("student_id", actor.id)
            .eq("status", "pending"),
        );
        demand(!pending?.length, "Ya tienes una solicitud pendiente.");
        await result(
          db.from("school_requests").insert({
            student_id: actor.id,
            city_id: city,
            name: text(b.name, 160, 2),
          }),
        );
        return send(200, { ok: true });
      }
      if (action === "join") {
        requireRole(actor, "student");
        const code = text(b.code, 64).toUpperCase().replace(/\s/g, "");
        const joined = await db.rpc("join_course", {
          p_student: actor.id,
          p_hash: createHash("sha256").update(code).digest("hex"),
        });
        demand(
          !joined.error,
          "El código no está disponible, venció o llegó a su límite de usos.",
        );
        return send(200, { course_id: joined.data });
      }
      if (action === "progress") {
        requireRole(actor, "student");
        const saved = await result(
          db
            .from("game_progress")
            .select("state,revision")
            .eq("student_id", actor.id)
            .eq("game_id", game)
            .maybeSingle(),
        );
        return send(200, saved ?? { state: initialProgress(), revision: 0 });
      }
      if (action === "event") {
        requireRole(actor, "student");
        uuid(b.event_id);
        demand(Number.isInteger(b.revision) && Number(b.revision) >= 0);
        const supplied = b.event as GameEvent;
        demand(supplied && typeof supplied.type === "string");
        const event: GameEvent = {
          type: supplied.type,
          ...(supplied.mission !== undefined
            ? { mission: supplied.mission }
            : {}),
          ...(supplied.challenge !== undefined
            ? { challenge: supplied.challenge }
            : {}),
          ...(supplied.item !== undefined ? { item: supplied.item } : {}),
          ...(supplied.value !== undefined ? { value: supplied.value } : {}),
        };
        const saved = await result(
          db
            .from("game_progress")
            .select("state,revision")
            .eq("student_id", actor.id)
            .eq("game_id", game)
            .maybeSingle(),
        );
        const duplicate = await result(
          db
            .from("evidence")
            .select("id")
            .eq("student_id", actor.id)
            .eq("event_id", b.event_id)
            .maybeSingle(),
        );
        if (duplicate) return send(200, saved);
        demand(
          (saved?.revision ?? 0) === b.revision,
          "Tu avance cambió en otro dispositivo. Recarga para continuar.",
          409,
        );
        const reduced = reduceGame(saved?.state ?? initialProgress(), event);
        const projection = coihueMissions
          .filter((m) => reduced.state.visited.includes(m.id))
          .map((m) => {
            const plan = challengesFor(reduced.state, m.id),
              step = plan.filter((c) =>
                reduced.state.advanced.includes(c.id),
              ).length;
            return {
              id: m.id,
              completed: completed(reduced.state, m.id),
              percentage: Math.round((step / plan.length) * 100),
              step,
            };
          });
        await requireAcademicContext(db,actor,game);
        const commit = await db.rpc("commit_game", {
          p_student: actor.id,
          p_game: game,
          p_version: contentVersion,
          p_revision: b.revision,
          p_state: {...reduced.state,academicPerformance:academicGamePerformance(reduced.state)},
          p_event_id: b.event_id,
          p_event: event,
          p_details: { ...reduced.details, missions: projection },
        });
        if (commit.error)
          throw new LearningError(
            commit.error.message.includes("REVISION_CONFLICT")
              ? "Tu avance cambió en otro dispositivo. Recarga para continuar."
              : "No se guardó la respuesta. Reintenta antes de salir.",
            commit.error.message.includes("REVISION_CONFLICT") ? 409 : 503,
          );
        return send(200, commit.data);
      }
      requireRole(actor, "teacher", "admin");
      demand(actor.role!=="teacher" || !["roster","csv","evidence","evaluation"].includes(action||""), "Utiliza Mi panel académico: el acceso requiere curso y asignatura validados.",403);
      if (action === "courses") {
        let query = db.from("courses").select("*").order("name");
        if (actor.role !== "admin") query = query.eq("teacher_id", actor.id);
        return send(200, { courses: await result(query) });
      }
      if (action === "createCourse") {
        const school = uuid(b.school_id);
        demand(
          await result(
            db.from("schools").select("id").eq("id", school).maybeSingle(),
          ),
        );
        const teacher =
          actor.role === "admin" && b.teacher_id
            ? uuid(b.teacher_id)
            : actor.id;
        demand(
          await result(
            db
              .from("profiles")
              .select("id")
              .eq("id", teacher)
              .in("role", ["teacher", "admin"])
              .eq("active", true)
              .maybeSingle(),
          ),
        );
        const course = await result(
          db
            .from("courses")
            .insert({
              name: text(b.name, 120, 2),
              school_id: school,
              teacher_id: teacher,
            })
            .select()
            .single(),
        );
        await audit(db, actor, "course.create", course.id);
        return send(200, { course });
      }
      if (action === "invite") {
        const course = await authorizedCourse(db, actor, uuid(b.course_id));
        const code = randomBytes(9).toString("hex").toUpperCase();
        const expires = new Date(Date.now() + 7 * 86400000).toISOString();
        await result(
          db.from("invitations").insert({
            course_id: course.id,
            code_hash: createHash("sha256").update(code).digest("hex"),
            expires_at: expires,
            max_uses: 100,
          }),
        );
        await audit(db, actor, "invitation.create", course.id);
        return send(200, { code, expires_at: expires });
      }
      if (action === "roster" || action === "csv") {
        const course = uuid(params.get("course"));
        await authorizedCourse(db, actor, course);
        demand(!params.get("game") || params.get("game") === game);
        const members = await result(
          db
            .from("memberships")
            .select("student_id,profiles(id,name,school_id,city_id,active)")
            .eq("course_id", course),
        );
        const ids = (members ?? []).map((m) => m.student_id);
        const progress = ids.length
          ? await result(
              db
                .from("game_progress")
                .select("*")
                .in("student_id", ids)
                .eq("game_id", game),
            )
          : [];
        const evaluations = await result(
          db.from("evaluations").select("*").eq("course_id", course),
        );
        const students = (members ?? [])
          .map((m) => ({
            ...(m.profiles as unknown as Profile),
            progress:
              progress?.find((p) => p.student_id === m.student_id) ?? null,
            evaluation:
              evaluations?.find((e) => e.student_id === m.student_id) ?? null,
          }))
          .filter(
            (p) =>
              (!params.get("student") || p.id === params.get("student")) &&
              (!params.get("school") || p.school_id === params.get("school")),
          );
        if (action === "csv") {
          res.setHeader("Content-Type", "text/csv; charset=utf-8");
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="tpplay-resultados.csv"',
          );
          res.end(
            "\uFEFF" +
              [
                [
                  "Estudiante",
                  "Curso",
                  "Juego",
                  "Revisión",
                  "Publicado",
                  "Rúbrica",
                  "Niveles",
                  "Comentarios",
                ],
                ...students.map((p) => [
                  p.name,
                  course,
                  game,
                  p.progress?.revision ?? 0,
                  p.evaluation?.published ? "Sí" : "No",
                  p.evaluation?.rubric?.version ?? "",
                  JSON.stringify(p.evaluation?.ratings ?? {}),
                  p.evaluation?.overall ?? "",
                ]),
              ]
                .map((row) => row.map(csvCell).join(","))
                .join("\r\n"),
          );
          return;
        }
        return send(200, { students, rubric: await rubricFor(db, course) });
      }
      if (action === "evidence") {
        const course = uuid(params.get("course"));
        const student = uuid(params.get("student"));
        await authorizedStudent(db, actor, student, course);
        const offset = Number(params.get("offset") || 0);
        demand(Number.isInteger(offset) && offset >= 0 && offset <= 1000000);
        const evidence = await result(
          db
            .from("evidence")
            .select("*")
            .eq("student_id", student)
            .eq("game_id", game)
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(offset, offset + 199),
        );
        const missionAttempts = await result(db.from("mission_attempts")
          .select("id,state,last_activity_at,source")
          .eq("student_id", student).eq("mission_id", "inicio-actividades")
          .order("last_activity_at", {ascending:false}).order("id", {ascending:false})
          .range(offset, offset + 199));
        const progress = await result(
          db
            .from("game_progress")
            .select("state")
            .eq("student_id", student)
            .eq("game_id", game)
            .maybeSingle(),
        );
        const rubric = await rubricFor(db, course);
        return send(200, {
          evidence,
          missionAttempts,
          next_offset: evidence?.length === 200 || missionAttempts?.length === 200 ? offset + 200 : null,
          suggestions: suggestions(
            progress?.state ?? initialProgress(),
            rubric,
          ),
        });
      }
      if (action === "rubric") {
        const course = uuid(b.course_id);
        await authorizedCourse(db, actor, course);
        const current = await rubricFor(db, course);
        const definition = validateRubric(b.rubric);
        demand(
          definition.version === current.version + 1,
          "Recarga la rúbrica antes de crear una nueva versión.",
          409,
        );
        await result(
          db.from("rubrics").insert({
            course_id: course,
            version: definition.version,
            definition,
          }),
        );
        await audit(db, actor, "rubric.version", course, {
          version: definition.version,
        });
        return send(200, { ok: true });
      }
      if (action === "evaluation") {
        const course = uuid(b.course_id);
        const student = uuid(b.student_id);
        await authorizedStudent(db, actor, student, course);
        const existing = await result(
          db
            .from("evaluations")
            .select("rubric,published")
            .eq("course_id", course)
            .eq("student_id", student)
            .maybeSingle(),
        );
        demand(
          !existing?.published,
          "La evaluación publicada se conserva. Solicita una nueva ronda de evaluación al administrador.",
          409,
        );
        const rubric = existing?.rubric ?? (await rubricFor(db, course));
        const evaluation = validateEvaluation(b, rubric);
        demand(
          !evaluation.published || b.confirmed === true,
          "Confirma la revisión docente antes de publicar.",
        );
        await result(
          db.from("evaluations").upsert(
            {
              ...evaluation,
              teacher_id: actor.id,
              published_at: evaluation.published
                ? new Date().toISOString()
                : null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "course_id,student_id" },
          ),
        );
        await audit(
          db,
          actor,
          evaluation.published ? "evaluation.publish" : "evaluation.draft",
          student,
          { course_id: course, rubric_version: rubric.version },
        );
        return send(200, { ok: true });
      }
      requireRole(actor, "admin");
      if (action === "admin") {
        const [users, requests, audits] = await Promise.all([
          result(db.from("profiles").select("*").order("name")),
          result(
            db.from("school_requests").select("*").eq("status", "pending"),
          ),
          result(
            db
              .from("audit")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(100),
          ),
        ]);
        return send(200, { users, requests, audits });
      }
      if (action === "userStatus") {
        const id = uuid(params.get("user"));
        const user = await db.auth.admin.getUserById(id);
        demand(!user.error && user.data.user);
        return send(200, {
          email: user.data.user.email,
          email_verified: !!user.data.user.email_confirmed_at,
        });
      }
      if (action === "adminUser") {
        const id = uuid(b.id);
        demand(
          id !== actor.id,
          "Otro administrador debe modificar tu propia cuenta.",
        );
        const updates: Record<string, unknown> = {};
        if (b.name !== undefined) updates.name = text(b.name, 120, 2);
        if (b.role !== undefined) {
          demand(["student", "teacher", "admin"].includes(String(b.role)));
          updates.role = b.role;
        }
        if (b.active !== undefined) {
          demand(typeof b.active === "boolean");
          updates.active = b.active;
        }
        if (b.city_id !== undefined) updates.city_id = uuid(b.city_id);
        if (b.school_id !== undefined)
          updates.school_id = b.school_id ? uuid(b.school_id) : null;
        const target = await result(
          db.from("profiles").select("*").eq("id", id).maybeSingle(),
        );
        demand(target);
        const school =
          updates.school_id === undefined
            ? target.school_id
            : updates.school_id;
        const city = updates.city_id ?? target.city_id;
        if (school)
          demand(
            await result(
              db
                .from("schools")
                .select("id")
                .eq("id", school)
                .eq("city_id", city)
                .maybeSingle(),
            ),
            "El establecimiento no corresponde a la ciudad.",
          );
        await result(
          db.rpc("admin_profile", {
            p_actor: actor.id,
            p_target: id,
            p_updates: updates,
          }),
        );
        return send(200, { ok: true });
      }
      if (action === "adminMembership") {
        const student = uuid(b.student_id);
        const course = uuid(b.course_id);
        demand(
          await result(
            db
              .from("profiles")
              .select("id")
              .eq("id", student)
              .eq("role", "student")
              .maybeSingle(),
          ),
        );
        demand(
          await result(
            db.from("courses").select("id").eq("id", course).maybeSingle(),
          ),
        );
        await result(
          db.rpc("admin_membership", {
            p_actor: actor.id,
            p_student: student,
            p_course: course,
            p_remove: b.remove === true,
          }),
        );
        return send(200, { ok: true });
      }
      if (action === "adminCourse") {
        const id = uuid(b.id);
        const teacher = uuid(b.teacher_id);
        const school = uuid(b.school_id);
        demand(typeof b.active === "boolean");
        demand(
          await result(
            db
              .from("profiles")
              .select("id")
              .eq("id", teacher)
              .in("role", ["teacher", "admin"])
              .eq("active", true)
              .maybeSingle(),
          ),
          "Selecciona un docente activo.",
        );
        await result(
          db.rpc("admin_course", {
            p_actor: actor.id,
            p_course: id,
            p_teacher: teacher,
            p_school: school,
            p_name: text(b.name, 120, 2),
            p_active: b.active,
          }),
        );
        return send(200, { ok: true });
      }
      if (action === "adminCity") {
        await result(db.from("cities").insert({ name: text(b.name, 120, 2) }));
        await audit(db, actor, "city.create", "registry");
        return send(200, { ok: true });
      }
      if (action === "approveSchool") {
        await result(
          db.rpc("approve_school", {
            p_actor: actor.id,
            p_request: uuid(b.request_id),
            p_city: uuid(b.city_id),
            p_name: text(b.name, 160, 2),
          }),
        );
        return send(200, { ok: true });
      }
      if (action === "adminSchool") {
        const school = await result(
          db
            .from("schools")
            .insert({ city_id: uuid(b.city_id), name: text(b.name, 160, 2) })
            .select()
            .single(),
        );
        await audit(db, actor, "school.create", school.id);
        return send(200, { ok: true });
      }
      if (action === "recovery") {
        const id = uuid(b.id);
        const record = await db.auth.admin.getUserById(id);
        demand(!record.error && record.data.user?.email);
        const recovery = await db.auth.resetPasswordForEmail(
          record.data.user.email,
          { redirectTo: origin + "/cuenta/recuperar" },
        );
        demand(
          !recovery.error,
          "El servicio de correo no pudo enviar el enlace.",
          503,
        );
        await audit(db, actor, "user.recovery", id);
        return send(200, { ok: true });
      }
      throw new LearningError("Acción no disponible.", 404);
    } catch (e) {
      const error =
        e instanceof LearningError
          ? e
          : new LearningError("No pudimos completar la solicitud.", 500);
      send(error.status, { error: error.message });
    }
  };
}
export default learningHandler();
