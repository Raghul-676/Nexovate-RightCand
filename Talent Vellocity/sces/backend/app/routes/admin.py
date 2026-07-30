from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import json

from app.database import get_db
from app.models.models import User, CodingProfile, ProjectRepo, CodingStats, RepoAnalysis, DomainScore, LeaderboardWeights
from app.schemas.schemas import StudentListItem
from app.services.auth_service import require_admin
from app.services.coding_service import fetch_leetcode, fetch_codeforces, fetch_github, sync_student_coding_stats

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Expose constants for tuning calculations
SUBWEIGHT_LC_SOLVED = 0.3
SUBWEIGHT_LC_HARD = 0.3
SUBWEIGHT_LC_RATING = 0.2
SUBWEIGHT_CF_RATING = 0.2


class WeightsUpdate(BaseModel):
    coding_weight: float
    domain_weight: float
    recency_halflife_days: int


def get_or_create_weights(db: Session) -> LeaderboardWeights:
    weights = db.query(LeaderboardWeights).first()
    if not weights:
        weights = LeaderboardWeights(id=1, coding_weight=0.6, domain_weight=0.4, recency_halflife_days=90)
        db.add(weights)
        db.commit()
        db.refresh(weights)
    return weights


def get_percentile(value: float, sorted_values: list) -> float:
    if not sorted_values:
        return 0.0
    try:
        idx = sorted_values.index(value)
        rank = idx + 1
        total = len(sorted_values)
        if total == 1:
            return 100.0
        return (1.0 - (rank / total)) * 100.0
    except ValueError:
        return 0.0


def compute_leaderboard_data(db: Session):
    weights = get_or_create_weights(db)
    students = db.query(User).filter(User.role == "student").all()
    
    coding_stats_list = db.query(CodingStats).all()
    coding_stats_by_id = {s.student_id: s for s in coding_stats_list}
    
    domain_scores_list = db.query(DomainScore).all()
    scores_by_domain = {}
    scores_by_student = {}
    
    for ds in domain_scores_list:
        if ds.domain not in scores_by_domain:
            scores_by_domain[ds.domain] = {}
        scores_by_domain[ds.domain][ds.student_id] = ds.domain_score
        
        if ds.student_id not in scores_by_student:
            scores_by_student[ds.student_id] = {}
        scores_by_student[ds.student_id][ds.domain] = ds.domain_score

    lc_solved_list = []
    lc_hard_list = []
    lc_rating_list = []
    cf_rating_list = []
    
    student_stats_map = {}
    
    for s in students:
        stats = coding_stats_by_id.get(s.id)
        if not stats:
            stats_dict = {
                "leetcode_solved": 0,
                "leetcode_hard_solved": 0,
                "leetcode_rating": 0,
                "leetcode_contests": 0,
                "codeforces_rating": 0,
                "codeforces_contests": 0,
                "last_active_at": s.created_at or datetime.utcnow()
            }
        else:
            stats_dict = {
                "leetcode_solved": stats.leetcode_solved or 0,
                "leetcode_hard_solved": stats.leetcode_hard_solved or 0,
                "leetcode_rating": stats.leetcode_rating or 0,
                "leetcode_contests": stats.leetcode_contests or 0,
                "codeforces_rating": stats.codeforces_rating or 0,
                "codeforces_contests": stats.codeforces_contests or 0,
                "last_active_at": stats.last_active_at or s.created_at or datetime.utcnow()
            }
            
        trust_lc = min(stats_dict["leetcode_contests"] / 15.0, 1.0)
        adj_lc_rating = stats_dict["leetcode_rating"] * trust_lc
        
        trust_cf = min(stats_dict["codeforces_contests"] / 15.0, 1.0)
        adj_cf_rating = stats_dict["codeforces_rating"] * trust_cf
        
        stats_dict["adj_lc_rating"] = adj_lc_rating
        stats_dict["adj_cf_rating"] = adj_cf_rating
        
        student_stats_map[s.id] = stats_dict
        
        lc_solved_list.append(stats_dict["leetcode_solved"])
        lc_hard_list.append(stats_dict["leetcode_hard_solved"])
        lc_rating_list.append(adj_lc_rating)
        cf_rating_list.append(adj_cf_rating)

    lc_solved_list.sort(reverse=True)
    lc_hard_list.sort(reverse=True)
    lc_rating_list.sort(reverse=True)
    cf_rating_list.sort(reverse=True)

    domain_cohorts = {}
    for domain, student_scores in scores_by_domain.items():
        domain_cohorts[domain] = sorted(list(student_scores.values()), reverse=True)

    leaderboard_records = {}
    
    for s in students:
        stats_dict = student_stats_map[s.id]
        
        lc_solved_pct = get_percentile(stats_dict["leetcode_solved"], lc_solved_list)
        lc_hard_solved_pct = get_percentile(stats_dict["leetcode_hard_solved"], lc_hard_list)
        lc_rating_pct = get_percentile(stats_dict["adj_lc_rating"], lc_rating_list)
        cf_rating_pct = get_percentile(stats_dict["adj_cf_rating"], cf_rating_list)
        
        days_since_active = max(0, (datetime.utcnow() - stats_dict["last_active_at"]).days)
        recency_multiplier = 0.5 ** (days_since_active / weights.recency_halflife_days)
        
        coding_score = (
            lc_solved_pct * SUBWEIGHT_LC_SOLVED +
            lc_hard_solved_pct * SUBWEIGHT_LC_HARD +
            lc_rating_pct * SUBWEIGHT_LC_RATING +
            cf_rating_pct * SUBWEIGHT_CF_RATING
        ) * recency_multiplier
        
        student_domain_pcts = {}
        student_domains_raw = scores_by_student.get(s.id, {})
        for domain, raw_score in student_domains_raw.items():
            cohort_scores = domain_cohorts.get(domain, [])
            student_domain_pcts[domain] = get_percentile(raw_score, cohort_scores)
            
        best_domain_pct = max(student_domain_pcts.values(), default=0.0)
        best_domain = max(student_domain_pcts, key=student_domain_pcts.get, default=None)
        
        overall_score = coding_score * weights.coding_weight + best_domain_pct * weights.domain_weight
        
        leaderboard_records[s.id] = {
            "student_id": s.id,
            "username": s.username,
            "coding_score": round(coding_score, 1),
            "overall_score": round(overall_score, 1),
            "best_domain_pct": round(best_domain_pct, 1),
            "best_domain": best_domain,
            "raw_domain_scores": student_domains_raw,
            "domain_percentiles": {dom: round(pct, 1) for dom, pct in student_domain_pcts.items()},
            "component_percentiles": {
                "leetcode_solved_pct": round(lc_solved_pct, 1),
                "leetcode_hard_solved_pct": round(lc_hard_solved_pct, 1),
                "leetcode_rating_pct": round(lc_rating_pct, 1),
                "codeforces_rating_pct": round(cf_rating_pct, 1),
            },
            "recency_multiplier": round(recency_multiplier, 3),
        }
        
    return leaderboard_records, scores_by_domain, weights


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

    # Sync statistics to the database
    sync_student_coding_stats(user_id, db)

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


@router.get("/leaderboard")
def get_leaderboard(filter: str = "overall", domain: Optional[str] = None, db: Session = Depends(get_db), _=Depends(require_admin)):
    records, scores_by_domain, _ = compute_leaderboard_data(db)
    
    result = []
    
    if filter == "coding":
        for rid, rec in records.items():
            result.append({
                "student_id": rec["student_id"],
                "name": rec["username"],
                "score": rec["coding_score"],
                "percentile": rec["coding_score"], # Return coding score directly
                "badge_domain": None
            })
    elif filter == "domain":
        if not domain:
            raise HTTPException(400, "Domain parameter is required when filtering by domain")
        
        # Only include students who have at least one repo in this domain
        target_student_ids = list(scores_by_domain.get(domain, {}).keys())
        for rid in target_student_ids:
            rec = records[rid]
            pct = rec["domain_percentiles"].get(domain, 0.0)
            raw = rec["raw_domain_scores"].get(domain, 0)
            result.append({
                "student_id": rec["student_id"],
                "name": rec["username"],
                "score": raw,
                "percentile": pct,
                "badge_domain": None
            })
    else: # overall
        for rid, rec in records.items():
            result.append({
                "student_id": rec["student_id"],
                "name": rec["username"],
                "score": rec["overall_score"],
                "percentile": rec["overall_score"],
                "badge_domain": f"Strongest domain: {rec['best_domain']}" if rec["best_domain"] else None
            })

    # Sort descending
    result.sort(key=lambda x: x["score"], reverse=True)
    total = len(result)
    for idx, r in enumerate(result):
        r["rank"] = idx + 1
        # Recalculate rank-relative percentile for final list representation
        r["percentile"] = round((1.0 - (r["rank"] / total)) * 100.0, 1) if total > 1 else 100.0

    return result


@router.get("/leaderboard/{student_id}/breakdown")
def get_student_breakdown(student_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    records, _, weights = compute_leaderboard_data(db)
    
    if student_id not in records:
        raise HTTPException(404, "Student not found")
        
    rec = records[student_id]
    return {
        "coding_score": rec["coding_score"],
        "domain_scores": rec["domain_percentiles"],
        "overall_score": rec["overall_score"],
        "component_percentiles": rec["component_percentiles"],
        "recency_multiplier": rec["recency_multiplier"],
        "weights_used": {
            "coding_weight": weights.coding_weight,
            "domain_weight": weights.domain_weight
        }
    }


@router.get("/leaderboard/weights")
def get_leaderboard_weights(db: Session = Depends(get_db), _=Depends(require_admin)):
    w = get_or_create_weights(db)
    return {
        "coding_weight": w.coding_weight,
        "domain_weight": w.domain_weight,
        "recency_halflife_days": w.recency_halflife_days
    }


@router.put("/leaderboard/weights")
def update_leaderboard_weights(body: WeightsUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    w = get_or_create_weights(db)
    
    # Normalize weights so they sum to 1.0
    total = body.coding_weight + body.domain_weight
    if total <= 0:
        raise HTTPException(400, "Sum of weights must be positive")
        
    w.coding_weight = body.coding_weight / total
    w.domain_weight = body.domain_weight / total
    w.recency_halflife_days = max(1, body.recency_halflife_days)
    
    db.commit()
    db.refresh(w)
    
    return {
        "coding_weight": w.coding_weight,
        "domain_weight": w.domain_weight,
        "recency_halflife_days": w.recency_halflife_days
    }
