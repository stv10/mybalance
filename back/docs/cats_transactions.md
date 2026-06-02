# Resumen de Implementación: Base de Datos, Cuentas, Categorías y Transacciones

Este documento resume los cambios y adiciones realizados en el servidor backend Java / Spring Boot de **MyBalance**, basados en el diseño de base de datos (`db.dbml` y `db.sql`).

## 1. Mapeo de Entidades JPA y Repositorios

Se implementaron todos los modelos y relaciones utilizando anotaciones JPA estándar, asegurando la consistencia referencial y la correcta manipulación de tipos de datos en PostgreSQL.

### Entidades Creadas/Modificadas:
1. **`Account`**:
   - Mapeada a la tabla `accounts`.
   - Relación `@ManyToOne` (LAZY) con `User`.
   - Campos: `name` (longitud 100, no nulo) y `balance` (BigDecimal de precisión 15, escala 2).
   - **Lógica de Dominio:** Encapsula las operaciones `credit(amount)` y `debit(amount)` directamente en el modelo de dominio.
2. **`CategoryType`** (Enum): Representa el tipo de flujo financiero. Valores: `INCOME` (Ingreso), `EXPENSE` (Gasto).
3. **`Category`**:
   - Mapeada a la tabla `categories`.
   - Relación `@ManyToOne` (LAZY) con `User`.
   - Campo `name` (longitud 100, no nulo) y `type` (Enum `CategoryType` guardado como String).
4. **`Transaction`**:
   - Mapeada a la tabla `transactions`.
   - Relación `@ManyToOne` (LAZY) con `Account` (en lugar del usuario directo) y con `Category` (LAZY).
   - Campos: `amount` (BigDecimal de precisión 15, escala 2), `description` (TEXT), `date` (LocalDate) y `type` (Enum `CategoryType`).

---

## 2. Gestión de Cuentas (`/api/v1/accounts`)

Se ha expuesto un CRUD completo de cuentas con validación de propiedad y control de nombres duplicados por usuario:
- **`GET /api/v1/accounts`**: Devuelve todas las cuentas del usuario autenticado ordenadas alfabéticamente.
- **`POST /api/v1/accounts`**: Permite al usuario crear una cuenta (ej. "Banco Galicia", "MercadoPago", "Efectivo") con su saldo correspondiente.
- **`PUT /api/v1/accounts/{id}`**: Modifica el nombre o el saldo de una cuenta.
- **`DELETE /api/v1/accounts/{id}`**: Elimina una cuenta si no contiene transacciones. Lanza una excepción amigable `BusinessException` si existen transacciones impidiendo la integridad referencial (`ON DELETE RESTRICT`).

### Sembrado Automático al Registro (`AuthService`)
Cuando un usuario nuevo se registra, automáticamente se siembra:
- Una cuenta por defecto llamada **"Principal"** con saldo inicial de `0.00`.
- Las categorías predeterminadas: **Comida**, **Fijos**, **Gustos** (Gastos / `EXPENSE`) y **Sueldo** (Ingresos / `INCOME`).

---

## 3. Lógica Completa de Transacciones y Saldos (`/api/v1/transactions`)

Las transacciones ahora se asocian de manera obligatoria a una **cuenta** específica, y todas las operaciones desencadenan un recálculo de saldo atómico.

### Comportamientos y Reglas de Negocio:
1. **Creación de Transacción:**
   - Si la transacción es de tipo `INCOME` (Ingreso), se le suma el monto al balance de la cuenta (`account.credit(amount)`).
   - Si la transacción es de tipo `EXPENSE` (Gasto), se le resta el monto al balance de la cuenta (`account.debit(amount)`). Se permiten saldos negativos.
2. **Modificación de Transacción:**
   - **Restricción:** No se permite mover una transacción de una cuenta a otra. Si se envía un `accountId` diferente al actual, el servidor lanza una `BusinessException`. El usuario debe borrar y recrear la transacción incorrecta.
   - **Recálculo:** Al modificar una transacción (monto o tipo), el backend revierte de forma atómica el efecto viejo en el saldo y aplica el efecto nuevo en la misma cuenta.
3. **Eliminación de Transacción:**
   - Al borrar una transacción, se revierte su efecto monetario en el saldo de la cuenta asociada de forma automática.

### Endpoints Expuestos:
- **`GET /api/v1/transactions`**: Lista todas las transacciones del usuario a través de sus cuentas, ordenadas por fecha de forma descendente.
- **`POST /api/v1/transactions`**: Crea y asocia una transacción afectando el saldo de la cuenta elegida.
- **`PUT /api/v1/transactions/{id}`**: Modifica la transacción y recalcula el saldo.
- **`DELETE /api/v1/transactions/{id}`**: Revierte el saldo y elimina el registro.

---

## 4. Estructura de Seguridad y Contexto de Usuario

Todos los controladores consumen el email del usuario autenticado utilizando la anotación `@AuthenticationPrincipal String email` de Spring Security, el cual es inyectado de forma segura desde el filtro JWT (`JwtAuthFilter`). Este email se utiliza en la capa de servicios para buscar y asociar entidades a la cuenta del usuario correcto, asegurando un aislamiento total entre usuarios.

