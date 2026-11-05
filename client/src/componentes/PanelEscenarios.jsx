/** Hora local hh:mm:ss de una marca de tiempo. */
const hora = (ts) => new Date(ts).toLocaleTimeString('es-EC', { hour12: false });

/**
 * Historial de cambios de ruta con Deshacer y Rehacer.
 * El historial se muestra desde el cambio más reciente (cima de la pila).
 */
export default function PanelEscenarios({ escenarios, error, onDeshacer, onRehacer }) {
  const historial = escenarios?.historial ?? [];
  const rehacer = escenarios?.rehacer ?? [];

  return (
    <section className="panel">
      <div className="encabezado-panel">
        <h2>Escenarios de ruta</h2>
        <div className="botones">
          <button type="button" onClick={onDeshacer} disabled={!escenarios?.puedeDeshacer}>Deshacer</button>
          <button type="button" onClick={onRehacer} disabled={!escenarios?.puedeRehacer}>Rehacer</button>
        </div>
      </div>
      {error && <p className="aviso">{error}</p>}
      {historial.length === 0 && rehacer.length === 0 ? (
        <p className="vacio">Sin cambios aplicados. Todas las líneas usan su recorrido original.</p>
      ) : (
        <ol className="historial">
          {historial.map((c, i) => (
            <li key={`h${c.ts}-${i}`}><span>{hora(c.ts)}</span> {c.descripcion}{i === 0 && <em> (último cambio)</em>}</li>
          ))}
          {rehacer.map((c, i) => (
            <li key={`r${c.ts}-${i}`} className="deshecho"><span>{hora(c.ts)}</span> {c.descripcion} <em>(deshecho)</em></li>
          ))}
        </ol>
      )}
    </section>
  );
}
