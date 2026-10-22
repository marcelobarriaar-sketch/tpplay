import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import {
  administrationModules as modules,
  administrationMissions as roadmap,
  findAdministrationModule,
  modulePath,
} from "../src/administrationCurriculum";
import { Administration, MissionCurriculum } from "../src/Administration";
import { moduleCatalog } from "../src/modules";
import { seoPages } from "../src/seo";
const render = (path: string) =>
  renderToString(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/especialidades/administracion"
          element={<Administration />}
        />
        <Route
          path="/especialidades/administracion/:grado"
          element={<Administration />}
        />
        <Route
          path="/especialidades/administracion/modulos/:modulo"
          element={<Administration />}
        />
      </Routes>
    </MemoryRouter>,
  );
test("official plan has six common and five RH modules; every module has a public route and legacy aliases", () => {
  assert.equal(modules.filter((m) => m.grade === 3).length, 6);
  assert.equal(modules.filter((m) => m.grade === 4).length, 5);
  assert.equal(
    modules.filter((m) => m.grade === 3).reduce((n, m) => n + m.hours, 0),
    836,
  );
  assert.equal(
    modules.filter((m) => m.grade === 4).reduce((n, m) => n + m.hours, 0),
    836,
  );
  for (const m of modules) {
    assert.ok(seoPages.some((s) => s.path === modulePath(m)));
    for (const alias of m.legacySlugs)
      assert.equal(findAdministrationModule(alias)?.moduleId, m.moduleId);
    assert.ok(m.sourceUrl.startsWith("https://www.curriculumnacional.cl/"));
  }
  assert.ok(
    render("/especialidades/administracion/3-medio").includes(
      "Utilización de información contable",
    ),
  );
  assert.ok(
    !render("/especialidades/administracion/3-medio").includes(
      "Cálculo de remuneración, finiquitos",
    ),
  );
  assert.ok(
    render("/especialidades/administracion/4-medio").includes(
      "Cálculo de remuneración, finiquitos",
    ),
  );
  assert.ok(
    !render("/especialidades/administracion/4-medio").includes("ADM-GCT"),
  );
});
test("roadmap is balanced, unique, non-playable drafts remain honest and existing missions keep URLs", () => {
  assert.equal(roadmap.length, 28);
  assert.equal(new Set(roadmap.map((m) => m.id)).size, 28);
  assert.equal(roadmap.filter((m) => m.available).length, 3);
  for (const m of roadmap) {
    assert.ok(
      modules.some((x) => x.moduleId === m.moduleId && x.grade === m.grade),
    );
    assert.ok(m.location.zoneId);
    if (!m.available) {
      assert.equal(m.href, null);
      assert.equal(m.status, "draft");
      assert.equal(m.curriculumAlignment.status, "pending");
    }
  }
  assert.equal(
    roadmap.find((m) => m.slug === "mision-iva")?.moduleId,
    "ADM-GCT",
  );
  assert.equal(
    roadmap.find((m) => m.slug === "primera-entrevista")?.moduleId,
    "ADM-EYE",
  );
  assert.ok(
    moduleCatalog
      .find((m) => m.id === "administracion/emprendimiento-y-empleabilidad")
      ?.missions.some((m) => m.id === "primera-entrevista"),
  );
  const html = render(
    "/especialidades/administracion/modulos/gestion-comercial-y-tributaria",
  );
  assert.ok(html.includes("/juegos/mision-tributos"));
  assert.ok(html.includes("/desafios/mision-iva"));
  assert.ok(
    html.includes("no evalúa declaración F29") ||
      html.includes("No evalúa declaración F29"),
  );
  assert.ok(html.includes("Próximamente"));
});
test("student surface separates a mission from official curriculum and keeps teacher detail disclosed on demand", () => {
  const html = renderToString(
    <MemoryRouter>
      <MissionCurriculum slug="mision-iva" />
    </MemoryRouter>,
  );
  assert.ok(html.includes("<details"));
  assert.ok(html.includes("CE 2.1 y 2.2"));
  assert.ok(html.includes("Pilotaje"));
  assert.ok(html.includes("independiente"));
});
