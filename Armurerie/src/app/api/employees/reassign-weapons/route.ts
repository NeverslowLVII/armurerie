import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Get employee IDs from query parameters
    const searchParams = request.nextUrl.searchParams
    const fromEmployeeId = parseInt(searchParams.get('from_employee_id') || '')
    const toEmployeeId = parseInt(searchParams.get('to_employee_id') || '')

    // Validate employee IDs
    if (isNaN(fromEmployeeId) || isNaN(toEmployeeId)) {
      console.error('Invalid employee IDs:', { fromEmployeeId, toEmployeeId })
      return NextResponse.json(
        { error: 'Invalid employee IDs', fromEmployeeId, toEmployeeId },
        { status: 400 }
      )
    }

    // Validate both employees exist
    const [fromEmployee, toEmployee] = await Promise.all([
      prisma.employee.findUnique({ where: { id: fromEmployeeId } }),
      prisma.employee.findUnique({ where: { id: toEmployeeId } })
    ])

    if (!fromEmployee || !toEmployee) {
      console.error('One or both employees not found:', { fromEmployeeId, toEmployeeId })
      return NextResponse.json(
        { 
          error: 'One or both employees not found',
          fromEmployee: fromEmployee ? 'found' : 'not found',
          toEmployee: toEmployee ? 'found' : 'not found'
        },
        { status: 404 }
      )
    }

    // Update all weapons from the source employee to the target employee
    const result = await prisma.weapon.updateMany({
      where: { employe_id: fromEmployeeId },
      data: { employe_id: toEmployeeId }
    })

    console.log('Weapons reassigned successfully:', result)
    return NextResponse.json({
      success: true,
      message: `${result.count} weapons reassigned from employee ${fromEmployeeId} to ${toEmployeeId}`,
      count: result.count
    })
  } catch (error) {
    console.error('Reassign weapons error:', error)
    return NextResponse.json(
      { error: 'Failed to reassign weapons' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400'
    }
  })
} 