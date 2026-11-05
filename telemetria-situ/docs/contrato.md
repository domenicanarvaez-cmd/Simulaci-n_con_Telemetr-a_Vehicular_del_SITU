# Contrato de datos

Conexión a `http://localhost:3000` con Socket.io, indicando el rol:

```js
io(URL, { query: { rol: 'simulador' } });
io(URL, { query: { rol: 'dashboard' } });
```

## Simulador → servidor

`telemetria` — una trama por unidad y ciclo.

| Campo | Tipo | Validación |
|---|---|---|
| unidadId | entero | 1 a 4 294 967 295 |
| lat | número | −90 a 90 |
| lng | número | −180 a 180 |
| velocidad | número (km/h) | 0 a 120 |
| ts | número (ms, `Date.now()`) | finito y mayor que 0 |

## Servidor → simulador

| Evento | Cuándo | Contenido |
|---|---|---|
| `rutas` | al conectar (una vez por línea) y en cada cambio de escenario | `lineaId`, `nodos` (recorrido vigente), `paradas` |

## Servidor → dashboard

| Evento | Frecuencia | Contenido |
|---|---|---|
| `red` | al conectar y en cada cambio de escenario | `nodos`, `tramos` y `lineas` (recorridos vigentes) de la red vial |
| `escenarios` | al conectar y tras cada acción | `puedeDeshacer`, `puedeRehacer`, `historial` y `rehacer` (`lineaId`, `descripcion`, `ts`), desde el más reciente |
| `escenarios:error` | si una acción no aplica | mensaje de texto |
| `metricas` | 1 s | `ts`, `tramasPorSegundo`, `latenciaPromedio`, `latenciaMax`, `heapUsed`, `arrayBuffers`, `rss`, `tam`, `capacidad`, `perdidas`, `invalidas`, `recibidasTotal`, `unidadesActivas`, `pasadasRegistradas` |
| `flota` | 1 s | `unidades`: `[unidadId, linea, lat, lng, velocidad]` por unidad |
| `evaluacion` | 5 s y tras cada acción de escenario | `lineas` (indicadores actuales, ruta propuesta, diferencia, `modificada` y `original` cuando la línea cambió) y `velocidadTramos` (km/h por tramo o `null`) |

## Dashboard → servidor

| Evento | Dato | Acción |
|---|---|---|
| `escenarios:aplicar` | `lineaId` | Aplica la ruta propuesta de la línea |
| `escenarios:restaurar` | `lineaId` | Vuelve al recorrido original (queda en el historial) |
| `escenarios:deshacer` | — | Revierte el último cambio |
| `escenarios:rehacer` | — | Vuelve a aplicar el último cambio revertido |
