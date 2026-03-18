"""
data_loader.py
Connects to the clinic's MySQL database and loads data for model training.
Reads DB credentials from the Laravel .env file.
"""
import os
import pymysql
import pandas as pd
from dotenv import dotenv_values

_env = dotenv_values(os.path.join(os.path.dirname(__file__), '..', 'dec-backend', '.env'))

def get_connection():
    """Connection for raw cursor queries (DictCursor)."""
    return pymysql.connect(
        host     = _env.get('DB_HOST', '127.0.0.1'),
        port     = int(_env.get('DB_PORT', 3306)),
        user     = _env.get('DB_USERNAME', 'root'),
        password = _env.get('DB_PASSWORD', ''),
        database = _env.get('DB_DATABASE', 'docec'),
        cursorclass=pymysql.cursors.DictCursor,
    )

def _get_pandas_connection():
    """Connection for pd.read_sql — must NOT use DictCursor (causes header duplication bug)."""
    return pymysql.connect(
        host     = _env.get('DB_HOST', '127.0.0.1'),
        port     = int(_env.get('DB_PORT', 3306)),
        user     = _env.get('DB_USERNAME', 'root'),
        password = _env.get('DB_PASSWORD', ''),
        database = _env.get('DB_DATABASE', 'docec'),
    )

def load_daily_appointments(days=180):
    """Returns daily appointment counts for the past N days."""
    sql = """
        SELECT DATE(appointment_date) as appt_date, COUNT(*) as cnt
        FROM appointments
        WHERE appointment_date >= DATE_SUB(NOW(), INTERVAL %s DAY)
        GROUP BY DATE(appointment_date)
        ORDER BY appt_date ASC
    """
    conn = _get_pandas_connection()
    try:
        df = pd.read_sql(sql, conn, params=(days,))
        if df.empty:
            return pd.DataFrame(columns=['date', 'count', 'day_of_week', 'month'])

        df = df.rename(columns={'appt_date': 'date', 'cnt': 'count'})
        df['date'] = pd.to_datetime(df['date'], errors='coerce', format='%Y-%m-%d')
        df = df.dropna(subset=['date'])

        if df.empty:
            return pd.DataFrame(columns=['date', 'count', 'day_of_week', 'month'])

        df = df.set_index('date').asfreq('D', fill_value=0).reset_index()
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month']       = df['date'].dt.month
        df['week']        = df['date'].dt.isocalendar().week.astype(int)
        return df
    finally:
        conn.close()

def load_service_stats():
    """Returns service utilization stats for demand classification."""
    sql = """
        SELECT s.service_id, s.name, s.price,
               COUNT(a.appointment_id) as times_availed,
               COALESCE(DATEDIFF(NOW(), MAX(a.appointment_date)), 365) as days_since_last
        FROM services s
        LEFT JOIN appointments a
            ON a.service_id = s.service_id
            AND a.status = 'completed'
        GROUP BY s.service_id, s.name, s.price
    """
    conn = _get_pandas_connection()
    try:
        df = pd.read_sql(sql, conn)
        df['times_availed']   = pd.to_numeric(df['times_availed'],   errors='coerce').fillna(0)
        df['days_since_last'] = pd.to_numeric(df['days_since_last'], errors='coerce').fillna(365)
        df['price']           = pd.to_numeric(df['price'],           errors='coerce').fillna(0)
        return df
    finally:
        conn.close()

def load_product_sales():
    """Returns product sales data for inventory depletion forecasting."""
    sql = """
        SELECT p.product_id, p.name, p.category, p.stock, p.price,
               COALESCE(SUM(si.quantity), 0) AS total_sold,
               COALESCE(
                   SUM(si.quantity) /
                   GREATEST(DATEDIFF(NOW(), MIN(st.created_at)), 1),
                   0
               ) AS avg_daily_sales
        FROM products p
        LEFT JOIN sales_items si ON si.product_id = p.product_id
        LEFT JOIN sales_transactions st ON st.st_id = si.st_id
        GROUP BY p.product_id, p.name, p.category, p.stock, p.price
    """
    conn = _get_pandas_connection()
    try:
        df = pd.read_sql(sql, conn)
        for col in ['stock', 'price', 'total_sold', 'avg_daily_sales']:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        return df
    finally:
        conn.close()

def load_patient_data():
    """Returns patient visit data for return probability prediction.
    Uses only appointment data (no sales join) for maximum compatibility.
    Features: total visits + recency — sufficient for binary return classification.
    """
    sql = """
        SELECT
            c.client_id,
            COUNT(DISTINCT a.appointment_id)                        AS total_visits,
            COALESCE(DATEDIFF(NOW(), MAX(a.appointment_date)), 365) AS days_since_last,
            COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.appointment_id END) AS completed_visits
        FROM client_accounts c
        LEFT JOIN appointments a ON a.client_id = c.client_id
        GROUP BY c.client_id
        HAVING COUNT(DISTINCT a.appointment_id) > 0
    """
    conn = _get_pandas_connection()
    try:
        df = pd.read_sql(sql, conn)
        for col in ['total_visits', 'days_since_last', 'completed_visits']:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        # Use completed_visits as proxy for "total_spent" feature
        df['total_spent'] = df['completed_visits'] * 500.0  # rough peso estimate
        return df
    finally:
        conn.close()
