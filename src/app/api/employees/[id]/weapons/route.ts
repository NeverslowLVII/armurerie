import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
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

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    if (!user) {
      console.error('User not found:', userId)
      return NextResponse.json(
        { error: 'User not found', user_id: userId },
        { status: 404 }
      )
    }

    // Get weapons for user
    const weapons = await prisma.weapon.findMany({
      where: { user_id: userId },
      include: {
        user: true,
        base_weapon: true
      }
    })

    return NextResponse.json(weapons)
  } catch (error) {
    console.error('Get user weapons error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user weapons' },
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