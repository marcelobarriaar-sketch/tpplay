export type Role = "student" | "teacher" | "institution_admin" | "admin";
export type Profile = {
  id: string;
  active_enrollment_id?: string | null;
  name: string;
  role: Role;
  active: boolean;
  first_name?: string;
  last_name?: string;
  email?: string;
  status?: "active" | "pending" | "suspended";
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
  email_verified?: boolean;
  school_id: string | null;
  city_id: string | null;
};
export type Registry = {
  cities: { id: string; name: string }[];
  schools: { id: string; name: string; city_id: string }[];
};
export type Criterion = {
  id: string;
  title: string;
  concepts: string[];
  weight: number;
  levels: string[];
};
export type Rubric = { version: number; criteria: Criterion[] };
export type Evaluation = {
  id?: string;
  student_id: string;
  course_id: string;
  rubric: Rubric;
  ratings: Record<string, number | null>;
  comments: Record<string, string>;
  overall: string;
  published: boolean;
};
export const initialRubric: Rubric = {
  version: 1,
  criteria: [
    {
      id: "tributo",
      title: "Reconoce el concepto de tributo",
      concepts: ["pagos"],
      weight: 1,
      levels: [
        "Confunde el tributo con una compra o donación en la plaza.",
        "Reconoce una obligación, pero necesita aclarar quién la establece.",
        "Distingue el tributo de compras y donaciones en las tarjetas de la plaza.",
        "Distingue un nuevo caso y justifica la obligación establecida por ley.",
      ],
    },
    {
      id: "finalidad",
      title: "Explica su finalidad en la comunidad",
      concepts: ["publico"],
      weight: 1,
      levels: [
        "Relaciona el tributo solo con una obra particular.",
        "Identifica una finalidad pública con apoyo del diálogo.",
        "Relaciona recursos públicos y necesidades colectivas sin prometer destino individual.",
        "Justifica un caso nuevo y explica por qué un pago no financia necesariamente una obra concreta.",
      ],
    },
    {
      id: "distinciones",
      title: "Distingue los conceptos tributarios trabajados",
      concepts: ["impuesto", "tasa", "derecho", "especial", "territorial"],
      weight: 1,
      levels: [
        "Confunde las categorías de las tarjetas del mercado.",
        "Distingue algunas categorías con apoyo y reconoce dudas.",
        "Clasifica los ejemplos trabajados y diferencia categorías doctrinales y ejemplos chilenos.",
        "Transfiere las distinciones a un caso nuevo y explica el criterio utilizado.",
      ],
    },
    {
      id: "instituciones",
      title: "Identifica las funciones de las instituciones",
      concepts: ["instituciones"],
      weight: 1,
      levels: [
        "Intercambia las funciones del SII y la Tesorería.",
        "Reconoce una función con apoyo del recorrido.",
        "Relaciona fiscalización y administración con SII y recaudación con Tesorería.",
        "Justifica a qué institución acudir en un nuevo caso sin atribuirle funciones ajenas.",
      ],
    },
    {
      id: "procedimiento",
      title: "Diferencia declaración, pago y canal",
      concepts: ["tramite", "canal", "vencida"],
      weight: 1,
      levels: [
        "Confunde declarar con pagar o elegir un canal.",
        "Ordena parte del procedimiento con ayuda.",
        "Diferencia la declaración, el pago y el canal en los casos de la oficina.",
        "Explica la diferencia y aplica el procedimiento a una situación nueva.",
      ],
    },
    {
      id: "transferencia",
      title: "Aplica lo aprendido a situaciones nuevas",
      concepts: [],
      weight: 1,
      levels: [
        "La decisión y su explicación no se relacionan con el caso de la feria.",
        "Reconoce un concepto pertinente, pero la justificación está incompleta.",
        "Resuelve el caso de la feria y justifica su decisión con conceptos del juego.",
        "Explica una situación nueva, conecta conceptos y reconoce límites de la información.",
      ],
    },
  ],
};
export const levelNames = ["Inicial", "En desarrollo", "Logrado", "Avanzado"];
