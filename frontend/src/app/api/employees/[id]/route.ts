import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { weapons: true }
    })
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Get employee error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const data = await request.json()
    
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name: data.name,
        color: data.color,
        role: data.role
      },
      include: { weapons: true }
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Update employee error:', error)
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { weapons: true }
    })

    if (!employee) {
      console.error('Employee not found:', employeeId)
      return NextResponse.json(
        { error: 'Employee not found', employe_id: employeeId },
        { status: 404 }
      )
    }

    // Check if employee has weapons
    if (employee.weapons.length > 0) {
      console.error('Cannot delete employee with weapons:', employeeId)
      return NextResponse.json(
        { 
          error: 'Cannot delete employee with weapons',
          employe_id: employeeId,
          weapon_count: employee.weapons.length
        },
        { status: 400 }
      )
    }

    // Delete employee
    await prisma.employee.delete({
      where: { id: employeeId }
    })

    console.log('Employee deleted successfully:', employeeId)
    return NextResponse.json({ 
      success: true,
      message: `Employee ${employeeId} deleted successfully`
    })
  } catch (error) {
    console.error('Delete employee error:', error)
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400'
    }
  })
} 