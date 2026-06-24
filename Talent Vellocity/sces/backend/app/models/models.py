from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="student")
    profile_setup_done = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    coding_profile = relationship("CodingProfile", back_populates="user", uselist=False, cascade="all, delete")


class CodingProfile(Base):
    __tablename__ = "coding_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    leetcode_username = Column(String, nullable=True)
    codeforces_handle = Column(String, nullable=True)
    github_username = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="coding_profile")


class ProjectRepo(Base):
    __tablename__ = "project_repos"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    repo_url = Column(String, nullable=False)
    project_name = Column(String, nullable=True)
    complexity = Column(String, nullable=True)
    stack_breakdown = Column(String, nullable=True)  # JSON string
    summary = Column(String, nullable=True)
    analysed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
