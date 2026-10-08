import { lazy, Suspense, Fragment, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AccountProvider, useAccount } from "./Session";
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
      <CloudGame />
    ) : pathname === "/acompanamiento" ? (
      <TeacherPanel />
    ) : pathname === "/administracion-cuentas" ? (
      <AdminAccounts />
    ) : pathname === "/cuenta" ? (
      <MyAccount />
    ) : pathname === "/privacidad" || pathname === "/cuenta/privacidad" ? (
      <AccountPrivacy />
    ) : pathname === "/recuperar-acceso" ||
      ["/cuenta/ingresar", "/cuenta/crear", "/cuenta/recuperar"].includes(
        pathname,
      ) ? (
      <AccountAccess />
    ) : (
      <AdventureEntry />
    );
  return (
    <AccountProvider>
      <IdentityBoundary>
        <Suspense fallback={<p role="status">Preparando tu espacio…</p>}>
          {page}
        </Suspense>
      </IdentityBoundary>
    </AccountProvider>
  );
}
