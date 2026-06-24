from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import User, CodingProfile, ProjectRepo
from app.schemas.schemas import StudentListItem
from app.services.auth_service import require_admin
from app.services.coding_service import fetch_leetcode, fetch_codeforces, fetch_github, compute_talent_score
import json

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/students", response_model=List[StudentListItem])
def list_students(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(User).filter(User.role == "student").all()
    result = []
    for u in users:
        p = u.coding_profile
        result.append(StudentListItem(
            id=u.id,
            username=u.username,
            email=u.email,
            profile_setup_done=bool(u.profile_setup_done),
            leetcode_username=p.leetcode_username if p else None,
            codeforces_handle=p.codeforces_handle if p else None,
            github_username=p.github_username if p else None,
        ))
    return result


@router.get("/students/{user_id}/stats")
def get_student_stats(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id, User.role == "student").first()
    if not user:
        raise HTTPException(404, "Student not found")

    profile = db.query(CodingProfile).filter(CodingProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(404, "This student has not set up a coding profile yet")

    result, errors = {}, []

    if profile.leetcode_username:
        try:
            result["leetcode"] = fetch_leetcode(profile.leetcode_username)
        except HTTPException as e:
            errors.append({"platform": "leetcode", "error": e.detail})

    if profile.codeforces_handle:
        try:
            result["codeforces"] = fetch_codeforces(profile.codeforces_handle)
        except HTTPException as e:
            errors.append({"platform": "codeforces", "error": e.detail})

    if profile.github_username:
        try:
            result["github"] = fetch_github(profile.github_username)
        except HTTPException as e:
            errors.append({"platform": "github", "error": e.detail})

    return {
        "student": {"id": user.id, "username": user.username, "email": user.email},
        "handles": {
            "leetcode": profile.leetcode_username,
            "codeforces": profile.codeforces_handle,
            "github": profile.github_username,
        },
        "stats": result,
        "errors": errors,
    }


@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(User).filter(User.role == "student").all()
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
            "id": u.id,
            "username": u.username,
            "talent_score": score,
            "lc_solved": lc.get("total_solved", 0),
            "lc_rating": lc.get("contest_rating", 0),
            "cf_rating": cf.get("rating", 0),
            "cf_rank": cf.get("rank", "—"),
            "gh_repos": gh.get("public_repos", 0),
        })
    board.sort(key=lambda x: x["talent_score"], reverse=True)
    total = len(board)
    for i, s in enumerate(board):
        s["rank"] = i + 1
        s["percentile"] = round((1 - i / total) * 100) if total > 1 else 100
    return board


@router.get("/batch-analytics")
def batch_analytics(db: Session = Depends(get_db), _=Depends(require_admin)):
    students = db.query(User).filter(User.role == "student").all()
    total = len(students)
    setup = sum(1 for s in students if s.profile_setup_done)

    # Stack distribution from project repos
    stack_totals = {}
    repos = db.query(ProjectRepo).all()
    for repo in repos:
        try:
            breakdown = json.loads(repo.stack_breakdown or "{}")
            for cat, pct in breakdown.items():
                stack_totals[cat] = stack_totals.get(cat, 0) + pct
        except Exception:
            pass

    # Complexity distribution
    complexity_dist = {"Beginner": 0, "Intermediate": 0, "Advanced": 0}
    for repo in repos:
        if repo.complexity in complexity_dist:
            complexity_dist[repo.complexity] += 1

    # At-risk: profile set up but no repos analysed
    analysed_users = {r.user_id for r in repos}
    at_risk = [
        {"id": s.id, "username": s.username}
        for s in students
        if s.profile_setup_done and s.id not in analysed_users
    ]

    return {
        "total_students": total,
        "profiles_setup": setup,
        "pending_setup": total - setup,
        "stack_distribution": dict(sorted(stack_totals.items(), key=lambda x: x[1], reverse=True)),
        "complexity_distribution": complexity_dist,
        "at_risk_students": at_risk,
        "total_repos_analysed": len(repos),
    }


@router.get("/students", response_model=List[StudentListItem])
def list_students(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(User).filter(User.role == "student").all()
    result = []
    for u in users:
        p = u.coding_profile
        result.append(StudentListItem(
            id=u.id,
            username=u.username,
            email=u.email,
            profile_setup_done=bool(u.profile_setup_done),
            leetcode_username=p.leetcode_username if p else None,
            codeforces_handle=p.codeforces_handle if p else None,
            github_username=p.github_username if p else None,
        ))
    return result


@router.get("/students/{user_id}/stats")
def get_student_stats(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id, User.role == "student").first()
    if not user:
        raise HTTPException(404, "Student not found")

    profile = db.query(CodingProfile).filter(CodingProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(404, "This student has not set up a coding profile yet")

    result, errors = {}, []

    if profile.leetcode_username:
        try:
            result["leetcode"] = fetch_leetcode(profile.leetcode_username)
        except HTTPException as e:
            errors.append({"platform": "leetcode", "error": e.detail})

    if profile.codeforces_handle:
        try:
            result["codeforces"] = fetch_codeforces(profile.codeforces_handle)
        except HTTPException as e:
            errors.append({"platform": "codeforces", "error": e.detail})

    if profile.github_username:
        try:
            result["github"] = fetch_github(profile.github_username)
        except HTTPException as e:
            errors.append({"platform": "github", "error": e.detail})

    return {
        "student": {"id": user.id, "username": user.username, "email": user.email},
        "handles": {
            "leetcode": profile.leetcode_username,
            "codeforces": profile.codeforces_handle,
            "github": profile.github_username,
        },
        "stats": result,
        "errors": errors,
    }
