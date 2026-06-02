DO $$
DECLARE
    user_record RECORD;
    vida_id UUID;
    ocio_id UUID;
    inversion_deuda_id UUID;
BEGIN
    FOR user_record IN SELECT id FROM users LOOP
        -- 1. Crear 'Vida' si no existe
        SELECT id INTO vida_id FROM categories WHERE user_id = user_record.id AND name = 'Vida' AND type = 'EXPENSE';
        IF vida_id IS NULL THEN
            vida_id := gen_random_uuid();
            INSERT INTO categories (id, user_id, name, type, is_user_created, created_at)
            VALUES (vida_id, user_record.id, 'Vida', 'EXPENSE', FALSE, NOW());
        ELSE
            UPDATE categories SET is_user_created = FALSE WHERE id = vida_id;
        END IF;

        -- 2. Crear 'Ocio' si no existe
        SELECT id INTO ocio_id FROM categories WHERE user_id = user_record.id AND name = 'Ocio' AND type = 'EXPENSE';
        IF ocio_id IS NULL THEN
            ocio_id := gen_random_uuid();
            INSERT INTO categories (id, user_id, name, type, is_user_created, created_at)
            VALUES (ocio_id, user_record.id, 'Ocio', 'EXPENSE', FALSE, NOW());
        ELSE
            UPDATE categories SET is_user_created = FALSE WHERE id = ocio_id;
        END IF;

        -- 3. Crear 'Inversion-Deuda' si no existe
        SELECT id INTO inversion_deuda_id FROM categories WHERE user_id = user_record.id AND name = 'Inversion-Deuda' AND type = 'EXPENSE';
        IF inversion_deuda_id IS NULL THEN
            inversion_deuda_id := gen_random_uuid();
            INSERT INTO categories (id, user_id, name, type, is_user_created, created_at)
            VALUES (inversion_deuda_id, user_record.id, 'Inversion-Deuda', 'EXPENSE', FALSE, NOW());
        ELSE
            UPDATE categories SET is_user_created = FALSE WHERE id = inversion_deuda_id;
        END IF;

        -- 4. Marcar 'Sueldo' como semilla
        UPDATE categories SET is_user_created = FALSE WHERE user_id = user_record.id AND name = 'Sueldo' AND type = 'INCOME';

        -- 5. Vincular 'Comida' y 'Fijos' a 'Vida'
        UPDATE categories SET parent_category_id = vida_id, is_user_created = TRUE
        WHERE user_id = user_record.id AND name IN ('Comida', 'Fijos') AND type = 'EXPENSE';

        -- 6. Vincular 'Gustos' a 'Ocio'
        UPDATE categories SET parent_category_id = ocio_id, is_user_created = TRUE
        WHERE user_id = user_record.id AND name = 'Gustos' AND type = 'EXPENSE';

        -- 7. Asegurar que las demás categorías sigan en is_user_created = TRUE
        UPDATE categories SET is_user_created = TRUE
        WHERE user_id = user_record.id AND name NOT IN ('Vida', 'Ocio', 'Inversion-Deuda', 'Sueldo');
    END LOOP;
END $$;
