from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()

class HashType(enum.Enum):
    md5 = "md5"
    sha1 = "sha1"
    sha256 = "sha256"

class User(Base):
    __tablename__ = 'User'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    image = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

class FileAnalysis(Base):
    __tablename__ = 'FileAnalysis'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hash_type = Column(Enum(HashType), nullable=False)
    hash_value = Column(String, nullable=False, unique=True)
    file_type = Column(String, nullable=False)
    analysis_result = Column(JSON, nullable=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

class SearchHistory(Base):
    __tablename__ = 'SearchHistory'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('User.id'), nullable=False)
    file_analysis_id = Column(Integer, ForeignKey('FileAnalysis.id'), nullable=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="search_histories")
    file_analysis = relationship("FileAnalysis")

User.search_histories = relationship("SearchHistory", order_by=SearchHistory.id, back_populates="user")