# Roadmap CréditosPunta

Actualizado 2026-08-09. Ver docs/ENVIRONMENTS.md, docs/SECURITY-AND-ROLES.md y docs/FINANCIAL-MODEL.md para el detalle de cada fase.

## Fase 0 — definición
- [x] Nombre provisional (CréditosPunta / Score Punta)
- [x] Modelo inicial con capital propio
- [ ] Validación jurídica/BCU -- pendiente, en pausa deliberada hasta que haya revisión legal
- [ ] Validación de marca y dominio

## Fase 1 — MVP funcional
- [x] CRUD real conectado a PostgreSQL (Supabase)
- [x] Clientes, ficha de cliente
- [x] Simulador de préstamos + motor de amortización reutilizable
- [x] Solicitudes: simular → Score Punta (explicable, con `reasons[]` persistido) → aprobar/rechazar
- [x] Generación persistente de cuotas al aprobar
- [x] Registro de pagos y actualización de cartera
- [x] Catálogo de productos (CRUD real, ADMIN)

## Fase 2 — datos y seguridad
- [x] PostgreSQL gestionado (Supabase)
- [x] Autenticación (cookie + JWT) y rate limiting/lockout en login
- [x] Roles y permisos (ADMIN/OPERADOR/RIESGO/COBRANZA/CONSULTA) + gestión de usuarios
- [x] Auditoría persistida en toda acción sensible
- [x] Staging desplegado (Vercel + Supabase)
- [x] Job diario de refresco de estado de cuotas + healthcheck
- [x] Backups -- automáticos en el plan gestionado de Supabase, sin acción pendiente
- [x] Reset de contraseña por email (envío real pendiente de configurar `RESEND_API_KEY`)
- [x] Tests unitarios sobre la lógica financiera crítica (`lib/credit.ts`, `lib/payments.ts`, `lib/financial-model.ts`)

## Fase 3 — operación
- [x] Cobranza (registro de gestiones, vencidas calculadas en vivo y persistidas por el job diario)
- [x] Notificaciones de vencimiento por email (recordatorio previo + recordatorio de vencida)
- [ ] Contratos y firma electrónica -- deliberadamente en pausa junto con la revisión legal
- [ ] Pagos reales (pasarela) -- requiere elegir proveedor y credenciales
- [ ] Portal del cliente -- no iniciado, expone datos a terceros por lo que conviene evaluarlo después de la revisión legal/seguridad

## Fase 4 — pruebas de carga
- [x] Script de seed de carga + limpieza (`prisma/seed-load-test*.ts`)
- [x] Paginación en listados sin límite (bug real encontrado bajo carga)
- [x] Agregación a nivel de base en dashboard/reportes (bug real encontrado bajo carga)
- [x] Root cause de un outage real bajo carga (Supabase session pooler vs. transaction pooler) diagnosticado y corregido

## Fase 5 — modelo financiero
- [x] Simulador interactivo de escenarios de capital (`/modelo-financiero`, ADMIN)
- [ ] Validación de los supuestos de simulación (tasa, incobrabilidad) contra datos reales -- solo posible con operación real

## Fase 6 — legal y regulatorio
- [ ] Todo lo de esta fase queda fuera del alcance de trabajo automatizado: revisión de régimen jurídico, topes de usura, contratos, protección al consumidor, datos personales y obligaciones ante BCU. Necesita abogado/contador.

## Fase 7 — escala (a futuro, después de la fase legal)
- [ ] Automatización de riesgo (p. ej. auto-aprobación de solicitudes de bajo riesgo) -- decisión de política de negocio, no una tarea técnica; pendiente de definición explícita antes de implementarse
- [ ] Integraciones bancarias/pagos
- [ ] Modelo P2P sujeto a encuadre regulatorio

**Regla:** hasta completar revisión jurídica, financiera, de protección de datos y seguridad, el sistema no debe utilizar datos personales reales ni otorgar créditos reales. Todo lo desplegado hoy corre contra datos ficticios en un entorno de staging.
