export type RosterStudent = {
  first_name: string;
  last_name: string;
  email: string;
  row: number;
};
export const rosterLimit = 200;
export function validateRoster(input: unknown): {
  students: RosterStudent[];
  errors: string[];
} {
  const errors: string[] = [],
    students: RosterStudent[] = [];
  const seen = new Set<string>();
  if (!Array.isArray(input) || !input.length || input.length > rosterLimit)
    return {
      students,
      errors: [`Incluye entre 1 y ${rosterLimit} alumnos por archivo.`],
    };
  input.forEach((raw, i) => {
    const r = raw as Record<string, unknown>;
    const row =
      r &&
      Number.isInteger(r.row) &&
      Number(r.row) >= 2 &&
      Number(r.row) <= 100000
        ? Number(r.row)
        : i + 2;
    if (!r || typeof r !== "object") {
      errors.push(`Fila ${row}: datos inválidos.`);
      return;
    }
    const first_name =
        typeof r.first_name === "string"
          ? r.first_name.trim().replace(/\s+/g, " ")
          : "",
      last_name =
        typeof r.last_name === "string"
          ? r.last_name.trim().replace(/\s+/g, " ")
          : "",
      email = typeof r.email === "string" ? r.email.trim().toLowerCase() : "";
    if (
      [first_name, last_name].some(
        (v) => v.length < 2 || v.length > 60 || /^[=+@-]|[\x00-\x1f<>]/.test(v),
      )
    )
      errors.push(
        `Fila ${row}: nombres y apellidos deben tener entre 2 y 60 caracteres, sin fórmulas ni etiquetas.`,
      );
    if (
      email.length > 254 ||
      !/^[-a-z0-9.!#$%&'*+/=?^_`{|}~]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(
        email,
      ) ||
      /^[=+@-]/.test(email)
    )
      errors.push(`Fila ${row}: revisa el correo del alumno.`);
    if (seen.has(email))
      errors.push(`Fila ${row}: correo repetido dentro de la planilla.`);
    seen.add(email);
    students.push({ first_name, last_name, email, row });
  });
  return { students, errors };
}
export function rosterFromCells(cells: unknown[][]) {
  const headers = cells[0] || [];
  if (
    headers.length !== 3 ||
    headers
      .map((v) =>
        String(v || "")
          .trim()
          .toLowerCase(),
      )
      .join("|") !== "nombres|apellidos|correo"
  )
    throw Error(
      "Usa la hoja Alumnos de la plantilla, con las columnas Nombres, Apellidos y Correo en ese orden.",
    );
  const rows = cells
    .slice(1)
    .map((cells, i) => ({ cells, row: i + 2 }))
    .filter((r) =>
      r.cells.some((v) => v !== null && v !== undefined && v !== ""),
    );
  if (rows.some((r) => r.cells.length > 3))
    throw Error(
      "La hoja Alumnos debe contener únicamente las tres columnas de la plantilla.",
    );
  return validateRoster(
    rows.map((r) => ({
      first_name: r.cells[0],
      last_name: r.cells[1],
      email: r.cells[2],
      row: r.row,
    })),
  );
}
