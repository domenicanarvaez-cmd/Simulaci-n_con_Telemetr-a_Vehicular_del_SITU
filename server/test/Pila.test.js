import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Pila } from '../src/escenarios/Pila.js';

test('una pila nueva está vacía', () => {
  const p = new Pila();
  assert.equal(p.estaVacia(), true);
  assert.equal(p.pop(), null);
  assert.equal(p.peek(), null);
});

test('extrae en orden LIFO', () => {
  const p = new Pila();
  [1, 2, 3].forEach((v) => p.push(v));
  assert.equal(p.tamano, 3);
  assert.equal(p.peek(), 3);
  assert.deepEqual([p.pop(), p.pop(), p.pop()], [3, 2, 1]);
  assert.equal(p.estaVacia(), true);
});

test('aArreglo lista desde la cima y vaciar elimina todo', () => {
  const p = new Pila();
  ['a', 'b'].forEach((v) => p.push(v));
  assert.deepEqual(p.aArreglo(), ['b', 'a']);
  p.vaciar();
  assert.equal(p.tamano, 0);
  assert.equal(p.estaVacia(), true);
});
