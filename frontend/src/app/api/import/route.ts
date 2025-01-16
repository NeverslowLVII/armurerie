import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface WeaponImport {
  employe_id: string | number;
  detenteur?: string;
  nom_arme: string;
  serigraphie: string;
  prix?: number;
  horodateur?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    console.log('Importing weapons from file:', file?.name)

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read and parse file
    const fileContent = await file.text()
    let weapons: WeaponImport[] = []

    if (file.name.endsWith('.json')) {
      const data = JSON.parse(fileContent)
      weapons = Array.isArray(data) ? data : data.weapons || []
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format - only JSON is supported' },
        { status: 400 }
      )
    }

    console.log('Importing weapons:', weapons.length)

    // Import weapons
    const results = await Promise.all(
      weapons.map(async (item: WeaponImport) => {
        try {
          // Parse employee ID
          const employeeId = parseInt(String(item.employe_id))
          if (isNaN(employeeId)) {
            return {
              success: false,
              error: 'Invalid employee ID',
              data: item
            }
          }

          // Find base weapon by name if provided
          let baseWeapon = undefined
          if (item.nom_arme) {
            baseWeapon = await prisma.baseWeapon.findUnique({
              where: { nom: item.nom_arme }
            })
          }

          // Create weapon
          const weapon = await prisma.weapon.create({
            data: {
              horodateur: item.horodateur ? new Date(item.horodateur) : new Date(),
              employe_id: employeeId,
              detenteur: item.detenteur || '',
              nom_arme: item.nom_arme,
              serigraphie: item.serigraphie,
              prix: item.prix || (baseWeapon?.prix_defaut || 0)
            },
            include: {
              employee: true,
              base_weapon: true
            }
          })

          return {
            success: true,
            weapon
          }
        } catch (error) {
          console.error('Error importing weapon:', error)
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            data: item
          }
        }
      })
    )

    // Count successes and failures
    const successes = results.filter(r => r.success).length
    const failures = results.filter(r => !r.success).length

    console.log('Import completed:', { successes, failures })
    return NextResponse.json({
      success: true,
      results: {
        total: results.length,
        successes,
        failures,
        details: results
      }
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to import weapons',
        details: error instanceof Error ? error.message : String(error)
      },
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