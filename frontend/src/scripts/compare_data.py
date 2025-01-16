import json
import re
from datetime import datetime
import os

def load_json_files():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
    
    with open(os.path.join(root_dir, 'Weapon.json'), 'r', encoding='utf-8') as f:
        weapons = json.load(f)
    with open(os.path.join(root_dir, 'Employee.json'), 'r', encoding='utf-8') as f:
        employees = json.load(f)
    with open(os.path.join(root_dir, 'BaseWeapon.json'), 'r', encoding='utf-8') as f:
        base_weapons = json.load(f)
    return weapons, employees, base_weapons

def parse_sql_file():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.dirname(os.path.dirname(script_dir))
    
    with open(os.path.join(frontend_dir, 'backup.sql'), 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Parser les données
    weapons_sql = []
    employees_sql = []
    base_weapons_sql = []
    
    # Extraire les sections COPY
    weapon_section = re.search(r"COPY public\.weapons.*?FROM stdin;\n(.*?)\\.", sql_content, re.DOTALL)
    employee_section = re.search(r"COPY public\.employees.*?FROM stdin;\n(.*?)\\.", sql_content, re.DOTALL)
    base_weapon_section = re.search(r"COPY public\.base_weapons.*?FROM stdin;\n(.*?)\\.", sql_content, re.DOTALL)
    
    if weapon_section:
        for line in weapon_section.group(1).strip().split('\n'):
            id, horodateur, employe_id, detenteur, nom_arme, serigraphie, prix = line.split('\t')
            # Nettoyer le timestamp
            horodateur = horodateur.split('.')[0]  # Enlever les microsecondes
            weapons_sql.append({
                'id': int(id),
                'horodateur': horodateur,
                'employe_id': int(employe_id),
                'detenteur': detenteur,
                'nom_arme': nom_arme,
                'serigraphie': serigraphie,
                'prix': int(prix)
            })
    
    if employee_section:
        for line in employee_section.group(1).strip().split('\n'):
            id, name, color, role = line.split('\t')
            employees_sql.append({
                'id': int(id),
                'name': name,
                'color': color,
                'role': role
            })
    
    if base_weapon_section:
        for line in base_weapon_section.group(1).strip().split('\n'):
            id, nom, prix = line.split('\t')
            base_weapons_sql.append({
                'id': int(id),
                'nom': nom,
                'prix_defaut': int(prix)
            })
    
    return weapons_sql, employees_sql, base_weapons_sql

def compare_data():
    print("Chargement des données...")
    weapons_json, employees_json, base_weapons_json = load_json_files()
    weapons_sql, employees_sql, base_weapons_sql = parse_sql_file()
    
    print("\nComparaison des armes:")
    print(f"Nombre d'armes dans JSON: {len(weapons_json)}")
    print(f"Nombre d'armes dans SQL: {len(weapons_sql)}")
    
    # Comparer les armes
    weapons_diff = []
    weapons_in_sql = set()
    
    # Vérifier les armes du JSON manquantes dans SQL
    for w_json in weapons_json:
        w_sql = next((w for w in weapons_sql if w['id'] == w_json['id']), None)
        if not w_sql:
            weapons_diff.append(f"Arme manquante dans SQL: ID {w_json['id']}")
            continue
            
        weapons_in_sql.add(w_sql['id'])
        for key in w_json:
            if key == 'horodateur':
                # Convertir les formats de date pour comparaison
                date_json = datetime.strptime(w_json[key], '%Y-%m-%d %H:%M:%S')
                date_sql = datetime.strptime(w_sql[key], '%Y-%m-%d %H:%M:%S')
                if date_json != date_sql:
                    weapons_diff.append(f"Différence pour l'arme {w_json['id']}, {key}: JSON={w_json[key]}, SQL={w_sql[key]}")
            elif w_json[key] != w_sql[key]:
                weapons_diff.append(f"Différence pour l'arme {w_json['id']}, {key}: JSON={w_json[key]}, SQL={w_sql[key]}")
    
    # Vérifier les armes supplémentaires dans SQL
    for w_sql in weapons_sql:
        if w_sql['id'] not in weapons_in_sql:
            weapons_diff.append(f"Arme supplémentaire dans SQL: ID {w_sql['id']}")
    
    print("\nDifférences trouvées dans les armes:")
    if not weapons_diff:
        print("Aucune différence trouvée !")
    else:
        for diff in weapons_diff:
            print(diff)
    
    # Comparer les employés
    print("\nComparaison des employés:")
    print(f"Nombre d'employés dans JSON: {len(employees_json)}")
    print(f"Nombre d'employés dans SQL: {len(employees_sql)}")
    
    employees_diff = []
    for e_json in employees_json:
        e_sql = next((e for e in employees_sql if e['id'] == e_json['id']), None)
        if not e_sql:
            employees_diff.append(f"Employé manquant dans SQL: ID {e_json['id']}")
            continue
            
        for key in e_json:
            if e_json[key] != e_sql[key]:
                employees_diff.append(f"Différence pour l'employé {e_json['id']}, {key}: JSON={e_json[key]}, SQL={e_sql[key]}")
    
    print("\nDifférences trouvées dans les employés:")
    if not employees_diff:
        print("Aucune différence trouvée !")
    else:
        for diff in employees_diff:
            print(diff)
    
    # Comparer les armes de base
    print("\nComparaison des armes de base:")
    print(f"Nombre d'armes de base dans JSON: {len(base_weapons_json)}")
    print(f"Nombre d'armes de base dans SQL: {len(base_weapons_sql)}")
    
    base_weapons_diff = []
    for b_json in base_weapons_json:
        b_sql = next((b for b in base_weapons_sql if b['id'] == b_json['id']), None)
        if not b_sql:
            base_weapons_diff.append(f"Arme de base manquante dans SQL: ID {b_json['id']}")
            continue
            
        for key in b_json:
            if b_json[key] != b_sql[key]:
                base_weapons_diff.append(f"Différence pour l'arme de base {b_json['id']}, {key}: JSON={b_json[key]}, SQL={b_sql[key]}")
    
    print("\nDifférences trouvées dans les armes de base:")
    if not base_weapons_diff:
        print("Aucune différence trouvée !")
    else:
        for diff in base_weapons_diff:
            print(diff)

if __name__ == "__main__":
    compare_data() 