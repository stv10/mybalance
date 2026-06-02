# Documentación de Feature: Generación Explicita de Presupuestos y Visualización del Patrimonio

Esta feature introduce la capacidad de **generar explícitamente el presupuesto mensual** de un usuario a partir de su molde o plantilla, en lugar de crearlo de forma silenciosa y automática en consultas de solo lectura. Además, se habilitó la visualización del **Patrimonio Total** y los KPIs del Dashboard principal incluso cuando no hay transacciones en el mes corriente, evitando pantallas vacías innecesarias.

---

## 1. Generación Explícita de Presupuestos Mensuales

Anteriormente, al consultar el presupuesto comparativo del mes, el sistema creaba perezosamente un presupuesto en blanco o basado en el modelo de forma automática bajo una transacción `@Transactional(readOnly = true)`. Esto causaba efectos colaterales de escritura en operaciones de lectura y no permitía al usuario saber si el presupuesto del mes había sido inicializado formalmente.

### Cambios en el Backend:
1. **`MonthlyBudgetService.java`**:
   * Se modificó `compareBudgetWithExpenses` para verificar primero la presencia del presupuesto en la base de datos a través de `findByUserEmailAndMonthAndYear`.
   * Si no existe el presupuesto para el período solicitado, en lugar de crearlo automáticamente, se retorna un objeto `BudgetComparisonResponse` con `monthlyBudgetId = null` y límites vacíos (pero conservando la suma de gastos acumulados reales del mes para visualización inicial).
2. **`MonthlyBudgetController.java`**:
   * Se agregó el endpoint **`POST /api/v1/budgets/monthly/generate?month=X&year=Y`**.
   * Este endpoint ejecuta explícitamente la lógica de negocio `monthlyBudgetService.getOrCreateMonthlyBudget(email, month, year)`, la cual crea la entidad `MonthlyBudget` y clona todos los límites por categoría establecidos en la plantilla de referencia del usuario (`BudgetModel`).

### Cambios en el Frontend:
1. **`api.js`**: Se expuso la función `generateMonthlyBudget(month, year)` para realizar la llamada POST al backend.
2. **`BudgetsTab.jsx`**:
   * Se agregó el estado de carga `isGenerating` y la función `handleGenerateBudget` para coordinar el proceso y refrescar la vista.
3. **`BudgetComparisonView.jsx`**:
   * Se modificó el renderizado condicional. Si `monthlyBudgetId === null`, se muestra una interfaz dedicada indicando que el presupuesto de ese mes no ha sido generado.
   * Se despliega un botón destacado para **"Generar Presupuesto del Mes"** y otro secundario para **"Configurar Plantilla Modelo"**, ofreciendo una experiencia interactiva y premium.

---

## 2. Dashboard Activo y Patrimonio Visible (Sin Transacciones)

Anteriormente, si el usuario no tenía transacciones registradas en el mes seleccionado, la pantalla completa del Dashboard era reemplazada por un componente `EmptyState` que ocultaba el patrimonio total del usuario y el resto de la interfaz.

### Cambios en el Frontend:
1. **`OverviewTab.jsx`**:
   * Se eliminó el bloque condicional que obstruía toda la pantalla cuando `monthTransactions.length === 0`.
   * Ahora, la grilla de estadísticas (`StatsGrid`) y el bloque de contenido principal del dashboard se muestran en todo momento. Esto garantiza que el usuario pueda ver su **Patrimonio Total (Riqueza Neta)** independientemente de su actividad mensual.
2. **`RecentTransactions.jsx`**:
   * Se agregó una sección informativa interna en caso de que la lista de movimientos mensuales esté vacía (*"No hay movimientos registrados en este mes."*).
3. **`CategoryDistribution.jsx`**:
   * Se mantuvo su comportamiento alineado de control que indica amigablemente la falta de gastos mensuales.

---

## 3. Beneficios Obtenidos

* **Claridad en el Flujo de Datos**: El usuario tiene control de cuándo inicializar su presupuesto y ve claramente si está trabajando sobre un molde preestablecido.
* **Consistencia de Base de Datos**: Se eliminaron las escrituras implícitas en operaciones de consulta (`GET /compare`).
* **Experiencia de Usuario (UX) Premium**: La grilla de patrimonio total y el balance general se mantienen activos de forma dinámica y atractiva, promoviendo mayor interacción y visualización real de su riqueza acumulada.
