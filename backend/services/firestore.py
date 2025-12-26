from google.cloud import firestore
from datetime import datetime, timedelta

db = firestore.Client()

def add_visit():
    print("Attempting to write to Firestore...")
    db.collection("visits").add({
        "timestamp": datetime.utcnow()
    })
    print("Firestore write completed")
    
def get_total_visits():
    visits = db.collection("visits").stream()
    return sum(1 for _ in visits)

def get_monthly_visits():
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    query = db.collection("visits") \
        .where("timestamp", ">=", thirty_days_ago)

    return sum(1 for _ in query.stream())
