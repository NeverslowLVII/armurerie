import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Parse employee ID
    const employeeId = parseInt(params.id)
    if (isNaN(employeeId)) {
      console.error('Invalid employee ID:', params.id)
      return NextResponse.json(
        { error: 'Invalid employee ID', employe_id: params.id },
        { status: 400 }
      )
    }

    // Validate employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })
    if (!employee) {
      console.error('Employee not found:', employeeId)
      return NextResponse.json(
        { error: 'Employee not found', employe_id: employeeId },
        { status: 404 }
      )
    }

    // Get weapons for employee
    const weapons = await prisma.weapon.findMany({
      where: { employe_id: employeeId },
      include: {
        employee: true,
        base_weapon: true
      }
    })

    return NextResponse.json(weapons)
  } catch (error) {
    console.error('Get employee weapons error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employee weapons' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400'
    }
  })
} 