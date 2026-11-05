/**
 * Parámetros del servidor. Cada valor puede sobrescribirse con una variable
 * de entorno del mismo nombre en mayúsculas (por ejemplo, CAPACIDAD=100000).
 */

function num(nombre, porDefecto) {
  const valor = Number(process.env[nombre]);
  return process.env[nombre] !== undefined && Number.isFinite(valor) ? valor : porDefecto;
}

export const config = {
  puerto: num('PUERTO', 3000),

  /** Capacidad del buffer: C ≥ λ·T = 1 000 tramas/s × 10 s. */
  capacidad: num('CAPACIDAD', 10000),

  /** Periodo del consumidor (ms). Forma parte de la latencia (RNF-04 < 200 ms). */
  intervaloConsumoMs: num('CONSUMO_MS', 100),

  /** Periodo de emisión de métricas y posición de la flota (ms). */
  intervaloMetricasMs: num('INTERVALO_MS', 1000),

  /** Periodo de evaluación de rutas (ms). */
  intervaloEvaluacionMs: num('EVALUACION_MS', 5000),

  /** Unidades que puede seguir el servidor (tamaño de los arreglos de la flota). */
  maxUnidades: num('MAX_UNIDADES', 1000),

  /** Distancia a la que se considera que una unidad llegó a un nodo (m). */
  umbralLlegadaM: num('UMBRAL_LLEGADA_M', 20),

  /** Rangos de validación de tramas (RNF-06). */
  validacion: {
    latMin: -90, latMax: 90,
    lngMin: -180, lngMax: 180,
    // El límite urbano es 40–50 km/h; solo se descartan valores imposibles.
    velocidadMax: 120,
  },

  /**
   * Factores para estimar combustible y emisiones (RNF-10).
   * PROVISIONALES: reemplazar consumoLporKm y consumoRalentiLporH con los
   * datos del Consorcio y citar la fuente de cada valor en el informe.
   */
  factores: {
    consumoLporKm: num('CONSUMO_L_KM', 0.40),
    consumoRalentiLporH: num('RALENTI_L_H', 2.5),
    factorKgCO2porL: num('FACTOR_CO2', 2.68),
    velocidadReferenciaKmh: num('VEL_REFERENCIA', 25),
  },
};
