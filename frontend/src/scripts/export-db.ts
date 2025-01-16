import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

const execAsync = promisify(exec)

async function exportDatabase() {
  const {
    PGHOST = '',
    PGUSER = '',
    PGDATABASE = '',
    PGPASSWORD = ''
  } = process.env

  const outputFile = path.join(process.cwd(), 'backup.sql')
  
  const command = `pg_dump "postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require" --file="${outputFile}" --no-owner --no-acl`

  try {
    console.log('Début de l\'export de la base de données...')
    await execAsync(command)
    console.log(`Export terminé avec succès ! Fichier sauvegardé dans : ${outputFile}`)
  } catch (error) {
    console.error('Erreur lors de l\'export :', error)
    throw error
  }
}

exportDatabase().catch(console.error) 