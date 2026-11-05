import {
  Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

/**
 * Gráfica de líneas para una o más series del historial.
 * @param {{titulo:string, historial:object[], series:{etiqueta:string, valor:(p:object)=>number, color:string}[], unidad:string}} props
 */
export default function GraficoSerie({ titulo, historial, series, unidad }) {
  const datos = {
    labels: historial.map((p) => new Date(p.ts).toLocaleTimeString('es-EC', { minute: '2-digit', second: '2-digit' })),
    datasets: series.map((s) => ({
      label: s.etiqueta,
      data: historial.map(s.valor),
      borderColor: s.color,
      backgroundColor: s.color,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.25,
    })),
  };
  const opciones = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
    scales: {
      x: { ticks: { maxTicksLimit: 6 }, grid: { display: false } },
      y: { beginAtZero: true, title: { display: true, text: unidad } },
    },
  };
  return (
    <section className="panel">
      <h2>{titulo}</h2>
      <div className="grafico"><Line data={datos} options={opciones} /></div>
    </section>
  );
}
