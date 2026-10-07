import { createContext, useContext, useState, type ReactNode } from 'react';
import { initialState, parseDemoState, STORAGE_KEY, type DemoState, type Attempt } from './progress';
type Store = { state: DemoState; saveError: string; saveAttempt: (attempt: Attempt) => void; save: (state: DemoState) => void; retry: () => void };
const Context = createContext<Store | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(() => {
    try { const value = localStorage.getItem(STORAGE_KEY); return { state: value ? parseDemoState(value) : initialState, error: '' }; }
    catch { return { state: initialState, error: 'No pudimos recuperar el avance local. Puedes continuar esta sesión; los datos anteriores no se han eliminado.' }; }
  });
  const [state, setState] = useState<DemoState>(loaded.state);
  const [saveError, setSaveError] = useState(loaded.error);
  const write = (next: DemoState) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setSaveError(''); }
    catch { setSaveError('No se pudo guardar en este navegador. Conservamos tu avance en esta sesión; reintenta antes de cerrar la página.'); }
  };
  const save = (next: DemoState) => { setState(next); write(next); };
  const saveAttempt = (attempt: Attempt) => save({ ...state, attempts: [...state.attempts.filter(a => a.id !== attempt.id), attempt] });
  return <Context.Provider value={{ state, saveError, save, saveAttempt, retry: () => write(state) }}>{children}</Context.Provider>;
}
export function useDemo() { const store = useContext(Context); if (!store) throw new Error('Falta el proveedor de demostración'); return store; }
