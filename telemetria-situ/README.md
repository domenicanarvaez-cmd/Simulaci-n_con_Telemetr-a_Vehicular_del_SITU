# Telemetría SITU

Simulación de telemetría vehicular del SITU en tiempo real con buffer circular para la evaluación y optimización de rutas en Loja.

Proyecto ABP · Grupo 5 · Estructura de Datos · Carrera de Computación, UNL
Docente: Ing. Cristian Ramiro Narváez Guillén
Integrantes: Dario Chillogallo, Domenica Narvaez, Jose Maldonado, Jahir Campoverde, Galo Benitez

## Requisitos

- Node.js 20 o superior (probado con Node 22 y 24).
- Navegador web.

## Instalación

Desde la carpeta del proyecto:

```bash
npm install
```

Instala de una vez las dependencias del servidor, del simulador y del dashboard (npm workspaces).

## Ejecución

```bash
npm run dev
```

Inicia el servidor (puerto 3000), el simulador (234 unidades a 1 trama/s) y el dashboard (http://localhost:5173), que se abre en el navegador. Para detener todo: `Ctrl + C`.

Las líneas empiezan a mostrar mediciones propias después de 1 o 2 minutos, cuando las unidades completan sus primeros tramos.

En la tabla de evaluación, **Aplicar propuesta** cambia el recorrido de una línea en la simulación: el servidor reconstruye su lista doblemente enlazada, el simulador reubica sus unidades y la nueva ruta se mide con su propia telemetría. Los botones **Deshacer** y **Rehacer** revierten o repiten el último cambio (dos pilas), y **Restaurar original** vuelve al recorrido inicial como un cambio más del historial.

Cada parte también se puede iniciar por separado, en terminales distintas:

```bash
npm run servidor
npm run simulador
npm run dashboard
```

Prueba de estrés (1 000 tramas/s con 5 % de tramas inválidas), con el servidor encendido:

```bash
npm run estres
```

## Pruebas

```bash
npm test                    # pruebas unitarias
npm run bench:complejidad   # RNF-01: costo por operación frente a la capacidad
npm run bench:gc            # RNF-07: arreglo dinámico frente a BufferCircular
npm run bench:dijkstra      # RNF-09: tiempo de Dijkstra frente al tamaño del grafo
```

## Estructura

```
telemetria-situ/
├── shared/            Código común: ListaDoble, red vial de prueba, geodesia
├── server/
│   ├── src/
│   │   ├── index.js           Arranque y eventos de Socket.io
│   │   ├── ingesta.js         Procesador y consumidor con dependencias inyectadas
│   │   ├── BufferCircular.js  Cola circular de capacidad fija
│   │   ├── validacion.js      Validación de tramas
│   │   ├── Metricas.js        Latencia, tramas por segundo y memoria
│   │   ├── config.js          Parámetros
│   │   ├── flota/             Seguimiento de unidades y asignación de tramos
│   │   ├── rutas/             Grafo, MonticuloMin, AcumuladorTramos, EvaluadorRutas, emisiones
│   │   └── escenarios/        Pila y GestorEscenarios (Deshacer y Rehacer)
│   └── test/                  Pruebas unitarias (node:test)
├── simulator/         Simulador de unidades sobre la red vial
├── client/            Dashboard (React + Vite + Chart.js)
├── benchmarks/        Pruebas de complejidad, del Garbage Collector y de Dijkstra
└── docs/              Contrato de datos, decisiones y diagrama de arquitectura
```

## Limitaciones actuales

- La red vial es una cuadrícula de prueba del centro de Loja (`shared/redLoja.js`); se reemplazará por la red de OpenStreetMap y el trazado real de las líneas.
- Los factores de consumo de combustible son provisionales (`server/src/config.js`) hasta contar con los datos del Consorcio.
- Dijkstra minimiza solo el tiempo; una ruta más rápida puede ser más larga y emitir más CO₂.
- El historial de escenarios vive en memoria: se pierde al reiniciar el servidor.
