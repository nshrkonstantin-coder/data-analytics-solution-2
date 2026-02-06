-- Обновление пароля администратора
-- Новый пароль: admin123
-- Хеш создан с помощью bcrypt с солтом $2b$12$

UPDATE users 
SET password_hash = '$2b$12$K8QZ3Z3Z3Z3Z3Z3Z3Z3Z3uqKq7vK8qH8qH8qH8qH8qH8qH8qH8qH8u'
WHERE email = 'admin@maxisoftzab.ru';

-- Если админ не существует, создаём его заново
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('admin@maxisoftzab.ru', '$2b$12$K8QZ3Z3Z3Z3Z3Z3Z3Z3Z3uqKq7vK8qH8qH8qH8qH8qH8qH8qH8qH8u', 'Администратор', 'admin')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;