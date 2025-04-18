import { prisma } from './prisma';
import { DEFAULT_ADMIN } from '@/config/defaults';
import bcrypt from 'bcryptjs';

let isInitialized = false;

export async function initializeApp() {
  if (isInitialized) {
    console.log('App already initialized, skipping...');
    return;
  }

  try {
    console.log('Starting app initialization...');
    console.log('Checking for existing admin...');

    // Vérifier si un administrateur existe déjà
    const adminExists = await prisma.user.findFirst({
      where: { role: DEFAULT_ADMIN.role },
    });

    if (adminExists) {
      console.log('Admin already exists:', {
        id: adminExists.id,
        email: adminExists.email,
        name: adminExists.name,
        role: adminExists.role,
      });
    } else {
      console.log('No admin found. Creating default admin...');
      console.log('Default admin config:', {
        email: DEFAULT_ADMIN.email,
        name: DEFAULT_ADMIN.name,
        role: DEFAULT_ADMIN.role,
        color: DEFAULT_ADMIN.color,
      });

      // Créer l'administrateur par défaut
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
      const admin = await prisma.user.create({
        data: {
          email: DEFAULT_ADMIN.email,
          password: hashedPassword,
          name: DEFAULT_ADMIN.name,
          role: DEFAULT_ADMIN.role,
          color: DEFAULT_ADMIN.color,
        },
      });

      console.log('Default admin created successfully:', {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      });
      console.log('You can now login with:');
      console.log('Email:', DEFAULT_ADMIN.email);
      console.log('Password:', DEFAULT_ADMIN.password);
    }

    isInitialized = true;
    console.log('App initialization completed successfully.');
  } catch (error) {
    console.error('Error during app initialization:', error);
    throw error;
  }
}
