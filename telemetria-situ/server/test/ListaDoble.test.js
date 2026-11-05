import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ListaDoble } from '../../shared/ListaDoble.js';

test('agregarAlFinal enlaza los nodos en ambos sentidos', () => {
  const l = new ListaDoble();
  [10, 20, 30].forEach((id) => l.agregarAlFinal(id));
  assert.equal(l.tamano, 3);
  assert.deepEqual(l.aArreglo(), [10, 20, 30]);
  assert.equal(l.cabeza.siguiente.anterior, l.cabeza);
  assert.equal(l.cola.anterior.nodoId, 20);
});

test('avanzar recorre la ida y la vuelta', () => {
  const l = new ListaDoble();
  [1, 2, 3].forEach((id) => l.agregarAlFinal(id));
  assert.equal(ListaDoble.avanzar(l.cabeza, 1).nodoId, 2);
  assert.equal(ListaDoble.avanzar(l.cola, -1).nodoId, 2);
  assert.equal(ListaDoble.avanzar(l.cola, 1), null);
  assert.equal(ListaDoble.avanzar(l.cabeza, -1), null);
});

test('obtener devuelve el nodo por posición desde el extremo más cercano', () => {
  const l = new ListaDoble();
  for (let i = 0; i < 9; i++) l.agregarAlFinal(i * 100);
  assert.equal(l.obtener(1).nodoId, 100);
  assert.equal(l.obtener(7).nodoId, 700);
  assert.equal(l.obtener(9), null);
});
