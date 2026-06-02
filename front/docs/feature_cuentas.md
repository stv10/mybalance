# Documentación de Feature: Múltiples Cuentas y Recalculación de Saldos

Esta feature introduce el soporte para **múltiples cuentas** (bancos, aplicaciones de pago, efectivo) bajo el usuario autenticado de **MyBalance**. Las transacciones ahora se vinculan de manera obligatoria a una cuenta específica en lugar de estar asociadas directamente al usuario, y los saldos de las cuentas se recalculan de forma automática ante cualquier movimiento.

---

## 1. Diseño y Arquitectura de Datos

Se realizó una migración en el diseño conceptual y físico de la base de datos para dar soporte a esta nueva estructura.

### Nueva Tabla: `accounts`
Cada usuario puede tener $N$ cuentas.
* `id` (`UUID` / `PK`): Identificador único autogenerado.
* `user_id` (`UUID` / `FK` -> `users.id`): Propietario de la cuenta con eliminación en cascada (`ON DELETE CASCADE`).
* `name` (`VARCHAR(100)`): Nombre descriptivo (ej. "Banco Galicia", "Efectivo", "MercadoPago"). Es único por usuario (insensible a mayúsculas).
* `balance` (`DECIMAL(15,2)`): Saldo disponible en tiempo real. Soporta saldos negativos.
* `created_at` (`TIMESTAMP`): Fecha y hora de creación de la cuenta.

### Modificación de Tabla: `transactions`
* Se **eliminó** la columna directa `user_id`.
* Se **agregó** la columna `account_id` (`UUID` / `FK` -> `accounts.id` con eliminación restringida `ON DELETE RESTRICT` para preservar la consistencia).
* Al consultar transacciones, el backend ahora realiza un `JOIN` a través de `account.user.email` para asegurar el aislamiento.

---

## 2. Lógica de Dominio Encapsulada

Siguiendo principios de diseño limpio y dominio enriquecido, la lógica de negocio para aumentar y disminuir el balance no se delega ad-hoc en los servicios, sino que está **encapsulada directamente en los métodos de la entidad `Account`**:

```java
public void credit(BigDecimal amount) {
    if (amount == null || amount.compareTo(BigDecimal.ZERO) < 0) {
        throw new IllegalArgumentException("El monto a acreditar no puede ser negativo");
    }
    this.balance = this.balance.add(amount);
}

public void debit(BigDecimal amount) {
    if (amount == null || amount.compareTo(BigDecimal.ZERO) < 0) {
        throw new IllegalArgumentException("El monto a debitar no puede ser negativo");
    }
    this.balance = this.balance.subtract(amount);
}
```

---

## 3. Comportamiento y Reglas de Negocio en Transacciones

Las operaciones de transacciones gatillan recálculos transaccionales y atómicos (`@Transactional`) en el saldo de la cuenta:

* **Crear Transacción:**
  * Si es un ingreso (`INCOME`), ejecuta `account.credit(amount)`.
  * Si es un gasto (`EXPENSE`), ejecuta `account.debit(amount)`.
* **Eliminar Transacción:**
  * Revierte el saldo: si era un ingreso, debita el monto; si era un gasto, acredita el monto.
* **Modificar Transacción:**
  * **Regla Crítica:** **No se permite mover una transacción de una cuenta a otra.** Si la petición incluye un `accountId` diferente al registrado en base de datos, el servidor arroja un error de negocio (`BusinessException`). El usuario debe eliminar la transacción incorrecta y crear la correcta desde cero.
  * **Recálculo de Saldos:** Si se modifica el monto o el tipo del movimiento en una transacción existente, de forma atómica:
    1. Se revierte el monto anterior de la cuenta.
    2. Se aplica el nuevo monto.
    3. Se guarda tanto la cuenta como la transacción.

---

## 4. Sembrado Automático de Cuenta Predeterminada

Para garantizar una experiencia de usuario fluida, cuando un nuevo usuario se registra a través de `AuthService`:
1. Se crea automáticamente una cuenta inicial llamada **"Principal"** con saldo `0.00`.
2. Se siembran las categorías básicas de inicio (**Comida**, **Fijos**, **Gustos** y **Sueldo**).
De esta manera, el usuario puede comenzar a subir transacciones sin configuración previa obligatoria.

---

## 5. Endpoints de la API

### Cuentas (`/api/v1/accounts`)
* `GET /api/v1/accounts`: Lista las cuentas del usuario autenticado ordenadas por nombre.
* `GET /api/v1/accounts/{id}`: Detalle de una cuenta.
* `POST /api/v1/accounts`: Crea una cuenta. Requiere `name` y `balance` (saldo inicial).
* `PUT /api/v1/accounts/{id}`: Modifica el nombre o saldo.
* `DELETE /api/v1/accounts/{id}`: Borra una cuenta vacía. Lanza `BusinessException` si tiene transacciones registradas.

### Transacciones (`/api/v1/transactions`)
Se actualizaron los payloads de la API:
* **Petición (Request):** Se requiere el campo `accountId` (`UUID`).
* **Respuesta (Response):** Retorna `accountId` y `accountName` (nombre legible de la cuenta) en el cuerpo JSON.

---

## 6. Suite de Pruebas Unitarias

Se implementó una suite robusta de pruebas unitarias en JUnit 5:
1. **`AccountTest`**: Valida que los métodos de dominio `credit()` y `debit()` calculen correctamente los importes, lancen excepciones si se envían valores inválidos y permitan saldos negativos.
2. **`TransactionServiceTest`**: Utiliza dobles de prueba (`Mockito`) para verificar el flujo completo de recalculación automática de balances al crear, modificar y eliminar transacciones, así como el bloqueo a nivel de negocio si se intenta migrar una transacción de cuenta.
