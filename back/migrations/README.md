# Database Migrations (DDL) — MyBalance Backend

Este directorio contiene todos los scripts SQL de definición de datos (DDL) para la base de datos PostgreSQL de **MyBalance**.

## Directrices de Migración

1. **Ubicación obligatoria**: Cualquier cambio en la estructura de la base de datos (creación/modificación de tablas, columnas, índices, vistas, etc.) debe definirse en un script SQL dentro de esta carpeta.
2. **Nomenclatura secuencial**:
   - Formato sugerido: `YYYYMMDDHHMMSS__descripcion.sql` (por ejemplo, `20260601000000__create_users_table.sql`) o `V<N>__descripcion.sql` (por ejemplo, `V1__init_db.sql`).
   - El prefijo temporal o numérico garantiza que las migraciones puedan ejecutarse en el orden correcto.
3. **Inmutabilidad**: Un archivo SQL de migración que ya haya sido aplicado o integrado no debe modificarse directamente. Si se requiere un cambio sobre esa tabla, se debe crear un nuevo script de migración incremental.
4. **Sentencias SQL limpias**:
   - Asegúrate de incluir sentencias DDL válidas para PostgreSQL.
   - Si es necesario, utiliza cláusulas `IF NOT EXISTS` o `IF EXISTS` para mayor robustez en entornos de desarrollo.
