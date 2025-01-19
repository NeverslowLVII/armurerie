import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@/services/api'
import { isValidRole } from '@/utils/roles'

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        weapons: true,
      },
    })
    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ error: 'Error fetching employees' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate role
    if (body.role && !isValidRole(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be EMPLOYEE, CO_PATRON, or PATRON' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.create({
      data: {
        name: body.name,
        color: body.color,
        role: (body.role || Role.EMPLOYEE) as Role,
      },
      include: {
        weapons: true,
      },
    })
    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: 'Error creating employee' }, { status: 500 })
  }
} 