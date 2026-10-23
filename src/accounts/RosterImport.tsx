import { useEffect, useState } from "react";
import { learningApi } from "./client";
import { rosterFromCells, type RosterStudent } from "./rosterValidation";
import type { Assignment } from "./AcademicSetup";
type ImportRow = {
  position: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  message: string;
};
type Batch = { id: string; rows: ImportRow[] };
const labels: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  invited: "Invitación enviada",
  enrolled: "Matriculado",
  error: "Requiere reintento",
};
export function RosterImport({
  assignment,
  done,
}: {
  assignment?: Assignment;
  done: () => void;
}) {
  return assignment ? (
    <RosterImportForm assignment={assignment} done={done} />
  ) : (
    <section className="panel spaced">
      <h2>Cargar alumnos desde Excel</h2>
      <p>
        <a href="/plantillas/alumnos-tpplay.xlsx" download>
          Descargar plantilla Excel
        </a>
      </p>
      <p>
        Selecciona un curso y asignatura validados para subir tu lista de
        alumnos. Si están pendientes, administración debe validarlos primero.
      </p>
    </section>
  );
}
function RosterImportForm({
  assignment,
  done,
}: {
  assignment: Assignment;
  done: () => void;
}) {
  const [students, setStudents] = useState<RosterStudent[]>([]),
    [errors, setErrors] = useState<string[]>([]),
    [checked, setChecked] = useState(false),
    [existing, setExisting] = useState(0),
    [busy, setBusy] = useState(false),
    [batch, setBatch] = useState<Batch | null>(null),
    [history, setHistory] = useState<{ id: string; created_at: string }[]>([]),
    [notice, setNotice] = useState("");
  const loadHistory = () =>
    learningApi<{ imports: typeof history }>(
      "rosterHistory&assignment=" + assignment.id,
    ).then((d) => setHistory(d.imports));
  useEffect(() => {
    setStudents([]);
    setBatch(null);
    setErrors([]);
    setChecked(false);
    void loadHistory().catch((e) => setNotice(e.message));
  }, [assignment.id]);
  async function read(file: File | undefined) {
    setErrors([]);
    setChecked(false);
    setBatch(null);
    setStudents([]);
    if (!file) return;
    setBusy(true);
    try {
      if (!file.name.toLowerCase().endsWith(".xlsx") || file.size > 1024 * 1024)
        throw Error("Usa un archivo .xlsx de hasta 1 MB.");
      const { default: readExcel } = await import("read-excel-file/browser");
      const sheets = await readExcel(file);
      const sheet = sheets.find((s) => s.sheet === "Alumnos");
      if (!sheet)
        throw Error("No se encontró la hoja Alumnos de la plantilla.");
      const result = rosterFromCells(sheet.data);
      setStudents(result.students);
      setErrors(result.errors);
      if (result.errors.length) return;
      const validation = await learningApi<{
        errors: string[];
        existing: number;
      }>("rosterPreview", { assignment: assignment.id, rows: result.students });
      setErrors(validation.errors);
      setExisting(validation.existing);
      setChecked(!validation.errors.length);
    } catch (e) {
      setErrors([(e as Error).message]);
    } finally {
      setBusy(false);
    }
  }
  async function status(id: string) {
    const d = await learningApi<Batch>("rosterStatus&id=" + id);
    setBatch(d);
    return d;
  }
  async function process(id: string, retry = false) {
    setBusy(true);
    setNotice(
      "La carga queda guardada; puedes continuarla si cierras esta página.",
    );
    try {
      if (retry) await learningApi("rosterRetry", { id });
      let current = await status(id);
      for (
        let i = 0;
        i < 200 &&
        current.rows.some((r) => ["pending", "processing"].includes(r.status));
        i++
      ) {
        const next = await learningApi<{ processed: boolean }>(
          "rosterProcess",
          { id },
        );
        current = await status(id);
        if (!next.processed) break;
      }
      setNotice(
        current.rows.some((r) => r.status === "processing")
          ? "Hay una fila en proceso. Espera tres minutos antes de continuar si hubo una interrupción."
          : "Proceso terminado. Revisa el estado de cada alumno. Los errores se pueden reintentar.",
      );
      done();
      void loadHistory().catch((e) => setNotice(e.message));
    } catch (e) {
      setNotice(
        (e as Error).message + " La carga se conserva; pulsa Continuar carga.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    setBusy(true);
    try {
      const d = await learningApi<{ id: string }>("rosterCreate", {
        id: crypto.randomUUID(),
        assignment: assignment.id,
        rows: students,
      });
      await process(d.id);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      void loadHistory().catch((e) => setNotice(e.message));
      setBusy(false);
    }
  }
  return (
    <details className="panel spaced">
      <summary>Cargar alumnos desde Excel</summary>
      <p>
        <strong>
          {assignment.class_groups.schools.name} ·{" "}
          {assignment.class_groups.schools.cities?.name} ·{" "}
          {assignment.class_groups.name} · {assignment.subjects.name}
        </strong>
      </p>
      <ol>
        <li>
          <a
            className="button secondary"
            href="/plantillas/alumnos-tpplay.xlsx"
            download
          >
            Descargar plantilla Excel
          </a>
        </li>
        <li>
          Completa la hoja «Alumnos»: nombres, apellidos y correo individual de
          cada alumno. Máximo 200 por archivo. No incluyas RUT ni contraseñas.
        </li>
        <li>Sube la planilla, revisa la lista y confirma la carga.</li>
      </ol>
      <label className="field">
        Planilla de alumnos (.xlsx)
        <input
          key={assignment.id}
          type="file"
          accept=".xlsx"
          disabled={busy}
          onChange={(e) => void read(e.target.files?.[0])}
        />
      </label>
      {busy && (
        <p role="status">
          Procesando… Mantén esta página abierta hasta ver el resultado.
        </p>
      )}
      {errors.length > 0 && (
        <div role="alert">
          <p>Corrige estos datos y vuelve a subir el archivo:</p>
          <ul>
            {errors.slice(0, 20).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {students.length > 0 && !batch && (
        <>
          <p>
            {students.length} alumnos · {existing} cuentas existentes ·{" "}
            {students.length - existing} invitaciones nuevas.
          </p>
          <div className="identity-table-wrap">
            <table className="identity-table">
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Nombres</th>
                  <th>Apellidos</th>
                  <th>Correo</th>
                </tr>
              </thead>
              <tbody>
                {students.map((r, i) => (
                  <tr key={i}>
                    <td>{r.row}</td>
                    <td>{r.first_name}</td>
                    <td>{r.last_name}</td>
                    <td>{r.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Al confirmar se crearán las cuentas nuevas y se enviará un enlace de
            activación por correo. Las cuentas existentes del mismo
            establecimiento se incorporarán a esta asignatura sin cambiar sus
            contraseñas.
          </p>
          <button
            className="button"
            disabled={busy || !checked}
            onClick={() => void start()}
          >
            Confirmar carga y enviar invitaciones
          </button>
        </>
      )}
      {notice && <p role="status">{notice}</p>}
      {batch && (
        <>
          <p>
            {
              batch.rows.filter((r) =>
                ["invited", "enrolled"].includes(r.status),
              ).length
            }{" "}
            de {batch.rows.length} alumnos registrados ·{" "}
            {batch.rows.filter((r) => r.status === "error").length} con errores.
          </p>
          <div className="identity-table-wrap">
            <table className="identity-table">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {batch.rows.map((r) => (
                  <tr key={r.position}>
                    <td>
                      {r.first_name} {r.last_name}
                    </td>
                    <td>{r.email}</td>
                    <td>{labels[r.status]}</td>
                    <td>{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {batch.rows.some((r) =>
            ["pending", "processing"].includes(r.status),
          ) && (
            <button
              className="button"
              disabled={busy}
              onClick={() => void process(batch.id)}
            >
              Continuar carga
            </button>
          )}
          {batch.rows.some((r) => r.status === "error") && (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => void process(batch.id, true)}
            >
              Reintentar filas con error
            </button>
          )}
        </>
      )}
      <p className="small muted">
        El estado de correo confirma la aceptación del envío por el proveedor,
        no su lectura. El alumno define su contraseña y acepta los términos al
        activar la cuenta. Si no encuentra el mensaje, debe revisar spam o usar
        «Recuperar contraseña» con ese correo.
      </p>
      {history.length > 0 && (
        <details>
          <summary>Últimas 10 cargas de esta asignatura</summary>
          <ul>
            {history.map((h) => (
              <li key={h.id}>
                {new Date(h.created_at).toLocaleString("es-CL", {
                  timeZone: "America/Santiago",
                })}{" "}
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() =>
                    void status(h.id).catch((e) => setNotice(e.message))
                  }
                >
                  Ver carga
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </details>
  );
}
