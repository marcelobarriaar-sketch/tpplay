import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { readSession } from "./admin.js";
import { moduleCatalog, orderedMissionIds } from "../src/modules.js";
export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const send = (status: number, data: unknown) => {
    res.statusCode = status;
    res.end(JSON.stringify(data));
  };
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return send(405, { error: "Método no permitido." });
  }
  if (req.method === "POST") {
    const secret = process.env.ADMIN_SESSION_SECRET || "";
    const token =
      (req.headers.cookie || "")
        .split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith("tpplay_admin="))
        ?.slice(13) || "";
    if (
      secret.length < 32 ||
      !readSession(token, secret, process.env.ADMIN_USER || "admin")
    )
      return send(401, { error: "Ingresa como administrador para guardar." });
    try {
      if (
        !req.headers.origin ||
        new URL(req.headers.origin).host !== req.headers.host
      )
        return send(403, { error: "Solicitud no permitida." });
    } catch {
      return send(403, { error: "Solicitud no permitida." });
    }
    if (!(req.headers["content-type"] || "").startsWith("application/json"))
      return send(415, { error: "Formato no permitido." });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    return send(503, {
      error: "El editor de módulos requiere conexión con la base de datos.",
    });
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    if (req.method === "GET") {
      const { data, error } = await db
        .from("module_settings")
        .select("id,objectives,mission_order");
      if (error) throw error;
      return send(200, { modules: data });
    }
    let raw = "";
    if (req.body === undefined) {
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 24000)
          return send(413, { error: "Solicitud demasiado grande." });
      }
    }
    const body =
      req.body === undefined
        ? JSON.parse(raw)
        : typeof req.body === "string"
          ? JSON.parse(req.body)
          : req.body;
    const catalog = moduleCatalog.find((m) => m.id === body?.id);
    if (
      !catalog ||
      !Array.isArray(body.objectives) ||
      body.objectives.length > 30 ||
      body.objectives.some(
        (s: unknown) =>
          typeof s !== "string" || s.trim().length === 0 || s.length > 1000,
      ) ||
      !Array.isArray(body.mission_order) ||
      body.mission_order.length !== catalog.missions.length ||
      new Set(body.mission_order).size !== body.mission_order.length ||
      body.mission_order.some(
        (s: unknown) => !catalog.missions.some((m) => m.id === s),
      )
    )
      return send(400, {
        error: "Revisa los objetivos y el orden de las misiones.",
      });
    const value = {
      id: catalog.id,
      objectives: body.objectives.map((s: string) => s.trim()),
      mission_order: orderedMissionIds(catalog.id, body.mission_order),
      updated_at: new Date().toISOString(),
    };
    const { error } = await db.from("module_settings").upsert(value);
    if (error) throw error;
    return send(200, { module: value });
  } catch {
    return send(503, {
      error: "No pudimos consultar o guardar el módulo. Inténtalo nuevamente.",
    });
  }
}
