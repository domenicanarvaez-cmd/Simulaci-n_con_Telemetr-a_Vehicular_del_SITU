import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GestorEscenarios } from '../src/escenarios/GestorEscenarios.js';

/** Gestor con un registro en memoria de los recorridos aplicados por línea. */
function crear() {
  const rutas = { 0: [1, 2, 3] };
  const gestor = new GestorEscenarios((linea, nodos) => { rutas[linea] = nodos; }, () => 1000);
  return { rutas, gestor };
}

test('aplicar cambia la ruta y habilita deshacer', () => {
  const { rutas, gestor } = crear();
  gestor.aplicar(0, [1, 2, 3], [1, 4, 3], 'propuesta');
  assert.deepEqual(rutas[0], [1, 4, 3]);
  const e = gestor.estado();
  assert.equal(e.puedeDeshacer, true);
  assert.equal(e.puedeRehacer, false);
  assert.deepEqual(e.historial, [{ lineaId: 0, descripcion: 'propuesta', ts: 1000 }]);
});

test('deshacer restaura la ruta anterior y rehacer la vuelve a aplicar', () => {
  const { rutas, gestor } = crear();
  gestor.aplicar(0, [1, 2, 3], [1, 4, 3], 'propuesta');
  gestor.deshacer();
  assert.deepEqual(rutas[0], [1, 2, 3]);
  assert.equal(gestor.estado().puedeRehacer, true);
  gestor.rehacer();
  assert.deepEqual(rutas[0], [1, 4, 3]);
  assert.equal(gestor.estado().puedeRehacer, false);
});

test('deshace varios cambios en orden inverso', () => {
  const { rutas, gestor } = crear();
  gestor.aplicar(0, [1, 2, 3], [1, 4, 3], 'primero');
  gestor.aplicar(0, [1, 4, 3], [1, 5, 3], 'segundo');
  assert.equal(gestor.deshacer().descripcion, 'segundo');
  assert.deepEqual(rutas[0], [1, 4, 3]);
  assert.equal(gestor.deshacer().descripcion, 'primero');
  assert.deepEqual(rutas[0], [1, 2, 3]);
  assert.equal(gestor.deshacer(), null);
});

test('un cambio nuevo descarta lo que se podía rehacer', () => {
  const { gestor } = crear();
  gestor.aplicar(0, [1, 2, 3], [1, 4, 3], 'primero');
  gestor.deshacer();
  gestor.aplicar(0, [1, 2, 3], [1, 5, 3], 'otro');
  assert.equal(gestor.estado().puedeRehacer, false);
  assert.equal(gestor.rehacer(), null);
});

test('guarda copias de los recorridos', () => {
  const { rutas, gestor } = crear();
  const nuevo = [1, 4, 3];
  gestor.aplicar(0, [1, 2, 3], nuevo, 'propuesta');
  nuevo.push(99);
  gestor.deshacer();
  gestor.rehacer();
  assert.deepEqual(rutas[0], [1, 4, 3]);
});
