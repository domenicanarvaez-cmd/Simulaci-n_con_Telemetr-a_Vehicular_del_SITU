import { useMemo } from 'react';

const ANCHO = 560;
const ALTO = 480;
const MARGEN = 28;

/** Color de un tramo según su velocidad promedio observada (km/h). */
function colorVelocidad(v) {
  if (v === null || v === undefined) return '#c8ccd2';
  if (v < 15) return '#d9372b';
  if (v < 25) return '#f0a020';
  return '#2e9e5b';
}

/**
 * Mapa esquemático de la red vial con la posición de las unidades.
 * Los tramos se colorean con la velocidad observada; la línea seleccionada
 * muestra su recorrido actual y, si existe, la ruta propuesta.
 */
export default function MapaFlota({ red, flota, evaluacion, seleccionada }) {
  const proyectar = useMemo(() => {
    if (!red) return null;
    const lats = red.nodos.map((n) => n.lat);
    const lngs = red.nodos.map((n) => n.lng);
    const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
    return (lat, lng) => [
      MARGEN + ((lng - minLng) / (maxLng - minLng)) * (ANCHO - 2 * MARGEN),
      MARGEN + ((maxLat - lat) / (maxLat - minLat)) * (ALTO - 2 * MARGEN),
    ];
  }, [red]);

  if (!red || !proyectar) return <section className="panel mapa"><h2>Red vial y flota</h2><p className="vacio">Esperando datos del servidor…</p></section>;

  const nodo = (id) => red.nodos[id];
  const punto = (id) => proyectar(nodo(id).lat, nodo(id).lng);
  const velocidades = evaluacion?.velocidadTramos ?? [];

  // Una calle tiene dos tramos (uno por sentido); se dibuja una sola vez con el promedio de ambos.
  const calles = red.tramos.filter((t) => t.a < t.b).map((t) => {
    const inverso = red.tramos.find((r) => r.a === t.b && r.b === t.a);
    const vs = [velocidades[t.id], inverso ? velocidades[inverso.id] : null].filter((v) => v !== null && v !== undefined);
    return { ...t, velocidad: vs.length ? vs.reduce((s, v) => s + v, 0) / vs.length : null };
  });

  const linea = evaluacion?.lineas.find((l) => l.id === seleccionada);
  const trazo = (ids) => ids.map((id) => punto(id).join(',')).join(' ');
  const colorLinea = (id) => red.lineas[id]?.color ?? '#555';

  return (
    <section className="panel mapa">
      <h2>Red vial y flota</h2>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label="Mapa de la red vial con la posición de las unidades">
        {calles.map((c) => {
          const [x1, y1] = punto(c.a);
          const [x2, y2] = punto(c.b);
          return <line key={c.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colorVelocidad(c.velocidad)} strokeWidth="5" strokeLinecap="round" />;
        })}
        {linea && <polyline points={trazo(linea.nodos)} fill="none" stroke={linea.color} strokeWidth="9" strokeOpacity="0.35" strokeLinejoin="round" />}
        {linea && linea.modificada && linea.original && (
          <polyline points={trazo(linea.original.nodos)} fill="none" stroke="#7a808a" strokeWidth="2.5" strokeDasharray="2 4" strokeLinejoin="round" />
        )}
        {linea && !linea.mismaRuta && linea.propuesta && (
          <polyline points={trazo(linea.propuesta.nodos)} fill="none" stroke="#111" strokeWidth="2.5" strokeDasharray="7 5" strokeLinejoin="round" />
        )}
        {red.nodos.map((n) => {
          const [x, y] = proyectar(n.lat, n.lng);
          return <circle key={n.id} cx={x} cy={y} r="2.5" fill="#7a808a" />;
        })}
        {flota?.unidades.map(([id, l, la, ln, v]) => {
          const [x, y] = proyectar(la, ln);
          return (
            <circle key={id} cx={x} cy={y} r={seleccionada === l ? 4.5 : 3.5} fill={colorLinea(l)} stroke="#fff" strokeWidth="1" opacity={seleccionada === null || seleccionada === l ? 1 : 0.35}>
              <title>{`Unidad ${id} · ${red.lineas[l].nombre} · ${v} km/h`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="leyenda">
        <span><i style={{ background: '#2e9e5b' }} /> ≥ 25 km/h</span>
        <span><i style={{ background: '#f0a020' }} /> 15–25 km/h</span>
        <span><i style={{ background: '#d9372b' }} /> &lt; 15 km/h</span>
        <span><i style={{ background: '#c8ccd2' }} /> sin datos</span>
        <span><i className="discontinua" /> ruta propuesta</span>
        <span><i className="punteada" /> ruta original</span>
      </div>
    </section>
  );
}
