import { NextRequest } from 'next/server'
import { POST } from '../route'
import { prisma } from '@/lib/prisma'
import { getUniqueString } from '@/test/setup'

describe('Import API', () => {
  let testEmployee: any
  let testBaseWeapon: any

  beforeEach(async () => {
    // Create a test employee for the imported weapons
    testEmployee = await prisma.employee.create({
      data: {
        name: 'Test Employee',
        color: '#FF0000',
        role: 'EMPLOYEE',
      },
    })

    // Create a test base weapon
    testBaseWeapon = await prisma.baseWeapon.create({
      data: {
        nom: getUniqueString('base_weapon'),
        prix_defaut: 100,
      },
    })
  })

  describe('POST /api/import', () => {
    it('should import weapons from JSON file', async () => {
      const jsonData = {
        weapons: [
          {
            horodateur: new Date().toISOString(),
            employe_id: testEmployee.id,
            detenteur: 'Test User',
            nom_arme: testBaseWeapon.nom,
            serigraphie: getUniqueString('serial'),
            prix: 100,
          },
        ],
      }

      const file = new File(
        [JSON.stringify(jsonData)],
        'weapons.json',
        { type: 'application/json' }
      )

      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost/api/import', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)

      // Verify the weapon was imported
      const weapons = await prisma.weapon.findMany()
      expect(weapons.length).toBe(1)
      expect(weapons[0]).toHaveProperty('nom_arme', testBaseWeapon.nom)
    })

    it('should import weapons from CSV file', async () => {
      const csvContent = `horodateur,employe_id,detenteur,nom_arme,serigraphie,prix
${new Date().toISOString()},${testEmployee.id},Test User,${testBaseWeapon.nom},${getUniqueString('serial')},100`

      const file = new File(
        [csvContent],
        'weapons.csv',
        { type: 'text/csv' }
      )

      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost/api/import', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)

      // Verify the weapon was imported
      const weapons = await prisma.weapon.findMany()
      expect(weapons.length).toBe(1)
      expect(weapons[0]).toHaveProperty('nom_arme', testBaseWeapon.nom)
    })

    it('should return 400 for unsupported file format', async () => {
      const file = new File(
        ['test content'],
        'weapons.txt',
        { type: 'text/plain' }
      )

      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost/api/import', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Unsupported file format')
    })

    it('should return 400 when no file is provided', async () => {
      const formData = new FormData()

      const request = new NextRequest('http://localhost/api/import', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'No file provided')
    })

    it('should return 500 for invalid base weapon name', async () => {
      const jsonData = {
        weapons: [
          {
            horodateur: new Date().toISOString(),
            employe_id: testEmployee.id,
            detenteur: 'Test User',
            nom_arme: 'Non-existent Base Weapon',
            serigraphie: getUniqueString('serial'),
            prix: 100,
          },
        ],
      }

      const file = new File(
        [JSON.stringify(jsonData)],
        'weapons.json',
        { type: 'application/json' }
      )

      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost/api/import', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Import failed')
    })
  })
}) 