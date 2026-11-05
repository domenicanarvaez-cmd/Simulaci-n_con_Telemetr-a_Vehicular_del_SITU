/**
 * Pila (LIFO) sobre nodos enlazados.
 *
 * Insertar y extraer ocurren en la cima, por lo que ambas operaciones
 * cuestan O(1) sin desplazar elementos.
 */
class NodoPila {
  constructor(valor, debajo) {
    this.valor = valor;
    /** @type {NodoPila|null} */
    this.debajo = debajo;
  }
}

export class Pila {
  constructor() {
    /** @type {NodoPila|null} */
    this.cima = null;
    this.tamano = 0;
  }

  /** Apila un valor. O(1). */
  push(valor) {
    this.cima = new NodoPila(valor, this.cima);
    this.tamano++;
  }

  /** Desapila y devuelve el valor de la cima, o null si está vacía. O(1). */
  pop() {
    if (this.cima === null) return null;
    const { valor } = this.cima;
    this.cima = this.cima.debajo;
    this.tamano--;
    return valor;
  }

  /** Valor de la cima sin retirarlo. O(1). */
  peek() {
    return this.cima === null ? null : this.cima.valor;
  }

  estaVacia() {
    return this.cima === null;
  }

  /** Elimina todos los elementos. O(1). */
  vaciar() {
    this.cima = null;
    this.tamano = 0;
  }

  /** Valores desde la cima hacia la base. O(n). */
  aArreglo() {
    const valores = [];
    for (let n = this.cima; n !== null; n = n.debajo) valores.push(n.valor);
    return valores;
  }
}
