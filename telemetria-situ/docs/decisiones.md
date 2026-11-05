# Decisiones de diseño — Grupo 5

Decisiones que el SRS dejó abiertas, cerradas para la implementación.

| # | Decisión | Valor | Justificación |
|---|---|---|---|
| D1 | Política de desbordamiento (RF-04) | **Sobrescribir la trama más antigua** y sumar 1 a `perdidas` | En monitoreo en tiempo real solo interesan los datos recientes (SRS, suposición 4). |
| D2 | Consumidor del buffer (`leer()`) | Un temporizador en el servidor que drena el buffer **cada 100 ms** | El tiempo de espera en el buffer forma parte de la latencia; con 100 ms se cumple RNF-04 (< 200 ms). |
| D3 | Emisión de métricas | Cada **1 000 ms** a la sala `dashboard` | Valor del SRS (Tabla 8). Solo se crea un objeto por segundo. |
| D4 | Almacenamiento de la trama | Arreglos paralelos: 1 `Uint32Array` + 4 `Float64Array` = **36 bytes/posición** | SRS §4.3. Evita un objeto por trama (RNF-07). |
| D5 | Salida de `leer()` y `verUltimo()` | Objetos de salida **reutilizables** (uno por método) | No se genera basura al leer. Quien lee copia los valores si quiere conservarlos. |
| D6 | Validación | Trama inválida se descarta y se cuenta; `try/catch` en todo el camino | RNF-06. |
| D7 | Tope de velocidad en validación | 120 km/h | El límite legal del bus urbano es 40 km/h (50 moderado); solo se descartan errores claros del GPS. |
| D8 | Simulador | **Un solo `setInterval`** para todas las unidades | El proyecto de referencia usaba uno por moto; no escala. |
| D9 | Versión de Node | 22 LTS (cumple "20 o superior", RNF-08) | Node 20 terminó su soporte en abril de 2026. |
| D10 | Deshacer y Rehacer | Dos pilas de comandos con el recorrido anterior y el nuevo | El último cambio es el primero que se revierte (LIFO). Un cambio nuevo vacía la pila de Rehacer. |
| D11 | Cambio de ruta en caliente | El servidor reconstruye la ListaDoble de la línea y reinicia el seguimiento de sus unidades; el simulador las ubica en el nodo más cercano del nuevo recorrido | Las mediciones por tramo se conservan; el primer tramo parcial de cada unidad se descarta. |
| D12 | Inyección de dependencias | `crearProcesador` y `crearConsumidor` reciben buffer, métricas, validación, flota y reloj | Permite probar la ingesta con un reloj fijo y sin Socket.io (RNF-11). |
| D13 | Emisiones | Funciones puras en `rutas/emisiones.js` | El resultado depende solo de los argumentos; se prueban sin el resto del sistema. |

## Parámetros (SRS Tabla 8, actualizada)

| Parámetro | Valor | Fuente |
|---|---|---|
| Capacidad C | 10 000 | C ≥ λ·T = 1 000 × 10 s (SRS ec. 6) |
| Unidades — carga realista | **234** | Flota del SITU (DPL News / Primicias; Revista Buen Viaje 2024: 233) |
| Frecuencia — carga realista | 1 Hz (supuesto, pendiente de confirmar con el SITU) | Formulario enviado |
| Carga de estrés | 100 unidades × 10 Hz = **1 000 tramas/s** | SRS, RNF-05 |
| Intervalo de consumo | 100 ms | D2 |
| Intervalo de métricas | 1 000 ms | SRS Tabla 8 |

> **Pendiente:** cuando el SITU responda la frecuencia real de reporte, actualizar el valor de `HZ` realista. Si reportan cada 10 s, la carga real sería ≈ 23 tramas/s y la prueba de 1 000 tramas/s representa ≈ 40 veces la carga real.
