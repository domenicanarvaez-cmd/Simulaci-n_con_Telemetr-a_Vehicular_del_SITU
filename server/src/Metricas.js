/**
 * Métricas de rendimiento del servidor (RF-11).
 *
 *   Latencia    L = t_consumo − t_emisión
 *   Throughput  λ = tramas recibidas / Δt
 *   Memoria     process.memoryUsage()
 *
 * Los acumuladores son números: registrar una trama no crea objetos. Solo se
 * crea un objeto por intervalo, al generar el resumen.
 */
export class Metricas {
  constructor() {
    this._recibidasIntervalo = 0;
    this._consumidasIntervalo = 0;
    this._sumaLatencia = 0;
    this._latenciaMax = 0;
    this._recibidasTotal = 0;
    this._invalidasTotal = 0;
    this._inicioIntervalo = performance.now();
  }

  registrarRecibida() {
    this._recibidasIntervalo++;
    this._recibidasTotal++;
  }

  registrarInvalida() {
    this._invalidasTotal++;
  }

  /**
   * @param {number} tsEmision  Marca de tiempo de la trama (ms).
   * @param {number} ahora      Date.now() del consumo.
   */
  registrarConsumo(tsEmision, ahora) {
    const latencia = ahora - tsEmision;
    this._sumaLatencia += latencia;
    this._consumidasIntervalo++;
    if (latencia > this._latenciaMax) this._latenciaMax = latencia;
  }

  /**
   * Resume el intervalo actual y reinicia los contadores.
   * @param {import('./BufferCircular.js').BufferCircular} buffer
   */
  resumen(buffer) {
    const ahora = performance.now();
    const dt = (ahora - this._inicioIntervalo) / 1000;
    const mem = process.memoryUsage();
    const latenciaPromedio = this._consumidasIntervalo > 0 ? this._sumaLatencia / this._consumidasIntervalo : 0;

    const datos = {
      ts: Date.now(),
      tramasPorSegundo: Math.round(this._recibidasIntervalo / dt),
      latenciaPromedio: Number(latenciaPromedio.toFixed(2)),
      latenciaMax: this._latenciaMax,
      heapUsed: mem.heapUsed,
      arrayBuffers: mem.arrayBuffers,
      rss: mem.rss,
      tam: buffer.tamaño(),
      capacidad: buffer.capacidad,
      perdidas: buffer.perdidas,
      invalidas: this._invalidasTotal,
      recibidasTotal: this._recibidasTotal,
    };

    this._recibidasIntervalo = 0;
    this._consumidasIntervalo = 0;
    this._sumaLatencia = 0;
    this._latenciaMax = 0;
    this._inicioIntervalo = ahora;
    return datos;
  }
}
