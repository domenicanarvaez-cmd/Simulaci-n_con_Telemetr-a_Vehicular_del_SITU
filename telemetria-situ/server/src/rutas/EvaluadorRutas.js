/**
 * Evaluación de líneas y propuesta de rutas optimizadas (RF-09 y RF-10).
 *
 * Combina el grafo vial con los tiempos observados por tramo para:
 *  1. Evaluar cada línea: distancia, tiempo, velocidad promedio, tiempo
 *     detenido, combustible y CO₂ estimados.
 *  2. Buscar con Dijkstra el recorrido de menor tiempo entre los extremos
 *     de la línea y compararlo con el recorrido actual.
 */
import { MonticuloMin } from './MonticuloMin.js';
import { litrosEstimados, kgCO2Estimados, sumar } from './emisiones.js';

export class EvaluadorRutas {
  /**
   * @param {import('./Grafo.js').Grafo} grafo
   * @param {import('./AcumuladorTramos.js').AcumuladorTramos} acumulador
   * @param {{consumoLporKm:number, consumoRalentiLporH:number, factorKgCO2porL:number, velocidadReferenciaKmh:number}} factores
   */
  constructor(grafo, acumulador, factores) {
    this.grafo = grafo;
    this.acumulador = acumulador;
    this.factores = factores;
  }

  /**
   * Tiempo estimado de un tramo en segundos. Usa el promedio observado y,
   * si aún no hay datos, la velocidad de referencia.
   */
  tiempoTramo(idTramo) {
    const observado = this.acumulador.tiempoPromedio(idTramo);
    if (!Number.isNaN(observado)) return observado;
    return (this.grafo.tramos[idTramo].km / this.factores.velocidadReferenciaKmh) * 3600;
  }

  /**
   * Indicadores de un recorrido dado como lista de ids de tramo.
   * @param {number[]} tramos
   */
  evaluarRecorrido(tramos) {
    const km = sumar(tramos, (t) => this.grafo.tramos[t].km);
    const segundos = sumar(tramos, (t) => this.tiempoTramo(t));
    const segundosDetenido = sumar(tramos, (t) => this.acumulador.detenidoPromedio(t));
    const litros = litrosEstimados(km, segundosDetenido, this.factores);
    return {
      km,
      minutos: segundos / 60,
      velocidadKmh: segundos > 0 ? km / (segundos / 3600) : 0,
      minutosDetenido: segundosDetenido / 60,
      litros,
      kgCO2: kgCO2Estimados(litros, this.factores),
      cobertura: tramos.filter((t) => this.acumulador.tieneDatos(t)).length / Math.max(tramos.length, 1),
    };
  }

  /** Ids de tramo de un recorrido dado como lista de nodos. */
  tramosDeRecorrido(nodos) {
    const tramos = [];
    for (let i = 0; i + 1 < nodos.length; i++) tramos.push(this.grafo.buscarTramo(nodos[i], nodos[i + 1]));
    return tramos;
  }

  /**
   * Camino de menor tiempo entre dos nodos con Dijkstra. O((V + E) log V).
   * @returns {{nodos:number[], tramos:number[], segundos:number}|null}
   */
  caminoMasRapido(origen, destino) {
    const distancia = new Map([[origen, 0]]);
    const tramoPrevio = new Map();
    const visitados = new Set();
    const cola = new MonticuloMin();
    cola.insertar(origen, 0);

    while (!cola.estaVacio()) {
      const { valor: nodo, costo } = cola.extraerMin();
      if (visitados.has(nodo)) continue;
      visitados.add(nodo);
      if (nodo === destino) break;

      for (const t of this.grafo.tramosDesde(nodo)) {
        const vecino = this.grafo.tramos[t].b;
        const nuevo = costo + this.tiempoTramo(t);
        if (nuevo < (distancia.get(vecino) ?? Infinity)) {
          distancia.set(vecino, nuevo);
          tramoPrevio.set(vecino, t);
          cola.insertar(vecino, nuevo);
        }
      }
    }

    if (!distancia.has(destino)) return null;
    const tramos = [];
    for (let n = destino; n !== origen; n = this.grafo.tramos[tramoPrevio.get(n)].a) tramos.push(tramoPrevio.get(n));
    tramos.reverse();
    const nodos = [origen, ...tramos.map((t) => this.grafo.tramos[t].b)];
    return { nodos, tramos, segundos: distancia.get(destino) };
  }

  /**
   * Evalúa una línea en sentido de ida y la compara con la ruta más rápida
   * entre sus extremos.
   * @param {{id:number, nombre:string, color:string, ruta:import('../../../shared/ListaDoble.js').ListaDoble}} linea
   */
  evaluarLinea(linea, nodosOriginales = null) {
    const tramosActuales = [];
    for (let n = linea.ruta.cabeza; n.siguiente !== null; n = n.siguiente) tramosActuales.push(n.tramoSiguiente);

    const actual = this.evaluarRecorrido(tramosActuales);
    const camino = this.caminoMasRapido(linea.ruta.cabeza.nodoId, linea.ruta.cola.nodoId);
    const propuesta = camino ? { ...this.evaluarRecorrido(camino.tramos), nodos: camino.nodos } : null;
    const mismaRuta = propuesta !== null && propuesta.nodos.join() === linea.ruta.aArreglo().join();

    const nodos = linea.ruta.aArreglo();
    const modificada = nodosOriginales !== null && nodosOriginales.join() !== nodos.join();
    return {
      id: linea.id,
      nombre: linea.nombre,
      color: linea.color,
      nodos,
      modificada,
      original: modificada ? { ...this.evaluarRecorrido(this.tramosDeRecorrido(nodosOriginales)), nodos: nodosOriginales } : null,
      actual,
      propuesta,
      mismaRuta,
      ahorro: propuesta && !mismaRuta
        ? {
            minutos: actual.minutos - propuesta.minutos,
            kgCO2: actual.kgCO2 - propuesta.kgCO2,
            porcentajeTiempo: actual.minutos > 0 ? (1 - propuesta.minutos / actual.minutos) * 100 : 0,
          }
        : null,
    };
  }

  /** Velocidad promedio observada por tramo en km/h (null si no hay datos). */
  velocidadesPorTramo() {
    return this.grafo.tramos.map((t) => {
      if (!this.acumulador.tieneDatos(t.id)) return null;
      return t.km / (this.acumulador.tiempoPromedio(t.id) / 3600);
    });
  }
}
