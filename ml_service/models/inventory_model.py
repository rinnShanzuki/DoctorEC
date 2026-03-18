"""
inventory_model.py
Dense neural network for inventory depletion forecasting.
Predicts how many days before a product runs out of stock.
"""
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import StandardScaler
import joblib, os

MODEL_PATH  = os.path.join(os.path.dirname(__file__), '..', 'saved_models', 'inventory_model.keras')
SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', 'saved_models', 'inventory_scaler.pkl')

def build_model():
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(4,)),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dropout(0.1),
        tf.keras.layers.Dense(16, activation='relu'),
        tf.keras.layers.Dense(1, activation='relu'),
    ])
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    return model

def _safe_float(val, default=0.0):
    """Convert any value (str, None, Decimal) to float safely."""
    try:
        return float(str(val).replace('₱', '').replace(',', '')) if val is not None else default
    except (ValueError, TypeError):
        return default

def _days_label(row):
    avg = _safe_float(row['avg_daily_sales'])
    stock = _safe_float(row['stock'])
    if avg <= 0:
        return 365.0
    return stock / avg

def train(df):
    if len(df) < 4:
        return None, None, {'status': 'insufficient_data', 'rows': len(df)}

    df = df.copy()
    df['avg_daily_sales'] = df['avg_daily_sales'].apply(_safe_float).clip(lower=0)
    df['stock']           = df['stock'].apply(_safe_float)
    df['price']           = df['price'].apply(_safe_float)
    df['total_sold']      = df['total_sold'].apply(_safe_float)
    df['days_remaining']  = df.apply(_days_label, axis=1).clip(upper=365)

    features = df[['stock', 'avg_daily_sales', 'price', 'total_sold']].values.astype(float)
    scaler   = StandardScaler()
    X        = scaler.fit_transform(features)
    y        = df['days_remaining'].values

    model   = build_model()
    history = model.fit(X, y, epochs=80, batch_size=8, validation_split=0.15, verbose=0)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    model.save(MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    val_mae = round(float(np.mean(history.history.get('val_mae', [0])[-5:])), 2)
    return model, scaler, {'status': 'trained', 'val_mae_days': val_mae, 'rows': len(df)}

def load():
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        return tf.keras.models.load_model(MODEL_PATH), joblib.load(SCALER_PATH)
    return None, None

def predict(model, scaler, df, warning_threshold=14):
    alerts = []
    for _, row in df.iterrows():
        # Safe cast everything to float — no string leakage
        avg_sales = _safe_float(row.get('avg_daily_sales', 0))
        stock     = _safe_float(row.get('stock', 0))
        price     = _safe_float(row.get('price', 0))
        total_sold= _safe_float(row.get('total_sold', 0))

        if model and scaler:
            try:
                X    = scaler.transform([[stock, avg_sales, price, total_sold]])
                days = max(0.0, float(model.predict(X, verbose=0)[0][0]))
            except Exception:
                days = (stock / avg_sales) if avg_sales > 0 else 365.0
        else:
            days = (stock / avg_sales) if avg_sales > 0 else 365.0

        days = round(days, 1)
        if days <= warning_threshold:
            alerts.append({
                'product':         str(row['name']),
                'category':        str(row.get('category', '')),
                'current_stock':   int(stock),
                'avg_daily_sales': round(avg_sales, 2),
                'days_remaining':  days,
                'alert':           days <= 7,
                'model':           'tensorflow_nn' if model else 'rule_based',
            })

    return sorted(alerts, key=lambda x: x['days_remaining'])
