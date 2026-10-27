import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Attempt } from "../../progress";
import {
  enqueueReactions,
  gameReactions,
  openingReactions,
  reactionPosition,
  type ReactionEvent,
} from "./reactions";

export function GameReaction({
  event,
  onFinished,
}: {
  event: ReactionEvent;
  onFinished: () => void;
}) {
  const [exiting, setExiting] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    size: number;
  }>();
  const finished = useRef(onFinished);
  finished.current = onFinished;
  useEffect(() => {
    const hide = window.setTimeout(
      () => setExiting(true),
      gameReactions[event.type].duration,
    );
    const done = window.setTimeout(
      () => finished.current(),
      gameReactions[event.type].duration + 300,
    );
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(done);
    };
  }, [event.id, event.type]);
  useEffect(() => {
    let frame = 0;
    const place = () => {
      const width = window.innerWidth,
        height = window.innerHeight;
      const size = Math.min(width < 700 ? width * 0.44 : 320, height * 0.48);
      const obstacles = Array.from(
        document.querySelectorAll(
          'button, a[href], input, select, textarea, h1, h2, .simulation-hud, [role="alert"]',
        ),
      )
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width && r.height && r.bottom > 0 && r.top < height);
      const next = {
        ...reactionPosition(width, height, size, obstacles),
        size,
      };
      setPosition((old) =>
        old &&
        old.left === next.left &&
        old.top === next.top &&
        old.size === size
          ? old
          : next,
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    place();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    const observer = new MutationObserver(schedule);
    const game = document.querySelector(".simulation-game");
    if (game) observer.observe(game, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, []);
  const signed = (n: number) =>
    `${n > 0 ? "+" : "−"}${Math.abs(n).toLocaleString("es-CL")}`;
  return createPortal(
    <aside
      className={`game-reaction ${exiting ? "game-reaction-exit" : ""}`}
      data-reaction={event.type}
      style={
        position
          ? {
              left: position.left,
              top: position.top,
              width: position.size,
              height: position.size,
            }
          : undefined
      }
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="game-reaction-art" aria-hidden="true">
        <img
          src={gameReactions[event.type].asset}
          alt=""
          width="320"
          height="240"
          draggable="false"
        />
      </div>
      <div className="game-reaction-caption">
        <strong>{event.message}</strong>
        {!!event.amount && (
          <span>
            {event.amount > 0 ? "+" : "−"}$
            {Math.abs(event.amount).toLocaleString("es-CL")} Coihues
          </span>
        )}
        {!!event.xp && <span>{signed(event.xp)} XP de gestión</span>}
        {!!event.reputation && (
          <span>{signed(event.reputation)} reputación</span>
        )}
        <small>{event.detail}</small>
      </div>
    </aside>,
    document.body,
  );
}

export function ReactionQueue({ attempt }: { attempt: Attempt }) {
  const previous = useRef(attempt);
  const [queue, setQueue] = useState<ReactionEvent[]>([]);
  useEffect(() => {
    const before = previous.current;
    previous.current = attempt;
    if (before.id !== attempt.id) {
      setQueue([]);
      return;
    }
    const events = openingReactions(before, attempt);
    if (events.length) setQueue((q) => enqueueReactions(q, events));
  }, [attempt]);
  useEffect(() => {
    const load = () => {
      Object.values(gameReactions).forEach((config) => {
        const image = new Image();
        image.src = config.asset;
      });
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(load, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(load, 1500);
    return () => clearTimeout(id);
  }, []);
  const active = queue[0];
  return active ? (
    <GameReaction
      key={active.id}
      event={active}
      onFinished={() => setQueue((q) => q.slice(1))}
    />
  ) : null;
}
