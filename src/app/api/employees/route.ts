import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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
    const data = await request.json()
    if (!data.name || !data.email || !data.password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const employee = await prisma.employee.create({
      data: ({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        color: data.color,
        role: data.role || 'EMPLOYEE'
      } as any)
    })

    return NextResponse.json({ success: true, employee })
  } catch (error) {
    console.error('Create employee error:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
} 