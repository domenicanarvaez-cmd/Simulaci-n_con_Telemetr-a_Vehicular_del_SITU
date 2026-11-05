import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

/** Dirección del servidor de ingesta. Se puede cambiar con VITE_SERVIDOR en un archivo .env. */
const SERVIDOR = import.meta.env.VITE_SERVIDOR ?? 'http://localhost:3000';
/** Segundos de historia que se muestran en las gráficas. */
const VENTANA = 60;

/**
 * Suscripción a los eventos del servidor.
 * @returns {{conectado:boolean, red:object|null, metricas:object|null, historial:object[], flota:object|null,
 *   evaluacion:object|null, escenarios:object|null, errorEscenario:string|null, enviar:(evento:string, dato?:unknown) => void}}
 */
export function useTelemetria() {
  const [conectado, setConectado] = useState(false);
  const [red, setRed] = useState(null);
  const [metricas, setMetricas] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [flota, setFlota] = useState(null);
  const [evaluacion, setEvaluacion] = useState(null);
  const [escenarios, setEscenarios] = useState(null);
  const [errorEscenario, setErrorEscenario] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SERVIDOR, { query: { rol: 'dashboard' } });
    socketRef.current = socket;

    socket.on('connect', () => setConectado(true));
    socket.on('disconnect', () => setConectado(false));
    socket.on('red', setRed);
    socket.on('flota', setFlota);
    socket.on('evaluacion', setEvaluacion);
    socket.on('escenarios', (e) => { setEscenarios(e); setErrorEscenario(null); });
    socket.on('escenarios:error', setErrorEscenario);
    socket.on('metricas', (m) => {
      // Latencia de extremo a extremo: emisión del resumen → recepción en la interfaz.
      const latenciaInterfaz = Date.now() - m.ts;
      const punto = { ...m, latenciaInterfaz };
      setMetricas(punto);
      setHistorial((h) => [...h.slice(-(VENTANA - 1)), punto]);
    });

    return () => socket.disconnect();
  }, []);

  /** Envía una acción al servidor (aplicar, restaurar, deshacer, rehacer). */
  const enviar = useCallback((evento, dato) => socketRef.current?.emit(evento, dato), []);

  return { conectado, red, metricas, historial, flota, evaluacion, escenarios, errorEscenario, enviar };
}
