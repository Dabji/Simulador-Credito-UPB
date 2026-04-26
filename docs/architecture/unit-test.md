# Evidencias de Testing - Simulador de Credito UPB

**Sprint 3 - HU-56 Motor de calculo**

Documento actualizado con la ejecucion real de pruebas unitarias del backend realizada el **21 de abril de 2026** sobre el workspace actual del proyecto.

---

## 1. Resumen Ejecutivo

La HU-56 quedo implementada y verificada con enfoque unitario sobre el nucleo financiero, sin mezclar UI, HTTP ni persistencia real.

Resultado de ejecucion del backend:

| Metrica | Resultado |
|---|---:|
| Test Suites | 10 passed |
| Tests | 94 passed |
| Failures | 0 |
| Resultado final | PASS |

Cobertura mas relevante para HU-56:

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

## 2. Comandos Ejecutados

Comando de validacion puntual para las suites nuevas de HU-56:

```powershell
npm.cmd test -- --runInBand --runTestsByPath src/Application/__tests__/SimulationService.test.ts src/Application/__tests__/FrenchAmortizationStrategy.test.ts src/Application/__tests__/NoInterestStrategy.test.ts src/Application/__tests__/ValidationSchemas.test.ts
```

Resultado:

```text
Test Suites: 4 passed, 4 total
Tests:       18 passed, 18 total
Snapshots:   0 total
```

Comando de validacion completa del backend:

```powershell
npm.cmd test -- --runInBand
```

Resultado:

```text
Test Suites: 10 passed, 10 total
Tests:       94 passed, 94 total
Snapshots:   0 total
Time:        4.766 s
```

Comando de cobertura:

```powershell
npm.cmd run test:coverage -- --runInBand
```

Resultado:

```text
Test Suites: 10 passed, 10 total
Tests:       94 passed, 94 total
Snapshots:   0 total
Time:        5.397 s
```

---

## 3. Suites Relevantes para HU-56

| Suite | Archivo | Enfoque |
|---|---|---|
| `SimulationEngine` | `server/src/Application/__tests__/SimulationEngine.test.ts` | Formula PMT, modalidad sin interes, redondeos, totales, reglas institucionales y fechas |
| `SimulationService` | `server/src/Application/__tests__/SimulationService.test.ts` | Validaciones de cuota inicial, periodo, financiado y reglas de negocio previas al calculo |
| `FrenchAmortizationStrategy` | `server/src/Application/__tests__/FrenchAmortizationStrategy.test.ts` | Bordes del calculo con interes |
| `NoInterestStrategy` | `server/src/Application/__tests__/NoInterestStrategy.test.ts` | Bordes del calculo sin interes |
| `ValidationSchemas` | `server/src/Application/__tests__/ValidationSchemas.test.ts` | Validaciones Zod/DTO de simulacion, login, registro y reset |

---

## 4. Trazabilidad HU-56

La siguiente matriz mapea los **14 casos unitarios priorizados** del anexo operativo contra la evidencia automatizada implementada en el proyecto.

| ID | Regla del diseno | Evidencia automatizada | Estado |
|---|---|---|---|
| `U-01` | Cuota lineal sin interes = financiado / (n-1) | `SimulationEngine.test.ts`: `debe calcular cuota lineal = financedValue / (n-1)`, `debe generar numberOfPayments-1 filas en la tabla (#58)`, `debe tener interest = 0 en todas las filas sin interes` | PASS |
| `U-02` | Formula PMT francesa con interes | `SimulationEngine.test.ts`: `debe calcular cuota fija con formula M = P*r*(1+r)^n / ((1+r)^n - 1)`, `totalInterest debe ser la suma de todos los intereses del plan`, `totalPaid debe incluir la cuota inicial mas la suma de cuotas con interes` | PASS |
| `U-03` | UPB Tech ignora beca | `SimulationEngine.test.ts`: `#57 - upbTech debe ignorar beca (scholarshipPct -> 0)` | PASS |
| `U-04` | Cuota inicial minima pregrado | `SimulationService.test.ts`: `rechaza pregrado cuando la cuota inicial es menor al 20%` | PASS |
| `U-05` | Cuota inicial minima UPB Tech | `SimulationService.test.ts`: `rechaza UPB Tech cuando la cuota inicial es menor al 15%` | PASS |
| `U-06` | Forzar sin interes cuando n <= 3 | `SimulationEngine.test.ts`: `#59 - forzar sin_interes si numberOfPayments <= 3 y se envio con_interes` | PASS |
| `U-07` | Ultimo saldo exactamente en cero | `SimulationEngine.test.ts`: `la ultima fila debe tener finalBalance = 0 (absorbe residuo de redondeo)` | PASS |
| `U-08` | Totales consistentes | `SimulationEngine.test.ts`: `totalPaid debe incluir la cuota inicial + suma del plan`, `totalInterest debe ser la suma de todos los intereses del plan`, `totalPaid debe incluir la cuota inicial mas la suma de cuotas con interes` | PASS |
| `U-09` | Fechas consecutivas validas y error si el mes esta fuera del periodo | `SimulationEngine.test.ts`: `debe avanzar mes a mes desde firstPaymentMonth`, `debe cruzar año correctamente (dic -> ene)`; `SimulationService.test.ts`: `rechaza un mes de primera cuota que no pertenece al periodo academico` | PASS |
| `U-10` | Bordes FrenchAmortizationStrategy: P=0, n=0, r=0, r~0 | `FrenchAmortizationStrategy.test.ts`: `retorna 0 cuando el principal es 0`, `retorna 0 cuando el numero de cuotas es 0`, `cae a cuota lineal cuando la tasa es 0`, `cae a cuota lineal cuando la tasa es practicamente 0` | PASS |
| `U-11` | Bordes NoInterestStrategy: P/n, P=0, n=0 | `NoInterestStrategy.test.ts`: `calcula P / n para cuota sin interes`, `retorna 0 cuando el principal es 0`, `retorna 0 cuando el numero de cuotas es 0` | PASS |
| `U-12` | Validaciones Zod criticas de simulacion y registro | `ValidationSchemas.test.ts`: `rechaza payload invalido de simulacion para pregrado con cuota inicial menor al 20%`, `rechaza registro con formato de documento invalido para el tipo seleccionado` | PASS |
| `U-13` | Validacion Zod de login | `ValidationSchemas.test.ts`: `rechaza login con correo vacio, contraseña vacia o rol invalido` | PASS |
| `U-14` | Validacion Zod de reset | `ValidationSchemas.test.ts`: `rechaza reset de contraseña con token faltante y confirmacion inconsistente` | PASS |

---

## 5. Hallazgos Tecnicos Relevantes

Durante la implementacion y verificacion de HU-56 se identificaron y resolvieron hallazgos que impactaban la confiabilidad del backend:

1. Se corrigio la validacion de `SimulationService` para detectar correctamente cuando la cuota inicial supera la matricula neta.
2. Se cerro la migracion `savedAt -> createdAt` en los puntos que aun bloqueaban la suite completa del backend.
3. Se ejecuto Jest en modo serial con `--runInBand` para evitar el error de sandbox `spawn EPERM` en PowerShell.

---

## 6. Conclusion

La HU-56 queda soportada por una base de pruebas unitarias repetible, aislada y trazable contra el diseno de pruebas. Los **14 casos priorizados** del anexo operativo se encuentran cubiertos y la ejecucion real del backend finalizo en estado **PASS**.

Como resultado, el motor de calculo del simulador queda validado en sus reglas mas sensibles:

- modalidad sin interes
- modalidad con interes
- redondeos y saldo final
- totales
- fechas
- reglas institucionales
- validaciones previas al calculo
- validaciones Zod de entrada relacionadas

---

## 7. Evidencias Visuales por Caso (HU-56)

### CP-U01
![](assets/evidence-unit-test/image1.jpeg)
![](assets/evidence-unit-test/image2.jpeg)

### CP-U02
![](assets/evidence-unit-test/image3.jpeg)
![](assets/evidence-unit-test/image4.jpeg)
![](assets/evidence-unit-test/image5.jpeg)
![](assets/evidence-unit-test/image6.jpeg)

### CP-U03
![](assets/evidence-unit-test/image7.jpeg)
![](assets/evidence-unit-test/image8.jpeg)

### CP-U04
![](assets/evidence-unit-test/image9.jpeg)
![](assets/evidence-unit-test/image10.jpeg)

### CP-U05
![](assets/evidence-unit-test/image11.jpeg)
![](assets/evidence-unit-test/image12.jpeg)

### CP-U06
![](assets/evidence-unit-test/image13.jpeg)
![](assets/evidence-unit-test/image14.jpeg)

### CP-U07
![](assets/evidence-unit-test/image15.jpeg)
![](assets/evidence-unit-test/image16.jpeg)
![](assets/evidence-unit-test/image17.jpeg)

### CP-U08
![](assets/evidence-unit-test/image18.jpeg)
![](assets/evidence-unit-test/image19.jpeg)
![](assets/evidence-unit-test/image20.jpeg)
![](assets/evidence-unit-test/image21.jpeg)
![](assets/evidence-unit-test/image22.jpeg)
![](assets/evidence-unit-test/image23.jpeg)
![](assets/evidence-unit-test/image24.jpeg)
![](assets/evidence-unit-test/image25.jpeg)
![](assets/evidence-unit-test/image26.jpeg)

### CP-U09
![](assets/evidence-unit-test/image27.jpeg)
![](assets/evidence-unit-test/image28.jpeg)

### CP-U10
![](assets/evidence-unit-test/image29.jpeg)

### CP-U11
![](assets/evidence-unit-test/image30.jpeg)

### CP-U12
![](assets/evidence-unit-test/image31.jpeg)
![](assets/evidence-unit-test/image32.jpeg)
![](assets/evidence-unit-test/image33.jpeg)
![](assets/evidence-unit-test/image34.jpeg)
![](assets/evidence-unit-test/image35.jpeg)
![](assets/evidence-unit-test/image36.jpeg)

### CP-U13
![](assets/evidence-unit-test/image37.jpeg)
![](assets/evidence-unit-test/image38.jpeg)

### CP-U14
![](assets/evidence-unit-test/image39.jpeg)
![](assets/evidence-unit-test/image40.jpeg)
