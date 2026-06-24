from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import User, ProjectRepo
from app.schemas.schemas import ProjectRepoIn, ProjectRepoOut
from app.services.auth_service import get_current_user
from app.services.project_service import analyse_repo

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("/my-repos", response_model=List[ProjectRepoOut])
def get_my_repos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(ProjectRepo).filter(ProjectRepo.user_id == current_user.id).all()


@router.post("/analyse", response_model=List[ProjectRepoOut])
def analyse_repos(
    body: ProjectRepoIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = []
    for url in body.repo_urls:
        url = url.strip()
        if not url:
            continue

        # Delete previous analysis for same URL for this user
        db.query(ProjectRepo).filter(
            ProjectRepo.user_id == current_user.id,
            ProjectRepo.repo_url == url
        ).delete()
        db.commit()

        try:
            data = analyse_repo(url)
        except Exception as e:
            data = {
                "project_name": url.split("/")[-1] or "Unknown",
                "complexity": "Unknown",
                "stack_breakdown": "{}",
                "summary": f"Analysis failed: {str(e)}",
            }

        repo = ProjectRepo(
            user_id=current_user.id,
            repo_url=url,
            project_name=data["project_name"],
            complexity=data["complexity"],
            stack_breakdown=data["stack_breakdown"],
            summary=data["summary"],
        )
        db.add(repo)
        db.commit()
        db.refresh(repo)
        results.append(repo)

    return results
