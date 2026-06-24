import requests
from fastapi import HTTPException


def fetch_leetcode(username: str) -> dict:
    query = """
    query($username: String!) {
      matchedUser(username: $username) {
        username
        profile { ranking }
        submitStats {
          acSubmissionNum { difficulty count }
        }
        tagProblemCounts {
          advanced { tagName problemsSolved }
          intermediate { tagName problemsSolved }
          fundamental { tagName problemsSolved }
        }
      }
      userContestRanking(username: $username) {
        rating attendedContestsCount globalRanking
      }
      recentAcSubmissionList(username: $username, limit: 20) {
        timestamp
      }
    }
    """
    try:
        r = requests.post(
            "https://leetcode.com/graphql",
            json={"query": query, "variables": {"username": username}},
            headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json().get("data", {})
        user = data.get("matchedUser")
        if not user:
            raise HTTPException(404, "LeetCode user not found")

        ac = {s["difficulty"]: s["count"] for s in user["submitStats"]["acSubmissionNum"]}
        contest = data.get("userContestRanking") or {}

        # Topic breakdown — merge all tag groups, pick top 8
        tag_counts = {}
        for group in ("fundamental", "intermediate", "advanced"):
            for t in (user.get("tagProblemCounts") or {}).get(group, []):
                tag_counts[t["tagName"]] = tag_counts.get(t["tagName"], 0) + t["problemsSolved"]
        top_topics = dict(sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:8])

        # Consistency — unique active days in last 20 submissions
        recent = data.get("recentAcSubmissionList") or []
        active_days = len({int(s["timestamp"]) // 86400 for s in recent})

        return {
            "username": user["username"],
            "ranking": user["profile"].get("ranking", 0),
            "total_solved": ac.get("All", 0),
            "easy_solved": ac.get("Easy", 0),
            "medium_solved": ac.get("Medium", 0),
            "hard_solved": ac.get("Hard", 0),
            "contest_rating": round(contest.get("rating", 0)),
            "contests_attended": contest.get("attendedContestsCount", 0),
            "global_ranking": contest.get("globalRanking", 0),
            "topic_breakdown": top_topics,
            "active_days_last20": active_days,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"LeetCode fetch error: {e}")


def fetch_codeforces(handle: str) -> dict:
    try:
        r = requests.get(f"https://codeforces.com/api/user.info?handles={handle}", timeout=10)
        r.raise_for_status()
        data = r.json()
        if data.get("status") != "OK":
            raise HTTPException(404, "Codeforces user not found")
        u = data["result"][0]

        # Fetch solved problems for rating distribution + total solved + topic breakdown
        rating_dist = {}
        total_solved = 0
        topic_counts = {}
        try:
            sub_r = requests.get(
                f"https://codeforces.com/api/user.status?handle={handle}&from=1&count=1000",
                timeout=10
            )
            if sub_r.status_code == 200:
                subs = sub_r.json().get("result", [])
                seen = set()
                for s in subs:
                    if s.get("verdict") == "OK":
                        prob = s.get("problem", {})
                        pid = f"{prob.get('contestId')}{prob.get('index')}"
                        if pid not in seen:
                            seen.add(pid)
                            total_solved += 1
                            # Rating distribution
                            rating = prob.get("rating")
                            if rating:
                                bucket = str((rating // 200) * 200)
                                rating_dist[bucket] = rating_dist.get(bucket, 0) + 1
                            # Topic breakdown from tags
                            for tag in prob.get("tags", []):
                                topic_counts[tag] = topic_counts.get(tag, 0) + 1
        except Exception:
            pass

        top_topics = dict(sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:8])

        # Consistency — unique active days from last 100 submissions
        active_days = 0
        try:
            sub_r2 = requests.get(
                f"https://codeforces.com/api/user.status?handle={handle}&from=1&count=100",
                timeout=10
            )
            if sub_r2.status_code == 200:
                subs2 = sub_r2.json().get("result", [])
                active_days = len({s["creationTimeSeconds"] // 86400 for s in subs2})
        except Exception:
            pass

        return {
            "handle": u.get("handle"),
            "rating": u.get("rating", 0),
            "max_rating": u.get("maxRating", 0),
            "rank": u.get("rank", "unrated"),
            "max_rank": u.get("maxRank", "unrated"),
            "avatar": u.get("titlePhoto"),
            "total_solved": total_solved,
            "topic_breakdown": top_topics,
            "rating_distribution": dict(sorted(rating_dist.items(), key=lambda x: int(x[0]))),
            "active_days_last100": active_days,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Codeforces fetch error: {e}")


def fetch_github(username: str) -> dict:
    try:
        r = requests.get(
            f"https://api.github.com/users/{username}",
            headers={"Accept": "application/vnd.github.v3+json"},
            timeout=10,
        )
        if r.status_code == 404:
            raise HTTPException(404, "GitHub user not found")
        r.raise_for_status()
        d = r.json()

        # Commit consistency — events from last 30 days
        active_days = 0
        try:
            ev_r = requests.get(
                f"https://api.github.com/users/{username}/events?per_page=100",
                headers={"Accept": "application/vnd.github.v3+json"},
                timeout=10,
            )
            if ev_r.status_code == 200:
                from datetime import datetime, timezone, timedelta
                cutoff = datetime.now(timezone.utc) - timedelta(days=30)
                push_days = set()
                for ev in ev_r.json():
                    if ev.get("type") == "PushEvent":
                        created = datetime.fromisoformat(ev["created_at"].replace("Z", "+00:00"))
                        if created >= cutoff:
                            push_days.add(created.date())
                active_days = len(push_days)
        except Exception:
            pass

        return {
            "username": d.get("login"),
            "name": d.get("name"),
            "avatar": d.get("avatar_url"),
            "public_repos": d.get("public_repos", 0),
            "followers": d.get("followers", 0),
            "following": d.get("following", 0),
            "profile_url": d.get("html_url"),
            "active_days_last30": active_days,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"GitHub fetch error: {e}")


def compute_talent_score(lc: dict, cf: dict, gh: dict) -> int:
    score = 0
    if lc:
        score += min(lc.get("total_solved", 0) // 5, 30)
        score += min(lc.get("hard_solved", 0) * 2, 20)
        score += min(lc.get("contest_rating", 0) // 100, 20)
    if cf:
        score += min(cf.get("rating", 0) // 100, 20)
    if gh:
        score += min(gh.get("public_repos", 0) * 2, 10)
    return min(score, 100)
