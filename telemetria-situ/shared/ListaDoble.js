/**
 * Lista doblemente enlazada.
 *
 * Representa el recorrido de una línea del SITU como una secuencia de nodos
 * (intersecciones o paradas). Cada nodo conoce al siguiente y al anterior,
 * de modo que una unidad puede avanzar en el sentido de ida o retroceder en
 * el sentido de vuelta en O(1).
 */

/** Nodo de la lista. Guarda el id del nodo del grafo y los tramos que lo unen con sus vecinos. */
export class NodoRuta {
  /**
   * @param {number} nodoId  Id del nodo en el grafo vial.
   * @param {number} indice  Posición del nodo dentro de la línea (0 = origen).
   */
  constructor(nodoId, indice) {
    this.nodoId = nodoId;
    this.indice = indice;
    /** @type {NodoRuta|null} */
    this.siguiente = null;
    /** @type {NodoRuta|null} */
    this.anterior = null;
    /** Id del tramo que va de este nodo al siguiente (-1 si no existe). */
    this.tramoSiguiente = -1;
    /** Id del tramo que va de este nodo al anterior (-1 si no existe). */
    this.tramoAnterior = -1;
    /** true si la unidad debe detenerse en este nodo (parada). */
    this.esParada = false;
  }
}

export class ListaDoble {
  constructor() {
    /** @type {NodoRuta|null} */
    this.cabeza = null;
    /** @type {NodoRuta|null} */
    this.cola = null;
    this.tamano = 0;
  }

  /**
   * Agrega un nodo al final de la lista. O(1).
   * @param {number} nodoId
   * @returns {NodoRuta} El nodo creado.
   */
  agregarAlFinal(nodoId) {
    const nodo = new NodoRuta(nodoId, this.tamano);
    if (this.cola === null) {
      this.cabeza = nodo;
    } else {
      nodo.anterior = this.cola;
      this.cola.siguiente = nodo;
    }
    this.cola = nodo;
    this.tamano++;
    return nodo;
  }

  /**
   * Devuelve el vecino de un nodo en el sentido indicado. O(1).
   * @param {NodoRuta} nodo
   * @param {1|-1} sentido  1 = ida (siguiente), -1 = vuelta (anterior).
   * @returns {NodoRuta|null}
   */
  static avanzar(nodo, sentido) {
    return sentido > 0 ? nodo.siguiente : nodo.anterior;
  }

  /**
   * Id del tramo que se recorre al salir de un nodo en el sentido indicado. O(1).
   * @param {NodoRuta} nodo
   * @param {1|-1} sentido
   * @returns {number}
   */
  static tramoHacia(nodo, sentido) {
    return sentido > 0 ? nodo.tramoSiguiente : nodo.tramoAnterior;
  }

  /**
   * Nodo en la posición indicada, recorriendo desde el extremo más cercano. O(n/2).
   * @param {number} indice
   * @returns {NodoRuta|null}
   */
  obtener(indice) {
    if (indice < 0 || indice >= this.tamano) return null;
    if (indice < this.tamano / 2) {
      let actual = this.cabeza;
      for (let i = 0; i < indice; i++) actual = actual.siguiente;
      return actual;
    }
    let actual = this.cola;
    for (let i = this.tamano - 1; i > indice; i--) actual = actual.anterior;
    return actual;
  }

  /**
   * Ids de los nodos en orden de ida. O(n).
   * @returns {number[]}
   */
  aArreglo() {
    const ids = [];
    for (let n = this.cabeza; n !== null; n = n.siguiente) ids.push(n.nodoId);
    return ids;
  }
}
