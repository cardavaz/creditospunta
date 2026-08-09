# Entornos

## Development
Uso local. Solo datos ficticios.

## Staging
Entorno de prueba accesible para el equipo. Base de datos separada. Datos ficticios o anonimizados.

## Production
Solo se habilita después de completar el checklist regulatorio y operativo. Base de datos separada, backups, monitoreo, control de acceso y secretos propios.

## Variables requeridas (ejemplo)
- DATABASE_URL
- SESSION_SECRET
- APP_ENV
- ADMIN_EMAIL
- CRON_SECRET (protege /api/cron/*; Vercel lo envía automáticamente como `Authorization: Bearer` si la variable está configurada en el proyecto)
- APP_URL (para armar el link de /reset-password en el email; por defecto http://localhost:3000)
- RESEND_API_KEY (opcional -- sin esto, el reset de contraseña genera el link igual pero lo loguea en vez de mandar un email real; ver lib/email.ts)
- EMAIL_FROM (opcional, remitente del email de reset; por defecto "CréditosPunta <no-reply@creditospunta.uy>")

Nunca subir valores reales al repositorio.
