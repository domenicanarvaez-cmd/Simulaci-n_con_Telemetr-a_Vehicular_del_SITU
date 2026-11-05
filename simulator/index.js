/**
 * Simulador de unidades del SITU (RF-02).
 *
 * Cada unidad recorre su línea tramo a tramo sobre la red vial, ida y vuelta,
 * con velocidad variable según la congestión de cada calle y detenciones en
 * las paradas. Un único temporizador mueve todas las unidades y emite una
 * trama por unidad en cada ciclo.
 *
 * Uso:
 *   node index.js [--unidades 234] [--hz 1] [--duracion 0] [--invalidas 0] [--url http://localhost:3000]
 *
 * Ejemplos:
 *   node index.js                                     carga realista (234 tramas/s)
 *   node index.js --unidades 100 --hz 10              carga de estrés del SRS (1 000 tramas/s)
 *   node index.js --invalidas 0.05                    5 % de tramas defectuosas (RNF-06)
 */
import { io } from 'socket.io-client';
import { ListaDoble } from '../shared/ListaDoble.js';
import { construirRedLoja, lineaDeUnidad } from '../shared/redLoja.js';
import { distanciaMetros } from '../shared/geo.js';

/** Lee `--nombre valor` de la línea de comandos. */
function argumento(nombre, porDefecto) {
  const i = process.argv.indexOf(`--${nombre}`);
  if (i === -1 || i + 1 >= process.argv.length) return porDefecto;
  const valor = process.argv[i + 1];
  return typeof porDefecto === 'number' ? Number(valor) : valor;
}

const UNIDADES = argumento('unidades', 234);
const HZ = argumento('hz', 1);
const DURACION_S = argumento('duracion', 0);
const PROPORCION_INVALIDAS = argumento('invalidas', 0);
const URL = argumento('url', 'http://localhost:3000');

/** Velocidad de un bus en flujo libre (km/h) y límite urbano. */
const VELOCIDAD_LIBRE = 35;
const VELOCIDAD_MAXIMA = 50;
/** Duración de una detención en parada (s). */
const PARADA_MIN = 5;
const PARADA_MAX = 12;

// --- Red vial y líneas ------------------------------------------------------
const red = construirRedLoja();
const tramoPorPar = new Map(red.tramos.map((t) => [t.a * 10000 + t.b, t]));
/** Construye la ListaDoble de un recorrido marcando sus paradas. */
function construirRuta(nodos, paradas) {
  const ruta = new ListaDoble();
  const esParada = new Set(paradas);
  for (const n of nodos) ruta.agregarAlFinal(n).esParada = esParada.has(n);
  return ruta;
}
const rutas = red.lineas.map((l) => construirRuta(l.nodos, l.paradas));

// --- Estado de cada unidad en arreglos tipados -------------------------------
const lat = new Float64Array(UNIDADES);
const lng = new Float64Array(UNIDADES);
const velocidad = new Float64Array(UNIDADES);
const avanceM = new Float64Array(UNIDADES);       // metros recorridos en el tramo actual
const esperaS = new Float64Array(UNIDADES);       // segundos restantes de parada
const sentido = new Int8Array(UNIDADES);
const origen = new Array(UNIDADES);               // nodo de la ruta desde el que salió

/** Tramo que recorre la unidad i en este momento. */
function tramoActual(i) {
  const destino = ListaDoble.avanzar(origen[i], sentido[i]);
  return tramoPorPar.get(origen[i].nodoId * 10000 + destino.nodoId);
}

/** Interpola la posición de la unidad i sobre su tramo. */
function ubicar(i) {
  const a = red.nodos[origen[i].nodoId];
  const b = red.nodos[ListaDoble.avanzar(origen[i], sentido[i]).nodoId];
  const f = Math.min(avanceM[i] / (tramoActual(i).km * 1000), 1);
  lat[i] = a.lat + (b.lat - a.lat) * f;
  lng[i] = a.lng + (b.lng - a.lng) * f;
}

// Posición inicial aleatoria sobre la línea asignada.
for (let i = 0; i < UNIDADES; i++) {
  const ruta = rutas[lineaDeUnidad(i + 1, rutas.length)];
  origen[i] = ruta.obtener(Math.floor(Math.random() * (ruta.tamano - 1)));
  sentido[i] = 1;
  if (Math.random() < 0.5 && origen[i].siguiente !== null) {
    origen[i] = origen[i].siguiente;
    sentido[i] = -1;
  }
  avanceM[i] = Math.random() * tramoActual(i).km * 1000;
  ubicar(i);
}

/** Mueve la unidad i durante dt segundos. */
function mover(i, dt) {
  if (esperaS[i] > 0) {
    esperaS[i] -= dt;
    velocidad[i] = 0;
    return;
  }
  const ruido = 0.85 + Math.random() * 0.3;
  velocidad[i] = Math.min(VELOCIDAD_MAXIMA, VELOCIDAD_LIBRE * tramoActual(i).congestion * ruido);
  avanceM[i] += (velocidad[i] / 3.6) * dt;

  const largo = tramoActual(i).km * 1000;
  if (avanceM[i] >= largo) {
    // Llegó al siguiente nodo: el excedente se descarta para que pase cerca del nodo.
    origen[i] = ListaDoble.avanzar(origen[i], sentido[i]);
    avanceM[i] = 0;
    if (ListaDoble.avanzar(origen[i], sentido[i]) === null) sentido[i] = -sentido[i];
    if (origen[i].esParada) esperaS[i] = PARADA_MIN + Math.random() * (PARADA_MAX - PARADA_MIN);
  }
  ubicar(i);
}

/**
 * Aplica un nuevo recorrido a una línea. Cada unidad de la línea se ubica en
 * el nodo más cercano del nuevo recorrido y continúa desde ahí.
 */
function cambiarRuta({ lineaId, nodos, paradas }) {
  if (rutas[lineaId].aArreglo().join() === nodos.join()) return;
  const ruta = construirRuta(nodos, paradas);
  rutas[lineaId] = ruta;
  let reubicadas = 0;
  for (let i = 0; i < UNIDADES; i++) {
    if (lineaDeUnidad(i + 1, rutas.length) !== lineaId) continue;
    let mejor = ruta.cabeza;
    let mejorDist = Infinity;
    for (let n = ruta.cabeza; n !== null; n = n.siguiente) {
      const p = red.nodos[n.nodoId];
      const d = distanciaMetros(lat[i], lng[i], p.lat, p.lng);
      if (d < mejorDist) { mejorDist = d; mejor = n; }
    }
    origen[i] = mejor;
    sentido[i] = mejor.siguiente !== null ? 1 : -1;
    avanceM[i] = 0;
    esperaS[i] = 0;
    ubicar(i);
    reubicadas++;
  }
  console.log(`Línea ${red.lineas[lineaId].nombre}: nuevo recorrido de ${nodos.length} nodos, ${reubicadas} unidades reubicadas`);
}

/** Trama defectuosa de uno de cuatro tipos, para probar la validación. */
function tramaInvalida(i) {
  switch (Math.floor(Math.random() * 4)) {
    case 0: return { unidadId: i + 1, lat: lat[i] };
    case 1: return { unidadId: i + 1, lat: 999, lng: lng[i], velocidad: 30, ts: Date.now() };
    case 2: return { unidadId: i + 1, lat: lat[i], lng: lng[i], velocidad: -10, ts: Date.now() };
    default: return 'trama-corrupta';
  }
}

// --- Envío -------------------------------------------------------------------
const socket = io(URL, { query: { rol: 'simulador' } });
let validas = 0;
let invalidas = 0;

socket.once('connect', () => {
  console.log(`Simulador conectado a ${URL}: ${UNIDADES} unidades × ${HZ} Hz = ${UNIDADES * HZ} tramas/s`);
  const periodoMs = 1000 / HZ;

  const temporizador = setInterval(() => {
    const ahora = Date.now();
    for (let i = 0; i < UNIDADES; i++) {
      mover(i, periodoMs / 1000);
      if (PROPORCION_INVALIDAS > 0 && Math.random() < PROPORCION_INVALIDAS) {
        socket.emit('telemetria', tramaInvalida(i));
        invalidas++;
        continue;
      }
      socket.emit('telemetria', {
        unidadId: i + 1,
        lat: lat[i],
        lng: lng[i],
        velocidad: Number(velocidad[i].toFixed(1)),
        ts: ahora,
      });
      validas++;
    }
  }, periodoMs);

  if (DURACION_S > 0) {
    setTimeout(() => {
      clearInterval(temporizador);
      setTimeout(() => {
        console.log(`Fin: ${validas} tramas válidas y ${invalidas} inválidas enviadas`);
        socket.disconnect();
      }, 500);
    }, DURACION_S * 1000);
  }
});

socket.on('rutas', cambiarRuta);
socket.on('connect_error', (err) => console.error(`Sin conexión con ${URL}: ${err.message}`));
