from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import itertools

app = Flask(__name__)
CORS(app)

# --- in-memory "database" -------------------------------------------------
subjects = []
sessions = []

subject_id_counter = itertools.count(1)
session_id_counter = itertools.count(1)

WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def find_subject(subject_id):
    return next((s for s in subjects if s["id"] == subject_id), None)


# --- /subjects --------------------------------------------------------------
@app.route("/subjects", methods=["GET"])
def get_subjects():
    return jsonify(subjects)


@app.route("/subjects", methods=["POST"])
def create_subject():
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    new_subject = {"id": next(subject_id_counter), "name": name}
    subjects.append(new_subject)
    return jsonify(new_subject), 201


@app.route("/subjects/<int:subject_id>", methods=["DELETE"])
def delete_subject(subject_id):
    global subjects
    if not find_subject(subject_id):
        return jsonify({"error": "subject not found"}), 404
    subjects = [s for s in subjects if s["id"] != subject_id]
    return jsonify({"success": True})


# --- /sessions ---------------------------------------------------------------
@app.route("/sessions", methods=["GET"])
def get_sessions():
    subject_id = request.args.get("subject_id", type=int)
    range_param = request.args.get("range", default="all")

    result = sessions

    if subject_id is not None:
        result = [s for s in result if s["subject_id"] == subject_id]

    if range_param in ("week", "month"):
        now = datetime.utcnow()
        days = 7 if range_param == "week" else 30
        cutoff = now - timedelta(days=days)
        result = [
            s for s in result
            if datetime.fromisoformat(s["created_at"]) >= cutoff
        ]

    # most recent first
    result = sorted(result, key=lambda s: s["created_at"], reverse=True)
    return jsonify(result)


@app.route("/sessions", methods=["POST"])
def create_session():
    data = request.get_json(force=True) or {}
    subject_id = data.get("subject_id")
    duration = data.get("duration")

    subject = find_subject(subject_id)
    if not subject:
        return jsonify({"error": "subject_id is invalid"}), 400
    if not isinstance(duration, (int, float)) or duration <= 0:
        return jsonify({"error": "duration must be a positive number"}), 400

    new_session = {
        "id": next(session_id_counter),
        "subject_id": subject_id,
        "subject_name": subject["name"],
        "duration": duration,
        "created_at": datetime.utcnow().isoformat(timespec="seconds"),
    }
    sessions.append(new_session)
    return jsonify(new_session), 201


@app.route("/sessions/<int:session_id>", methods=["DELETE"])
def delete_session(session_id):
    global sessions
    if not any(s["id"] == session_id for s in sessions):
        return jsonify({"error": "session not found"}), 404
    sessions = [s for s in sessions if s["id"] != session_id]
    return jsonify({"success": True})


# --- /stats -------------------------------------------------------------------
@app.route("/stats", methods=["GET"])
def get_stats():
    total_minutes = sum(s["duration"] for s in sessions)
    total_hours = round(total_minutes / 60, 1)

    now = datetime.utcnow()
    week_cutoff = now - timedelta(days=7)
    sessions_this_week = sum(
        1 for s in sessions if datetime.fromisoformat(s["created_at"]) >= week_cutoff
    )

    by_subject_map = {}
    for s in sessions:
        by_subject_map[s["subject_name"]] = by_subject_map.get(s["subject_name"], 0) + s["duration"]
    by_subject = [{"name": name, "minutes": minutes} for name, minutes in by_subject_map.items()]

    by_weekday_map = {day: 0 for day in WEEKDAY_NAMES}
    for s in sessions:
        dt = datetime.fromisoformat(s["created_at"])
        day_name = WEEKDAY_NAMES[dt.weekday()]
        by_weekday_map[day_name] += s["duration"]

    # streak: consecutive days (including today) with at least one session
    session_dates = {datetime.fromisoformat(s["created_at"]).date() for s in sessions}
    streak = 0
    cursor = now.date()
    while cursor in session_dates:
        streak += 1
        cursor -= timedelta(days=1)

    return jsonify({
        "streak": streak,
        "total_hours": total_hours,
        "sessions_this_week": sessions_this_week,
        "by_subject": by_subject,
        "by_weekday": by_weekday_map,
    })


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "focus-tracker-api"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
