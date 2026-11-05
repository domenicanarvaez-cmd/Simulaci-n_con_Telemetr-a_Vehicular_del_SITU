import { useState } from 'react';
import { useTelemetria } from './useTelemetria.js';
import Indicadores from './componentes/Indicadores.jsx';
import GraficoSerie from './componentes/GraficoSerie.jsx';
import MapaFlota from './componentes/MapaFlota.jsx';
import TablaEvaluacion from './componentes/TablaEvaluacion.jsx';
import PanelEscenarios from './componentes/PanelEscenarios.jsx';

const MiB = (b) => b / 1048576;

export default function App() {
  const { conectado, red, metricas, historial, flota, evaluacion, escenarios, errorEscenario, enviar } = useTelemetria();
  const [seleccionada, setSeleccionada] = useState(null);

  return (
    <div className="app">
      <header>
        <div>
          <h1>Telemetría SITU</h1>
          <p>Ingesta en tiempo real y evaluación de rutas · Grupo 5, Estructura de Datos UNL</p>
        </div>
        <span className={`estado ${conectado ? 'ok' : 'error'}`}>{conectado ? 'Conectado' : 'Sin conexión'}</span>
      </header>

      <Indicadores m={metricas} />

      <main className="cuerpo">
        <MapaFlota red={red} flota={flota} evaluacion={evaluacion} seleccionada={seleccionada} />
        <div className="columna">
          <GraficoSerie
            titulo="Latencia"
            unidad="ms"
            historial={historial}
            series={[
              { etiqueta: 'Emisión → servidor (promedio)', valor: (p) => p.latenciaPromedio, color: '#1f77b4' },
              { etiqueta: 'Servidor → interfaz', valor: (p) => p.latenciaInterfaz, color: '#ff7f0e' },
            ]}
          />
          <GraficoSerie
            titulo="Memoria del proceso"
            unidad="MiB"
            historial={historial}
            series={[
              { etiqueta: 'Heap usado', valor: (p) => MiB(p.heapUsed), color: '#2ca02c' },
              { etiqueta: 'ArrayBuffers (buffer y flota)', valor: (p) => MiB(p.arrayBuffers), color: '#9467bd' },
            ]}
          />
        </div>
      </main>

      <TablaEvaluacion
        evaluacion={evaluacion}
        seleccionada={seleccionada}
        onSeleccionar={setSeleccionada}
        onAplicar={(id) => enviar('escenarios:aplicar', id)}
        onRestaurar={(id) => enviar('escenarios:restaurar', id)}
      />
      <PanelEscenarios
        escenarios={escenarios}
        error={errorEscenario}
        red={red}
        onDeshacer={() => enviar('escenarios:deshacer')}
        onRehacer={() => enviar('escenarios:rehacer')}
      />
    </div>
  );
}
