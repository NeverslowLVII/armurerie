import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { prisma } from '@/lib/prisma'
import { getUniqueString } from '@/test/setup'

describe('Weapons API', () => {
  let testEmployee: any
  let testBaseWeapon: any

  beforeEach(async () => {
    // Create a test employee for each test
    testEmployee = await prisma.employee.create({
      data: {
        name: 'Test Employee',
        color: '#FF0000',
        role: 'EMPLOYEE',
      },
    })

    // Create a test base weapon for each test
    testBaseWeapon = await prisma.baseWeapon.create({
      data: {
        nom: getUniqueString('base_weapon'),
        prix_defaut: 100,
      },
    })
  })

  describe('GET /api/weapons', () => {
    it('should return all weapons', async () => {
      // Create test data
      const testWeapon = await prisma.weapon.create({
        data: {
          employe_id: testEmployee.id,
          detenteur: 'Test User',
          nom_arme: testBaseWeapon.nom,
          serigraphie: getUniqueString('serial'),
          prix: 100,
          horodateur: new Date(),
        },
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBeTruthy()
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('nom_arme', testBaseWeapon.nom)
      expect(data[0]).toHaveProperty('employee')
      expect(data[0].employee).toHaveProperty('name', 'Test Employee')
    })

    it('should return empty array when no weapons exist', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBeTruthy()
      expect(data.length).toBe(0)
    })
  })

  describe('POST /api/weapons', () => {
    it('should create a new weapon', async () => {
      const weaponData = {
        employe_id: testEmployee.id,
        detenteur: 'New User',
        nom_arme: testBaseWeapon.nom,
        serigraphie: getUniqueString('serial'),
        prix: 200,
      }

      const request = new NextRequest('http://localhost/api/weapons', {
        method: 'POST',
        body: JSON.stringify(weaponData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('nom_arme', testBaseWeapon.nom)
      expect(data).toHaveProperty('prix', 200)
      expect(data).toHaveProperty('employee')
      expect(data.employee).toHaveProperty('name', 'Test Employee')
    })

    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest('http://localhost/api/weapons', {
        method: 'POST',
        body: JSON.stringify({
          detenteur: 'New User',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Missing required fields')
    })

    it('should return 500 for invalid employee ID', async () => {
      const weaponData = {
        employe_id: 999999, // Non-existent employee ID
        detenteur: 'New User',
        nom_arme: testBaseWeapon.nom,
        serigraphie: getUniqueString('serial'),
        prix: 200,
      }

      const request = new NextRequest('http://localhost/api/weapons', {
        method: 'POST',
        body: JSON.stringify(weaponData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Error creating weapon')
    })

    it('should return 500 for invalid base weapon name', async () => {
      const weaponData = {
        employe_id: testEmployee.id,
        detenteur: 'New User',
        nom_arme: 'Non-existent Base Weapon',
        serigraphie: getUniqueString('serial'),
        prix: 200,
      }

      const request = new NextRequest('http://localhost/api/weapons', {
        method: 'POST',
        body: JSON.stringify(weaponData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Error creating weapon')
    })
  })
}) 