/**
 * Validación de tramas (RF-04, RNF-06).
 * Solo realiza comparaciones; no crea objetos.
 */
import { config } from './config.js';

const R = config.validacion;
const UINT32_MAX = 4294967295;

/**
 * @param {unknown} t  Dato recibido por el socket.
 * @returns {boolean} true si la trama tiene los cinco campos dentro de rango.
 */
export function esTramaValida(t) {
  if (t === null || typeof t !== 'object') return false;
  if (!Number.isInteger(t.unidadId) || t.unidadId < 1 || t.unidadId > UINT32_MAX) return false;
  if (typeof t.lat !== 'number' || !(t.lat >= R.latMin && t.lat <= R.latMax)) return false;
  if (typeof t.lng !== 'number' || !(t.lng >= R.lngMin && t.lng <= R.lngMax)) return false;
  if (typeof t.velocidad !== 'number' || !(t.velocidad >= 0 && t.velocidad <= R.velocidadMax)) return false;
  if (typeof t.ts !== 'number' || !Number.isFinite(t.ts) || t.ts <= 0) return false;
  return true;
}
