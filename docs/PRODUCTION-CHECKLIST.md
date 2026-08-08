# CréditosPunta — Checklist de producción

## Producto
- [ ] Alta y edición de clientes
- [ ] Solicitudes de crédito
- [ ] Simulador parametrizable
- [ ] Score Punta explicable
- [ ] Aprobación manual
- [ ] Generación de préstamo
- [ ] Plan de cuotas
- [ ] Registro de pagos
- [ ] Mora y cobranza
- [ ] Reportes de cartera

## Seguridad
- [ ] Autenticación
- [ ] Roles y permisos
- [ ] MFA para administradores
- [ ] Auditoría de acciones
- [ ] Secretos únicamente en variables de entorno
- [ ] Backups automáticos
- [ ] Restauración probada
- [ ] Protección contra abuso/rate limiting

## Datos
- [ ] PostgreSQL de staging
- [ ] PostgreSQL de producción
- [ ] Migraciones Prisma
- [ ] Seed separado de producción
- [ ] Política de retención
- [ ] Política de privacidad
- [ ] Gestión de solicitudes de titulares

## Operación
- [ ] Dominio
- [ ] SSL
- [ ] Monitoreo
- [ ] Logs
- [ ] Alertas
- [ ] Plan de incidentes

## Regulatorio — bloquear producción hasta validar
- [ ] Estructura societaria
- [ ] Encuadre BCU
- [ ] Registro/autorización que corresponda
- [ ] Topes de usura
- [ ] Contratos y condiciones generales
- [ ] Protección al consumidor
- [ ] Protección de datos personales
- [ ] Política de prevención de fraude
- [ ] Política de reclamos
- [ ] Contabilidad e impuestos

**Regla:** staging puede funcionar con datos ficticios; producción financiera queda bloqueada hasta completar la revisión profesional correspondiente.
