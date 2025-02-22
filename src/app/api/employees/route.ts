import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['EMPLOYEE', 'PATRON', 'CO_PATRON']
        }
      },
      include: {
        weapons: true,
      },
    })
    return NextResponse.json(users)
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

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        color: data.color,
        role: data.role || 'EMPLOYEE'
      }
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Create employee error:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
} 