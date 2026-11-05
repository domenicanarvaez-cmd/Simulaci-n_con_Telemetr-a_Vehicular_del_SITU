/**
 * Construcción de las líneas del SITU como listas doblemente enlazadas.
 */
import { ListaDoble } from '../../../shared/ListaDoble.js';

/**
 * Convierte una línea (secuencia de ids de nodo) en una ListaDoble cuyos
 * nodos guardan el tramo hacia el siguiente y hacia el anterior.
 * @param {import('./Grafo.js').Grafo} grafo
 * @param {{id:number, nombre:string, color:string, nodos:number[], paradas:number[]}} linea
 * @returns {{id:number, nombre:string, color:string, ruta:ListaDoble}}
 */
export function construirLinea(grafo, linea) {
  const ruta = new ListaDoble();
  const paradas = new Set(linea.paradas);
  for (const nodoId of linea.nodos) ruta.agregarAlFinal(nodoId).esParada = paradas.has(nodoId);

  for (let n = ruta.cabeza; n !== null; n = n.siguiente) {
    if (n.siguiente) n.tramoSiguiente = exigirTramo(grafo, n.nodoId, n.siguiente.nodoId, linea.nombre);
    if (n.anterior) n.tramoAnterior = exigirTramo(grafo, n.nodoId, n.anterior.nodoId, linea.nombre);
  }
  return { id: linea.id, nombre: linea.nombre, color: linea.color, ruta };
}

/** Construye todas las líneas de la red. */
export function construirLineas(grafo, lineas) {
  return lineas.map((l) => construirLinea(grafo, l));
}

function exigirTramo(grafo, a, b, nombre) {
  const t = grafo.buscarTramo(a, b);
  if (t < 0) throw new Error(`La línea ${nombre} usa un tramo inexistente: ${a} → ${b}`);
  return t;
}
