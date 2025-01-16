import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const employee = await prisma.employee.create({
      data: {
        name: body.name,
        color: body.color,
        role: body.role || "EMPLOYEE",
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