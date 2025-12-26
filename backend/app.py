from flask import Flask, request
from flask_cors import CORS
from services.firestore import add_visit, get_total_visits, get_monthly_visits
import os

app = Flask(__name__)
CORS(app)

@app.route("/visit", methods=["POST"])
def visit():
    add_visit()
    print("Visit stored in Firestore")
    return {"status": "ok"}, 200

@app.route("/stats/total", methods=["GET"])
def total_visits():
    return {"total": get_total_visits()}, 200

@app.route("/stats/monthly", methods=["GET"])
def monthly_visits():
    return {"monthly": get_monthly_visits()}, 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
