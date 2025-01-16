import { prisma } from '@/lib/prisma'

let testCounter = 0

export function getUniqueString(prefix: string = 'test'): string {
  testCounter++
  return `${prefix}_${Date.now()}_${testCounter}`
}

beforeAll(async () => {
  // Add any global setup here
  testCounter = 0
})

afterAll(async () => {
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean up the test database before each test
  const tables = ['Weapon', 'Employee', 'BaseWeapon']
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
  }
}) 