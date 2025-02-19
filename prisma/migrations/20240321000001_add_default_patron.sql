-- Insert default patron account
-- Password is 'patron123' hashed with bcrypt
INSERT INTO "User" (
    email,
    username,
    password,
    name,
    role,
    createdAt,
    updatedAt
)
VALUES (
    'patron@company.com',
    'patron',
    '$2b$10$lfKcUs4B.YyI9ta9bRA6U.kFKd1W8oeH6Eb0eOvhP8o/MjCVoS.AO',
    'Patron',
    'PATRON',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
); 