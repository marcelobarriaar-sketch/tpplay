export type Scale = {
  mission_id: string;
  minimum: number;
  optimum: number;
  grade_min: number;
  grade_pass: number;
  grade_max: number;
  requirement: number;
  metric: "money" | "performance";
  version: number;
};
export function gradeFor(score: number, scale: Scale) {
  if (
    !Number.isFinite(score) ||
    ![
      scale.minimum,
      scale.optimum,
      scale.grade_min,
      scale.grade_pass,
      scale.grade_max,
      scale.requirement,
    ].every(Number.isFinite) ||
    scale.optimum <= scale.minimum ||
    scale.requirement <= 0 ||
    scale.requirement >= 1 ||
    scale.grade_min < 1 ||
    scale.grade_max > 7 ||
    scale.grade_min >= scale.grade_pass ||
    scale.grade_pass >= scale.grade_max
  )
    throw new Error("Escala inválida.");
  const x = Math.max(
    0,
    Math.min(1, (score - scale.minimum) / (scale.optimum - scale.minimum)),
  );
  return x <= scale.requirement
    ? scale.grade_min +
        ((scale.grade_pass - scale.grade_min) * x) / scale.requirement
    : scale.grade_pass +
        ((scale.grade_max - scale.grade_pass) * (x - scale.requirement)) /
          (1 - scale.requirement);
}
export function gradeLabel(value: number | null) {
  return value === null
    ? "Pendiente"
    : value.toLocaleString("es-CL", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
}
