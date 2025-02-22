import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id || params.id === 'null') {
      return NextResponse.json(
        { error: 'Missing weapon ID' },
        { status: 400 }
      )
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid weapon ID', id: params.id },
        { status: 400 }
      )
    }

    const weapon = await prisma.weapon.findUnique({
      where: { id },
      include: {
        user: true,
        base_weapon: true
      }
    })
    
    if (!weapon) {
      return NextResponse.json(
        { error: 'Weapon not found', id },
        { status: 404 }
      )
    }

    return NextResponse.json(weapon)
  } catch (error) {
    console.error('Get weapon error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weapon' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id || params.id === 'null') {
      return NextResponse.json(
        { error: 'Missing weapon ID' },
        { status: 400 }
      )
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid weapon ID', id: params.id },
        { status: 400 }
      )
    }

    const data = await request.json()
    console.log('Update weapon data received:', data)
    
    try {
      const baseWeapon = await prisma.baseWeapon.findUnique({
        where: { nom: data.nom_arme }
      })

      if (!baseWeapon) {
        return NextResponse.json(
          { error: 'Base weapon not found', nom_arme: data.nom_arme },
          { status: 404 }
        )
      }

      const weapon = await prisma.weapon.update({
        where: { id },
        data: {
          ...(data.horodateur && { horodateur: new Date(data.horodateur) }),
          ...(data.detenteur && { detenteur: data.detenteur }),
          ...(data.serigraphie && { serigraphie: data.serigraphie }),
          ...(data.prix && { prix: data.prix }),
          ...(data.user_id && { 
            user: {
              connect: { id: parseInt(data.user_id) }
            }
          }),
          base_weapon: {
            connect: { nom: data.nom_arme }
          }
        },
        include: {
          user: true,
          base_weapon: true
        }
      })

      return NextResponse.json(weapon)
    } catch (error) {
      console.error('Prisma update error:', error)
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }
      return NextResponse.json(
        { error: 'Failed to update weapon', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Update weapon error:', error)
    return NextResponse.json(
      { error: 'Failed to update weapon' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Deleting weapon with ID:', params.id)

    if (!params.id || params.id === 'null') {
      return NextResponse.json(
        { error: 'Missing weapon ID' },
        { status: 400 }
      )
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid weapon ID', id: params.id },
        { status: 400 }
      )
    }

    const weapon = await prisma.weapon.findUnique({
      where: { id }
    })
    
    if (!weapon) {
      return NextResponse.json(
        { error: 'Weapon not found', id },
        { status: 404 }
      )
    }

    await prisma.weapon.delete({
      where: { id }
    })
    
    console.log('Weapon deleted successfully:', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete weapon error:', error)
    return NextResponse.json(
      { error: 'Failed to delete weapon', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400'
    }
  })
} 