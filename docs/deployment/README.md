<div align="center">

# 🚀 Despliegue CTIC / CTIC Deployment

**Documentación operativa para instalar, validar, auditar y volver a desplegar el Simulador de Crédito UPB.**

</div>

---

## 📄 Documentos principales / Main Documents

| Documento | Propósito |
|---|---|
| 📘 [`Manual de Despliegue Simulador - CTIC.pdf`](./Manual%20de%20Despliegue%20Simulador%20-%20CTIC.pdf) | Manual formal de despliegue y nuevo despliegue. |
| 🧭 [`CTIC-RHEL-RUNBOOK.md`](./CTIC-RHEL-RUNBOOK.md) | Runbook accionable para ejecución en RHEL. |
| 🟢 [`CTIC-PROD-DEPLOYMENT.md`](./CTIC-PROD-DEPLOYMENT.md) | Arquitectura productiva, variables, puertos y operación. |
| 🟡 [`PRE-PROD-ENVIRONMENT.md`](./PRE-PROD-ENVIRONMENT.md) | Ambiente de preproducción con runner self-hosted y Aiven. |
| ✅ [`HU-91-DEPLOYMENT-CLOSURE.md`](./HU-91-DEPLOYMENT-CLOSURE.md) | Cierre técnico de despliegue y evidencias. |

## 🟢 Topología CTIC / CTIC Topology

<div align="center">
  <img src="./assets/ctic-deployment.png" alt="Topología de despliegue CTIC" width="920" />
</div>

## 🟡 Preproducción / Pre-production

<div align="center">
  <img src="./assets/preprod-deployment.png" alt="Topología de preproducción" width="920" />
</div>

## 💾 Respaldo de base de datos / Database Backup

<div align="center">
  <img src="./assets/backup-policy-ctic.png" alt="Política de respaldo CTIC" width="920" />
</div>

## 🔌 Puertos por defecto / Default Ports

| Servicio | Puerto | Exposición esperada |
|---|---:|---|
| HTTP | `80` | Público; normalmente redirige a HTTPS. |
| HTTPS | `443` | Público si TLS termina en la VM. |
| Backend Express | `3000` | Solo local; Nginx enruta `/api` hacia este puerto. |
| MariaDB/MySQL | `3306` | Privado entre VM y servidor de base de datos. |
| LDAP/AD | `389` | Privado hacia directorio institucional. |
| SMTP | `587` | Salida hacia servicio de correo transaccional. |

## 🧭 Flujo operativo / Operational Flow

1. Copiar el proyecto o la rama aprobada a la VM.
2. Crear `ctic-rhel10.deploy.env` fuera de Git con datos reales.
3. Ejecutar `ctic-rhel10-bootstrap.sh`.
4. Validar conectividad con base de datos, LDAP y SMTP.
5. Compilar frontend y backend.
6. Publicar `client/dist` con Nginx.
7. Levantar el backend con PM2.
8. Validar dominio oficial y `/api/health`.

## 🔒 Reglas de seguridad / Security Rules

- El archivo real `ctic-rhel10.deploy.env` no debe versionarse.
- Certificados, llaves privadas y dumps de producción se administran fuera de Git.
- `APP_DOMAIN` debe usar solo letras, números, puntos y guiones.
- Si cambia el dominio final, actualizar variables y Nginx en la VM; no hardcodear dominios institucionales en el repositorio.
