-- Insert default developer account
-- Password is 'admin123' hashed with bcrypt
INSERT INTO "Developer" (username, password, name)
VALUES ('admin', '$2b$10$lfKcUs4B.YyI9ta9bRA6U.kFKd1W8oeH6Eb0eOvhP8o/MjCVoS.AO', 'Administrator'); 