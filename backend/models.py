from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum

class Role(enum.Enum):
    EMPLOYEE = "employee"
    PATRON = "patron"

class BaseWeapon(Base):
    __tablename__ = "base_weapons"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, index=True)
    prix_defaut = Column(Integer)  # Prix en centimes

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    color = Column(String)
    role = Column(Enum(Role), default=Role.EMPLOYEE)
    weapons = relationship("Weapon", back_populates="employee")

class Weapon(Base):
    __tablename__ = "weapons"

    id = Column(Integer, primary_key=True, index=True)
    horodateur = Column(DateTime)
    employe_id = Column(Integer, ForeignKey("employees.id"))
    detenteur = Column(String)
    nom_arme = Column(String)
    serigraphie = Column(String)
    prix = Column(Integer)
    
    employee = relationship("Employee", back_populates="weapons") 