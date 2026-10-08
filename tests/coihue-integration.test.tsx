import React from 'react';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToString} from 'react-dom/server';
import {MemoryRouter,Route,Routes} from 'react-router-dom';
import {DemoProvider} from '../src/store';
import {Catalog,Specialty,Home} from '../src/pages';
function page(path:string){return renderToString(<MemoryRouter initialEntries={[path]}><DemoProvider><Routes><Route path="/" element={<Home/>}/><Route path="/desafios" element={<Catalog/>}/><Route path="/especialidades/:slug/modulos/:modulo" element={<Specialty/>}/></Routes></DemoProvider></MemoryRouter>);}
test('adventure is discoverable in the exact commercial module and matching catalog filters',()=>{
 assert.ok(page('/especialidades/administracion/modulos/gestion-comercial-y-tributaria').includes('href="/juegos/mision-tributos"'));
 assert.ok(page('/desafios?modulo='+encodeURIComponent('Gestión Comercial y Tributaria')+'&nivel=3').includes('href="/juegos/mision-tributos"'));
 assert.ok(!page('/desafios?area=agropecuaria').includes('href="/juegos/mision-tributos"'));
 assert.ok(!page('/desafios?nivel=4').includes('href="/juegos/mision-tributos"'));
 assert.ok(page('/').includes('Bienvenido a Valle del Coihue'));assert.ok(page('/').includes('href="/aventura"'));assert.ok(page('/').includes('Comenzar mi aventura'));assert.ok(page('/').includes('Aprende jugando.'));assert.ok(page('/').includes('campus-los-lagos'));
});
