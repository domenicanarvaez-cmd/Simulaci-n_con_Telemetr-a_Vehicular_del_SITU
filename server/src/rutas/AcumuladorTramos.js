/**
 * Mediciones acumuladas por tramo (RF-08).
 *
 * Usa arreglos tipados preasignados e indexados por id de tramo, igual que
 * el BufferCircular: registrar una pasada cuesta O(1) y no crea objetos.
 */
export class AcumuladorTramos {
  /** @param {number} numTramos  Cantidad de tramos del grafo. */
  constructor(numTramos) {
    /** Segundos totales de recorrido por tramo. */
    this.tiempoTotal = new Float64Array(numTramos);
    /** Segundos totales con velocidad 0 por tramo. */
    this.tiempoDetenido = new Float64Array(numTramos);
    /** Recorridos completos registrados por tramo. */
    this.pasadas = new Uint32Array(numTramos);
  }

  /**
   * Registra un recorrido completo de un tramo. O(1).
   * @param {number} idTramo
   * @param {number} segundos          Duración total del recorrido.
   * @param {number} segundosDetenido  Parte de esa duración con velocidad 0.
   */
  registrarPasada(idTramo, segundos, segundosDetenido) {
    this.tiempoTotal[idTramo] += segundos;
    this.tiempoDetenido[idTramo] += segundosDetenido;
    this.pasadas[idTramo]++;
  }

  /** true si el tramo tiene al menos una pasada. */
  tieneDatos(idTramo) {
    return this.pasadas[idTramo] > 0;
  }

  /** Tiempo promedio de recorrido en segundos, o NaN si no hay datos. */
  tiempoPromedio(idTramo) {
    const n = this.pasadas[idTramo];
    return n > 0 ? this.tiempoTotal[idTramo] / n : NaN;
  }

  /** Tiempo detenido promedio por pasada en segundos, o 0 si no hay datos. */
  detenidoPromedio(idTramo) {
    const n = this.pasadas[idTramo];
    return n > 0 ? this.tiempoDetenido[idTramo] / n : 0;
  }

  /** Total de pasadas registradas en todos los tramos. */
  totalPasadas() {
    let total = 0;
    for (let i = 0; i < this.pasadas.length; i++) total += this.pasadas[i];
    return total;
  }
}
