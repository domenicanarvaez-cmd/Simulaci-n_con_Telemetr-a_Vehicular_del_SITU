/**
 * Cola de prioridad implementada como montículo binario mínimo.
 *
 * Mantiene en la raíz el elemento de menor costo. Insertar y extraer el
 * mínimo cuestan O(log n). Es la estructura que usa Dijkstra para elegir
 * en cada paso el nodo más cercano todavía no visitado.
 *
 * El árbol se guarda en dos arreglos paralelos: los hijos de la posición i
 * están en 2i + 1 y 2i + 2, y su padre en ⌊(i − 1) / 2⌋.
 */
export class MonticuloMin {
  constructor() {
    /** @type {number[]} */
    this.valores = [];
    /** @type {number[]} */
    this.costos = [];
  }

  get tamano() { return this.valores.length; }

  estaVacio() { return this.valores.length === 0; }

  /** Inserta un valor con su costo. O(log n). */
  insertar(valor, costo) {
    this.valores.push(valor);
    this.costos.push(costo);
    this.#subir(this.valores.length - 1);
  }

  /**
   * Extrae el elemento de menor costo. O(log n).
   * @returns {{valor:number, costo:number}|null}
   */
  extraerMin() {
    if (this.valores.length === 0) return null;
    const minimo = { valor: this.valores[0], costo: this.costos[0] };
    const ultimoValor = this.valores.pop();
    const ultimoCosto = this.costos.pop();
    if (this.valores.length > 0) {
      this.valores[0] = ultimoValor;
      this.costos[0] = ultimoCosto;
      this.#bajar(0);
    }
    return minimo;
  }

  /** Costo del mínimo sin extraerlo. O(1). */
  verMin() {
    return this.valores.length === 0 ? null : { valor: this.valores[0], costo: this.costos[0] };
  }

  #intercambiar(i, j) {
    [this.valores[i], this.valores[j]] = [this.valores[j], this.valores[i]];
    [this.costos[i], this.costos[j]] = [this.costos[j], this.costos[i]];
  }

  #subir(i) {
    while (i > 0) {
      const padre = (i - 1) >> 1;
      if (this.costos[padre] <= this.costos[i]) break;
      this.#intercambiar(i, padre);
      i = padre;
    }
  }

  #bajar(i) {
    const n = this.valores.length;
    for (;;) {
      const izq = 2 * i + 1;
      const der = izq + 1;
      let menor = i;
      if (izq < n && this.costos[izq] < this.costos[menor]) menor = izq;
      if (der < n && this.costos[der] < this.costos[menor]) menor = der;
      if (menor === i) return;
      this.#intercambiar(i, menor);
      i = menor;
    }
  }
}
