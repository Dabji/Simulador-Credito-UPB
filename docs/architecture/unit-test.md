# Evidencias de Testing - Simulador de Credito UPB

**HU-56 - Pruebas unitarias del motor de calculo**

Documento consolidado y actualizado con la ejecucion real de las pruebas unitarias del backend asociadas a `HU-56`. El objetivo de este archivo es dejar trazabilidad tecnica clara sobre el motor de calculo, las validaciones previas al calculo y los esquemas de entrada que respaldan el comportamiento mas sensible del simulador.

> Nota de organizacion: a diferencia de versiones anteriores del documento, esta edicion toma como fuente principal la estructura actual de evidencias agrupadas por carpetas dentro de `docs/architecture/assets/evidence-unit-test/`. Las capturas sueltas que permanecen en la raiz de esa carpeta se consideran soporte historico o referencia cruzada y no hacen parte del bloque principal de evidencia de este markdown.

---

## 1. Panorama General

| Campo | Detalle |
|---|---|
| Historia de usuario | `HU-56` |
| Objetivo | Validar de forma aislada el nucleo financiero del simulador, sin mezclar UI, HTTP ni persistencia real |
| Alcance principal | `14` casos priorizados (`U-01` a `U-14`) definidos para el motor de calculo, validaciones de servicio, estrategias y esquemas Zod |
| Fecha de ejecucion base | `21/04/2026` |
| Ambiente de ejecucion | Backend local en Node.js/TypeScript con Jest ejecutado sobre `server/` |
| Resultado global HU-56 | `PASS` |
| Resultado backend completo | `10` suites aprobadas, `94` pruebas aprobadas, `0` fallos |
| Evidencia principal | Carpetas `environment/`, `simulation-engine/`, `simulation-service/`, `strategies/`, `summary/` y `validation-schemas/` |

### 1.1 Objetivo tecnico del bloque unitario

La HU-56 se enfoco en asegurar que el calculo financiero mas sensible del proyecto quede protegido por pruebas repetibles, aisladas y entendibles por el equipo. En terminos practicos, se buscaba confirmar:

- calculo sin interes con cuota lineal y cronograma consistente
- calculo con interes bajo amortizacion francesa
- reglas institucionales por nivel y modalidad
- redondeos, totales y saldo final
- validaciones previas al calculo en `SimulationService`
- validaciones Zod/DTO de entradas criticas

### 1.2 Alcance y exclusiones

**Incluye**

- pruebas unitarias de `SimulationEngine`
- pruebas unitarias de `SimulationService`
- pruebas de estrategias de calculo (`FrenchAmortizationStrategy`, `NoInterestStrategy`)
- pruebas de esquemas de validacion (`SimulationInput`, `RegisterUserInput`, `LoginUserInput`, `ResetPasswordInput`)
- evidencia visual de ejecucion local de Jest y soporte funcional/manual puntual para casos donde se documento contraste en interfaz

**No incluye**

- pruebas de integracion API
- pruebas E2E
- persistencia real en BD durante la ejecucion unitaria
- validacion de UI como criterio principal de aprobacion

---

## 2. Ambiente y Preparacion

| Campo | Detalle |
|---|---|
| Workspace | Monorepo `Simulador-Credito-UPB` |
| Carpeta objetivo | `server/` |
| Framework de pruebas | `Jest` |
| Modo de ejecucion recomendado | `--runInBand` |
| Razon operativa del modo serial | Evitar errores `spawn EPERM` observados en PowerShell durante ejecuciones locales |
| Dependencias externas | No requeridas para las suites de HU-56; los casos usan fixtures y objetos en memoria |
| Evidencia de ambiente | `assets/evidence-unit-test/environment/backend-local-running.png` |

### 2.1 Evidencia de ambiente

La siguiente captura documenta el backend local operativo en el contexto de ejecucion de pruebas:

![](assets/evidence-unit-test/environment/backend-local-running.png)

---

## 3. Comandos Ejecutados

### 3.1 Validacion puntual de las suites nuevas o reforzadas para HU-56

```powershell
npm.cmd test -- --runInBand --runTestsByPath src/Application/__tests__/SimulationService.test.ts src/Application/__tests__/FrenchAmortizationStrategy.test.ts src/Application/__tests__/NoInterestStrategy.test.ts src/Application/__tests__/ValidationSchemas.test.ts
```

**Resultado observado**

```text
Test Suites: 4 passed, 4 total
Tests:       18 passed, 18 total
Snapshots:   0 total
```

### 3.2 Validacion completa del backend

```powershell
npm.cmd test -- --runInBand
```

**Resultado observado**

```text
Test Suites: 10 passed, 10 total
Tests:       94 passed, 94 total
Snapshots:   0 total
Time:        4.766 s
```

### 3.3 Cobertura global del backend

```powershell
npm.cmd run test:coverage -- --runInBand
```

**Resultado observado**

```text
Test Suites: 10 passed, 10 total
Tests:       94 passed, 94 total
Snapshots:   0 total
Time:        5.397 s
```

### 3.4 Evidencia consolidada de ejecucion

La captura siguiente funciona como evidencia resumen del bloque unitario en estado `PASS`:

![](assets/evidence-unit-test/summary/jest-run-all.png)

---

## 4. Inventario de Suites Relevantes para HU-56

| Suite | Archivo | Rol dentro de HU-56 | Casos HU-56 cubiertos |
|---|---|---|---|
| `SimulationEngine` | `server/src/Application/__tests__/SimulationEngine.test.ts` | Verifica el calculo financiero central, reglas institucionales, fechas, redondeos y consistencia de totales | `U-01`, `U-02`, `U-03`, `U-06`, `U-07`, `U-08`, `U-09` |
| `SimulationService` | `server/src/Application/__tests__/SimulationService.test.ts` | Verifica validaciones previas al calculo y restricciones de negocio en capa de servicio | `U-04`, `U-05`, soporte parcial de `U-09` |
| `FrenchAmortizationStrategy` | `server/src/Application/__tests__/FrenchAmortizationStrategy.test.ts` | Valida bordes matematicos y resolucion de tasa en estrategia con interes | `U-10` |
| `NoInterestStrategy` | `server/src/Application/__tests__/NoInterestStrategy.test.ts` | Valida comportamiento base y bordes de la estrategia sin interes | `U-11` |
| `ValidationSchemas` | `server/src/Application/__tests__/ValidationSchemas.test.ts` | Valida esquemas Zod/DTO criticos de simulacion, registro, login y reset | `U-12`, `U-13`, `U-14` |

### 4.1 Cobertura mas relevante observada

| Componente | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `SimulationEngine.ts` | 92.68% | 88.00% | 83.33% | 92.30% |
| `SimulationService.ts` | 76.56% | 51.92% | 66.66% | 80.70% |
| `FrenchAmortizationStrategy.ts` | 95.45% | 90.00% | 100.00% | 94.11% |
| `NoInterestStrategy.ts` | 100.00% | 100.00% | 100.00% | 100.00% |
| `SimulationInput.ts` | 100.00% | 100.00% | 100.00% | 100.00% |
| `LoginUserInput.ts` | 100.00% | 100.00% | 100.00% | 100.00% |
| `ResetPasswordInput.ts` | 100.00% | 100.00% | 100.00% | 100.00% |
| `RegisterUserInput.ts` | 84.61% | 50.00% | 100.00% | 100.00% |

---

## 5. Trazabilidad de Casos HU-56

La siguiente matriz resume la trazabilidad entre el diseno priorizado de HU-56, la suite que lo respalda y la carpeta de evidencia que corresponde a la organizacion actual.

| ID | Regla o comportamiento | Suite / archivo | Evidencia automatizada principal | Carpeta de evidencia | Estado |
|---|---|---|---|---|---|
| `U-01` | Cuota lineal sin interes = financiado / `(n-1)` | `SimulationEngine.test.ts` | `debe calcular cuota lineal = financedValue / (n-1)` | `simulation-engine/` | `PASS` |
| `U-02` | Formula PMT francesa con interes | `SimulationEngine.test.ts` | `debe calcular cuota fija con formula M = P*r*(1+r)^n / ((1+r)^n - 1)` | `simulation-engine/` | `PASS` |
| `U-03` | UPB Tech ignora beca | `SimulationEngine.test.ts` | `#57 - upbTech debe ignorar beca (scholarshipPct -> 0)` | `simulation-engine/` | `PASS` |
| `U-04` | Cuota inicial minima pregrado | `SimulationService.test.ts` | `rechaza pregrado cuando la cuota inicial es menor al 20%` | `simulation-service/` | `PASS` |
| `U-05` | Cuota inicial minima UPB Tech | `SimulationService.test.ts` | `rechaza UPB Tech cuando la cuota inicial es menor al 15%` | `simulation-service/` | `PASS` |
| `U-06` | Forzar sin interes cuando `n <= 3` | `SimulationEngine.test.ts` | `#59 - forzar sin_interes si numberOfPayments <= 3 y se envio con_interes` | `simulation-engine/` | `PASS` |
| `U-07` | Ultimo saldo exactamente en cero | `SimulationEngine.test.ts` | `la ultima fila debe tener finalBalance = 0 (absorbe residuo de redondeo)` | `simulation-engine/` | `PASS` |
| `U-08` | Totales consistentes | `SimulationEngine.test.ts` | `totalPaid` y `totalInterest` coherentes con el cronograma | `simulation-engine/` | `PASS` |
| `U-09` | Fechas consecutivas validas y error si el mes esta fuera del periodo | `SimulationEngine.test.ts` + `SimulationService.test.ts` | avance mes a mes, cruce de ano y rechazo de mes invalido | `simulation-engine/` | `PASS` |
| `U-10` | Bordes de `FrenchAmortizationStrategy` | `FrenchAmortizationStrategy.test.ts` | principal 0, cuotas 0, tasa 0, tasa casi 0, tasa faltante | `strategies/french-amortization/` | `PASS` |
| `U-11` | Bordes de `NoInterestStrategy` | `NoInterestStrategy.test.ts` | `P/n`, principal 0, cuotas 0 | `strategies/no-interest/` | `PASS` |
| `U-12` | Validaciones Zod criticas de simulacion y registro | `ValidationSchemas.test.ts` | rechazo de payload invalido en simulacion y registro | `validation-schemas/` | `PASS` |
| `U-13` | Validacion Zod de login | `ValidationSchemas.test.ts` | rechazo por correo, password o rol invalido | `validation-schemas/` | `PASS` |
| `U-14` | Validacion Zod de reset | `ValidationSchemas.test.ts` | rechazo por token faltante y confirmacion inconsistente | `validation-schemas/` | `PASS` |

---

## 6. Cobertura Complementaria Agregada

Ademas de los `14` casos priorizados, las suites de HU-56 quedaron reforzadas con validaciones adicionales que mejoran la confiabilidad del modulo sin alterar la matriz principal del anexo:

### 6.1 Refuerzos en `SimulationService.test.ts`

- regla institucional activa mas estricta cuando existe `initialPaymentRule`
- rechazo cuando la cuota inicial supera la matricula neta
- rechazo cuando el valor financiado queda en `0` y aun se solicitan mas cuotas

### 6.2 Refuerzos en `FrenchAmortizationStrategy.test.ts`

- retorno `0` cuando falta la tasa del `paymentCount` solicitado
- error controlado cuando no existe `activeVersion` para resolver la tasa

### 6.3 Refuerzos en `SimulationEngine.test.ts`

- generacion del numero correcto de filas en el cronograma
- intereses `0` en todas las filas sin interes
- validacion de `totalPaid` con cuota inicial incluida
- derivacion de modalidad desde `levelConfigs`
- uso correcto de tasa por nivel (`PREGRADO`, `POSGRADO`)
- continuidad de `period` y presencia de `id` en el resumen

Estas validaciones complementarias no sustituyen la matriz `U-01` a `U-14`, pero si fortalecen la justificacion tecnica de HU-56 y dejan mejor cubierto el motor financiero para cambios futuros.

---

## 7. Registro Detallado por Bloque de Evidencia

La evidencia se presenta siguiendo la organizacion actual del proyecto. Cada subgrupo corresponde a una carpeta real dentro de `docs/architecture/assets/evidence-unit-test/`.

### 7.1 Bloque `simulation-engine`

Casos cubiertos: `U-01`, `U-02`, `U-03`, `U-06`, `U-07`, `U-08`, `U-09`

#### U-01 - Cuota lineal sin interes

| Campo | Detalle |
|---|---|
| Objetivo | Confirmar que la cuota sin interes se distribuya de forma lineal como `financiado / (n-1)` |
| Datos base | `gross=10.000.000`, `initial=20%`, `modality=sin_interes`, `n=4` |
| Resultado esperado | cuota exacta redondeada, `3` filas de schedule e intereses en `0` |
| Resultado obtenido | La suite `SimulationEngine` paso correctamente y la evidencia funcional/manual mostro comportamiento coherente del plan lineal sin interes |
| Evidencia automatizada | `debe calcular cuota lineal = financedValue / (n-1)` |
| Estado | `PASS` |

![](assets/evidence-unit-test/simulation-engine/cp-u01-sin-interes-lineal-01.png)

![](assets/evidence-unit-test/simulation-engine/cp-u01-sin-interes-lineal-jest-02.png)

---

#### U-02 - Formula PMT francesa con interes

| Campo | Detalle |
|---|---|
| Objetivo | Verificar cuota fija con formula PMT, interes por fila y consistencia de totales |
| Datos base | `gross=10.000.000`, `initial=20%`, `modality=con_interes`, `n=6`, tasa esperada `0.009` |
| Resultado esperado | cuota conforme a formula, `totalPaid` consistente y `totalInterest > 0` |
| Resultado obtenido | La suite paso correctamente y la evidencia visual confirmo simulacion con interes, cronograma y salidas Jest alineadas con la regla |
| Evidencia automatizada | `debe calcular cuota fija con formula M = P*r*(1+r)^n / ((1+r)^n - 1)` |
| Estado | `PASS` |

![](assets/evidence-unit-test/simulation-engine/cp-u02-pmt-francesa-01.png)

![](assets/evidence-unit-test/simulation-engine/cp-u02-pmt-francesa-02.png)

![](assets/evidence-unit-test/simulation-engine/cp-u02-pmt-francesa-jest-03.png)

![](assets/evidence-unit-test/simulation-engine/cp-u02-pmt-francesa-jest-04.png)

---

#### U-03 - UPB Tech ignora beca

| Campo | Detalle |
|---|---|
| Objetivo | Confirmar que para `UPB Tech` la beca no reduce la matricula neta |
| Datos base | `educationLevel=upbTech`, `scholarshipPct=50%`, `gross=8.000.000`, `initial=15%` |
| Resultado esperado | `tuitionNet === tuitionGross` y `scholarshipPct` efectivo en `0` |
| Resultado obtenido | La suite paso y la evidencia funcional confirma que UPB Tech mantiene la matricula sin aplicar beca |
| Evidencia automatizada | `#57 - upbTech debe ignorar beca (scholarshipPct -> 0)` |
| Estado | `PASS` |

![](assets/evidence-unit-test/simulation-engine/cp-u03-upbtech-ignora-beca-01.png)

![](assets/evidence-unit-test/simulation-engine/cp-u03-upbtech-ignora-beca-jest-02.png)

---

#### U-06 - Forzar sin interes cuando `n <= 3`

| Campo | Detalle |
|---|---|
| Objetivo | Validar la regla institucional que fuerza modalidad efectiva sin interes cuando el numero de pagos no supera `3` |
| Datos base | `modality=con_interes`, `n=3`, sin `levelConfig` especial |
| Resultado esperado | modo efectivo `sin_interes` y `totalInterest = 0` |
| Resultado obtenido | La evidencia visual y la prueba automatizada confirmaron el cambio de modalidad efectiva |
| Evidencia automatizada | `#59 - forzar sin_interes si numberOfPayments <= 3 y se envio con_interes` |
| Estado | `PASS` |

![](assets/evidence-unit-test/simulation-engine/cp-u06-forzar-sin-interes-n-menor-igual-3-01.png)

![](assets/evidence-unit-test/simulation-engine/cp-u06-forzar-sin-interes-n-menor-igual-3-jest-02.png)

---

#### U-07 - Ultimo saldo exactamente en cero

| Campo | Detalle |
|---|---|
| Objetivo | Comprobar absorcion del residuo de redondeo en la ultima cuota |
| Datos base | `gross=7.777.777`, `initial=1.555.555`, `modality=con_interes`, `n=6` |
| Resultado esperado | ultima fila con `finalBalance = 0` |
| Resultado obtenido | Se observo en interfaz y en Jest el cierre correcto del saldo final |
| Evidencia automatizada | `la ultima fila debe tener finalBalance = 0 (absorbe residuo de redondeo)` |
| Estado | `PASS` |

![](assets/evidence-unit-test/simulation-engine/cp-u07-ultimo-saldo-cero-01.png)

![](assets/evidence-unit-test/simulation-engine/cp-u07-ultimo-saldo-cero-jest-02.png)

![](assets/evidence-unit-test/simulation-engine/cp-u07-ultimo-saldo-cero-jest-03.png)

---

#### U-08 - Totales consistentes

| Campo | Detalle |
|---|---|
| Objetivo | Verificar que el resumen y el cronograma mantengan consistencia entre capital, intereses y total pagado |
| Datos base | combinaciones nominales con y sin interes |
| Resultado esperado | suma de capital + intereses consistente con `totalPaid` |
| Resultado obtenido | Se documentaron varios escenarios funcionales y la suite confirmo consistencia de agregados |
| Evidencia automatizada | pruebas sobre `totalPaid` y `totalInterest` en `SimulationEngine.test.ts` |
| Estado | `PASS` |

Simulaciones y contraste funcional:

![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion1-01.png)

![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion1-02.png)

![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion2-03.png)

![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion2-04.png)

![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion3-05.png)

![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion3-06.png)

![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion4-07.png)

![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-simulacion4-08.png)

Soporte automatizado:

![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-jest-09.png)

![](assets/evidence-unit-test/simulation-engine/cp-u08-totales-consistentes-jest-10.png)

---

#### U-09 - Fechas y periodo validos

| Campo | Detalle |
|---|---|
| Objetivo | Validar avance mensual consecutivo, cruce de ano y rechazo de meses fuera del periodo academico |
| Datos base | `period=2026-01`, `firstPaymentMonth=2`, `n=6`; caso invalido `mes=7` |
| Resultado esperado | fechas consecutivas validas y error cuando el mes no pertenece al periodo |
| Resultado obtenido | La evidencia visual mostro comportamiento coherente del calendario y Jest valido el avance y el rechazo |
| Evidencia automatizada | `debe avanzar mes a mes desde firstPaymentMonth`, `debe cruzar ano correctamente (dic -> ene)`, `rechaza un mes de primera cuota que no pertenece al periodo academico` |
| Estado | `PASS` |

![](assets/evidence-unit-test/simulation-engine/cp-u09-fechas-periodo-validos-01.png)

![](assets/evidence-unit-test/simulation-engine/cp-u09-fechas-periodo-validos-jest-02.png)

---

### 7.2 Bloque `simulation-service`

Casos cubiertos: `U-04`, `U-05`

#### U-04 - Cuota inicial minima para pregrado

| Campo | Detalle |
|---|---|
| Objetivo | Validar rechazo cuando pregrado no cumple el minimo del `20%` |
| Datos base | `pregrado`, `gross=10.000.000`, `initialPaymentPct=19%` |
| Resultado esperado | error de validacion por minimo incumplido |
| Resultado obtenido | Se observo mensaje funcional coherente y la suite `SimulationService` reporto rechazo controlado |
| Evidencia automatizada | `rechaza pregrado cuando la cuota inicial es menor al 20%` |
| Estado | `PASS` |

![](assets/evidence-unit-test/simulation-service/cp-u04-cuota-inicial-minima-pregrado-01.png)

![](assets/evidence-unit-test/simulation-service/cp-u04-cuota-inicial-minima-pregrado-jest-02.png)

---

#### U-05 - Cuota inicial minima para UPB Tech

| Campo | Detalle |
|---|---|
| Objetivo | Validar rechazo cuando UPB Tech no cumple el minimo del `15%` |
| Datos base | `upbTech`, `gross=8.000.000`, `initialPaymentPct=14%` |
| Resultado esperado | error de validacion por minimo incumplido |
| Resultado obtenido | La interfaz y la salida de Jest fueron consistentes con la regla de rechazo |
| Evidencia automatizada | `rechaza UPB Tech cuando la cuota inicial es menor al 15%` |
| Estado | `PASS` |

![](assets/evidence-unit-test/simulation-service/cp-u05-cuota-inicial-minima-upbtech-01.png)

![](assets/evidence-unit-test/simulation-service/cp-u05-cuota-inicial-minima-upbtech-jest-02.png)

---

### 7.3 Bloque `strategies`

Casos cubiertos: `U-10`, `U-11`

#### U-10 - Bordes de `FrenchAmortizationStrategy`

| Campo | Detalle |
|---|---|
| Objetivo | Validar bordes matematicos de la estrategia con interes |
| Casos verificados | `P=0`, `n=0`, `r=0`, `r` practicamente `0`, tasa faltante, `activeVersion` ausente |
| Resultado esperado | retorno `0`, equivalencia lineal o error controlado segun el caso |
| Resultado obtenido | La suite paso completa y dejo cubiertos los bordes esenciales del calculo frances |
| Evidencia automatizada | `FrenchAmortizationStrategy.test.ts` |
| Estado | `PASS` |

![](assets/evidence-unit-test/strategies/french-amortization/cp-u10-bordes-calculo-jets-01.png)

---

#### U-11 - Bordes de `NoInterestStrategy`

| Campo | Detalle |
|---|---|
| Objetivo | Validar formula `P/n` y bordes basicos de la estrategia sin interes |
| Casos verificados | `P=10M, n=4`, `P=0`, `n=0` |
| Resultado esperado | resultado correcto o `0` segun el borde |
| Resultado obtenido | La suite aprobo los tres escenarios definidos para la estrategia |
| Evidencia automatizada | `NoInterestStrategy.test.ts` |
| Estado | `PASS` |

![](assets/evidence-unit-test/strategies/no-interest/cp-u11-bordes-calculo-jets-01.png)

---

### 7.4 Bloque `validation-schemas`

Casos cubiertos: `U-12`, `U-13`, `U-14`

#### U-12 - Validaciones Zod criticas de simulacion y registro

| Campo | Detalle |
|---|---|
| Objetivo | Verificar que entradas invalidas sean rechazadas antes de llegar al calculo o al alta de usuario |
| Datos base | payload invalido de simulacion y registro |
| Resultado esperado | `safeParse().success === false` y errores por campo |
| Resultado obtenido | La evidencia visual mostro mensajes por campo y la suite `ValidationSchemas` confirmo rechazo en ambos esquemas |
| Evidencia automatizada | `rechaza payload invalido de simulacion para pregrado con cuota inicial menor al 20%`, `rechaza registro con formato de documento invalido para el tipo seleccionado` |
| Estado | `PASS` |

![](assets/evidence-unit-test/validation-schemas/cp-u12-zod-simulacion-01.png)

![](assets/evidence-unit-test/validation-schemas/cp-u12-zod-simulacion-02.png)

![](assets/evidence-unit-test/validation-schemas/cp-u12-zod-simulacion-03.png)

![](assets/evidence-unit-test/validation-schemas/cp-u12-zod-registro-04.png)

![](assets/evidence-unit-test/validation-schemas/cp-u12-zod-registro-05.png)

![](assets/evidence-unit-test/validation-schemas/cp-u12-zod-simulacion-registro-jets-05.png)

---

#### U-13 - Validacion Zod de login

| Campo | Detalle |
|---|---|
| Objetivo | Confirmar que login invalido sea rechazado por esquema antes de autenticar |
| Datos base | correo vacio, password vacia o rol invalido |
| Resultado esperado | `safeParse().success === false` |
| Resultado obtenido | La interfaz mostro errores visibles y la suite confirmo rechazo sobre `body.email`, `body.password` y `body.role` |
| Evidencia automatizada | `rechaza login con correo vacio, password vacia o rol invalido` |
| Estado | `PASS` |

![](assets/evidence-unit-test/validation-schemas/cp-u13-zod-login-01.png)

![](assets/evidence-unit-test/validation-schemas/cp-u13-zod-login-jets-02.png)

---

#### U-14 - Validacion Zod de reset

| Campo | Detalle |
|---|---|
| Objetivo | Confirmar que el reset invalido sea rechazado por token ausente o confirmacion inconsistente |
| Datos base | token faltante, passwords diferentes y password invalida |
| Resultado esperado | `safeParse().success === false` |
| Resultado obtenido | La evidencia funcional/manual y la suite de Jest mantuvieron el mismo criterio de rechazo |
| Evidencia automatizada | `rechaza reset de password con token faltante y confirmacion inconsistente` |
| Estado | `PASS` |

![](assets/evidence-unit-test/validation-schemas/cp-u14-zod-reset-01.png)

![](assets/evidence-unit-test/validation-schemas/cp-u14-zod-rest-jets-02.png)

---

## 8. Hallazgos Tecnicos Relevantes

Durante la implementacion y consolidacion de HU-56 se documentaron los siguientes puntos tecnicos de interes:

1. `SimulationService` fue ajustado para manejar con mayor precision escenarios limite relacionados con cuota inicial, financiado cero y coherencia del valor inicial frente a la matricula neta.
2. La migracion funcional `savedAt -> createdAt` se cerro en backend y frontend para evitar incoherencias en el detalle e historial de simulaciones.
3. La ejecucion serial de Jest con `--runInBand` se mantuvo como practica recomendada en PowerShell por estabilidad operativa.
4. La organizacion de evidencia fue normalizada por bloques funcionales para separar claramente pruebas unitarias de referencias posteriores usadas en integracion.

---

## 9. Resumen Final de Cobertura

| Bloque | Casos HU-56 asociados | Estado | Observacion |
|---|---|---|---|
| `environment` | soporte de ambiente | `PASS` | backend local operativo documentado |
| `simulation-engine` | `U-01`, `U-02`, `U-03`, `U-06`, `U-07`, `U-08`, `U-09` | `PASS` | bloque central del motor financiero |
| `simulation-service` | `U-04`, `U-05` | `PASS` | validaciones previas al calculo |
| `strategies` | `U-10`, `U-11` | `PASS` | bordes matematicos de estrategias |
| `validation-schemas` | `U-12`, `U-13`, `U-14` | `PASS` | validaciones Zod/DTO criticas |
| `summary` | consolidado general | `PASS` | evidencia del run completo `10/10 suites`, `94/94 tests` |

### 9.1 Cierre

La HU-56 queda respaldada por una base de pruebas unitarias:

- repetible
- aislada del flujo UI/API
- trazable contra la matriz priorizada
- reforzada con pruebas complementarias de bordes y validaciones de servicio

En consecuencia, el motor de calculo del simulador queda documentado con soporte suficiente para avanzar con confianza hacia pruebas de integracion, funcionales y de regresion.

---

## 10. Anexos y Estructura de Evidencia

| Carpeta | Contenido principal |
|---|---|
| `docs/architecture/assets/evidence-unit-test/environment/` | soporte de ambiente local para ejecucion unitaria |
| `docs/architecture/assets/evidence-unit-test/simulation-engine/` | casos `U-01`, `U-02`, `U-03`, `U-06`, `U-07`, `U-08`, `U-09` |
| `docs/architecture/assets/evidence-unit-test/simulation-service/` | casos `U-04`, `U-05` |
| `docs/architecture/assets/evidence-unit-test/strategies/french-amortization/` | caso `U-10` |
| `docs/architecture/assets/evidence-unit-test/strategies/no-interest/` | caso `U-11` |
| `docs/architecture/assets/evidence-unit-test/validation-schemas/` | casos `U-12`, `U-13`, `U-14` |
| `docs/architecture/assets/evidence-unit-test/summary/` | evidencia consolidada de ejecucion total |

**Criterio documental adoptado en esta version**

- Este markdown utiliza como base las subcarpetas organizadas por bloque.
- Los archivos sueltos historicos en la raiz de `evidence-unit-test/` no se usan como fuente primaria en este documento.
- La trazabilidad principal queda concentrada en las carpetas agrupadas, para mantener coherencia con la reorganizacion actual del repositorio.
