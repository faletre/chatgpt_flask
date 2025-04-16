from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Conversacion(Base):
    __tablename__ = 'conversacion'
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, nullable=False)
    contexto = Column(Boolean, nullable=False, default=True)
    modelo = Column(String, nullable=False, default='gpt-3.5-turbo')
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    mensajes = relationship('Mensaje', back_populates='conversacion', cascade="all, delete-orphan")

class Mensaje(Base):
    __tablename__ = 'mensaje'
    id = Column(Integer, primary_key=True, autoincrement=True)
    conversacion_id = Column(Integer, ForeignKey('conversacion.id'))
    mensaje = Column(Text, nullable=False)
    es_usuario = Column(Boolean, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    conversacion = relationship('Conversacion', back_populates='mensajes')
