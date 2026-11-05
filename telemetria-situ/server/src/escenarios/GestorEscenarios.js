/**
 * Escenarios de ruta con Deshacer y Rehacer.
 *
 * Permite aplicar en la simulación la ruta propuesta para una línea y
 * revertir el cambio. Cada cambio se guarda como un comando con el recorrido
 * anterior y el nuevo:
 *  - aplicar:  apila el comando en `deshacer` y vacía `rehacer`.
 *  - deshacer: lo mueve de `deshacer` a `rehacer` y restaura el recorrido anterior.
 *  - rehacer:  lo mueve de `rehacer` a `deshacer` y vuelve a aplicar el nuevo.
 */
import { Pila } from './Pila.js';

export class GestorEscenarios {
  /**
   * @param {(lineaId:number, nodos:number[]) => void} cambiarRuta
   *        Función que reemplaza el recorrido de una línea en el sistema.
   * @param {() => number} reloj  Fuente de la hora, inyectada para las pruebas.
   */
  constructor(cambiarRuta, reloj = Date.now) {
    this.cambiarRuta = cambiarRuta;
    this.reloj = reloj;
    this.pilaDeshacer = new Pila();
    this.pilaRehacer = new Pila();
  }

  /**
   * Aplica un nuevo recorrido a una línea.
   * @param {number} lineaId
   * @param {number[]} anterior  Recorrido vigente.
   * @param {number[]} nuevo     Recorrido a aplicar.
   * @param {string} descripcion
   */
  aplicar(lineaId, anterior, nuevo, descripcion) {
    const comando = { lineaId, anterior: [...anterior], nuevo: [...nuevo], descripcion, ts: this.reloj() };
    this.cambiarRuta(lineaId, comando.nuevo);
    this.pilaDeshacer.push(comando);
    this.pilaRehacer.vaciar();
    return comando;
  }

  /** Revierte el último cambio. Devuelve el comando revertido o null. */
  deshacer() {
    const comando = this.pilaDeshacer.pop();
    if (comando === null) return null;
    this.cambiarRuta(comando.lineaId, comando.anterior);
    this.pilaRehacer.push(comando);
    return comando;
  }

  /** Vuelve a aplicar el último cambio revertido. Devuelve el comando o null. */
  rehacer() {
    const comando = this.pilaRehacer.pop();
    if (comando === null) return null;
    this.cambiarRuta(comando.lineaId, comando.nuevo);
    this.pilaDeshacer.push(comando);
    return comando;
  }

  /** Estado resumido para el dashboard. */
  estado() {
    const resumir = (c) => ({ lineaId: c.lineaId, descripcion: c.descripcion, ts: c.ts });
    return {
      puedeDeshacer: !this.pilaDeshacer.estaVacia(),
      puedeRehacer: !this.pilaRehacer.estaVacia(),
      historial: this.pilaDeshacer.aArreglo().map(resumir),
      rehacer: this.pilaRehacer.aArreglo().map(resumir),
    };
  }
}
