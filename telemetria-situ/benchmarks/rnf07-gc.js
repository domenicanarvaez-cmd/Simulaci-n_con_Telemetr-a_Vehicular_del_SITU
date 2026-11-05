/**
 * ============================================================================
 *  Benchmark RNF-03 / RNF-07: impacto del Garbage Collector de V8.
 *
 *  Simula una ingesta continua de tramas y cuenta cuántas veces corre el GC
 *  y cuánto tiempo pausa en total, con dos estrategias:
 *    A) ingenua:  guardar cada trama como objeto en un arreglo que crece
 *    B) BufferCircular: copiar los números a arreglos tipados preasignados
 *
 *  En ambos casos se crea la trama como objeto (igual que hace Socket.io al
 *  recibirla); la diferencia es si ese objeto queda RETENIDO o muere joven.
 *
 *  Ejecutar:  node benchmarks/rnf07-gc.js ingenua
 *             node benchmarks/rnf07-gc.js buffer
 *  Para ver cada recolección en detalle (evidencia del SRS):
 *             node --trace-gc benchmarks/rnf07-gc.js buffer
 * ============================================================================
 */

import { PerformanceObserver, constants } from 'node:perf_hooks';
import { BufferCircular } from '../server/src/BufferCircular.js';

// Estrategia elegida por línea de comandos (por defecto, el buffer)
const modo = process.argv[2] === 'ingenua' ? 'ingenua' : 'buffer';

// Volumen simulado: 3 000 000 de tramas ≈ 50 minutos a 1 000 tramas/s
const TRAMAS = 3_000_000;

// Capacidad del buffer según el SRS (C = 10 000)
const C = 10_000;

// --- Observador de recolecciones de basura ---
let gcMenores = 0;      // Scavenger: generación joven (barato, frecuente)
let gcMayores = 0;      // Mark-Sweep-Compact: generación vieja (caro)
let pausaTotalMs = 0;   // tiempo total que el GC detuvo el programa

const obs = new PerformanceObserver((lista) => {
  for (const e of lista.getEntries()) {
    // Cada entrada es una recolección; se clasifica por su tipo
    if (e.detail?.kind === constants.NODE_PERFORMANCE_GC_MINOR) gcMenores++;
    else gcMayores++;
    pausaTotalMs += e.duration;
  }
});
obs.observe({ entryTypes: ['gc'] });

// --- Estructuras de cada estrategia ---
const arregloIngenuo = [];            // A) crece sin límite
const buffer = new BufferCircular(C); // B) memoria fija reservada una vez

// Toma una muestra de memoria para ver si crece o se mantiene
const heapInicial = process.memoryUsage().heapUsed;
const t0 = performance.now();

for (let i = 0; i < TRAMAS; i++) {
  // La trama llega como objeto nuevo (lo que entrega Socket.io)
  const trama = { unidadId: (i % 234) + 1, lat: -3.99 + i * 1e-9, lng: -79.2, velocidad: i % 50, ts: i };

  if (modo === 'ingenua') {
    // A) se guarda la referencia: el objeto sobrevive y pasa a la generación vieja
    arregloIngenuo.push(trama);
  } else {
    // B) solo se copian los números: el objeto queda libre y muere joven
    buffer.escribir(trama);
  }
}

const t1 = performance.now();
const heapFinal = process.memoryUsage().heapUsed;

// Espera un instante para que el observador reciba las últimas entradas
setTimeout(() => {
  obs.disconnect();
  const MiB = (b) => (b / 1048576).toFixed(1);
  console.log(`Estrategia: ${modo} · ${TRAMAS.toLocaleString('es')} tramas`);
  console.log(`  Tiempo total ............ ${(t1 - t0).toFixed(0)} ms`);
  console.log(`  GC menores (Scavenger) .. ${gcMenores}`);
  console.log(`  GC mayores (Mark-Sweep) . ${gcMayores}`);
  console.log(`  Pausa total del GC ...... ${pausaTotalMs.toFixed(1)} ms`);
  console.log(`  Heap inicial → final .... ${MiB(heapInicial)} → ${MiB(heapFinal)} MiB`);
  console.log(`  Tramas retenidas ........ ${modo === 'ingenua' ? arregloIngenuo.length : buffer.tamaño()}`);
}, 100);
