import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { authClient, learningApi } from "./client";
import type { Profile } from "./model";
type State = {
  session: Session | null;
  recovery: boolean;
  profile: Profile | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<State>({
  session: null,
  recovery: false,
  profile: null,
  loading: false,
  error: "",
  refresh: async () => {},
  logout: async () => {},
});
export function AccountProvider({ children }: { children: ReactNode }) {
  const [recovery, setRecovery] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.location.hash.includes("type=recovery") ||
        sessionStorage.getItem("tpplay-password-recovery") === "yes"),
  );
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(!!authClient);
  const [error, setError] = useState("");
  const logout = async () => {
    try {
      const result = await authClient?.auth.signOut({ scope: "local" });
      if (result?.error) throw result.error;
      setProfile(null);
      setSession(null);
      setError("");
    } catch {
      setError(
        "No pudimos cerrar la sesión. Reintenta antes de dejar este equipo.",
      );
    }
  };
  const generation = useRef(0);
  const live = useRef(true);
  const userId = useRef<string | null>(null);
  const refresh = useCallback(async () => {
    if (!authClient) return;
    const request = ++generation.current;
    try {
      const current = await authClient.auth.getSession();
      if (!live.current || request !== generation.current) return;
      setSession(current.data.session);
      userId.current = current.data.session?.user.id ?? null;
      if (current.data.session) {
        const data = await learningApi<{ profile: Profile }>("me");
        if (!live.current || request !== generation.current) return;
        if (data.profile.id !== current.data.session.user.id) return;
        setProfile(data.profile);
      } else setProfile(null);
      setError("");
    } catch (e) {
      if (live.current && request === generation.current) {
        setProfile(null);
        setError((e as Error).message);
      }
    } finally {
      if (live.current && request === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    live.current = true;
    void refresh();
    const focus = () => {
      if (live.current) void refresh();
    };
    window.addEventListener("focus", focus);
    const subscription = authClient?.auth.onAuthStateChange((event, next) => {
      if (!live.current) return;
      setSession(next);
      if (event === "TOKEN_REFRESHED") return;
      generation.current++;
      if (event === "SIGNED_OUT" || userId.current !== next?.user.id)
        setProfile(null);
      userId.current = next?.user.id ?? null;
      if (event === "PASSWORD_RECOVERY") {
        setRecovery(true);
        sessionStorage.setItem("tpplay-password-recovery", "yes");
        window.location.replace("/cuenta/recuperar");
      } else if (event === "SIGNED_OUT") {
        setRecovery(false);
        sessionStorage.removeItem("tpplay-password-recovery");
      } else
        setTimeout(() => {
          if (live.current) void refresh();
        }, 0);
    });
    return () => {
      window.removeEventListener("focus", focus);
      live.current = false;
      generation.current++;
      subscription?.data.subscription.unsubscribe();
    };
  }, [refresh]);
  return (
    <Context.Provider
      value={{ session, recovery, profile, loading, error, refresh, logout }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAccount = () => useContext(Context);
