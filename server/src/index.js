/**
 * Servidor de ingesta y evaluación de rutas del SITU.
 *
 * Flujo:
 *   simulador ──telemetria──▶ validación ──▶ BufferCircular
 *   consumidor (cada 100 ms): buffer → métricas de latencia → seguimiento de flota → acumulador de tramos
 *   cada 1 s: eventos metricas y flota al dashboard
 *   cada 5 s: evaluación de líneas y propuesta de rutas (evento evaluacion)
 *   escenarios: el dashboard aplica la ruta propuesta de una línea y puede
 *   deshacer o rehacer el cambio; el simulador recibe el recorrido vigente.
 *
 * Uso: node src/index.js
 */
import { Server } from 'socket.io';
import { BufferCircular } from './BufferCircular.js';
import { Metricas } from './Metricas.js';
import { esTramaValida } from './validacion.js';
import { config } from './config.js';
import { crearProcesador, crearConsumidor } from './ingesta.js';
import { Grafo } from './rutas/Grafo.js';
import { AcumuladorTramos } from './rutas/AcumuladorTramos.js';
import { EvaluadorRutas } from './rutas/EvaluadorRutas.js';
import { construirLinea, construirLineas } from './rutas/Lineas.js';
import { SeguimientoFlota } from './flota/SeguimientoFlota.js';
import { GestorEscenarios } from './escenarios/GestorEscenarios.js';
import { construirRedLoja, paradasDeRecorrido } from '../../shared/redLoja.js';

// Estructuras creadas una sola vez al iniciar.
const red = construirRedLoja();
const grafo = Grafo.desdeRed(red);
const lineas = construirLineas(grafo, red.lineas);
const acumulador = new AcumuladorTramos(grafo.numTramos);
const flota = new SeguimientoFlota(grafo, lineas, acumulador, config);
const evaluador = new EvaluadorRutas(grafo, acumulador, config.factores);
const buffer = new BufferCircular(config.capacidad);
const metricas = new Metricas();

const procesarTrama = crearProcesador({ buffer, metricas, validar: esTramaValida });
const consumir = crearConsumidor({ buffer, metricas, flota, reloj: Date.now });

// Recorridos originales, para comparar contra los escenarios aplicados.
const recorridosOriginales = red.lineas.map((l) => [...l.nodos]);

// Datos estáticos de la red para dibujar el mapa (sin el factor de congestión).
const redPublica = {
  nodos: red.nodos,
  tramos: red.tramos.map(({ id, a, b, km }) => ({ id, a, b, km })),
  lineas: red.lineas.map(({ id, nombre, color, nodos, paradas }) => ({ id, nombre, color, nodos, paradas })),
};

const io = new Server(config.puerto, { cors: { origin: '*' } });
let ultimaEvaluacion = null;

/** Recorrido vigente de una línea en el formato del evento `rutas`. */
const recorridoVigente = (i) => ({ lineaId: i, nodos: redPublica.lineas[i].nodos, paradas: redPublica.lineas[i].paradas });

/**
 * Reemplaza el recorrido de una línea en todo el sistema: ListaDoble del
 * servidor, seguimiento de sus unidades, datos del mapa y simulador.
 */
function cambiarRuta(i, nodos) {
  const paradas = paradasDeRecorrido(nodos);
  lineas[i].ruta = construirLinea(grafo, { ...red.lineas[i], nodos, paradas }).ruta;
  const reiniciadas = flota.reiniciarLinea(i);
  redPublica.lineas[i] = { ...redPublica.lineas[i], nodos, paradas };

  io.to('simulador').emit('rutas', recorridoVigente(i));
  io.to('dashboard').emit('red', redPublica);
  console.log(`[escenario] ${lineas[i].nombre}: ${nodos.length} nodos, ${reiniciadas} unidades reubicadas`);
}

const escenarios = new GestorEscenarios(cambiarRuta);

function evaluar() {
  ultimaEvaluacion = {
    ts: Date.now(),
    lineas: lineas.map((l, i) => evaluador.evaluarLinea(l, recorridosOriginales[i])),
    velocidadTramos: evaluador.velocidadesPorTramo(),
  };
  io.to('dashboard').emit('evaluacion', ultimaEvaluacion);
}

/** Ejecuta una acción de escenario y publica el resultado. */
function accionEscenario(socket, accion) {
  try {
    const resultado = accion();
    if (resultado === null) {
      socket.emit('escenarios:error', 'No hay cambios para esta acción.');
      return;
    }
    evaluar();
    io.to('dashboard').emit('escenarios', escenarios.estado());
  } catch (err) {
    console.error('[error] escenario:', err.message);
    socket.emit('escenarios:error', err.message);
  }
}

io.on('connection', (socket) => {
  const rol = socket.handshake.query.rol ?? 'desconocido';
  console.log(`[conexión] ${rol} ${socket.id}`);

  if (rol === 'simulador') {
    socket.join('simulador');
    // Si el simulador se reinicia, recibe los recorridos vigentes.
    lineas.forEach((_, i) => socket.emit('rutas', recorridoVigente(i)));
  }

  if (rol === 'dashboard') {
    socket.join('dashboard');
    socket.emit('red', redPublica);
    socket.emit('escenarios', escenarios.estado());
    if (ultimaEvaluacion) socket.emit('evaluacion', ultimaEvaluacion);

    socket.on('escenarios:aplicar', (lineaId) => accionEscenario(socket, () => {
      const i = lineas.findIndex((l) => l.id === lineaId);
      if (i < 0) throw new Error(`Línea inexistente: ${lineaId}`);
      const evaluacion = evaluador.evaluarLinea(lineas[i]);
      if (!evaluacion.propuesta || evaluacion.mismaRuta) return null;
      return escenarios.aplicar(i, evaluacion.nodos, evaluacion.propuesta.nodos, `${lineas[i].nombre}: ruta propuesta`);
    }));
    socket.on('escenarios:restaurar', (lineaId) => accionEscenario(socket, () => {
      const i = lineas.findIndex((l) => l.id === lineaId);
      if (i < 0) throw new Error(`Línea inexistente: ${lineaId}`);
      const vigente = lineas[i].ruta.aArreglo();
      if (vigente.join() === recorridosOriginales[i].join()) return null;
      return escenarios.aplicar(i, vigente, recorridosOriginales[i], `${lineas[i].nombre}: ruta original`);
    }));
    socket.on('escenarios:deshacer', () => accionEscenario(socket, () => escenarios.deshacer()));
    socket.on('escenarios:rehacer', () => accionEscenario(socket, () => escenarios.rehacer()));
  }

  // Camino crítico: validar y escribir en O(1), sin crear objetos.
  socket.on('telemetria', (trama) => {
    try {
      procesarTrama(trama);
    } catch (err) {
      metricas.registrarInvalida();
      console.error('[error] trama no procesada:', err.message);
    }
  });

  socket.on('disconnect', (motivo) => console.log(`[desconexión] ${rol} ${socket.id} (${motivo})`));
});

// Consumidor: vacía el buffer en orden FIFO (RF-07).
setInterval(() => {
  try {
    consumir();
  } catch (err) {
    console.error('[error] consumidor:', err.message);
  }
}, config.intervaloConsumoMs);

// Métricas y posición de la flota (RF-11, RF-12).
setInterval(() => {
  try {
    const datos = metricas.resumen(buffer);
    datos.unidadesActivas = flota.unidadesActivas;
    datos.pasadasRegistradas = acumulador.totalPasadas();
    io.to('dashboard').emit('metricas', datos);
    io.to('dashboard').emit('flota', flota.instantanea());

    console.log(
      `[métricas] λ=${datos.tramasPorSegundo} tramas/s · L=${datos.latenciaPromedio} ms · ` +
      `heap=${(datos.heapUsed / 1048576).toFixed(1)} MiB · unidades=${datos.unidadesActivas} · ` +
      `pasadas=${datos.pasadasRegistradas} · pérdidas=${datos.perdidas} · inválidas=${datos.invalidas}`
    );
  } catch (err) {
    console.error('[error] métricas:', err.message);
  }
}, config.intervaloMetricasMs);

// Evaluación de líneas y propuesta de rutas (RF-09, RF-10).
setInterval(() => {
  try {
    evaluar();
  } catch (err) {
    console.error('[error] evaluación:', err.message);
  }
}, config.intervaloEvaluacionMs);

console.log(
  `Servidor en http://localhost:${config.puerto} · C=${config.capacidad} ` +
  `(${(buffer.bytesReservados / 1024).toFixed(0)} KiB) · red: ${grafo.numNodos} nodos, ` +
  `${grafo.numTramos} tramos, ${lineas.length} líneas`
);
