<div align="center">

# 🌐 Configuración Cliente Proxy y Validación de Navegación

**Historia de Usuario — HU-65**

Reporte de Resolución y Evidencias

</div>

---

## 📋 Índice

1. [Resumen](#1-resumen)
2. [Recepción y Configuración de Parámetros](#2-recepción-y-configuración-de-parámetros)
3. [Validación de Navegación - Lado Cliente](#3-validación-de-navegación---lado-cliente)
4. [Confirmación de Enrutamiento Exclusivo (Logs del Servidor)](#4-confirmación-de-enrutamiento-exclusivo-logs-del-servidor)
5. [Conclusión](#5-conclusión)

---

## 📝 1. Resumen

Este documento presenta la evidencia funcional correspondiente a la **HU-65**, detallando la configuración y validación de un cliente para consumir el servicio proxy provisto externamente dentro del laboratorio. El alcance se limita estrictamente a la configuración y validación desde el lado del cliente (PC Windows), excluyendo la administración del servidor proxy, según los criterios de aceptación establecidos.

**Objetivo:** Demostrar integración correcta y validar consumo funcional del proxy, confirmando que la navegación externa esté enrutada a través del servicio controlado.

---

## ⚙️ 2. Recepción y Configuración de Parámetros

Se configuró el equipo de prueba (Windows) con los parámetros entregados por el equipo responsable del servicio:

- **IP del Servidor Proxy:** `10.7.2.16`
- **Puerto:** `3128`

Se verificó el entorno de red de este equipo, confirmando que el cliente operaba bajo la IP asignada por DHCP (`10.5.3.110`) dentro del dominio del proyecto.

### Evidencias de Configuración

**Configuración proxy en Windows:**

<div align="center">
  <img width="800" alt="Configuración de Proxy en Windows" src="https://github.com/user-attachments/assets/0f5fb650-07a2-4433-9969-aff251da75a1" />
</div>

<br/>

**Detalles de la conexión de red (IP 10.5.3.110):**

<div align="center">
  <img width="800" alt="Detalles Conexión de Red" src="https://github.com/user-attachments/assets/14660f90-af0d-4546-bce9-db7b2345120a" />
</div>

---

## 🧭 3. Validación de Navegación - Lado Cliente

Con los ajustes de proxy aplicados en el sistema operativo, se procedió a realizar una prueba funcional de navegación hacia la plataforma externa *TryHackMe*. La carga de la página fue exitosa, demostrando la correcta salida a internet a través del cliente configurado. 

> *Nota: Esta validación asegura el cumplimiento del **Criterio 3** de la HU-65.*

### Evidencia Funcional / Navegación

<div align="center">
  <img width="800" alt="Navegación web exitosa a través de proxy" src="https://github.com/user-attachments/assets/59ffd8b3-9f0e-4f7c-b17a-8739fa7136bb" />
</div>

---

## 🛡️ 4. Confirmación de Enrutamiento Exclusivo (Logs del Servidor)

Para dar cumplimiento a la restricción adicional (*"el tráfico debe usar el proxy provisto y no una salida directa sin control"*), se solicitó validación cruzada con el administrador del proxy. 

El extracto de los logs del servidor (Squid) proporcionado confirma que las peticiones de navegación (ej. `TCP_TUNNEL/200`, `TCP_MISS/200`) hacia dominios externos (ej. `github.com`, `whatsapp.net`) se están originando e identificando correctamente desde nuestra IP cliente (`10.5.3.110`).

### Evidencia de Tráfico (Squid Logs)

<div align="center">
  <img width="800" alt="Logs de Squid del servidor Proxy" src="https://github.com/user-attachments/assets/dfb63dba-9040-40b5-a534-ec361f2cf419" />
</div>

---

## ✅ 5. Conclusión

**Todos los criterios de aceptación y notas de validación cruzada han sido cubiertos con éxito.** La configuración de red en el cliente es completamente funcional y el consumo del servicio ha quedado validado con evidencia documentada.
