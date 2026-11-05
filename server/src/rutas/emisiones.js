/**
 * Estimación de combustible y emisiones. Funciones puras: el resultado
 * depende solo de sus argumentos y no modifican estado externo.
 */

/**
 * Litros de combustible de un recorrido.
 * @param {number} km                Distancia recorrida.
 * @param {number} segundosDetenido  Tiempo con el motor encendido y la unidad detenida.
 * @param {{consumoLporKm:number, consumoRalentiLporH:number}} factores
 */
export const litrosEstimados = (km, segundosDetenido, { consumoLporKm, consumoRalentiLporH }) =>
  km * consumoLporKm + (segundosDetenido / 3600) * consumoRalentiLporH;

/**
 * Kilogramos de CO₂ por la combustión de un volumen de diésel.
 * @param {number} litros
 * @param {{factorKgCO2porL:number}} factores
 */
export const kgCO2Estimados = (litros, { factorKgCO2porL }) => litros * factorKgCO2porL;

/** Suma de una propiedad numérica sobre una lista. */
export const sumar = (lista, valor) => lista.reduce((total, x) => total + valor(x), 0);
