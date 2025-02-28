import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidRole } from '@/utils/roles'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Role } from '@prisma/client'

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
    
    console.log('PUT /api/employees/[id] - Request data:', {
      id,
      data,
      params
    })
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      console.log('No session found, user is not authenticated');
      return NextResponse.json(
        { error: 'Vous devez être connecté pour effectuer cette action' },
        { status: 401 }
      );
    }
    
    // Vérifier si l'utilisateur a les droits nécessaires (PATRON, CO_PATRON ou DEVELOPER)
    if (session.user.role !== Role.PATRON && 
        session.user.role !== Role.CO_PATRON && 
        session.user.role !== Role.DEVELOPER) {
      console.log('User does not have permission to update users:', session.user.role);
      return NextResponse.json(
        { error: 'Vous n\'avez pas les droits nécessaires pour effectuer cette action' },
        { status: 403 }
      );
    }
    
    // Validate role
    if (data.role && !isValidRole(data.role)) {
      console.log('Invalid role:', data.role)
      return NextResponse.json(
        { error: 'Invalid role. Must be EMPLOYEE, CO_PATRON, or PATRON' },
        { status: 400 }
      )
    }

    // Check if trying to demote last PATRON
    if (data.role && data.role !== 'PATRON') {
      const currentUser = await prisma.user.findUnique({ where: { id } })
      console.log('Current user:', currentUser)
      
      if (currentUser?.role === 'PATRON') {
        // Vérifier si l'utilisateur qui fait la modification est un DEVELOPER
        const session = await getServerSession(authOptions)
        console.log('User session:', session)
        
        // Autoriser explicitement le changement de PATRON à DEVELOPER
        if (data.role === 'DEVELOPER') {
          console.log('Allowing change from PATRON to DEVELOPER')
          // Continuer l'exécution sans bloquer
        } else if (session?.user.role !== Role.DEVELOPER) {
          const patronCount = await prisma.user.count({ where: { role: 'PATRON' } })
          console.log('Patron count:', patronCount)
          
          if (patronCount <= 1) {
            console.log('Cannot demote the last PATRON')
            return NextResponse.json(
              { error: 'Cannot demote the last PATRON' },
              { status: 400 }
            )
          }
        }
      }
    }
    
    // Vérifier si le nom d'utilisateur existe déjà (sauf pour l'utilisateur actuel)
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: {
            id: parseInt(params.id)
          }
        }
      })

      console.log('Username check:', {
        requested: data.username,
        existing: existingUser
      })

      if (existingUser) {
        console.log('Username already exists:', data.username)
        return NextResponse.json(
          { error: 'Ce nom d\'utilisateur est déjà utilisé' },
          { status: 400 }
        )
      }
    }

    // Vérifier si l'email existe déjà (sauf pour l'utilisateur actuel)
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: {
            id: parseInt(params.id)
          }
        }
      })

      console.log('Email check:', {
        requested: data.email,
        existing: existingUser
      })

      if (existingUser) {
        console.log('Email already exists:', data.email)
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        )
      }
    }
    
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!existingUser) {
      console.log('User not found:', id)
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }
    
    const updateData: {
      name?: string;
      username?: string;
      email?: string;
      color?: string | null;
      role?: Role;
    } = {
      name: data.name,
      username: data.username,
      email: data.email,
      color: data.color,
      role: data.role
    }

    // Supprimer les champs undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    console.log('Final update data:', updateData)
    
    try {
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        include: { weapons: true }
      })
      
      console.log('Updated user:', user)
      return NextResponse.json(user)
    } catch (prismaError) {
      console.error('Prisma update error:', prismaError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de l\'utilisateur dans la base de données', details: String(prismaError) },
        { status: 500 }
      )
    }
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
      where: { id: userId }
    })

    if (!user) {
      console.error('User not found:', userId)
      return NextResponse.json(
        { error: 'User not found', user_id: userId },
        { status: 404 }
      )
    }

    // Soft delete the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        deleted: true,
        deletedAt: new Date()
      }
    })

    console.log('User soft deleted successfully:', userId)
    return NextResponse.json({ 
      success: true,
      message: `User ${userId} soft deleted successfully`
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