import { Fragment } from 'react';

const f1 = (n) => n.toFixed(1);
const f2 = (n) => n.toFixed(2);

/** Texto de la columna de ahorro; una diferencia negativa de CO₂ significa más emisiones. */
function textoAhorro(ahorro) {
  if (!ahorro || ahorro.minutos <= 0) return '—';
  const co2 = ahorro.kgCO2 >= 0 ? `−${f2(ahorro.kgCO2)} kg CO₂` : `+${f2(-ahorro.kgCO2)} kg CO₂`;
  return `−${f1(ahorro.minutos)} min (${f1(ahorro.porcentajeTiempo)} %) · ${co2}`;
}

/** Diferencia de la ruta vigente frente a la original de la línea. */
function textoComparacion(actual, original) {
  const min = actual.minutos - original.minutos;
  const co2 = actual.kgCO2 - original.kgCO2;
  const signo = (n) => (n > 0 ? '+' : n < 0 ? '−' : '');
  return `Vigente frente a original: ${signo(min)}${f1(Math.abs(min))} min · ${signo(co2)}${f2(Math.abs(co2))} kg CO₂`;
}

/** Evaluación de cada línea y comparación con la ruta propuesta. */
export default function TablaEvaluacion({ evaluacion, seleccionada, onSeleccionar, onAplicar, onRestaurar }) {
  return (
    <section className="panel">
      <h2>Evaluación de líneas y rutas propuestas</h2>
      {!evaluacion ? (
        <p className="vacio">La primera evaluación se publica a los pocos segundos de iniciar.</p>
      ) : (
        <div className="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Línea</th><th>Distancia (km)</th><th>Tiempo (min)</th><th>Velocidad (km/h)</th>
                <th>Detenido (min)</th><th>CO₂ (kg)</th><th>Datos</th><th>Ruta propuesta</th><th>Diferencia</th><th>Escenario</th>
              </tr>
            </thead>
            <tbody>
              {evaluacion.lineas.map((l) => (
                <Fragment key={l.id}>
                <tr className={seleccionada === l.id ? 'activa' : ''} onClick={() => onSeleccionar(seleccionada === l.id ? null : l.id)}>
                  <td><i className="punto" style={{ background: l.color }} />{l.nombre}</td>
                  <td>{f2(l.actual.km)}</td>
                  <td>{f1(l.actual.minutos)}</td>
                  <td>{f1(l.actual.velocidadKmh)}</td>
                  <td>{f1(l.actual.minutosDetenido)}</td>
                  <td>{f2(l.actual.kgCO2)}</td>
                  <td>{Math.round(l.actual.cobertura * 100)} %</td>
                  <td>{l.mismaRuta || !l.propuesta ? 'Sin cambios' : `${f2(l.propuesta.km)} km · ${f1(l.propuesta.minutos)} min`}</td>
                  <td>{textoAhorro(l.ahorro)}</td>
                  <td className="acciones" onClick={(e) => e.stopPropagation()}>
                    {!l.mismaRuta && l.propuesta && <button type="button" onClick={() => onAplicar(l.id)}>Aplicar propuesta</button>}
                    {l.modificada && <button type="button" className="secundario" onClick={() => onRestaurar(l.id)}>Restaurar original</button>}
                  </td>
                </tr>
                {l.modificada && l.original && (
                  <tr className="fila-original">
                    <td>Ruta original</td>
                    <td>{f2(l.original.km)}</td>
                    <td>{f1(l.original.minutos)}</td>
                    <td>{f1(l.original.velocidadKmh)}</td>
                    <td>{f1(l.original.minutosDetenido)}</td>
                    <td>{f2(l.original.kgCO2)}</td>
                    <td>{Math.round(l.original.cobertura * 100)} %</td>
                    <td colSpan="3">{textoComparacion(l.actual, l.original)}</td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="nota">Valores estimados por recorrido de ida. La ruta propuesta minimiza el tiempo; la columna Diferencia muestra el cambio en tiempo y en CO₂ (un valor positivo de CO₂ indica más emisiones, por ejemplo cuando la ruta rápida es más larga). "Datos" indica el porcentaje de tramos de la línea con mediciones; con menos del 100 % se usa una velocidad de referencia para los tramos sin datos. Seleccione una línea para verla en el mapa. "Aplicar propuesta" cambia el recorrido de la línea en la simulación; las unidades se reubican y la nueva ruta se mide con su propia telemetría.</p>
    </section>
  );
}
