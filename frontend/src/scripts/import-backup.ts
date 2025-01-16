import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const employees = [
  { id: 10, name: 'James', color: '#84CC16', role: 'EMPLOYEE' },
  { id: 9, name: 'John Davis', color: '#06B6D4', role: 'EMPLOYEE' },
  { id: 7, name: 'Léonard Lavenue', color: '#8B5CF6', role: 'EMPLOYEE' },
  { id: 8, name: 'Rory Mclaury', color: '#6366F1', role: 'EMPLOYEE' },
  { id: 1, name: 'Peter Kimber', color: '#EF4444', role: 'EMPLOYEE' }
]

const baseWeapons = [
  { id: 2, nom: 'Revolver Cattleman', prix_defaut: 6000 },
  { id: 3, nom: 'Revolver Double Action', prix_defaut: 11000 },
  { id: 4, nom: 'Revolver Scofield', prix_defaut: 15000 },
  { id: 5, nom: 'Revolver Navy', prix_defaut: 18000 },
  { id: 6, nom: 'Pistolet Semi-Automatique', prix_defaut: 20000 },
  { id: 7, nom: 'Pistolet M1889', prix_defaut: 40000 },
  { id: 8, nom: 'Pistolet Mauser', prix_defaut: 30000 },
  { id: 9, nom: 'Pistolet Volcanic', prix_defaut: 15000 },
  { id: 10, nom: 'Carabine à Répétition', prix_defaut: 15000 },
  { id: 11, nom: 'Carabine Litchefield / Henry', prix_defaut: 25000 },
  { id: 12, nom: 'Carabine Winchester / Lancaster', prix_defaut: 30000 },
  { id: 13, nom: 'Carabine Evans', prix_defaut: 40000 },
  { id: 14, nom: 'Fusil Varmint', prix_defaut: 20000 },
  { id: 15, nom: 'Fusil Springfield', prix_defaut: 30000 },
  { id: 16, nom: 'Fusil Double Canon', prix_defaut: 30000 },
  { id: 17, nom: 'Fusil à Verrou', prix_defaut: 40000 },
  { id: 18, nom: 'Fusil à Pompe', prix_defaut: 50000 },
  { id: 19, nom: 'Fusil à Répétition', prix_defaut: 50000 },
  { id: 20, nom: 'Fusil Semi-Automatique', prix_defaut: 70000 },
  { id: 21, nom: 'Fusil Rolling Bloke', prix_defaut: 80000 }
]

// Fonction pour vérifier et ajuster les numéros de série en double
function adjustSerialNumbers(weapons: any[]) {
  const serialNumbers = new Set<string>()
  return weapons.map(weapon => {
    let newSerial = weapon.serigraphie
    let counter = 1
    while (serialNumbers.has(newSerial)) {
      newSerial = `${weapon.serigraphie}-${counter}`
      counter++
    }
    serialNumbers.add(newSerial)
    return {
      ...weapon,
      serigraphie: newSerial
    }
  })
}

const weapons = adjustSerialNumbers([
  { id: 28, horodateur: new Date('2025-01-07 21:54:00'), employe_id: 10, detenteur: 'Police', nom_arme: 'Pistolet Semi-Automatique', serigraphie: '101636', prix: 20000 },
  { id: 29, horodateur: new Date('2025-01-08 00:09:00'), employe_id: 10, detenteur: 'Cabinet de Rhode', nom_arme: 'Carabine à Répétition', serigraphie: '101644', prix: 15000 },
  { id: 2, horodateur: new Date('2025-01-03 07:41:00'), employe_id: 1, detenteur: 'Aristide Mao', nom_arme: 'Fusil Rolling Bloke', serigraphie: '101363', prix: 80000 },
  { id: 41, horodateur: new Date('2025-01-09 22:16:07.15'), employe_id: 1, detenteur: 'Wisley Larson', nom_arme: 'Revolver Navy', serigraphie: '101744', prix: 18000 },
  { id: 30, horodateur: new Date('2025-01-08 01:10:00'), employe_id: 10, detenteur: 'Edouard Calloway', nom_arme: 'Fusil à Pompe', serigraphie: '101564', prix: 50000 },
  { id: 39, horodateur: new Date('2025-01-08 19:22:00'), employe_id: 1, detenteur: 'Rico Vargas', nom_arme: 'Revolver Navy', serigraphie: '101686', prix: 18000 },
  { id: 31, horodateur: new Date('2025-01-08 02:21:00'), employe_id: 9, detenteur: 'Madame Papillon', nom_arme: 'Fusil Double Canon', serigraphie: '101658', prix: 30000 },
  { id: 8, horodateur: new Date('2025-01-03 19:08:00'), employe_id: 1, detenteur: 'Joe Rollington', nom_arme: 'Pistolet M1889', serigraphie: '101397', prix: 40000 },
  { id: 5, horodateur: new Date('2025-01-03 17:08:00'), employe_id: 1, detenteur: 'Tommy Morrow', nom_arme: 'Carabine Winchester / Lancaster', serigraphie: '101387', prix: 30000 },
  { id: 4, horodateur: new Date('2025-01-03 15:14:00'), employe_id: 1, detenteur: 'Evans Thomson', nom_arme: 'Fusil à Verrou', serigraphie: '101379', prix: 40000 },
  { id: 3, horodateur: new Date('2025-01-03 10:06:00'), employe_id: 7, detenteur: 'Léonard Lavenue', nom_arme: 'Revolver Navy', serigraphie: '101365', prix: 18000 },
  { id: 6, horodateur: new Date('2025-01-03 17:58:00'), employe_id: 8, detenteur: 'Wallace Dickens', nom_arme: 'Revolver Navy', serigraphie: '101391', prix: 18000 },
  { id: 7, horodateur: new Date('2025-01-03 19:04:00'), employe_id: 1, detenteur: 'Tundra Garrich', nom_arme: 'Fusil Rolling Bloke', serigraphie: '101389', prix: 80000 },
  { id: 9, horodateur: new Date('2025-01-04 15:53:00'), employe_id: 8, detenteur: 'Tundra Garrich', nom_arme: 'Fusil Rolling Bloke', serigraphie: '101389', prix: 80000 },
  { id: 10, horodateur: new Date('2025-01-04 19:00:00'), employe_id: 8, detenteur: 'Jarvis Wingston', nom_arme: 'Fusil à Pompe', serigraphie: '101396', prix: 50000 },
  { id: 11, horodateur: new Date('2025-01-04 22:20:00'), employe_id: 8, detenteur: 'Falko dray', nom_arme: 'Revolver Scofield', serigraphie: '101467', prix: 15000 },
  { id: 12, horodateur: new Date('2025-01-04 22:25:00'), employe_id: 9, detenteur: 'Falko Dray', nom_arme: 'Fusil à Pompe', serigraphie: '101468', prix: 50000 },
  { id: 13, horodateur: new Date('2025-01-05 01:33:00'), employe_id: 8, detenteur: 'police', nom_arme: 'Carabine Litchefield / Henry', serigraphie: '101476', prix: 25000 },
  { id: 14, horodateur: new Date('2025-01-05 01:34:00'), employe_id: 8, detenteur: 'Police', nom_arme: 'Carabine Litchefield / Henry', serigraphie: '101475', prix: 25000 },
  { id: 15, horodateur: new Date('2025-01-05 05:10:00'), employe_id: 8, detenteur: 'police', nom_arme: 'Revolver Scofield', serigraphie: '101472', prix: 15000 },
  { id: 16, horodateur: new Date('2025-01-05 05:11:00'), employe_id: 8, detenteur: 'police', nom_arme: 'Revolver Scofield', serigraphie: '101471', prix: 15000 },
  { id: 17, horodateur: new Date('2025-01-05 05:11:00'), employe_id: 8, detenteur: 'police', nom_arme: 'Carabine Litchefield / Henry', serigraphie: '101482', prix: 25000 },
  { id: 18, horodateur: new Date('2025-01-05 05:12:00'), employe_id: 8, detenteur: 'police', nom_arme: 'Pistolet Volcanic', serigraphie: '101473', prix: 15000 },
  { id: 19, horodateur: new Date('2025-01-05 05:12:00'), employe_id: 8, detenteur: 'Sherif Rhodes', nom_arme: 'Revolver Scofield', serigraphie: '101486', prix: 15000 },
  { id: 20, horodateur: new Date('2025-01-05 05:13:00'), employe_id: 8, detenteur: 'Sherif rhodes', nom_arme: 'Revolver Scofield', serigraphie: '101487', prix: 15000 },
  { id: 21, horodateur: new Date('2025-01-05 05:13:00'), employe_id: 8, detenteur: 'sherif de rhodes', nom_arme: 'Revolver Scofield', serigraphie: '101488', prix: 15000 },
  { id: 22, horodateur: new Date('2025-01-05 05:14:00'), employe_id: 8, detenteur: 'sherif de rhodes', nom_arme: 'Revolver Scofield', serigraphie: '101489', prix: 15000 },
  { id: 23, horodateur: new Date('2025-01-05 05:14:00'), employe_id: 8, detenteur: 'Sherif de rhodes', nom_arme: 'Revolver Scofield', serigraphie: '101481', prix: 15000 },
  { id: 24, horodateur: new Date('2025-01-05 17:20:00'), employe_id: 1, detenteur: 'Gérard Godefroid', nom_arme: 'Revolver Double Action', serigraphie: '101520', prix: 11000 },
  { id: 25, horodateur: new Date('2025-01-06 00:37:00'), employe_id: 8, detenteur: 'Harris Richard', nom_arme: 'Fusil à Verrou', serigraphie: '101533', prix: 40000 },
  { id: 26, horodateur: new Date('2025-01-07 16:22:00'), employe_id: 1, detenteur: 'Thomas Martinez', nom_arme: 'Revolver Cattleman', serigraphie: '101619', prix: 6000 },
  { id: 27, horodateur: new Date('2025-01-07 21:54:00'), employe_id: 10, detenteur: 'Police', nom_arme: 'Pistolet Semi-Automatique', serigraphie: '101637', prix: 20000 },
  { id: 32, horodateur: new Date('2025-01-08 17:14:00'), employe_id: 8, detenteur: 'Alexander Mcoy', nom_arme: 'Carabine Litchefield / Henry', serigraphie: '101674', prix: 25000 },
  { id: 33, horodateur: new Date('2025-01-08 17:27:00'), employe_id: 8, detenteur: 'Tundra Garrich', nom_arme: 'Pistolet Volcanic', serigraphie: '101165', prix: 15000 },
  { id: 34, horodateur: new Date('2025-01-08 17:28:00'), employe_id: 8, detenteur: 'McCoy Scarlett', nom_arme: 'Carabine Winchester / Lancaster', serigraphie: '101282', prix: 30000 },
  { id: 35, horodateur: new Date('2025-01-08 17:29:00'), employe_id: 8, detenteur: 'Blackthorn jededia', nom_arme: 'Carabine Winchester / Lancaster', serigraphie: '101283', prix: 30000 },
  { id: 36, horodateur: new Date('2025-01-08 17:29:00'), employe_id: 8, detenteur: 'ELizabeth Dommart', nom_arme: 'Fusil à Verrou', serigraphie: '101304', prix: 40000 },
  { id: 37, horodateur: new Date('2025-01-08 17:30:00'), employe_id: 8, detenteur: 'ELizabeth Dommart', nom_arme: 'Revolver Double Action', serigraphie: '101293', prix: 11000 },
  { id: 38, horodateur: new Date('2025-01-08 18:44:00'), employe_id: 8, detenteur: 'Red Curtis', nom_arme: 'Fusil à Pompe', serigraphie: '101682', prix: 50000 },
  { id: 44, horodateur: new Date('2025-01-09 20:27:00'), employe_id: 1, detenteur: 'Wisley Larson', nom_arme: 'Fusil à Pompe', serigraphie: '101752', prix: 50000 },
  { id: 63, horodateur: new Date('2025-01-10 22:30:03.192'), employe_id: 1, detenteur: 'Charlie Luvania', nom_arme: 'Revolver Cattleman', serigraphie: '100509', prix: 6000 },
  { id: 55, horodateur: new Date('2025-01-10 17:00:00'), employe_id: 1, detenteur: 'Shériff Rhodes', nom_arme: 'Carabine Winchester / Lancaster', serigraphie: '101831', prix: 30000 },
  { id: 56, horodateur: new Date('2025-01-10 19:00:00'), employe_id: 1, detenteur: 'Shériff Rhodes', nom_arme: 'Carabine Winchester / Lancaster', serigraphie: '101821', prix: 30000 },
  { id: 53, horodateur: new Date('2025-01-10 17:00:00'), employe_id: 1, detenteur: 'Shériff Rhodes', nom_arme: 'Carabine Winchester / Lancaster', serigraphie: '101828', prix: 30000 },
  { id: 54, horodateur: new Date('2025-01-10 19:00:00'), employe_id: 1, detenteur: 'Shériff Rhodes', nom_arme: 'Carabine Litchefield / Henry', serigraphie: '101834', prix: 25000 },
  { id: 57, horodateur: new Date('2025-01-10 19:00:00'), employe_id: 1, detenteur: 'Shériff Rhodes', nom_arme: 'Carabine Litchefield / Henry', serigraphie: '101835', prix: 25000 },
  { id: 52, horodateur: new Date('2025-01-10 19:00:00'), employe_id: 1, detenteur: 'Shériff Rhodes', nom_arme: 'Carabine Litchefield / Henry', serigraphie: '101833', prix: 25000 },
  { id: 58, horodateur: new Date('2025-01-10 21:50:41.324'), employe_id: 1, detenteur: 'Joe Rollington', nom_arme: 'Fusil à Verrou', serigraphie: '101841', prix: 40000 },
  { id: 60, horodateur: new Date('2025-01-10 19:50:00'), employe_id: 1, detenteur: 'Joe Rollington', nom_arme: 'Fusil à Verrou', serigraphie: '101842', prix: 40000 },
  { id: 59, horodateur: new Date('2025-01-10 19:50:00'), employe_id: 1, detenteur: 'Joe Rollington', nom_arme: 'Fusil à Verrou', serigraphie: '101840', prix: 40000 },
  { id: 61, horodateur: new Date('2025-01-10 19:50:00'), employe_id: 1, detenteur: 'Joe Rollington', nom_arme: 'Fusil à Verrou', serigraphie: '101839', prix: 40000 },
  { id: 62, horodateur: new Date('2025-01-10 22:28:32.429'), employe_id: 1, detenteur: 'Paco Gambini', nom_arme: 'Revolver Cattleman', serigraphie: '101459', prix: 6000 }
])

async function main() {
  console.log('Début de l\'importation des données...')

  try {
    // Nettoyer la base de données
    await prisma.weapon.deleteMany()
    await prisma.employee.deleteMany()
    await prisma.baseWeapon.deleteMany()

    console.log('Import des employés...')
    for (const employee of employees) {
      await prisma.employee.create({
        data: employee
      })
    }

    console.log('Import des armes de base...')
    for (const baseWeapon of baseWeapons) {
      await prisma.baseWeapon.create({
        data: baseWeapon
      })
    }

    console.log('Import des armes...')
    for (const weapon of weapons) {
      await prisma.weapon.create({
        data: weapon
      })
    }

    console.log('Importation terminée avec succès !')
  } catch (error) {
    console.error('Erreur lors de l\'importation :', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  }) 