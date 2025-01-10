from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from models import Role

class BaseWeaponBase(BaseModel):
    nom: str
    prix_defaut: int

class BaseWeaponCreate(BaseWeaponBase):
    pass

class BaseWeapon(BaseWeaponBase):
    id: int
    
    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    name: str
    color: Optional[str] = None
    role: Role = Role.EMPLOYEE

class EmployeeCreate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    id: int
    
    class Config:
        from_attributes = True

class WeaponBase(BaseModel):
    horodateur: datetime
    employe_id: int
    detenteur: str
    nom_arme: str
    serigraphie: str
    prix: int  # Prix en centimes

class WeaponCreate(WeaponBase):
    pass

class Weapon(WeaponBase):
    id: int
    employee: Employee

    class Config:
        from_attributes = True 