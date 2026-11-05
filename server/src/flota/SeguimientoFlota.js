/**
 * Seguimiento de la flota y asignación de tramos (RF-08).
 *
 * Mantiene el último estado conocido de cada unidad y detecta cuándo llega
 * al siguiente nodo de su línea. Al completar un tramo registra su duración
 * en el AcumuladorTramos.
 *
 * Cada trama se compara solo con el nodo siguiente y el anterior de la ruta
 * de la unidad (ListaDoble), por lo que el costo es O(1). El estado vive en
 * arreglos tipados indexados por unidad, reservados al iniciar.
 */
import { ListaDoble } from '../../../shared/ListaDoble.js';
import { distanciaMetros } from '../../../shared/geo.js';
import { lineaDeUnidad } from '../../../shared/redLoja.js';

/** Velocidad bajo la cual la unidad se considera detenida (km/h). */
const VELOCIDAD_DETENIDA = 1;
/** Intervalo máximo entre tramas para acumular tiempo (s); por encima se asume pérdida de señal. */
const DT_MAXIMO = 30;

export class SeguimientoFlota {
  /**
   * @param {import('../rutas/Grafo.js').Grafo} grafo
   * @param {{ruta:ListaDoble}[]} lineas
   * @param {import('../rutas/AcumuladorTramos.js').AcumuladorTramos} acumulador
   * @param {{maxUnidades:number, umbralLlegadaM:number}} opciones
   */
  constructor(grafo, lineas, acumulador, { maxUnidades, umbralLlegadaM }) {
    this.grafo = grafo;
    this.lineas = lineas;
    this.acumulador = acumulador;
    this.maxUnidades = maxUnidades;
    this.umbral = umbralLlegadaM;

    this.lat = new Float64Array(maxUnidades);
    this.lng = new Float64Array(maxUnidades);
    this.velocidad = new Float64Array(maxUnidades);
    this.tsAnterior = new Float64Array(maxUnidades);
    this.linea = new Int16Array(maxUnidades).fill(-1);
    this.sentido = new Int8Array(maxUnidades);
    this.segundosEnTramo = new Float64Array(maxUnidades);
    this.segundosDetenido = new Float64Array(maxUnidades);
    /** 1 cuando el tramo en curso empezó en un nodo (se puede registrar completo). */
    this.tramoValido = new Uint8Array(maxUnidades);
    /** Nodo de la ruta desde el que salió cada unidad (referencias, sin copias). */
    this.nodoOrigen = new Array(maxUnidades).fill(null);
    this.unidadesActivas = 0;
  }

  /**
   * Procesa una trama válida. O(1) salvo la primera trama de cada unidad.
   * @returns {boolean} false si la unidad está fuera del rango configurado.
   */
  procesar(unidadId, lat, lng, velocidad, ts) {
    const u = unidadId - 1;
    if (u < 0 || u >= this.maxUnidades) return false;

    if (this.linea[u] === -1) {
      this.#iniciarUnidad(u, unidadId, lat, lng, ts);
    } else {
      const dt = (ts - this.tsAnterior[u]) / 1000;
      if (dt > 0 && dt <= DT_MAXIMO) {
        this.segundosEnTramo[u] += dt;
        if (velocidad < VELOCIDAD_DETENIDA) this.segundosDetenido[u] += dt;
      }
      this.#detectarLlegada(u, lat, lng);
    }

    this.lat[u] = lat;
    this.lng[u] = lng;
    this.velocidad[u] = velocidad;
    this.tsAnterior[u] = ts;
    return true;
  }

  /** Ubica la unidad en el nodo más cercano de su línea. O(k), solo una vez por unidad. */
  #iniciarUnidad(u, unidadId, lat, lng, ts) {
    const l = lineaDeUnidad(unidadId, this.lineas.length);
    let mejor = null;
    let mejorDist = Infinity;
    for (let n = this.lineas[l].ruta.cabeza; n !== null; n = n.siguiente) {
      const p = this.grafo.nodos.get(n.nodoId);
      const d = distanciaMetros(lat, lng, p.lat, p.lng);
      if (d < mejorDist) { mejorDist = d; mejor = n; }
    }
    this.linea[u] = l;
    this.nodoOrigen[u] = mejor;
    this.sentido[u] = mejor.siguiente !== null ? 1 : -1;
    this.tramoValido[u] = 0;
    this.segundosEnTramo[u] = 0;
    this.segundosDetenido[u] = 0;
    this.tsAnterior[u] = ts;
    this.unidadesActivas++;
  }

  /** Revisa si la unidad llegó al nodo siguiente o al anterior de su ruta. O(1). */
  #detectarLlegada(u, lat, lng) {
    const origen = this.nodoOrigen[u];
    const sentido = this.sentido[u];
    const adelante = ListaDoble.avanzar(origen, sentido);
    const atras = ListaDoble.avanzar(origen, -sentido);

    if (adelante !== null && this.#cerca(adelante, lat, lng)) {
      this.#completarTramo(u, ListaDoble.tramoHacia(origen, sentido), adelante, sentido);
    } else if (atras !== null && this.#cerca(atras, lat, lng)) {
      this.#completarTramo(u, ListaDoble.tramoHacia(origen, -sentido), atras, -sentido);
    }
  }

  #cerca(nodo, lat, lng) {
    const p = this.grafo.nodos.get(nodo.nodoId);
    return distanciaMetros(lat, lng, p.lat, p.lng) < this.umbral;
  }

  #completarTramo(u, idTramo, llegada, sentido) {
    if (this.tramoValido[u] === 1) {
      this.acumulador.registrarPasada(idTramo, this.segundosEnTramo[u], this.segundosDetenido[u]);
    }
    this.nodoOrigen[u] = llegada;
    // En el extremo de la línea la unidad da la vuelta.
    this.sentido[u] = ListaDoble.avanzar(llegada, sentido) === null ? -sentido : sentido;
    this.segundosEnTramo[u] = 0;
    this.segundosDetenido[u] = 0;
    this.tramoValido[u] = 1;
  }

  /**
   * Reinicia el seguimiento de las unidades de una línea tras un cambio de
   * recorrido. Con la siguiente trama cada unidad se ubica de nuevo sobre la
   * ruta vigente y su primer tramo parcial se descarta. O(n).
   * @param {number} l  Índice de la línea.
   * @returns {number} Unidades reiniciadas.
   */
  reiniciarLinea(l) {
    let reiniciadas = 0;
    for (let u = 0; u < this.maxUnidades; u++) {
      if (this.linea[u] !== l) continue;
      this.linea[u] = -1;
      this.nodoOrigen[u] = null;
      this.unidadesActivas--;
      reiniciadas++;
    }
    return reiniciadas;
  }

  /**
   * Instantánea de la flota para el dashboard. Se llama una vez por segundo,
   * fuera del camino crítico.
   */
  instantanea() {
    const unidades = [];
    for (let u = 0; u < this.maxUnidades; u++) {
      if (this.linea[u] === -1) continue;
      unidades.push([u + 1, this.linea[u], +this.lat[u].toFixed(6), +this.lng[u].toFixed(6), +this.velocidad[u].toFixed(1)]);
    }
    return { unidades };
  }
}
