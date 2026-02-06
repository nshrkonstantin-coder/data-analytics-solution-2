-- Обновление пароля администратора на правильный хеш
-- Пароль: admin123
-- Хеш: $2b$12$cdao4cjD/h.sI//PMDUfOOzwfFlqcA1ydrZ0kZpHHS9/Y7.eU/tYS

UPDATE users 
SET password_hash = '$2b$12$cdao4cjD/h.sI//PMDUfOOzwfFlqcA1ydrZ0kZpHHS9/Y7.eU/tYS'
WHERE email = 'admin@maxisoftzab.ru';