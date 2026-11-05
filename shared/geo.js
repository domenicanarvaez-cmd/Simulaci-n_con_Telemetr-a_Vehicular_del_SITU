/**
 * Utilidades geográficas.
 */

const RADIO_TIERRA_M = 6371000;
const RAD = Math.PI / 180;

/**
 * Distancia entre dos coordenadas con la fórmula de Haversine.
 * @returns {number} Distancia en metros.
 */
export function distanciaMetros(lat1, lng1, lat2, lng2) {
  const dLat = (lat2 - lat1) * RAD;
  const dLng = (lng2 - lng1) * RAD;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(a));
}
