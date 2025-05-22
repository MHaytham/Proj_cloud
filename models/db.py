import psycopg2

# Update these with your PostgreSQL settings
DB_CONFIG = {
    'dbname': 'task_db',
    'user': 'postgres',
    'password': 'Mh24116528',  # 🟡 Replace this!
    'host': 'localhost',
    'port': '5432',
}

def get_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print("❌ Database connection error:", e)
        return None
