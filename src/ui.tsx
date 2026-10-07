import { Link } from 'react-router-dom';
import { ArrowUpRight, Play, BriefcaseBusiness, Sprout, HeartHandshake, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { areaName, type Mission, type Area, areas } from './data';
import type { ReactNode } from 'react';
export function Logo() { return <Link className="logo" to="/" aria-label="TP PLAY, inicio"><span className="logo-icon"><Play size={17} fill="currentColor"/></span><span>TP<span className="logo-play">PLAY</span></span></Link>; }
export function AreaIcon({ area, size = 24 }: { area: Area; size?: number }) { const Icon = area === 'administracion' ? BriefcaseBusiness : area === 'agropecuaria' ? Sprout : area === 'parvulos' ? HeartHandshake : Sparkles; return <Icon size={size}/>; }
export function SectionHead({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) { return <div className="section-head"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{subtitle && <p className="muted">{subtitle}</p>}</div>{action}</div>; }
export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) { return <header className="page-head"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <div className="muted measure">{children}</div>}</header>; }
export function ButtonLink({ to, children, secondary = false }: { to: string; children: ReactNode; secondary?: boolean }) { return <Link className={`button ${secondary ? 'secondary' : ''}`} to={to}>{children}<ArrowRight size={17}/></Link>; }
export function DemoNote() { return <div className="demo-note"><Sparkles size={16}/><span>Demostración · Casos ficticios · Avance solo en este navegador</span></div>; }
export function Empty({ title, children }: { title: string; children?: ReactNode }) { return <div className="empty"><Sparkles size={32}/><h3>{title}</h3>{children}</div>; }
export function MissionCard({ mission, index = 0 }: { mission: Mission; index?: number }) { return <article className="mission-card">
  <Link to={`/desafios/${mission.slug}`} className={`mission-art art-${mission.area}`} aria-label={`Ver ${mission.title}`}>
    <span className="art-grid"/><span className="art-number">0{index + 1}</span><span className="art-sticker">MISIÓN DEMO</span>
    <span className="art-symbol"><AreaIcon area={mission.area} size={68}/></span>
    <span className="art-detail">{mission.area === 'administracion' ? '19% · COMPRA · VENTA' : mission.area === 'agropecuaria' ? 'OBSERVA · DECIDE · CUIDA' : 'PREPARA · COMUNICA · CONECTA'}</span>
  </Link>
  <div className="mission-copy"><p className="card-eyebrow">{areaName(mission.area)}</p><h3><Link to={`/desafios/${mission.slug}`}>{mission.title}</Link></h3><p className="muted">{mission.subtitle}</p><div className="meta"><span><Clock size={14}/>{mission.duration}*</span><span>◈ {mission.difficulty}</span></div><Link className="text-link" to={`/desafios/${mission.slug}`}>Ver desafío <ArrowUpRight size={16}/></Link></div>
  </article>; }
export function SpecialtyCards() { return <div className="specialty-grid">{areas.map(area => <Link key={area.id} className={`specialty-card specialty-${area.color}`} to={`/especialidades/${area.id}`}><div className="specialty-illustration"><AreaIcon area={area.id} size={64}/><span className="specialty-circle"/></div><p className="card-eyebrow">{area.tag}</p><h3>{area.name}</h3><p>{area.description}</p><span className="text-link">Explorar especialidad <ArrowUpRight size={17}/></span></Link>)}</div>; }
