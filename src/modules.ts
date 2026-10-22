import {administrationCommercialName} from './administrationCurriculum.js';
import { areas, missions, slugify } from "./data.js";
export type ModuleSettings = {
  id: string;
  objectives: string[];
  mission_order: string[];
};
export const moduleCatalog = areas.flatMap((area) =>
  area.modules.map((name) => ({
    id: `${area.id}/${slugify(name)}`,
    name,
    area: area.name,
    areaId: area.id,
    missions: [
      ...(area.id === "administracion" &&
      name === administrationCommercialName
        ? [
            {
              id: "mision-tributos",
              title: "Valle del Coihue: misión tributos",
              level: "3",
            },
          ]
        : []),
      ...missions
        .filter((m) => (m.area === area.id && m.module === name) || (area.id === 'administracion' && name === 'Emprendimiento y empleabilidad' && m.slug === 'primera-entrevista'))
        .map((m) => ({ id: m.slug, title: m.title, level: m.level })),
    ],
  })),
);
export function orderedMissionIds(id: string, saved: string[] = []) {
  const ids =
    moduleCatalog.find((m) => m.id === id)?.missions.map((m) => m.id) || [];
  return [
    ...saved.filter((v, i) => ids.includes(v) && saved.indexOf(v) === i),
    ...ids.filter((v) => !saved.includes(v)),
  ];
}
