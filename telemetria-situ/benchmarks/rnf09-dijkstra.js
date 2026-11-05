/**
 * Benchmark RNF-09: tiempo de Dijkstra con montículo binario.
 *
 * Construye cuadrículas de n × n intersecciones con calles de doble sentido
 * y pesos aleatorios, y mide el camino de menor tiempo entre esquinas
 * opuestas. Si el costo es O((V + E) log V), el cociente
 * tiempo / ((V + E) log2 V) debe mantenerse aproximadamente constante.
 *
 * Ejecutar:  node benchmarks/rnf09-dijkstra.js
 */
import { Grafo } from '../server/src/rutas/Grafo.js';
import { AcumuladorTramos } from '../server/src/rutas/AcumuladorTramos.js';
import { EvaluadorRutas } from '../server/src/rutas/EvaluadorRutas.js';

const LADOS = [10, 30, 100, 300];
const REPETICIONES = 20;
const factores = { consumoLporKm: 0.4, consumoRalentiLporH: 2.5, factorKgCO2porL: 2.68, velocidadReferenciaKmh: 25 };

/** Cuadrícula n × n con tramos de 0,3 a 0,5 km en ambos sentidos. */
function cuadricula(n) {
  const g = new Grafo();
  for (let f = 0; f < n; f++) for (let c = 0; c < n; c++) g.agregarNodo(f * n + c, f, c);
  const calle = (a, b) => {
    const km = 0.3 + Math.random() * 0.2;
    g.agregarTramo(a, b, km);
    g.agregarTramo(b, a, km);
  };
  for (let f = 0; f < n; f++) {
    for (let c = 0; c < n; c++) {
      if (c + 1 < n) calle(f * n + c, f * n + c + 1);
      if (f + 1 < n) calle(f * n + c, (f + 1) * n + c);
    }
  }
  return g;
}

console.log('Lado  Nodos (V)  Tramos (E)  Tiempo medio (ms)  ns / ((V+E) log2 V)');
for (const n of LADOS) {
  const g = cuadricula(n);
  const evaluador = new EvaluadorRutas(g, new AcumuladorTramos(g.numTramos), factores);
  evaluador.caminoMasRapido(0, n * n - 1); // calentamiento del compilador JIT

  const inicio = performance.now();
  for (let r = 0; r < REPETICIONES; r++) evaluador.caminoMasRapido(0, n * n - 1);
  const ms = (performance.now() - inicio) / REPETICIONES;

  const V = g.numNodos;
  const E = g.numTramos;
  const normalizado = (ms * 1e6) / ((V + E) * Math.log2(V));
  console.log(
    `${String(n).padStart(4)}  ${String(V).padStart(9)}  ${String(E).padStart(10)}  ` +
    `${ms.toFixed(3).padStart(17)}  ${normalizado.toFixed(1).padStart(19)}`
  );
}
