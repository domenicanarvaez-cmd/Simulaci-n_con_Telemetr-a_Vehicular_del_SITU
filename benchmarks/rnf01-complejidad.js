/**
 * ============================================================================
 *  Benchmark RNF-01: ¿el costo por operación crece con la capacidad?
 *
 *  Método del SRS: 1 000 000 de operaciones con C = 1 000, 10 000 y 100 000.
 *  Se compara el BufferCircular contra la "línea base ingenua" del problema:
 *  un arreglo dinámico de objetos que usa push() para escribir y shift()
 *  para retirar la trama más antigua.
 *
 *  Escenario: buffer lleno en régimen estable (cada trama nueva desplaza a
 *  la más antigua), que es la situación de una ingesta continua.
 *
 *  Ejecutar:  node benchmarks/rnf01-complejidad.js
 * ============================================================================
 */

import { BufferCircular } from '../server/src/BufferCircular.js';

// Número de operaciones medidas por cada capacidad (SRS, RNF-01)
const OPERACIONES = 1_000_000;

// El arreglo ingenuo se mide con menos operaciones porque con C = 100 000
// un millón de shift() tarda varios minutos (ese es justamente el problema).
// El resultado se expresa en ns POR OPERACIÓN, así que sigue siendo comparable.
const OPERACIONES_ARREGLO = 100_000;

// Capacidades a comparar (SRS, RNF-01)
const CAPACIDADES = [1_000, 10_000, 100_000];

// Trama de ejemplo que se reutiliza en el BufferCircular
const muestra = { unidadId: 1, lat: -3.99, lng: -79.2, velocidad: 30, ts: 0 };

// --- Variante 1: BufferCircular (escribir sobre un buffer lleno) ---
function medirBuffer(C) {
  const b = new BufferCircular(C);
  // Llena el buffer antes de medir, para estar en régimen estable
  for (let i = 0; i < C; i++) b.escribir(muestra);
  // Calentamiento: deja que el compilador JIT de V8 optimice la función
  for (let i = 0; i < 100_000; i++) b.escribir(muestra);

  // Medición: cada escritura sobrescribe la más antigua (equivale a push + shift)
  const t0 = performance.now();
  for (let i = 0; i < OPERACIONES; i++) {
    muestra.ts = i;            // cambia un campo para que el trabajo no se "optimice fuera"
    b.escribir(muestra);
  }
  const t1 = performance.now();
  // Devuelve nanosegundos por operación
  return ((t1 - t0) * 1e6) / OPERACIONES;
}

// --- Variante 2: arreglo dinámico con push() + shift() (línea base ingenua) ---
function medirArreglo(C) {
  const arr = [];
  // Llena el arreglo con C objetos (un objeto por trama, como el enfoque ingenuo)
  for (let i = 0; i < C; i++) arr.push({ unidadId: 1, lat: -3.99, lng: -79.2, velocidad: 30, ts: i });
  // Calentamiento más corto, para no alargar la prueba con C grande
  for (let i = 0; i < 10_000; i++) {
    arr.push({ unidadId: 1, lat: -3.99, lng: -79.2, velocidad: 30, ts: i });
    arr.shift();
  }

  // Medición: cada operación crea un objeto nuevo y retira el primero
  const t0 = performance.now();
  for (let i = 0; i < OPERACIONES_ARREGLO; i++) {
    arr.push({ unidadId: 1, lat: -3.99, lng: -79.2, velocidad: 30, ts: i });
    arr.shift();
  }
  const t1 = performance.now();
  return ((t1 - t0) * 1e6) / OPERACIONES_ARREGLO;
}

// --- Ejecución y tabla de resultados ---
console.log(`RNF-01 · ${OPERACIONES.toLocaleString('es')} operaciones por capacidad · Node ${process.version}\n`);
console.log('Capacidad C | BufferCircular (ns/op) | push+shift (ns/op)');
console.log('------------|------------------------|-------------------');

for (const C of CAPACIDADES) {
  // El buffer se mide 3 veces y se toma la mediana para reducir ruido;
  // el arreglo una sola vez, porque con C grande cada corrida es muy lenta
  const nsBuffer = [medirBuffer(C), medirBuffer(C), medirBuffer(C)].sort((a, b) => a - b)[1];
  const nsArreglo = medirArreglo(C);
  console.log(
    `${C.toLocaleString('es').padStart(11)} | ${nsBuffer.toFixed(1).padStart(22)} | ${nsArreglo.toFixed(1).padStart(18)}`
  );
}

console.log('\nCriterio RNF-01: el tiempo por operación del BufferCircular no debe crecer con C.');
