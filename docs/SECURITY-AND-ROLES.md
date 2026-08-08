# Seguridad y roles — CréditosPunta

## Roles
- ADMIN: configuración, usuarios, parámetros y auditoría.
- OPERADOR: clientes, solicitudes, simulaciones y seguimiento.
- RIESGO: evaluación y decisión crediticia.
- COBRANZA: cuotas, pagos y gestiones de mora.
- CONSULTA: acceso de solo lectura a reportes autorizados.

## Principios
- Mínimo privilegio.
- Separación entre quien carga una solicitud y quien decide cuando sea posible.
- Toda decisión y cambio sensible debe generar auditoría.
- Nunca almacenar contraseñas en texto plano.
- Secretos únicamente mediante variables de entorno.
- Datos reales prohibidos en desarrollo/demo.
- Producción financiera bloqueada hasta validación legal y regulatoria.

## Auditoría mínima
Registrar actor, acción, entidad, identificador, fecha/hora, resultado y motivo cuando corresponda.
