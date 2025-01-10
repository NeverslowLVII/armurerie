import csv
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from models import Role

def import_csv():
    db = SessionLocal()
    try:
        # Lecture du fichier CSV
        with open('../Registre - Armurerie Saint-Denis - Registre Armes.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            # Dictionnaire pour suivre les employés déjà créés
            employees = {}
            
            for row in reader:
                # Normaliser le nom de l'employé
                employee_name = row['Nom de l\'employé'].strip()
                
                # Créer ou récupérer l'employé
                if employee_name not in employees:
                    # Pour l'exemple, on considère que les employés avec "patron" dans leur nom sont des patrons
                    is_patron = "patron" in employee_name.lower()
                    db_employee = models.Employee(
                        name=employee_name,
                        role=Role.PATRON if is_patron else Role.EMPLOYEE
                    )
                    db.add(db_employee)
                    db.commit()
                    db.refresh(db_employee)
                    employees[employee_name] = db_employee
                
                # Créer l'arme
                horodateur = datetime.strptime(row['Horodateur'], '%d/%m/%Y %H:%M:%S')
                prix = int(float(row.get('Prix', '0')) * 100)  # Convertir le prix en centimes
                db_weapon = models.Weapon(
                    horodateur=horodateur,
                    employe_id=employees[employee_name].id,
                    detenteur=row['Nom du Détenteur'],
                    nom_arme=row['Nom de l\'arme'],
                    serigraphie=row['Sérigraphie'],
                    prix=prix
                )
                db.add(db_weapon)
            
            db.commit()
            print("Import terminé avec succès")
            
    except Exception as e:
        print(f"Erreur lors de l'import: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Créer les tables
    models.Base.metadata.create_all(bind=engine)
    # Importer les données
    import_csv() 