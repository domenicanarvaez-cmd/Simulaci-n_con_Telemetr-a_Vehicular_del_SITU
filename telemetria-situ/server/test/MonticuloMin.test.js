import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MonticuloMin } from '../src/rutas/MonticuloMin.js';

test('extraerMin entrega los elementos en orden de costo', () => {
  const m = new MonticuloMin();
  [[1, 5], [2, 1], [3, 9], [4, 3], [5, 7]].forEach(([v, c]) => m.insertar(v, c));
  const orden = [];
  while (!m.estaVacio()) orden.push(m.extraerMin().valor);
  assert.deepEqual(orden, [2, 4, 1, 5, 3]);
});

test('un montículo vacío devuelve null', () => {
  const m = new MonticuloMin();
  assert.equal(m.extraerMin(), null);
  assert.equal(m.verMin(), null);
});

test('mantiene el orden con 1 000 costos aleatorios', () => {
  const m = new MonticuloMin();
  for (let i = 0; i < 1000; i++) m.insertar(i, Math.random());
  let previo = -Infinity;
  while (!m.estaVacio()) {
    const { costo } = m.extraerMin();
    assert.ok(costo >= previo);
    previo = costo;
  }
});
