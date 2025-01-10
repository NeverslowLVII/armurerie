from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import models, schemas
from fastapi import HTTPException
from typing import List

# Employee CRUD operations
def get_employee(db: Session, employee_id: int):
    return db.query(models.Employee).filter(models.Employee.id == employee_id).first()

def get_employee_by_name(db: Session, name: str):
    return db.query(models.Employee).filter(models.Employee.name == name).first()

def get_employees(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Employee).offset(skip).limit(limit).all()

def create_employee(db: Session, employee: schemas.EmployeeCreate):
    db_employee = models.Employee(**employee.model_dump())
    try:
        db.add(db_employee)
        db.commit()
        db.refresh(db_employee)
        return db_employee
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Employee already exists")

def update_employee(db: Session, employee_id: int, employee: schemas.EmployeeCreate):
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    for key, value in employee.model_dump().items():
        setattr(db_employee, key, value)
    
    try:
        db.commit()
        db.refresh(db_employee)
        return db_employee
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Employee name already exists")

def delete_employee(db: Session, employee_id: int):
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Vérifier si l'employé a des armes associées
    weapons_count = db.query(models.Weapon).filter(models.Weapon.employe_id == employee_id).count()
    if weapons_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Impossible de supprimer l'employé car il a {weapons_count} armes associées. Veuillez d'abord réassigner ou supprimer ces armes."
        )
    
    db.delete(db_employee)
    db.commit()
    return db_employee

def merge_employees(db: Session, employee_ids: List[int], target_id: int):
    # Vérifier que l'employé cible existe
    target_employee = get_employee(db, target_id)
    if not target_employee:
        raise HTTPException(status_code=404, detail="Target employee not found")
    
    # Vérifier que tous les employés à fusionner existent
    employees_to_merge = []
    for employee_id in employee_ids:
        if employee_id == target_id:
            continue
        employee = get_employee(db, employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")
        employees_to_merge.append(employee)
    
    try:
        # Mettre à jour toutes les armes pour utiliser l'employé cible
        for employee in employees_to_merge:
            db.query(models.Weapon).filter(
                models.Weapon.employe_id == employee.id
            ).update({
                models.Weapon.employe_id: target_id
            })
            # Supprimer l'employé fusionné
            db.delete(employee)
        
        db.commit()
        db.refresh(target_employee)
        return target_employee
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Weapon CRUD operations
def get_weapon(db: Session, weapon_id: int):
    return db.query(models.Weapon).filter(models.Weapon.id == weapon_id).first()

def get_weapons(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Weapon).offset(skip).limit(limit).all()

def create_weapon(db: Session, weapon: schemas.WeaponCreate):
    db_weapon = models.Weapon(**weapon.model_dump())
    db.add(db_weapon)
    db.commit()
    db.refresh(db_weapon)
    return db_weapon

def update_weapon(db: Session, weapon_id: int, weapon: schemas.WeaponCreate):
    db_weapon = get_weapon(db, weapon_id)
    if not db_weapon:
        raise HTTPException(status_code=404, detail="Weapon not found")
    
    for key, value in weapon.model_dump().items():
        setattr(db_weapon, key, value)
    
    db.commit()
    db.refresh(db_weapon)
    return db_weapon

def delete_weapon(db: Session, weapon_id: int):
    weapon = db.query(models.Weapon).filter(models.Weapon.id == weapon_id).first()
    if weapon is None:
        raise HTTPException(status_code=404, detail=f"Weapon with id {weapon_id} not found")
    
    try:
        db.delete(weapon)
        db.commit()
        return weapon
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

def get_employee_weapons(db: Session, employee_id: int):
    return db.query(models.Weapon).filter(models.Weapon.employe_id == employee_id).all()

def reassign_weapons(db: Session, from_employee_id: int, to_employee_id: int):
    # Vérifier que les deux employés existent
    from_employee = get_employee(db, from_employee_id)
    to_employee = get_employee(db, to_employee_id)
    
    if not from_employee:
        raise HTTPException(status_code=404, detail="Source employee not found")
    if not to_employee:
        raise HTTPException(status_code=404, detail="Target employee not found")
    
    try:
        # Mettre à jour toutes les armes
        weapons_count = db.query(models.Weapon).filter(
            models.Weapon.employe_id == from_employee_id
        ).update({
            models.Weapon.employe_id: to_employee_id
        })
        
        db.commit()
        return weapons_count
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Base Weapons
def get_base_weapons(db: Session):
    return db.query(models.BaseWeapon).all()

def get_base_weapon(db: Session, base_weapon_id: int):
    base_weapon = db.query(models.BaseWeapon).filter(models.BaseWeapon.id == base_weapon_id).first()
    if base_weapon is None:
        raise HTTPException(status_code=404, detail="Base weapon not found")
    return base_weapon

def get_base_weapon_by_name(db: Session, nom: str):
    return db.query(models.BaseWeapon).filter(models.BaseWeapon.nom == nom).first()

def create_base_weapon(db: Session, base_weapon: schemas.BaseWeaponCreate):
    db_base_weapon = models.BaseWeapon(**base_weapon.model_dump())
    db.add(db_base_weapon)
    db.commit()
    db.refresh(db_base_weapon)
    return db_base_weapon

def update_base_weapon(db: Session, base_weapon_id: int, base_weapon: schemas.BaseWeaponCreate):
    db_base_weapon = get_base_weapon(db, base_weapon_id)
    for key, value in base_weapon.model_dump().items():
        setattr(db_base_weapon, key, value)
    db.commit()
    db.refresh(db_base_weapon)
    return db_base_weapon

def delete_base_weapon(db: Session, base_weapon_id: int):
    db_base_weapon = get_base_weapon(db, base_weapon_id)
    db.delete(db_base_weapon)
    db.commit()
    return db_base_weapon 