import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { prisma } from '@/lib/prisma'

describe('Base Weapons API', () => {
  describe('GET /api/base-weapons', () => {
    it('should return all base weapons', async () => {
      // Create test data
      const testBaseWeapon = await prisma.baseWeapon.create({
        data: {
          nom: 'Test Base Weapon',
          prix_defaut: 100,
        },
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBeTruthy()
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('nom', 'Test Base Weapon')
      expect(data[0]).toHaveProperty('prix_defaut', 100)
    })

    it('should return empty array when no base weapons exist', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBeTruthy()
      expect(data.length).toBe(0)
    })
  })

  describe('POST /api/base-weapons', () => {
    it('should create a new base weapon', async () => {
      const baseWeaponData = {
        nom: 'New Base Weapon',
        prix_defaut: 150,
      }

      const request = new NextRequest('http://localhost/api/base-weapons', {
        method: 'POST',
        body: JSON.stringify(baseWeaponData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('nom', 'New Base Weapon')
      expect(data).toHaveProperty('prix_defaut', 150)
    })

    it('should handle missing required fields', async () => {
      const request = new NextRequest('http://localhost/api/base-weapons', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          nom: 'New Base Weapon',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Error creating base weapon')
    })
  })
}) 