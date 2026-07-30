from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json
from app.database import get_db
from app.models.models import ProjectRepo, User, CodingProfile
from app.services.auth_service import require_admin
from app.services.coding_service import compute_talent_score, fetch_leetcode, fetch_codeforces, fetch_github

router = APIRouter(prefix="/api/admin/domains", tags=["admin-domains"])

@router.get("/list")
def list_domains(db: Session = Depends(get_db), _=Depends(require_admin)):
    repos = db.query(ProjectRepo).all()
    domain_users = {}
    for repo in repos:
        try:
            breakdown = json.loads(repo.stack_breakdown or "{}")
            for domain, pct in breakdown.items():
                if pct > 0:
                    if domain not in domain_users:
                        domain_users[domain] = set()
                    domain_users[domain].add(repo.user_id)
        except Exception:
            pass
    
    result = []
    for domain, users in domain_users.items():
        result.append({
            "domain": domain,
            "student_count": len(users)
        })
    result.sort(key=lambda x: x["student_count"], reverse=True)
    return result

@router.get("/{domain_name}/ranking")
def get_domain_ranking(domain_name: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    repos = db.query(ProjectRepo).all()
    user_ids_in_domain = set()
    for repo in repos:
        try:
            breakdown = json.loads(repo.stack_breakdown or "{}")
            if breakdown.get(domain_name, 0) > 0:
                user_ids_in_domain.add(repo.user_id)
        except Exception:
            pass
            
    users = db.query(User).filter(User.id.in_(user_ids_in_domain)).all()
    board = []
    for u in users:
        p = u.coding_profile
        if not p:
            continue
        lc, cf, gh = {}, {}, {}
        if p.leetcode_username:
            try: lc = fetch_leetcode(p.leetcode_username)
            except: pass
        if p.codeforces_handle:
            try: cf = fetch_codeforces(p.codeforces_handle)
            except: pass
        if p.github_username:
            try: gh = fetch_github(p.github_username)
            except: pass
        score = compute_talent_score(lc, cf, gh)
        board.append({
            "student_id": u.id,
            "username": u.username,
            "talent_score": score,
            "profile_setup_done": bool(u.profile_setup_done)
        })
        
    board.sort(key=lambda x: x["talent_score"], reverse=True)
    return board
