/**
 * Cola circular de capacidad fija para tramas de telemetría (RF-05 a RF-07).
 *
 * - La memoria se reserva una sola vez en el constructor (RNF-02).
 * - Cada campo de la trama se guarda en un arreglo tipado propio (arreglos
 *   paralelos): la posición i de todos los arreglos forma la trama i. No se
 *   crea un objeto por trama, por lo que el camino crítico no genera basura
 *   para el Garbage Collector (RNF-07).
 * - Escribir y leer solo actualizan índices con aritmética modular: O(1)
 *   sin importar la capacidad (RNF-01).
 *
 * Desbordamiento (RF-06): con el buffer lleno se sobrescribe la trama más
 * antigua y se incrementa `perdidas`.
 *
 * Memoria: 4 B (Uint32) + 4 × 8 B (Float64) = 36 B por posición.
 */
export class BufferCircular {
  /**
   * @param {number} capacidad  Número máximo de tramas (entero mayor que 0).
   */
  constructor(capacidad) {
    if (!Number.isInteger(capacidad) || capacidad <= 0) {
      throw new RangeError('La capacidad debe ser un entero mayor que 0');
    }
    this._capacidad = capacidad;

    // Arreglos paralelos preasignados.
    this._unidadId = new Uint32Array(capacidad);
    this._lat = new Float64Array(capacidad);
    this._lng = new Float64Array(capacidad);
    this._velocidad = new Float64Array(capacidad);
    this._ts = new Float64Array(capacidad);

    this._cabeza = 0;   // posición de la trama más antigua
    this._cola = 0;     // siguiente posición libre
    this._tam = 0;      // tramas almacenadas
    this._perdidas = 0; // tramas sobrescritas por desbordamiento

    // Objetos de salida reutilizables: leer() y verUltimo() no crean objetos.
    // El llamador debe copiar los valores si necesita conservarlos.
    this._salidaLeer = { unidadId: 0, lat: 0, lng: 0, velocidad: 0, ts: 0 };
    this._salidaUltimo = { unidadId: 0, lat: 0, lng: 0, velocidad: 0, ts: 0 };
  }

  /**
   * Inserta una trama al final de la cola. O(1).
   * @param {{unidadId:number, lat:number, lng:number, velocidad:number, ts:number}} trama
   */
  escribir(trama) {
    const i = this._cola;

    // Se copian los valores, no la referencia al objeto.
    this._unidadId[i] = trama.unidadId;
    this._lat[i] = trama.lat;
    this._lng[i] = trama.lng;
    this._velocidad[i] = trama.velocidad;
    this._ts[i] = trama.ts;

    this._cola = (i + 1) % this._capacidad;

    if (this._tam === this._capacidad) {
      // Buffer lleno: se sobrescribió la trama más antigua.
      this._cabeza = (this._cabeza + 1) % this._capacidad;
      this._perdidas++;
    } else {
      this._tam++;
    }
  }

  /**
   * Retira y devuelve la trama más antigua (FIFO). O(1).
   * @returns {object|null} Objeto de salida reutilizable, o null si está vacío.
   */
  leer() {
    if (this._tam === 0) return null;

    const i = this._cabeza;
    const s = this._salidaLeer;
    s.unidadId = this._unidadId[i];
    s.lat = this._lat[i];
    s.lng = this._lng[i];
    s.velocidad = this._velocidad[i];
    s.ts = this._ts[i];

    this._cabeza = (i + 1) % this._capacidad;
    this._tam--;
    return s;
  }

  /**
   * Devuelve la trama más reciente sin retirarla. O(1).
   * @returns {object|null}
   */
  verUltimo() {
    if (this._tam === 0) return null;

    // Se suma la capacidad antes del módulo para evitar un índice negativo.
    const i = (this._cola - 1 + this._capacidad) % this._capacidad;
    const s = this._salidaUltimo;
    s.unidadId = this._unidadId[i];
    s.lat = this._lat[i];
    s.lng = this._lng[i];
    s.velocidad = this._velocidad[i];
    s.ts = this._ts[i];
    return s;
  }

  estaLleno() { return this._tam === this._capacidad; }

  estaVacio() { return this._tam === 0; }

  tamaño() { return this._tam; }

  get capacidad() { return this._capacidad; }

  get perdidas() { return this._perdidas; }

  /** Bytes reservados por los arreglos tipados (36 × capacidad). */
  get bytesReservados() {
    return this._unidadId.byteLength + this._lat.byteLength + this._lng.byteLength +
      this._velocidad.byteLength + this._ts.byteLength;
  }
}
