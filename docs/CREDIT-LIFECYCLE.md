# Ciclo de vida de un crédito

```text
CLIENTE
  ↓
SOLICITUD
  ↓
VERIFICACIÓN
  ↓
SIMULACIÓN
  ↓
SCORE PUNTA
  ↓
REVISIÓN HUMANA
  ↓
APROBACIÓN / RECHAZO
  ↓
CONTRATO
  ↓
DESEMBOLSO
  ↓
CUOTAS
  ↓
PAGO ──────────────┐
  ↓                │
MORA → COBRANZA ───┘
  ↓
CERRADO / REFINANCIADO / INCOBRABLE
```

La aplicación debe conservar el historial de cada transición y de cada decisión. Los estados y reglas definitivos quedan sujetos a revisión legal y regulatoria.
