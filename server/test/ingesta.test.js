import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearProcesador, crearConsumidor } from '../src/ingesta.js';
import { BufferCircular } from '../src/BufferCircular.js';
import { esTramaValida } from '../src/validacion.js';

/** Doble de Metricas que solo cuenta las llamadas. */
function metricasFalsas() {
  return {
    recibidas: 0, invalidas: 0, latencias: [],
    registrarRecibida() { this.recibidas++; },
    registrarInvalida() { this.invalidas++; },
    registrarConsumo(ts, ahora) { this.latencias.push(ahora - ts); },
  };
}

const trama = (id, ts) => ({ unidadId: id, lat: -3.99, lng: -79.2, velocidad: 20, ts });

test('el procesador escribe las tramas válidas y cuenta las inválidas', () => {
  const buffer = new BufferCircular(10);
  const metricas = metricasFalsas();
  const procesar = crearProcesador({ buffer, metricas, validar: esTramaValida });
  assert.equal(procesar(trama(1, 1000)), true);
  assert.equal(procesar({ unidadId: 1 }), false);
  assert.equal(procesar('texto'), false);
  assert.equal(buffer.tamaño(), 1);
  assert.equal(metricas.recibidas, 1);
  assert.equal(metricas.invalidas, 2);
});

test('el consumidor usa el reloj inyectado para la latencia', () => {
  const buffer = new BufferCircular(10);
  const metricas = metricasFalsas();
  const vistas = [];
  const flota = { procesar: (id) => { vistas.push(id); return true; } };
  // Reloj fijo: la latencia esperada se conoce de antemano.
  const consumir = crearConsumidor({ buffer, metricas, flota, reloj: () => 5000 });
  buffer.escribir(trama(1, 4900));
  buffer.escribir(trama(2, 4950));
  assert.equal(consumir(), 2);
  assert.deepEqual(metricas.latencias, [100, 50]);
  assert.deepEqual(vistas, [1, 2]);
  assert.equal(consumir(), 0);
});
