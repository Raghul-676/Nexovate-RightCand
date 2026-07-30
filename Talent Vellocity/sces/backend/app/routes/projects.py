from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from app.database import get_db
from app.models.models import User, ProjectRepo, RepoAnalysis, DomainScore
from app.schemas.schemas import ProjectRepoIn, ProjectRepoOut
from app.services.auth_service import get_current_user
from app.services.project_service import analyse_repo

router = APIRouter(prefix="/api/projects", tags=["projects"])

COMPLEXITY_FACTOR = 0.7
PROJECT_COUNT_FACTOR = 5.0


def recompute_student_domain_scores(student_id: int, db: Session):
    # 1. Fetch all repositories and their analyses for this student
    repos = db.query(ProjectRepo).filter(ProjectRepo.user_id == student_id).all()
    repo_ids = [r.id for r in repos]
    
    analyses = db.query(RepoAnalysis).filter(RepoAnalysis.repo_id.in_(repo_ids)).all() if repo_ids else []
    analysis_by_repo = {a.repo_id: a for a in analyses}
    
    # 2. Group complexity scores by domain
    domain_repos = {}
    for r in repos:
        a = analysis_by_repo.get(r.id)
        if not a or not a.categories:
            continue
        try:
            cats = json.loads(a.categories)
            if not isinstance(cats, list):
                cats = [cats]
        except:
            cats = []
        for cat in cats:
            if not cat:
                continue
            if cat not in domain_repos:
                domain_repos[cat] = []
            domain_repos[cat].append(a.complexity_score)
            
    # 3. Calculate and save domain scores
    current_domains = set()
    for domain, scores in domain_repos.items():
        if not scores:
            continue
        avg_complexity = sum(scores) / len(scores)
        project_count = len(scores)
        raw_score = min(100, round(avg_complexity * COMPLEXITY_FACTOR + project_count * PROJECT_COUNT_FACTOR))
        
        ds = db.query(DomainScore).filter(
            DomainScore.student_id == student_id,
            DomainScore.domain == domain
        ).first()
        if not ds:
            ds = DomainScore(student_id=student_id, domain=domain)
            db.add(ds)
        ds.domain_score = raw_score
        ds.project_count = project_count
        current_domains.add(domain)
        
    # 4. Remove stale domain scores for domains this student no longer has repos in
    if current_domains:
        db.query(DomainScore).filter(
            DomainScore.student_id == student_id,
            ~DomainScore.domain.in_(current_domains)
        ).delete(synchronize_session=False)
    else:
        db.query(DomainScore).filter(DomainScore.student_id == student_id).delete(synchronize_session=False)
    
    db.commit()


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

        # Delete previous analysis & repo_analysis for same URL for this user
        old_repos = db.query(ProjectRepo).filter(
            ProjectRepo.user_id == current_user.id,
            ProjectRepo.repo_url == url
        ).all()
        for orp in old_repos:
            db.query(RepoAnalysis).filter(RepoAnalysis.repo_id == orp.id).delete()
        
        db.query(ProjectRepo).filter(
            ProjectRepo.user_id == current_user.id,
            ProjectRepo.repo_url == url
        ).delete()
        db.commit()

        categories = []
        complexity_score = 0

        try:
            data = analyse_repo(url)
            categories = data.get("categories", [])
            complexity_score = data.get("complexity_score", 0)
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

        # Save analysis details into RepoAnalysis
        analysis = RepoAnalysis(
            repo_id=repo.id,
            categories=json.dumps(categories),
            complexity_score=complexity_score
        )
        db.add(analysis)
        db.commit()

        # Recompute domain scores for this student
        recompute_student_domain_scores(current_user.id, db)

        results.append(repo)

    return results
