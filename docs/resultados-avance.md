# Resultados del avance

Equipo de prueba: Node.js v22.22.0, Linux, 2 núcleos. Las cifras se reproducen con los comandos indicados.

## Pruebas unitarias

`npm test`: 36 pruebas en 9 archivos, todas aprobadas.

## RNF-01. Complejidad O(1)

`npm run bench:complejidad` (buffer lleno: cada trama nueva desplaza a la más antigua).

| Capacidad C | BufferCircular (ns/op) | Arreglo `push` + `shift` (ns/op) |
|---:|---:|---:|
| 1 000 | 16,5 | 228,0 |
| 10 000 | 12,1 | 248,9 |
| 100 000 | 12,9 | 223 155,8 |

## RNF-03 y RNF-04. Corrida continua

`npm run dev` durante 8 minutos (234 unidades, 1 trama/s).

| Dato | Valor |
|---|---|
| Heap usado (mínimo y máximo) | 8,0 y 10,4 MiB |
| Heap retenido tras GC forzado cada 30 s (corrida de 6,5 min) | 8,01 → 8,29 MiB, estable en los últimos 2 min |
| Latencia promedio emisión → consumo | 49 ms (promedio por segundo más alto: 103 ms) |
| Tramas por segundo | 234 |
| Pérdidas | 0 |

Sin GC forzado el Heap sube unos 1,5 MiB en 8 minutos porque la basura de la generación vieja se acumula hasta la siguiente recolección mayor; con GC forzado el Heap retenido se estabiliza, por lo que no hay una fuga.

## RNF-05 y RNF-06. Prueba de estrés

`node simulator/index.js --unidades 100 --hz 10 --invalidas 0.05 --duracion 60`

| Dato | Valor |
|---|---|
| Tramas enviadas | 59 700 en 60 s (995 tramas/s) |
| Válidas / inválidas | 56 680 / 3 020 |
| Pérdidas en el buffer | 0 |
| Latencia promedio | 82 ms |

## RNF-07. Garbage Collector

`npm run bench:gc` (3 000 000 de tramas).

| Métrica | Arreglo que crece | BufferCircular |
|---|---:|---:|
| Tiempo total | 1 439 ms | 78 ms |
| Recolecciones menores | 39 | 2 |
| Recolecciones mayores | 4 | 0 |
| Pausa total del GC | 877,7 ms | 1,3 ms |
| Heap inicial → final | 3,9 → 334,3 MiB | 3,9 → 4,4 MiB |

## RNF-09. Dijkstra

`npm run bench:dijkstra` (cuadrículas de n × n, promedio de 20 ejecuciones).

| Lado | V | E | Tiempo (ms) | ns / ((V+E) log2 V) |
|---:|---:|---:|---:|---:|
| 10 | 100 | 360 | 0,82 | 268,8 |
| 30 | 900 | 3 480 | 2,39 | 55,5 |
| 100 | 10 000 | 39 600 | 17,71 | 26,9 |
| 300 | 90 000 | 358 800 | 291,25 | 39,4 |

## Evaluación de rutas y escenarios

Después de unos 3 minutos de simulación (recorrido de ida):

| Línea | Actual (min) | Propuesta (min) | CO₂ actual (kg) |
|---|---:|---:|---:|
| L1 Oeste–Este | 9,5 | 6,7 | 2,54 |
| L2 Norte–Sur | 5,9 | sin cambios | 2,55 |
| L3 Noroeste–Sureste | 11,8 | 9,6 | 5,09 |
| L4 Suroeste–Noreste | 12,1 | 9,5 | 5,09 |

Al aplicar la propuesta en L1, sus 59 unidades se reubicaron y la ruta nueva midió 6,3 min frente a 9,5 min de la original, pero con 3,11 km frente a 2,33 km y 3,35 kg de CO₂ frente a 2,55 kg. Deshacer y Rehacer restauraron y volvieron a aplicar el recorrido sin reiniciar procesos.

## Pendiente

- Repetir RNF-03 durante al menos una hora.
- Probar en Node.js 20 (RNF-08).
- Reemplazar los consumos provisionales con los datos del Consorcio (RNF-10).
- Peso combinado de tiempo y emisiones en Dijkstra.
