import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Grafo } from '../src/rutas/Grafo.js';
import { AcumuladorTramos } from '../src/rutas/AcumuladorTramos.js';
import { EvaluadorRutas } from '../src/rutas/EvaluadorRutas.js';
import { construirLineas } from '../src/rutas/Lineas.js';

const factores = { consumoLporKm: 0.4, consumoRalentiLporH: 2.5, factorKgCO2porL: 2.68, velocidadReferenciaKmh: 30 };

/**
 * Red en forma de cuadrado:  0 ── 1
 *                            │    │
 *                            2 ── 3
 * La línea va 0 → 1 → 3; el camino alterno 0 → 2 → 3 mide lo mismo.
 */
function redCuadrada() {
  const g = new Grafo();
  [[0, 0, 0], [1, 0, 1], [2, 1, 0], [3, 1, 1]].forEach(([id, la, ln]) => g.agregarNodo(id, la, ln));
  for (const [a, b] of [[0, 1], [1, 3], [0, 2], [2, 3]]) { g.agregarTramo(a, b, 1); g.agregarTramo(b, a, 1); }
  return g;
}

test('Dijkstra elige el camino más corto con los pesos de referencia', () => {
  const g = redCuadrada();
  const ev = new EvaluadorRutas(g, new AcumuladorTramos(g.numTramos), factores);
  const c = ev.caminoMasRapido(0, 3);
  assert.equal(c.nodos.length, 3);
  assert.equal(Math.round(c.segundos), 240);
});

test('Dijkstra evita un tramo congestionado según los tiempos observados', () => {
  const g = redCuadrada();
  const acc = new AcumuladorTramos(g.numTramos);
  acc.registrarPasada(g.buscarTramo(0, 1), 600, 120);
  acc.registrarPasada(g.buscarTramo(1, 3), 120, 0);
  acc.registrarPasada(g.buscarTramo(0, 2), 120, 0);
  acc.registrarPasada(g.buscarTramo(2, 3), 120, 0);
  const ev = new EvaluadorRutas(g, acc, factores);
  assert.deepEqual(ev.caminoMasRapido(0, 3).nodos, [0, 2, 3]);
});

test('evaluarLinea compara la ruta actual con la propuesta', () => {
  const g = redCuadrada();
  const acc = new AcumuladorTramos(g.numTramos);
  acc.registrarPasada(g.buscarTramo(0, 1), 600, 120);
  acc.registrarPasada(g.buscarTramo(1, 3), 120, 0);
  [g.buscarTramo(0, 2), g.buscarTramo(2, 3)].forEach((t) => acc.registrarPasada(t, 120, 0));
  const [linea] = construirLineas(g, [{ id: 0, nombre: 'Prueba', color: '#000', nodos: [0, 1, 3], paradas: [0, 3] }]);
  const r = new EvaluadorRutas(g, acc, factores).evaluarLinea(linea);

  assert.equal(r.actual.km, 2);
  assert.equal(r.actual.minutos, 12);
  assert.equal(r.propuesta.minutos, 4);
  assert.equal(r.mismaRuta, false);
  assert.equal(Math.round(r.ahorro.porcentajeTiempo), 67);
  // Litros = 2 km × 0,4 + (120 s / 3600) × 2,5; CO₂ = litros × 2,68.
  assert.ok(Math.abs(r.actual.kgCO2 - (0.8 + (120 / 3600) * 2.5) * 2.68) < 1e-9);
});

test('evaluarLinea incluye la ruta original cuando la línea fue modificada', () => {
  const g = redCuadrada();
  const [linea] = construirLineas(g, [{ id: 0, nombre: 'L', color: '#000', nodos: [0, 2, 3], paradas: [] }]);
  const ev = new EvaluadorRutas(g, new AcumuladorTramos(g.numTramos), factores);
  const r = ev.evaluarLinea(linea, [0, 1, 3]);
  assert.equal(r.modificada, true);
  assert.deepEqual(r.original.nodos, [0, 1, 3]);
  assert.equal(r.original.km, 2);
  assert.equal(ev.evaluarLinea(linea, [0, 2, 3]).original, null);
});
