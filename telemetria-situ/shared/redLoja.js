/**
 * Red vial de prueba del centro de Loja.
 *
 * Cuadrícula de 7 × 7 intersecciones (≈ 390 m entre calles) centrada en el
 * casco urbano, con cuatro líneas de bus. Sustituye a la red de OpenStreetMap
 * hasta que se integren los datos reales; el resto del sistema no depende de
 * cómo se construyó la red.
 *
 * El campo `congestion` (factor de velocidad por tramo) lo usa SOLO el
 * simulador para generar tráfico realista. El servidor no lo conoce: debe
 * deducir los tramos lentos a partir de la telemetría.
 */

import { distanciaMetros } from './geo.js';

const FILAS = 7;
const COLUMNAS = 7;
const LAT_NORTE = -3.9855;     // fila 0
const LNG_OESTE = -79.2145;    // columna 0
const PASO_GRADOS = 0.0035;    // ≈ 390 m

/** Id de la intersección en la fila f y columna c. */
const id = (f, c) => f * COLUMNAS + c;

/** Generador pseudoaleatorio con semilla, para que la red sea siempre la misma. */
function aleatorio(semilla) {
  let s = semilla;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Construye la red.
 * @returns {{
 *   nodos: {id:number, lat:number, lng:number}[],
 *   tramos: {id:number, a:number, b:number, km:number, congestion:number}[],
 *   lineas: {id:number, nombre:string, color:string, nodos:number[], paradas:number[]}[]
 * }}
 */
export function construirRedLoja() {
  const azar = aleatorio(42);
  const nodos = [];
  for (let f = 0; f < FILAS; f++) {
    for (let c = 0; c < COLUMNAS; c++) {
      nodos.push({ id: id(f, c), lat: LAT_NORTE - f * PASO_GRADOS, lng: LNG_OESTE + c * PASO_GRADOS });
    }
  }

  // Factor de velocidad de cada calle: 1 = flujo libre, < 1 = congestión.
  // La fila 3 (eje este-oeste) y la columna 3 (eje norte-sur) simulan las
  // avenidas más cargadas del centro.
  const congestionDe = (a, b) => {
    const fa = Math.floor(a / COLUMNAS), fb = Math.floor(b / COLUMNAS);
    const ca = a % COLUMNAS, cb = b % COLUMNAS;
    const enFila3 = fa === 3 && fb === 3 && ca >= 1 && cb >= 1 && ca <= 5 && cb <= 5;
    const enColumna3 = ca === 3 && cb === 3 && fa >= 2 && fb >= 2 && fa <= 4 && fb <= 4;
    if (enFila3) return 0.35;
    if (enColumna3) return 0.5;
    return 0.85 + azar() * 0.25;
  };

  const tramos = [];
  const agregarCalle = (a, b) => {
    const km = distanciaMetros(nodos[a].lat, nodos[a].lng, nodos[b].lat, nodos[b].lng) / 1000;
    const congestion = congestionDe(a, b);
    // Calle de doble sentido: un tramo por cada dirección.
    tramos.push({ id: tramos.length, a, b, km, congestion });
    tramos.push({ id: tramos.length, a: b, b: a, km, congestion });
  };
  for (let f = 0; f < FILAS; f++) {
    for (let c = 0; c < COLUMNAS; c++) {
      if (c + 1 < COLUMNAS) agregarCalle(id(f, c), id(f, c + 1));
      if (f + 1 < FILAS) agregarCalle(id(f, c), id(f + 1, c));
    }
  }

  const fila = (f, c0, c1) => Array.from({ length: c1 - c0 + 1 }, (_, i) => id(f, c0 + i));
  const columna = (c, f0, f1) => Array.from({ length: f1 - f0 + 1 }, (_, i) => id(f0 + i, c));

  const lineas = [
    { id: 0, nombre: 'L1 Oeste–Este', color: '#1f77b4', nodos: fila(3, 0, 6) },
    { id: 1, nombre: 'L2 Norte–Sur', color: '#d62728', nodos: columna(3, 0, 6) },
    { id: 2, nombre: 'L3 Noroeste–Sureste', color: '#2ca02c',
      nodos: [id(0, 0), id(1, 0), id(1, 1), id(2, 1), id(2, 2), id(3, 2), id(3, 3), id(3, 4), id(4, 4), id(5, 4), id(5, 5), id(6, 5), id(6, 6)] },
    { id: 3, nombre: 'L4 Suroeste–Noreste', color: '#9467bd',
      nodos: [id(6, 0), id(5, 0), id(4, 0), id(3, 0), id(3, 1), id(3, 2), id(3, 3), id(2, 3), id(2, 4), id(1, 4), id(1, 5), id(0, 5), id(0, 6)] },
  ];
  for (const l of lineas) l.paradas = paradasDeRecorrido(l.nodos);

  return { nodos, tramos, lineas };
}

/**
 * Línea asignada a una unidad. Simulador y servidor usan la misma regla.
 * @param {number} unidadId  Id de la unidad (desde 1).
 * @param {number} numLineas
 */
export function lineaDeUnidad(unidadId, numLineas) {
  return (unidadId - 1) % numLineas;
}

/**
 * Paradas de un recorrido: una cada dos nodos y los dos extremos.
 * @param {number[]} nodos
 * @returns {number[]}
 */
export function paradasDeRecorrido(nodos) {
  return nodos.filter((_, i) => i % 2 === 0 || i === nodos.length - 1);
}
