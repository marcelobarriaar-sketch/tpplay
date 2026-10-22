import {MissionCurriculum} from '../Administration';
import { lazy, Suspense, Fragment, type ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { Guard } from "./Identity";
import { useAccount } from "./Session";
import {
  AdventureEntry,
  AccountAccess,
  MyAccount,
  AccountPrivacy,
} from "./Account";
const CloudGame = lazy(() => import("./CloudGame"));
const TeacherPanel = lazy(() => import("./TeacherPanel"));
const AdminAccounts = lazy(() => import("./AdminAccounts"));
function IdentityBoundary({ children }: { children: ReactNode }) {
  const { session, profile } = useAccount();
  return (
    <Fragment
      key={`${session?.user.id ?? "guest"}:${profile?.role ?? "pending"}`}
    >
      {children}
    </Fragment>
  );
}
export default function AccountArea() {
  const { pathname } = useLocation();
  const page =
    pathname === "/juegos/mision-tributos" ? (
      <><MissionCurriculum slug="mision-tributos"/><CloudGame /></>
    ) : pathname === "/acompanamiento" ? (
      <Guard roles={["teacher", "admin"]}>
        <TeacherPanel />
      </Guard>
    ) : pathname === "/administracion-cuentas" ? (
      <AdminAccounts />
    ) : pathname === "/cuenta/cursos" ? (
      <MyAccount />
    ) : pathname === "/cuenta" ? (
      <Navigate to="/perfil" replace />
    ) : pathname === "/privacidad" || pathname === "/cuenta/privacidad" ? (
      <AccountPrivacy />
    ) : pathname === "/recuperar-acceso" ||
      pathname === "/ingresar" ||
      pathname === "/registro" ||
      ["/cuenta/ingresar", "/cuenta/crear", "/cuenta/recuperar"].includes(
        pathname,
      ) ? (
      <AccountAccess />
    ) : (
      <AdventureEntry />
    );
  return (
    <>
      <IdentityBoundary>
        <Suspense fallback={<p role="status">Preparando tu espacio…</p>}>
          {page}
        </Suspense>
      </IdentityBoundary>
    </>
  );
}
