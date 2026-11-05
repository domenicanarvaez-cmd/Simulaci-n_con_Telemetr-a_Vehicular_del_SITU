/**
 * Pruebas unitarias del BufferCircular (RF-05, RF-06, RF-07, RNF-02).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BufferCircular } from '../src/BufferCircular.js';

/** Trama de prueba identificable por n. */
function trama(n) {
  return { unidadId: n, lat: -3.99 - n / 1000, lng: -79.2, velocidad: n % 50, ts: 1000 + n };
}

test('el constructor rechaza capacidades inválidas', () => {
  // 0, negativos, decimales y textos no son capacidades válidas
  assert.throws(() => new BufferCircular(0), RangeError);
  assert.throws(() => new BufferCircular(-5), RangeError);
  assert.throws(() => new BufferCircular(2.5), RangeError);
  assert.throws(() => new BufferCircular('10'), RangeError);
});

test('un buffer nuevo está vacío y no lleno', () => {
  const b = new BufferCircular(3);
  assert.equal(b.estaVacio(), true);
  assert.equal(b.estaLleno(), false);
  assert.equal(b.tamaño(), 0);
  // Leer o ver el último en un buffer vacío devuelve null, no lanza error
  assert.equal(b.leer(), null);
  assert.equal(b.verUltimo(), null);
});

test('reserva 36 bytes por posición (SRS ec. 5)', () => {
  // S(C) = 36·C → con C = 10 000 son 360 000 bytes
  assert.equal(new BufferCircular(10000).bytesReservados, 360000);
});

test('entrega las tramas en orden FIFO (RF-07)', () => {
  const b = new BufferCircular(5);
  // Escribe 1, 2, 3 ...
  for (let n = 1; n <= 3; n++) b.escribir(trama(n));
  // ... y deben salir en el mismo orden: 1, 2, 3
  for (let n = 1; n <= 3; n++) assert.equal(b.leer().unidadId, n);
  assert.equal(b.estaVacio(), true);
});

test('conserva todos los campos de la trama', () => {
  const b = new BufferCircular(2);
  const t = { unidadId: 12, lat: -3.99313, lng: -79.20422, velocidad: 32.5, ts: 1791400000000 };
  b.escribir(t);
  // Se compara campo por campo: leer() devuelve exactamente los mismos valores
  assert.deepEqual({ ...b.leer() }, t);
});

test('verUltimo devuelve la más reciente sin retirarla', () => {
  const b = new BufferCircular(4);
  b.escribir(trama(1));
  b.escribir(trama(2));
  assert.equal(b.verUltimo().unidadId, 2);
  // El tamaño no cambia: verUltimo no retira nada
  assert.equal(b.tamaño(), 2);
});

test('da la vuelta al final del arreglo sin perder el orden', () => {
  const b = new BufferCircular(3);
  // Llena, lee dos y escribe dos más: los índices pasan por el final y vuelven a 0
  b.escribir(trama(1)); b.escribir(trama(2)); b.escribir(trama(3));
  b.leer(); b.leer();
  b.escribir(trama(4)); b.escribir(trama(5));
  // Deben quedar 3, 4, 5 en ese orden
  assert.deepEqual([b.leer().unidadId, b.leer().unidadId, b.leer().unidadId], [3, 4, 5]);
  // Con cola = 0 tras la vuelta, verUltimo no debe calcular un índice negativo
  b.escribir(trama(6));
  assert.equal(b.verUltimo().unidadId, 6);
});

test('al llenarse sobrescribe la más antigua y cuenta pérdidas (RF-06)', () => {
  const b = new BufferCircular(3);
  // Se escriben 5 tramas en un buffer de 3 → se pierden las 2 más antiguas
  for (let n = 1; n <= 5; n++) b.escribir(trama(n));
  assert.equal(b.estaLleno(), true);
  assert.equal(b.tamaño(), 3);
  assert.equal(b.perdidas, 2);
  // Sobreviven las más recientes, en orden: 3, 4, 5
  assert.deepEqual([b.leer().unidadId, b.leer().unidadId, b.leer().unidadId], [3, 4, 5]);
});

test('la capacidad y la memoria no cambian tras miles de escrituras (RNF-02)', () => {
  const b = new BufferCircular(1000);
  const bytesAntes = b.bytesReservados;
  // 100 000 escrituras en un buffer de 1 000: debe seguir midiendo lo mismo
  for (let n = 1; n <= 100000; n++) b.escribir(trama(n));
  assert.equal(b.capacidad, 1000);
  assert.equal(b.tamaño(), 1000);
  assert.equal(b.bytesReservados, bytesAntes);
  assert.equal(b.perdidas, 99000);
});

test('leer() reutiliza el mismo objeto de salida (RNF-07)', () => {
  const b = new BufferCircular(2);
  b.escribir(trama(1));
  b.escribir(trama(2));
  // Dos lecturas devuelven la MISMA referencia: no se crean objetos nuevos
  const a = b.leer();
  const c = b.leer();
  assert.equal(a, c);
});
