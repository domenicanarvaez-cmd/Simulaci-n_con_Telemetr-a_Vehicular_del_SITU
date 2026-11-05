import { test } from 'node:test';
import assert from 'node:assert/strict';
import { litrosEstimados, kgCO2Estimados, sumar } from '../src/rutas/emisiones.js';

const factores = { consumoLporKm: 0.4, consumoRalentiLporH: 2.5, factorKgCO2porL: 2.68 };

test('litros por distancia y por tiempo detenido', () => {
  // 10 km × 0,4 L/km + 0,5 h × 2,5 L/h = 4 + 1,25
  assert.equal(litrosEstimados(10, 1800, factores), 5.25);
});

test('kg de CO₂ por litro de diésel', () => {
  assert.equal(kgCO2Estimados(10, factores), 26.8);
});

test('las funciones son puras: no modifican sus argumentos', () => {
  const copia = { ...factores };
  const lista = [{ km: 1 }, { km: 2 }];
  litrosEstimados(5, 60, factores);
  assert.equal(sumar(lista, (x) => x.km), 3);
  assert.deepEqual(factores, copia);
  assert.deepEqual(lista, [{ km: 1 }, { km: 2 }]);
});
