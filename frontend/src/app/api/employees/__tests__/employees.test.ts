import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { prisma } from '@/lib/prisma'

describe('Employees API', () => {
  describe('GET /api/employees', () => {
    it('should return all employees', async () => {
      // Create test data
      await prisma.employee.create({
        data: {
          name: 'Test Employee',
          color: '#FF0000',
          role: 'EMPLOYEE',
        },
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBeTruthy()
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('name', 'Test Employee')
      expect(data[0]).toHaveProperty('color', '#FF0000')
    })

    it('should return empty array when no employees exist', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBeTruthy()
      expect(data.length).toBe(0)
    })
  })

  describe('POST /api/employees', () => {
    it('should create a new employee', async () => {
      const employeeData = {
        name: 'New Employee',
        color: '#00FF00',
        role: 'EMPLOYEE',
      }

      const request = new NextRequest('http://localhost/api/employees', {
        method: 'POST',
        body: JSON.stringify(employeeData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('name', 'New Employee')
      expect(data).toHaveProperty('color', '#00FF00')
      expect(data).toHaveProperty('role', 'EMPLOYEE')
    })

    it('should create an employee with default role when role is not provided', async () => {
      const employeeData = {
        name: 'New Employee',
        color: '#00FF00',
      }

      const request = new NextRequest('http://localhost/api/employees', {
        method: 'POST',
        body: JSON.stringify(employeeData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('role', 'EMPLOYEE')
    })
  })
}) 