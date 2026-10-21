import { createClient } from "@supabase/supabase-js";
const env = import.meta.env;
const transient = new Map<string, string>();
const persistent = () => {
  try {
    return localStorage.getItem("tpplay-remember-session") !== "no";
  } catch {
    return false;
  }
};
const storage = {
  getItem(key: string) {
    try {
      return (persistent() ? localStorage : sessionStorage).getItem(key);
    } catch {
      return transient.get(key) || null;
    }
  },
  setItem(key: string, value: string) {
    try {
      (persistent() ? localStorage : sessionStorage).setItem(key, value);
    } catch {
      transient.set(key, value);
    }
  },
  removeItem(key: string) {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      /* In-memory fallback is cleared below. */
    }
    transient.delete(key);
  },
};
export function rememberSession(remember: boolean) {
  try {
    localStorage.setItem("tpplay-remember-session", remember ? "yes" : "no");
  } catch {
    /* Restrictive browsers keep the session in memory. */
  }
}

export const authClient =
  env?.VITE_SUPABASE_URL && env?.VITE_SUPABASE_PUBLISHABLE_KEY
    ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
        auth: { flowType: "implicit", detectSessionInUrl: true, storage },
      })
    : null;
export async function learningApi<T>(
  action: string,
  body?: unknown,
): Promise<T> {
  const session = await authClient?.auth.getSession();
  const token = session?.data.session?.access_token;
  const [operation, ...query] = action.split("&");
  let response: Response;
  try {
    response = await fetch(
      `/api/learning?action=${encodeURIComponent(operation)}${query.length ? "&" + query.join("&") : ""}`,
      {
        method: body === undefined ? "GET" : "POST",
        headers: {
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
    );
  } catch {
    throw Error(
      "No pudimos conectar con TP PLAY. Tus respuestas siguen aquí; reintenta al recuperar conexión.",
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error("No pudimos confirmar la respuesta del servidor. Reintenta.");
  }
  if (!response.ok)
    throw Object.assign(
      Error(data.error || "No pudimos completar la solicitud."),
      { status: response.status },
    );
  return data;
}
