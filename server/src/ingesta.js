/**
 * Ingesta y consumo de tramas con dependencias inyectadas.
 *
 * Las funciones reciben como parámetros todo lo que usan (buffer, métricas,
 * validación, seguimiento de flota y reloj) en lugar de importarlo. Así el
 * servidor les pasa las instancias reales y las pruebas les pasan dobles
 * controlados, por ejemplo un reloj con hora fija.
 */

/**
 * Crea el manejador del evento `telemetria`.
 * @param {{
 *   buffer: {escribir(t:object):void},
 *   metricas: {registrarRecibida():void, registrarInvalida():void},
 *   validar: (t:unknown) => boolean
 * }} dependencias
 * @returns {(trama:unknown) => boolean} true si la trama se aceptó.
 */
export function crearProcesador({ buffer, metricas, validar }) {
  return function procesar(trama) {
    if (!validar(trama)) {
      metricas.registrarInvalida();
      return false;
    }
    buffer.escribir(trama);
    metricas.registrarRecibida();
    return true;
  };
}

/**
 * Crea el consumidor que vacía el buffer en orden FIFO (RF-07).
 * @param {{
 *   buffer: {leer():object|null},
 *   metricas: {registrarConsumo(ts:number, ahora:number):void},
 *   flota: {procesar(id:number, lat:number, lng:number, v:number, ts:number):boolean},
 *   reloj: () => number
 * }} dependencias
 * @returns {() => number} Función que consume lo pendiente y devuelve cuántas tramas procesó.
 */
export function crearConsumidor({ buffer, metricas, flota, reloj }) {
  return function consumir() {
    const ahora = reloj();
    let procesadas = 0;
    for (let t = buffer.leer(); t !== null; t = buffer.leer()) {
      metricas.registrarConsumo(t.ts, ahora);
      flota.procesar(t.unidadId, t.lat, t.lng, t.velocidad, t.ts);
      procesadas++;
    }
    return procesadas;
  };
}
