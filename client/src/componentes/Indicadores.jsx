const MiB = (bytes) => (bytes / 1048576).toFixed(1);

/** Tarjetas con los valores actuales del sistema. */
export default function Indicadores({ m }) {
  const items = [
    { titulo: 'Tramas por segundo', valor: m ? m.tramasPorSegundo : '—', unidad: 'tramas/s' },
    { titulo: 'Latencia promedio', valor: m ? m.latenciaPromedio.toFixed(1) : '—', unidad: 'ms', alerta: m && m.latenciaPromedio > 200 },
    { titulo: 'Unidades activas', valor: m ? m.unidadesActivas : '—', unidad: 'buses' },
    { titulo: 'Heap usado', valor: m ? MiB(m.heapUsed) : '—', unidad: 'MiB' },
    { titulo: 'Ocupación del buffer', valor: m ? `${m.tam}/${m.capacidad}` : '—', unidad: 'tramas' },
    { titulo: 'Pérdidas / inválidas', valor: m ? `${m.perdidas} / ${m.invalidas}` : '—', unidad: 'tramas' },
  ];
  return (
    <section className="indicadores">
      {items.map((it) => (
        <article key={it.titulo} className={`tarjeta${it.alerta ? ' alerta' : ''}`}>
          <span className="tarjeta-titulo">{it.titulo}</span>
          <strong className="tarjeta-valor">{it.valor}</strong>
          <span className="tarjeta-unidad">{it.unidad}</span>
        </article>
      ))}
    </section>
  );
}
