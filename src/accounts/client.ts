import { createClient } from "@supabase/supabase-js";
const env = import.meta.env;
export const authClient =
  env?.VITE_SUPABASE_URL && env?.VITE_SUPABASE_PUBLISHABLE_KEY
    ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
        auth: { flowType: "implicit", detectSessionInUrl: true },
      })
    : null;
export async function learningApi<T>(
  action: string,
  body?: unknown,
): Promise<T> {
  const session = await authClient?.auth.getSession();
  const token = session?.data.session?.access_token;
  const [operation, ...query] = action.split("&");
  const response = await fetch(
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
  const data = await response.json();
  if (!response.ok)
    throw Error(data.error || "No pudimos completar la solicitud.");
  return data;
}
