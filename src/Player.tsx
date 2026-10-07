import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lightbulb, RotateCcw, ChevronRight, AlertCircle } from 'lucide-react';
import { missions, resources } from './data';
import { useDemo } from './store';
import { makeAttempt, scoreAttempt, summarize, type Attempt } from './progress';
import { DemoNote, Empty, PageHead, ButtonLink } from './ui';

export function Player() {
  const { slug } = useParams(); const mission = missions.find(m => m.slug === slug);
  const store = useDemo(); const navigate = useNavigate(); const [attemptId, setAttemptId] = useState<string>(); const [showHint, setShowHint] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    if (!mission) return;
    const draft = store.state.attempts.find(a => a.missionSlug === mission.slug && a.version === mission.version && !a.completedAt);
    if (draft) setAttemptId(draft.id);
    else { const created = makeAttempt(mission.slug); store.saveAttempt(created); setAttemptId(created.id); }
    setError(''); setShowHint(false);
    // Re-open the current draft only when changing mission, never on each save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission?.slug]);
  const attempt = store.state.attempts.find(a => a.id === attemptId);
  if (!mission) return <Missing/>;
  if (!attempt) return <p role="status" className="loading">Preparando tu misión…</p>;
  const step = mission.steps[attempt.index]; const evidenceStage = attempt.index === mission.steps.length;
  const confirmed = attempt.confirmed[attempt.index]; const answer = attempt.answers[attempt.index] || '';
  const correct = answer.trim() !== '' && Number(answer) === step?.correct;
  const update = (patch: Partial<Attempt>) => store.saveAttempt({ ...attempt, ...patch });
  const choose = (value: string) => { const answers = [...attempt.answers]; answers[attempt.index] = value; update({ answers }); setError(''); };
  const check = () => { if (!answer.trim()) { setError('Selecciona una opción o ingresa el monto antes de comprobar.'); return; } const next = [...attempt.confirmed]; next[attempt.index] = true; update({ confirmed: next }); };
  const next = () => { update({ index: attempt.index + 1 }); setShowHint(false); setError(''); };
  const finish = () => { if (attempt.evidence.trim().length < 25) { setError('Escribe al menos 25 caracteres para explicar tu respuesta. No incluyas datos personales.'); return; } update({ completedAt: new Date().toISOString() }); navigate(`/intentos/${attempt.id}/resultados`); };
  return <div className="player-page"><DemoNote/><div className="player-top"><Link className="text-link" to={`/desafios/${mission.slug}`}><ArrowLeft size={16}/> Ficha de la misión</Link><Link className="text-link" to="/mi-aprendizaje">Guardar y salir</Link></div>
    <div className="player-title"><span className="pill">{mission.title}</span><span className="muted">Etapa {attempt.index + 1} de {mission.steps.length + 1}</span></div>
    <div className="progress-track" role="progressbar" aria-label="Avance de la misión" aria-valuemin={0} aria-valuemax={mission.steps.length + 1} aria-valuenow={attempt.index}><span style={{ width: `${attempt.index / (mission.steps.length + 1) * 100}%` }}/></div>
    <div className="player-grid"><section className="panel task-panel" aria-labelledby="task-title" key={attempt.index}>
      <p className="eyebrow">{evidenceStage ? 'TU EVIDENCIA FINAL' : `DECISIÓN 0${attempt.index + 1}`}</p><h1 id="task-title">{evidenceStage ? 'Explica lo que aprendiste.' : step.title}</h1>
      <div className="case-note"><p>{evidenceStage ? mission.evidence : step.context}</p></div>
      {!evidenceStage ? <><h2 className="question">{step.prompt}</h2>{step.kind === 'number' ? <label className="field">Monto en pesos<input type="number" min="0" step="1" inputMode="numeric" value={answer} disabled={confirmed} onChange={e => choose(e.target.value)} placeholder="Ej.: 19000" aria-describedby="answer-error"/></label> : <fieldset className="choices" disabled={confirmed}><legend className="sr-only">Elige tu respuesta</legend>{step.options?.map((option, index) => <label key={option} className={`choice ${answer === String(index) ? 'chosen' : ''}`}><input type="radio" name={`step-${attempt.index}`} value={index} checked={answer === String(index)} onChange={() => choose(String(index))}/><span className="choice-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span></label>)}</fieldset>}
        {confirmed && <div className={`feedback ${correct ? 'good' : 'review'}`} role="status"><strong>{correct ? <CheckCircle2 size={20}/> : <RotateCcw size={20}/>} {correct ? 'Buen razonamiento.' : 'Una oportunidad para aprender.'}</strong><p>{step.feedback[step.kind === 'number' ? correct ? 1 : 0 : Number(answer)]}</p><small>Podrás mejorar esta decisión en un nuevo intento. Las ayudas no reducen tu avance.</small></div>}
        {error && <p className="form-error" id="answer-error" role="alert">{error}</p>}<div className="task-actions"><button className="text-button" onClick={() => setShowHint(!showHint)} aria-expanded={showHint}><Lightbulb size={17}/> {showHint ? 'Ocultar ayuda' : 'Necesito una pista'}</button>{confirmed ? <button className="button" onClick={next}>Continuar <ChevronRight size={18}/></button> : <button className="button" onClick={check}>Comprobar decisión <ChevronRight size={18}/></button>}</div>{showHint && <div className="hint">{step.hint}</div>}
      </> : <><label className="field">Tu explicación<textarea rows={7} value={attempt.evidence} maxLength={2500} onChange={e => { update({ evidence: e.target.value }); setError(''); }} placeholder="Usa las señales y decisiones del caso para explicar tu respuesta." aria-describedby="evidence-note"/></label><p className="muted small" id="evidence-note">Esta explicación quedará como evidencia de demostración. No recibe una calificación automática y requiere revisión docente en el piloto.</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="button" onClick={finish}>Terminar y ver resultados <CheckCircle2 size={18}/></button></>}
    </section><aside className="mission-sidebar"><div className="panel"><p className="eyebrow">TU MISIÓN</p><h3>Un paso a la vez.</h3><p className="muted">{mission.goal}</p><ol className="stage-list">{mission.steps.map((item,i)=><li key={item.title} className={i===attempt.index?'current':''}><span>{i<attempt.index?'✓':i+1}</span>{item.title}</li>)}<li className={evidenceStage?'current':''}><span>{mission.steps.length+1}</span>Evidencia final</li></ol></div><div className="panel glossary"><Lightbulb size={24}/><h3>Ayudas sin penalización</h3><p className="muted">Lee a tu ritmo, consulta una pista y vuelve a los datos. No hay vidas ni tiempo límite.</p>{mission.slug==='mision-iva' && <dl><dt>Neto</dt><dd>Monto antes de IVA.</dd><dt>Débito / crédito</dt><dd>En este caso: IVA de ventas / IVA de compras admitido.</dd></dl>}<details><summary>Releer el contexto</summary><p>{mission.context}</p></details></div></aside></div>
  </div>;
}
export function Results() {
  const { id } = useParams(); const store = useDemo(); const attempt = store.state.attempts.find(a => a.id === id && a.completedAt);
  if (!attempt) return <Missing title="No encontramos este resultado en tu navegador."/>;
  const mission = missions.find(m => m.slug === attempt.missionSlug)!; const summary = summarize(store.state.attempts); const milestone = summary.milestones.find(m => m.slug === mission.slug)!;
  return <><PageHead eyebrow="MISIÓN TERMINADA" title="Cada decisión te hace avanzar."><p>Completaste {mission.title}. Revisa lo que lograste y lo que puedes mejorar.</p></PageHead><DemoNote/>
    <div className="result-banner"><CheckCircle2 size={44}/><div><h2>{scoreAttempt(attempt)} de {mission.steps.length} criterios automáticos logrados</h2><p>No es una nota escolar. Tu evidencia escrita está pendiente de revisión.</p></div><div className="xp-chip">{milestone.xp} XP<span>acumulados en esta misión</span></div></div>
    <div className="two-column"><section className="panel"><h2>Tu recorrido, explicado</h2>{mission.steps.map((step,index)=> { const correct = Number(attempt.answers[index])===step.correct; return <div className="criterion" key={step.title}><div className="criterion-top">{correct ? <CheckCircle2 size={19}/> : <AlertCircle size={19}/>}<h3>{step.criterion}</h3><span className="pill">{correct ? 'Logrado' : 'Por mejorar'}</span></div><p className="muted">{step.feedback[step.kind==='number' ? correct?1:0 : Number(attempt.answers[index])]}</p></div>; })}<div className="criterion"><h3>Evidencia escrita · Pendiente de revisión</h3><blockquote>{attempt.evidence}</blockquote><p className="muted small">En esta demo puedes revisar tu explicación por claridad, uso de datos del caso y justificación. La plataforma no la evalúa automáticamente.</p></div></section>
    <aside><div className="panel"><p className="eyebrow">SIGUIENTE PASO</p><h2>¿Probamos otra vez?</h2><p className="muted">Revisa las pistas y aplica lo aprendido. Un nuevo intento conserva este resultado.</p><ButtonLink to={`/desafios/${mission.slug}/jugar`}>Mejorar mi intento</ButtonLink><Link className="text-link spaced" to="/mi-aprendizaje">Ver mi aprendizaje <ChevronRight size={17}/></Link></div><div className="panel spaced"><h3>Recompensas transparentes</h3><p className="muted">100 XP al completar por primera vez. 50 XP adicionales, una sola vez, si mejoras los criterios automáticos en otro intento. Repetir o recargar no duplica puntos.</p><p className="muted small">La evidencia escrita no suma XP de revisión automática.</p></div></aside></div>
    <section className="section"><h2>Consulta las referencias</h2><div className="resource-list">{resources.filter(r=>mission.sourceIds.includes(r.slug)).map(r=><Link className="resource-row" key={r.slug} to={`/recursos/${r.slug}`}><span>{r.title}</span><ChevronRight size={17}/></Link>)}</div></section>
  </>;
}
export function Missing({title='Esta página tomó otro camino.'}:{title?:string}) {return <><PageHead eyebrow="NO ENCONTRADO" title={title}/><Empty title="Volvamos al campus"><p className="muted">Revisa el enlace o explora las misiones disponibles. Los intentos de demostración solo existen en el navegador donde los hiciste.</p><ButtonLink to="/desafios">Explorar desafíos</ButtonLink></Empty></>;}
