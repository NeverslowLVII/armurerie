import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to find by ID first
    const numericId = parseInt(params.id)
    if (!isNaN(numericId)) {
      const baseWeapon = await prisma.baseWeapon.findUnique({
        where: { id: numericId }
      })
      if (baseWeapon) {
        return NextResponse.json(baseWeapon)
      }
    }

    // If not found by ID, try to find by name
    const baseWeapon = await prisma.baseWeapon.findUnique({
      where: { nom: params.id }
    })
    
    if (!baseWeapon) {
      return NextResponse.json(
        { error: 'Base weapon not found', id: params.id },
        { status: 404 }
      )
    }

    return NextResponse.json(baseWeapon)
  } catch (error) {
    console.error('Get base weapon error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch base weapon' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to find by ID first
    const numericId = parseInt(params.id)
    if (!isNaN(numericId)) {
      const baseWeapon = await prisma.baseWeapon.findUnique({
        where: { id: numericId }
      })
      if (baseWeapon) {
        const data = await request.json()
        const updated = await prisma.baseWeapon.update({
          where: { id: numericId },
          data: {
            nom: data.nom,
            prix_defaut: data.prix_defaut,
            cout_production_defaut: data.cout_production_defaut
          }
        })
        return NextResponse.json(updated)
      }
    }

    // If not found by ID, try to find by name
    const baseWeapon = await prisma.baseWeapon.findUnique({
      where: { nom: params.id }
    })
    
    if (!baseWeapon) {
      return NextResponse.json(
        { error: 'Base weapon not found', id: params.id },
        { status: 404 }
      )
    }

    const data = await request.json()
    const updated = await prisma.baseWeapon.update({
      where: { id: baseWeapon.id },
      data: {
        nom: data.nom,
        prix_defaut: data.prix_defaut,
        cout_production_defaut: data.cout_production_defaut
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update base weapon error:', error)
    return NextResponse.json(
      { error: 'Failed to update base weapon' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Deleting base weapon with ID/name:', params.id)

    // Try to find by ID first
    const numericId = parseInt(params.id)
    if (!isNaN(numericId)) {
      const baseWeapon = await prisma.baseWeapon.findUnique({
        where: { id: numericId }
      })
      if (baseWeapon) {
        await prisma.baseWeapon.delete({
          where: { id: numericId }
        })
        console.log('Base weapon deleted by ID:', numericId)
        return NextResponse.json({ success: true })
      }
    }

    // If not found by ID, try to find by name
    const baseWeapon = await prisma.baseWeapon.findUnique({
      where: { nom: params.id }
    })
    
    if (!baseWeapon) {
      return NextResponse.json(
        { error: 'Base weapon not found', id: params.id },
        { status: 404 }
      )
    }

    await prisma.baseWeapon.delete({
      where: { id: baseWeapon.id }
    })
    
    console.log('Base weapon deleted by name:', params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete base weapon error:', error)
    return NextResponse.json(
      { error: 'Failed to delete base weapon', details: error instanceof Error ? error.message : String(error) },
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