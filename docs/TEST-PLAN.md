# Plan de pruebas MVP

## Simulador
- monto positivo
- tasa cero
- tasa positiva
- plazos 3/6/9/12
- saldo final 0

## Score Punta
- ingresos bajos/altos
- cuota/ingreso <=20%, 20-30%, >40%
- historial positivo
- mora previa
- límites 300-900
- máximo sugerido <= 12.000 en el producto demo

## Solicitudes
- transiciones válidas
- impedir transiciones inválidas
- decisión requiere estado EN_REVISION
- guardar motivo de decisión

## Pagos
- pago parcial
- pago total
- cuota vencida
- impedir pagos no positivos

## Cartera
- capital colocado
- saldo pendiente
- mora
- cantidad activa
- porcentaje de mora

## Seguridad
- acceso por rol
- auditoría de cambios sensibles
- secretos fuera del repositorio
- bases separadas por entorno

Todos los casos se ejecutan inicialmente con datos ficticios.
