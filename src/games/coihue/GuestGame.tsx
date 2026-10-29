import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { reduceGame, type GameEvent } from '../../../server/learningDomain';
import { restore, storageKey } from './progress';
import CoihueGame from './Game';

/** Public practice never calls the learning API or writes academic records. */
export default function GuestGame() {
  const [params] = useSearchParams();
  const [game, setGame] = useState(() => {
    try {
      const restored = restore(typeof localStorage === "undefined" ? null : localStorage.getItem(storageKey));
      return params.get("vista") === "mapa" ? { ...restored, state: { ...restored.state, started: true } } : restored;
    }
    catch { return { ...restore(null), notice: 'Puedes jugar, pero este navegador no permite conservar el avance.' }; }
  });
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(game.state)); }
    catch { setStorageError('Puedes seguir jugando. El avance se perderá al cerrar esta página porque el navegador no permite guardarlo.'); }
  }, [game.state]);
  const send = (event: GameEvent) => setGame(current => {
    try { return { state: reduceGame(current.state, event).state, notice: '' }; }
    catch (e) { return { ...current, notice: (e as Error).message }; }
  });
  return <>
    <section className="notice" aria-label="Experiencia libre">
      <strong>Explora y aprende sin cuenta</strong>
      <p>Tu recorrido se conserva solo en este navegador. Esta práctica no suma puntos al ranking ni genera calificaciones escolares.</p>
      <Link className="text-link" to="/cuenta/crear">Crear una cuenta para registrar mi aprendizaje</Link>
    </section>
    {(game.notice || storageError) && <p role="status">{game.notice || storageError}</p>}
    <CoihueGame state={game.state} onEvent={send} guest />
  </>;
}
