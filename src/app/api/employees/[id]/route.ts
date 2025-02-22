import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidRole } from '@/utils/roles'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const user = await prisma.user.findUnique({
      where: { id },
      include: { weapons: true }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
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
    
    // Validate role
    if (data.role && !isValidRole(data.role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be EMPLOYEE, CO_PATRON, or PATRON' },
        { status: 400 }
      )
    }

    // Check if trying to demote last PATRON
    if (data.role && data.role !== 'PATRON') {
      const currentUser = await prisma.user.findUnique({ where: { id } })
      if (currentUser?.role === 'PATRON') {
        const patronCount = await prisma.user.count({ where: { role: 'PATRON' } })
        if (patronCount <= 1) {
          return NextResponse.json(
            { error: 'Cannot demote the last PATRON' },
            { status: 400 }
          )
        }
      }
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: ({
        name: data.name,
        color: data.color,
        role: data.role
      } as any),
      include: { weapons: true }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Parse user ID
    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      console.error('Invalid user ID:', params.id)
      return NextResponse.json(
        { error: 'Invalid user ID', user_id: params.id },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { weapons: true }
    })

    if (!user) {
      console.error('User not found:', userId)
      return NextResponse.json(
        { error: 'User not found', user_id: userId },
        { status: 404 }
      )
    }

    // Check if user has weapons
    if (user.weapons.length > 0) {
      console.error('Cannot delete user with weapons:', userId)
      return NextResponse.json(
        { 
          error: 'Cannot delete user with weapons',
          user_id: userId,
          weapon_count: user.weapons.length
        },
        { status: 400 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    })

    console.log('User deleted successfully:', userId)
    return NextResponse.json({ 
      success: true,
      message: `User ${userId} deleted successfully`
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
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