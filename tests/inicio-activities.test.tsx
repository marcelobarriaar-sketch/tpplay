import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import {
  inicioMission,
  inicioSteps,
  dossierOptions,
  dossierCorrectMask,
  inicioSources,
} from "../src/games/inicio/content";
import { InicioScene, InicioDocuments } from "../src/games/inicio/Scene";
import {
  freshAttempt,
  reduceMission,
  importAttempt,
  scoreAttempt,
} from "../server/missionDomain";
import { administrationMissions } from "../src/administrationCurriculum";
test("eight city levels and documentary puzzle pass through the real mission reducer and preserve an intermediate checkpoint", () => {
  let a = freshAttempt(
    "00000000-0000-4000-8000-000000000001",
    inicioMission.slug,
  );
  assert.throws(() => reduceMission(a, { type: "next" }));
  for (let i = 0; i < inicioSteps.length; i++) {
    assert.equal(a.index, i);
    a = reduceMission(a, {
      type: "answer",
      value: String(inicioSteps[i].correct),
    });
    a = reduceMission(a, { type: "confirm" });
    a = reduceMission(a, { type: "next" });
    if (i === 4) {
      a = importAttempt(JSON.parse(JSON.stringify(a)), a.id);
      assert.equal(a.index, 5);
      assert.equal(a.answers[4], String(dossierCorrectMask));
    }
  }
  assert.throws(() => reduceMission(a, { type: "complete" }));
  a = reduceMission(a, {
    type: "evidence",
    value:
      "El aviso comunica la actividad; los respaldos deben coincidir con el domicilio. La verificación puede incluir una visita coordinada y no sustituye los otros permisos.",
  });
  a = reduceMission(a, { type: "complete" });
  assert.ok(a.completedAt);
  assert.equal(scoreAttempt(a), 8);
  assert.throws(() => reduceMission(a, { type: "complete" }));
});
test("all dossier combinations have defined outcomes; false address and a credential do not count as a correct packet", () => {
  assert.equal(dossierOptions.length, 16);
  assert.equal(dossierCorrectMask, 3);
  assert.equal(inicioSteps[4].feedback.length, 16);
  assert.match(inicioSteps[4].feedback[8], /contraseña/);
  assert.match(inicioSteps[4].feedback[4], /descartado/);
  let a = freshAttempt(
    "00000000-0000-4000-8000-000000000002",
    inicioMission.slug,
  );
  for (let i = 0; i < 4; i++) {
    a = reduceMission(a, { type: "answer", value: "0" });
    a = reduceMission(a, { type: "confirm" });
    a = reduceMission(a, { type: "next" });
  }
  assert.throws(() => reduceMission(a, { type: "answer", value: "16" }));
  const html = renderToString(
    <InicioDocuments value="3" onChange={() => {}} disabled={false} />,
  );
  assert.equal((html.match(/checked=""/g) || []).length, 2);
  assert.ok(!html.includes('type="file"'));
  assert.ok(!html.includes('type="password"'));
});
test("story keeps digital filing and eventual coordinated inspection distinct and links the GCT curriculum", () => {
  assert.ok(
    inicioSteps[1].feedback[1].includes("no se impone una visita presencial"),
  );
  assert.ok(
    inicioSteps[6].context.includes("No todos los inicios reciben visita"),
  );
  assert.ok(inicioSteps[6].context.includes("sale de la oficina"));
  assert.ok(
    inicioSources.every((s) => new URL(s.url).hostname === "www.sii.cl"),
  );
  assert.equal(
    administrationMissions.find((m) => m.slug === inicioMission.slug)?.moduleId,
    "ADM-GCT",
  );
  const scene = renderToString(
    <InicioScene index={6} confirmed={Array(6).fill(true)} />,
  );
  assert.match(scene, /VILLA DEL COIHUE/);
  assert.match(scene, /fiscalizador/);
  assert.match(scene, /no presenta declaraciones/);
});
