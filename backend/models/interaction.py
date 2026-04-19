from sqlalchemy import Column, Integer, String, Text, Date, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    doctor_name = Column(String(255), nullable=False)
    specialty = Column(String(255), nullable=True)
    interaction_date = Column(Date, nullable=False)
    interaction_type = Column(String(100), default="In-Person")
    notes = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    topics_discussed = Column(Text, nullable=True)
    sentiment = Column(String(50), nullable=True)
    follow_up_date = Column(Date, nullable=True)
    follow_up_action = Column(Text, nullable=True)
    product_discussed = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
