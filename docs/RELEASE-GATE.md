# Release gate

CréditosPunta no debe pasar de staging a producción financiera hasta que se cumplan todos los puntos regulatorios y operativos.

## Gate técnico
- [ ] Build reproducible
- [ ] Tests automatizados
- [ ] PostgreSQL staging
- [ ] Migraciones verificadas
- [ ] Autenticación
- [ ] RBAC
- [ ] Auditoría
- [ ] Backups/restauración
- [ ] Monitoring

## Gate legal/regulatorio
- [ ] Encuadre confirmado por profesional
- [ ] Requisitos BCU confirmados
- [ ] Topes y cargos validados
- [ ] Contratos validados
- [ ] Protección de datos validada
- [ ] Política de reclamos validada
- [ ] Estructura fiscal/contable validada

## Gate operativo
- [ ] Procedimiento de aprobación
- [ ] Procedimiento de desembolso
- [ ] Procedimiento de cobranza
- [ ] Conciliación bancaria
- [ ] Reportes contables

Hasta completar los gates, el sistema debe operar únicamente con datos ficticios y/o entorno de prueba.
