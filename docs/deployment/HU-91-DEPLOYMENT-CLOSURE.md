# HU-91 - Cierre técnico de despliegue CTIC

## Alcance

Este documento resume el cierre documental de la HU-91 para el despliegue del Simulador de Credito UPB en infraestructura CTIC. Complementa el manual formal en PDF y los runbooks tecnicos del repositorio.

El objetivo es que un integrante del equipo, evaluador o responsable tecnico pueda entender que componentes se desplegaron, que prerequisitos aplican, como se valida el sistema y que evidencias soportan el estado final.

## Artefacto principal

| Artefacto | Proposito |
|---|---|
| [`Manual de Despliegue Simulador - CTIC.pdf`](./Manual%20de%20Despliegue%20Simulador%20-%20CTIC.pdf) | Manual formal de despliegue y validacion para CTIC. |
| [`CTIC-RHEL-RUNBOOK.md`](./CTIC-RHEL-RUNBOOK.md) | Runbook operativo para ejecutar el despliegue en VM RHEL. |
| [`CTIC-PROD-DEPLOYMENT.md`](./CTIC-PROD-DEPLOYMENT.md) | Guia tecnica de arquitectura productiva, variables, puertos y operacion. |
| [`ctic-rhel10-bootstrap.sh`](./ctic-rhel10-bootstrap.sh) | Script maestro de bootstrap para RHEL 10. |
| [`ctic-rhel10.deploy.env.example`](./ctic-rhel10.deploy.env.example) | Plantilla sin secretos para construir el archivo real de despliegue. |
| [`00_ctic_full_deploy_mariadb_10_11.sql`](../database/hu-66/scripts/00_ctic_full_deploy_mariadb_10_11.sql) | Script SQL anonimizado para estructura y datos tecnicos de arranque. |

## Prerequisitos documentados

| Componente | Requisito |
|---|---|
| Sistema operativo | VM RHEL administrada por CTIC. |
| Runtime | Node.js 20+ LTS y npm compatible. |
| Servidor web | Nginx con puertos 80/443 segun politica CTIC. |
| Proceso backend | PM2 con persistencia por systemd. |
| Base de datos | MariaDB/MySQL provisionada por CTIC. |
| Red | Acceso desde la VM a base de datos, LDAP y SMTP. |
| Secretos | Archivo real `ctic-rhel10.deploy.env` fuera de Git. |

## Flujo de despliegue reproducible

1. Preparar la VM con dependencias base.
2. Crear el archivo `ctic-rhel10.deploy.env` a partir de `ctic-rhel10.deploy.env.example`.
3. Validar que el archivo real no tenga espacios alrededor de `=`.
4. Ejecutar `ctic-rhel10-bootstrap.sh` o seguir el flujo manual del runbook.
5. Compilar frontend y backend.
6. Publicar `client/dist` en Nginx.
7. Ejecutar backend con PM2 en `localhost:3000`.
8. Configurar Nginx para servir la SPA y enrutar `/api` al backend.
9. Validar salud, rutas principales y logs.

## Validaciones mínimas

| Validacion | Comando o flujo |
|---|---|
| Backend local | `curl --fail http://localhost:3000/api/health` |
| API por proxy | `curl --fail http://localhost/api/health` |
| Nginx | `nginx -t` con privilegios de administrador o mediante el helper `run_privileged` del bootstrap. |
| Proceso PM2 | `pm2 status` y `pm2 logs simulador-backend --lines 100` |
| Frontend | Abrir el dominio y verificar que la SPA cargue sin errores visibles. |
| Flujo invitado | Crear simulacion de invitado y revisar tabla de resultado. |
| Flujo estudiante | Iniciar sesion, crear simulacion, guardar y consultar historial. |
| Flujo administrador | Validar acceso a parametros, estudiantes y simulaciones. |

## Relacion con historias dependientes

| Historia | Relacion |
|---|---|
| HU-58 | Ambientes, secretos y variables de configuracion. |
| HU-66 | Base de datos objetivo, script SQL y migracion de esquema. |
| HU-59 | Despliegue productivo y configuracion de infraestructura. |
| HU-89 | Validacion final funcional y evidencias de operacion. |
| HU-83 | Consolidacion documental dentro de la estructura general del repositorio. |

## Control de seguridad para publicacion

- No versionar `.env`, `*.deploy.env`, certificados, llaves privadas, logs, coverage, dist ni `node_modules`.
- Mantener solo plantillas `*.example` sin credenciales reales.
- Rotar cualquier secreto que haya sido usado en pruebas o haya quedado expuesto localmente.
- No publicar capturas que muestren tokens, passwords, correos personales, IP privadas sensibles o rutas internas no autorizadas.
- Mantener el backend en `localhost:3000`; solo Nginx debe exponer 80/443.

## Estado de cierre

La HU-91 queda cubierta por el manual PDF, los runbooks, la plantilla de variables, el script de bootstrap, el SQL anonimizado y las validaciones documentadas. El repositorio queda preparado para publicar la documentacion sin depender de explicaciones orales del equipo ni de acceso futuro a GitHub privado.
