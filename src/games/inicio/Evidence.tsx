import { inicioMission } from './content';
export function CamilaEvidence() {
 const [intro, questions, closing, privacy] = inicioMission.evidence.split('\n\n');
 return <div><p><strong>{intro}</strong></p><p>En tu respuesta debes explicar:</p><ul>{questions.split('\n').slice(1).map(item => <li key={item}>{item.slice(2)}</li>)}</ul><p>{closing}</p><p><strong>{privacy}</strong></p></div>;
}
