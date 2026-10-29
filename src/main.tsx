import Ranking from "./accounts/Ranking";
import {Administration} from './Administration';
import {
  lazy,
  Suspense,
  Component,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Menu,
  X,
  Search,
  ArrowUpRight,
  WifiOff,
  AlertCircle,
  Compass,
  Settings,
} from "lucide-react";
import { DemoProvider, useDemo } from "./store";
import { Logo } from "./ui";
import { Player, Results, Missing } from "./Player";
import {
  Home,
  Catalog,
  MissionDetail,
  Specialties,
  Specialty,
  Library,
  ResourceDetail,
  Dashboard,
  LearningRoute,
  HowItWorks,
  Teacher,
  Access,
  Profile,
  Info,
} from "./pages";
import Admin from "./Admin";
import Seo from "./Metadata";

import { AccountProvider, useAccount } from "./accounts/Session";
import { authClient } from "./accounts/client";
import {
  StudentDashboard,
  UserProfile,
  InstitutionalDashboard,
  Guard,
} from "./accounts/Identity";
import CloudMission from "./accounts/CloudMission";
import UserAdmin from "./accounts/UserAdmin";
import TeacherPanel from "./accounts/TeacherPanel";
import { AcademicDashboard } from "./accounts/AcademicDashboard";
import "./styles.css";
import "./games/coihue/game.css";
const AccountArea = lazy(() => import("./accounts/Area"));
const AccountRoute = () => (
  <Suspense fallback={<p role="status">Preparando tu espacio…</p>}>
    <AccountArea />
  </Suspense>
);

class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="fatal">
        <h1>La página necesita un nuevo intento.</h1>
        <p>
          No pudimos completar la acción. Recarga para recuperar el avance
          guardado en este navegador.
        </p>
        <button className="button" onClick={() => window.location.reload()}>
          Recargar
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
const participantRoles = { student: "Alumno", teacher: "Profesor", admin: "Superadministrador", institution_admin: "Administrador institucional" };
function Header() {
  const { profile, loading, logout } = useAccount();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const toggle = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearchOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  const nav = profile
    ? [
        ["Inicio", "/"],
        ["Misiones", "/desafios"],
        ["Mi progreso", "/alumno"],
        ["Mi perfil", "/perfil"],
        [
          "Mi espacio",
          profile.role === "student"
            ? "/alumno"
            : profile.role === "teacher"
              ? "/docente"
              : profile.role === "institution_admin"
                ? "/institucion"
                : "/admin",
        ],
      ]
    : [
        ["Inicio", "/"],
        ["Especialidades", "/especialidades"],
        ["Desafíos", "/desafios"],
        ["Recursos", "/recursos"],
        ["Cómo funciona", "/como-funciona"],
      ];
  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav
          aria-label="Navegación principal"
          className={`main-nav ${open ? "open" : ""}`}
          id="main-nav"
        >
          {nav.map(([label, to]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
          <Link className="mobile-learning" to="/mi-aprendizaje">
            {profile ? "Mi progreso" : "Mi aprendizaje demo"}
          </Link>
          {!profile && (
            <Link className="mobile-learning" to="/cuenta/crear">
              Crear cuenta
            </Link>
          )}
          <Link className="mobile-learning" to="/admin">
            Administración
          </Link>
          {profile && (
            <button
              className="text-button mobile-learning"
              onClick={() => void logout()}
            >
              Cerrar sesión
            </button>
          )}
        </nav>
        <div className="header-actions">
          <Link
            className="icon-button admin-gear"
            to="/admin"
            aria-label="Acceso de administrador"
            title="Administración"
          >
            <Settings size={23} />
          </Link>
          <Link
            className="learning-icon"
            aria-label="Mi aprendizaje de demostración"
            to="/mi-aprendizaje"
          >
            <Compass size={21} />
          </Link>
          <button
            className="icon-button"
            aria-label={searchOpen ? "Cerrar búsqueda" : "Buscar desafíos"}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search size={21} />
          </button>
          <Link
            className={`login-link ${profile ? "participant-link" : ""}`}
            title={profile ? `${participantRoles[profile.role]} · ${profile.name}` : undefined}
            to={profile ? "/perfil" : "/cuenta/ingresar"}
          >
            {loading
              ? "Comprobando…"
              : profile ? <span className="participant-identity"><span className="participant-role">{participantRoles[profile.role]}</span><span className="participant-name">{profile.name}</span></span> : "Ingresar"}{" "}
            <ArrowUpRight size={16} />
          </Link>
          {profile ? (
            <button className="text-button" onClick={() => void logout()}>
              Cerrar sesión
            </button>
          ) : (
            <Link className="login-link create-account-link" to="/cuenta/crear">
              Crear cuenta
            </Link>
          )}
          <button
            ref={toggle}
            className="icon-button menu-toggle"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {searchOpen && (
        <form
          className="header-search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/desafios?q=${encodeURIComponent(query)}`);
          }}
        >
          <label className="search-field">
            <Search size={20} />
            <span className="sr-only">Buscar una misión</span>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué quieres aprender hoy?"
            />
          </label>
          <button className="button" type="submit">
            Buscar
          </button>
        </form>
      )}
    </header>
  );
}
function LearningEntry() {
  const { profile } = useAccount();
  return profile?.role === "student" ? <StudentDashboard /> : <Dashboard />;
}
function AccountLayout() {
  const { session, profile } = useAccount();
  return (
    <DemoProvider
      key={`${session?.user.id || "guest"}:${profile?.role || "pending"}`}
    >
      <Layout />
    </DemoProvider>
  );
}
function MissionEntry({ result = false }: { result?: boolean }) {
  const { profile, session, loading } = useAccount();
  const { search, pathname } = useLocation();
  const free = new URLSearchParams(search).get("modo") === "libre";
  if (!free && loading && session) return <p role="status">Comprobando sesión…</p>;
  if (!free && (profile?.role === "student" || (session && !profile))) return <>{!result&&<Link className="text-link spaced" to={`${pathname}?modo=libre`}>Probar sin registrar una calificación</Link>}<CloudMission result={result}/></>;
  return <><section className="notice"><strong>Experiencia libre · sin cuenta obligatoria</strong><p>Puedes jugar y descubrir lo que aprendes. El avance queda en este navegador; para registrar puntos y calificaciones, usa una cuenta de estudiante.</p><Link className="text-link" to="/cuenta/crear">Crear mi cuenta</Link></section>{result ? <Results /> : <Player />}</>;
}
function AdminEntry() {
  const { profile, session, loading } = useAccount();
  if (loading) return <p role="status">Comprobando acceso…</p>;
  if (profile || session) return <UserAdmin />;
  return (
    <section className="panel account-panel">
      <p className="eyebrow">ADMINISTRACIÓN TP PLAY</p>
      <h1>Acceso protegido</h1>
      <p>
        Ingresa con una cuenta administradora autorizada para gestionar
        usuarios.
      </p>
      <Link className="button" to="/cuenta/ingresar">
        Ingresar con mi cuenta
      </Link>
      <p className="muted spaced">
        <Link to="/admin/mantenimiento">
          Acceso de mantenimiento editorial existente
        </Link>
      </p>
    </section>
  );
}
function Layout() {
  const { error: accountError } = useAccount();
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  const { state, saveError, retry } = useDemo();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    window.scrollTo(0, 0);
    main.current?.focus({ preventScroll: true });
  }, [location.pathname]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return (
    <div className={state.reducedMotion ? "reduced-motion" : ""}>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Seo />
      <Header />
      {accountError && (
        <p className="status-banner" role="alert">
          {accountError}
        </p>
      )}
      {!online && (
        <div className="status-banner" role="status">
          <WifiOff size={18} />
          <span>
            Estás sin conexión. Las aventuras con cuenta necesitan internet para
            guardar respuestas. Puedes reintentar al volver la conexión.
          </span>
          <button
            className="text-button"
            onClick={() => setOnline(navigator.onLine)}
          >
            Comprobar conexión
          </button>
        </div>
      )}
      {saveError && (
        <div className="status-banner" role="alert">
          <AlertCircle size={18} />
          <span>{saveError}</span>
          <button className="button secondary" onClick={retry}>
            Reintentar guardado
          </button>
        </div>
      )}
      <main id="contenido" ref={main} tabIndex={-1} className="container">
        <Routes>
          <Route path="/aventura" element={<AccountRoute />} />
          <Route path="/cuenta/*" element={<AccountRoute />} />
          <Route path="/acompanamiento" element={<AccountRoute />} />
          <Route path="/administracion-cuentas" element={<AccountRoute />} />
          <Route path="/" element={<Home />} />
          <Route path="/especialidades" element={<Specialties />} />
          <Route path="/especialidades/:slug" element={<Specialty />} />
<Route path="/especialidades/administracion/:grado" element={<Administration/>}/>
          <Route
            path="/especialidades/:slug/modulos/:modulo"
            element={<Specialty />}
          />
          <Route path="/juegos/mision-tributos" element={<AccountRoute />} />
          <Route path="/desafios" element={<Catalog />} />
          <Route path="/desafios/:slug" element={<MissionDetail />} />
          <Route path="/desafios/:slug/jugar" element={<MissionEntry />} />
          <Route
            path="/intentos/:id/resultados"
            element={<MissionEntry result />}
          />
          <Route path="/recursos" element={<Library />} />
          <Route path="/recursos/:slug" element={<ResourceDetail />} />
          <Route path="/como-funciona" element={<HowItWorks />} />
          <Route path="/mi-aprendizaje" element={<LearningEntry />} />
          <Route path="/mi-aprendizaje/rutas/:id" element={<LearningRoute />} />
          <Route path="/alumno" element={<StudentDashboard />} /><Route path="/ranking" element={<Ranking />} />
          <Route path="/institucion" element={<InstitutionalDashboard />} />
          <Route
            path="/docente"
            element={
              <Guard roles={["teacher", "admin"]}>
                <TeacherPanel />
              </Guard>
            }
          />
          <Route
            path="/admin/contenidos"
            element={
              <Guard roles={["admin"]}>
                <Admin />
              </Guard>
            }
          />
          <Route path="/admin/mantenimiento" element={<Admin />} />
          <Route
            path="/docente/*"
            element={
              <Guard roles={["teacher", "admin"]}>
                <Info kind="denegado" />
              </Guard>
            }
          />
          <Route path="/admin/cursos" element={<Guard roles={["admin"]}><AcademicDashboard /></Guard>} />
          <Route path="/admin" element={<AdminEntry />} />
          <Route path="/ingresar" element={<AccountRoute />} />
          <Route path="/recuperar-acceso" element={<AccountRoute />} />
          <Route path="/perfil" element={<UserProfile />} />
          <Route path="/preferencias" element={<Profile />} />
          <Route path="/registro" element={<AccountRoute />} />
          <Route path="/ayuda" element={<Info kind="ayuda" />} />
          <Route path="/privacidad" element={<AccountRoute />} />
          <Route path="/condiciones" element={<Info kind="condiciones" />} />
          <Route path="*" element={<Missing />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="container footer-top">
          <div>
            <Logo />
            <p>
              Aprende jugando.
              <br />
              Construye tu futuro.
            </p>
            <span className="pill">Aprende a tu ritmo</span>
          </div>
          <div>
            <h3>Explora</h3>
            <Link to="/especialidades">Especialidades</Link>
            <Link to="/desafios">Desafíos</Link>
            <Link to="/recursos">Fuentes educativas</Link>
            <Link to="/como-funciona">Cómo funciona</Link>
          </div>
          <div>
            <h3>Tu recorrido</h3>
            <Link to="/mi-aprendizaje">Mi aprendizaje demo</Link>
            <Link to="/perfil">Preferencias</Link>
            <Link to="/acompanamiento">Espacio docente</Link>
          </div>
          <div>
            <h3>Conversemos</h3>
            <Link to="/ayuda">Ayuda y contacto</Link>
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/condiciones">Condiciones</Link>
            <a
              href="https://github.com/marcelobarriaar-sketch/tpplay"
              target="_blank"
              rel="noreferrer"
            >
              Proyecto en GitHub ↗
            </a>
          </div>
        </div>
        <div className="container creator-signature">
          <p>
            Sitio creado por el docente TP{" "}
            <strong>Marcelo Barría Arismendi</strong>
          </p>
          <div>
            <a href="tel:+56930357842">Contacto: +56 9 3035 7842</a>
            <a href="mailto:marcelo.barriaar@gmail.com">
              marcelo.barriaar@gmail.com
            </a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 TP PLAY</span>
          <span>Hecho para aprender. Diseñado para volver a intentar.</span>
          <span>Valle del Coihue · TP PLAY</span>
        </div>
      </footer>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AccountProvider>
        <AccountLayout />
      </AccountProvider>
    </BrowserRouter>
  </ErrorBoundary>,
);
