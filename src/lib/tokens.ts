import { type SignOptions, sign, verify } from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

interface TokenPayload {
  userId: number;
  email: string;
  type: 'setup' | 'reset';
}

type ExpiresIn = string | number;

function generateToken(payload: TokenPayload, expiresIn: ExpiresIn) {
  return sign(payload, SECRET_KEY, { expiresIn } as SignOptions);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return verify(token, SECRET_KEY) as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function generateSetupLink(
  userId: number,
  email: string,
  baseUrl: string
) {
  const token = generateToken(
    { userId, email, type: 'setup' },
    '24h' // Expire après 24 heures
  );
  return `${baseUrl}/auth/setup?token=${token}`;
}

export function generateResetLink(
  userId: number,
  email: string,
  baseUrl: string
) {
  const token = generateToken(
    { userId, email, type: 'reset' },
    '1h' // Expire après 1 heure
  );
  return `${baseUrl}/auth/reset?token=${token}`;
}
