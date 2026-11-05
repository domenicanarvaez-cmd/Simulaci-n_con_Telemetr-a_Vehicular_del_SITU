/**
 * Grafo dirigido y ponderado de la red vial (RF-01).
 *
 * Nodos: intersecciones y paradas. Aristas (tramos): calles en un sentido.
 * Se representa con lista de adyacencia porque la red vial es dispersa:
 * ocupa O(V + E) frente a O(V²) de una matriz.
 */
export class Grafo {
  constructor() {
    /** Lista de adyacencia: id de nodo → ids de los tramos que salen de él. */
    this.adyacencia = new Map();
    /** Coordenadas por id de nodo. */
    this.nodos = new Map();
    /** Tramos indexados por id: { id, a, b, km }. */
    this.tramos = [];
  }

  /** Agrega una intersección o parada. */
  agregarNodo(id, lat, lng) {
    this.nodos.set(id, { id, lat, lng });
    if (!this.adyacencia.has(id)) this.adyacencia.set(id, []);
  }

  /**
   * Agrega un tramo dirigido de `a` a `b`.
   * @returns {number} Id del tramo.
   */
  agregarTramo(a, b, km) {
    if (!this.nodos.has(a) || !this.nodos.has(b)) throw new Error(`Tramo con nodo inexistente: ${a} → ${b}`);
    const id = this.tramos.length;
    this.tramos.push({ id, a, b, km });
    this.adyacencia.get(a).push(id);
    return id;
  }

  /** Ids de los tramos que salen de un nodo. */
  tramosDesde(id) {
    return this.adyacencia.get(id) ?? [];
  }

  /**
   * Id del tramo que une `a` con `b`, o -1 si no existe. O(grado de a).
   */
  buscarTramo(a, b) {
    for (const t of this.tramosDesde(a)) if (this.tramos[t].b === b) return t;
    return -1;
  }

  get numNodos() { return this.nodos.size; }
  get numTramos() { return this.tramos.length; }

  /**
   * Construye el grafo a partir de la descripción de la red.
   * @param {{nodos:{id:number,lat:number,lng:number}[], tramos:{a:number,b:number,km:number}[]}} red
   */
  static desdeRed(red) {
    const g = new Grafo();
    for (const n of red.nodos) g.agregarNodo(n.id, n.lat, n.lng);
    for (const t of red.tramos) g.agregarTramo(t.a, t.b, t.km);
    return g;
  }
}
