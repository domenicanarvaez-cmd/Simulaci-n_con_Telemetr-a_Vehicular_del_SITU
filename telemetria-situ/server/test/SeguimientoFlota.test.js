import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Grafo } from '../src/rutas/Grafo.js';
import { AcumuladorTramos } from '../src/rutas/AcumuladorTramos.js';
import { construirLineas } from '../src/rutas/Lineas.js';
import { SeguimientoFlota } from '../src/flota/SeguimientoFlota.js';

/** Línea recta de tres nodos separados ≈ 111 m (0,001° de latitud). */
function escenario() {
  const g = new Grafo();
  [0, 1, 2].forEach((i) => g.agregarNodo(i, -4 + i * 0.001, -79.2));
  for (const [a, b] of [[0, 1], [1, 2]]) { g.agregarTramo(a, b, 0.111); g.agregarTramo(b, a, 0.111); }
  const lineas = construirLineas(g, [{ id: 0, nombre: 'L', color: '#000', nodos: [0, 1, 2], paradas: [0, 2] }]);
  const acc = new AcumuladorTramos(g.numTramos);
  const flota = new SeguimientoFlota(g, lineas, acc, { maxUnidades: 10, umbralLlegadaM: 20 });
  return { g, acc, flota };
}

test('registra el tiempo de un tramo recorrido de nodo a nodo', () => {
  const { g, acc, flota } = escenario();
  let ts = 1_000_000;
  // La primera trama solo ubica la unidad; el tramo 0 → 1 se descarta porque
  // no se sabe desde dónde partió. El tramo 1 → 2 se mide completo.
  const trayecto = [[-4, 0], [-3.9995, 10], [-3.999, 10], [-3.9985, 10], [-3.998, 0]];
  for (const [la, v] of trayecto) { flota.procesar(1, la, -79.2, v, ts); ts += 10_000; }

  const t12 = g.buscarTramo(1, 2);
  assert.equal(acc.pasadas[t12], 1);
  assert.equal(acc.tiempoTotal[t12], 20);
  assert.equal(acc.pasadas[g.buscarTramo(0, 1)], 0);
});

test('ignora unidades fuera del rango configurado', () => {
  const { flota } = escenario();
  assert.equal(flota.procesar(99, -4, -79.2, 0, 1), false);
});

test('reiniciarLinea vuelve a ubicar las unidades con la siguiente trama', () => {
  const { flota } = escenario();
  flota.procesar(1, -4, -79.2, 0, 1000);
  assert.equal(flota.unidadesActivas, 1);
  assert.equal(flota.reiniciarLinea(0), 1);
  assert.equal(flota.unidadesActivas, 0);
  assert.equal(flota.linea[0], -1);
  // La siguiente trama la ubica de nuevo en el nodo más cercano (nodo 2).
  flota.procesar(1, -3.998, -79.2, 0, 2000);
  assert.equal(flota.unidadesActivas, 1);
  assert.equal(flota.nodoOrigen[0].nodoId, 2);
});
