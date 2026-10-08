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
  profile: Profile | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};
const Context = createContext<State>({
  session: null,
  profile: null,
  loading: false,
  error: "",
  refresh: async () => {},
});
export function AccountProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(!!authClient);
  const [error, setError] = useState("");
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
    const subscription = authClient?.auth.onAuthStateChange((event, next) => {
      if (!live.current) return;
      setSession(next);
      if (event === "TOKEN_REFRESHED") return;
      generation.current++;
      if (event === "SIGNED_OUT" || userId.current !== next?.user.id)
        setProfile(null);
      userId.current = next?.user.id ?? null;
      if (event === "PASSWORD_RECOVERY")
        window.location.replace("/cuenta/recuperar");
      else
        setTimeout(() => {
          if (live.current) void refresh();
        }, 0);
    });
    return () => {
      live.current = false;
      generation.current++;
      subscription?.data.subscription.unsubscribe();
    };
  }, [refresh]);
  return (
    <Context.Provider value={{ session, profile, loading, error, refresh }}>
      {children}
    </Context.Provider>
  );
}
export const useAccount = () => useContext(Context);
