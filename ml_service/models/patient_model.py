"""
patient_model.py
Dense neural network with sigmoid output for patient return prediction.
Predicts likelihood (0-1) that a patient will return for another visit.
"""
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import StandardScaler
import joblib, os

MODEL_PATH  = os.path.join(os.path.dirname(__file__), '..', 'saved_models', 'patient_model.keras')
SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', 'saved_models', 'patient_scaler.pkl')

def _safe_float(val, default=0.0):
    try:
        return float(val) if val is not None else default
    except (ValueError, TypeError):
        return default

def build_model():
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(3,)),
        tf.keras.layers.Dense(16, activation='relu'),
        tf.keras.layers.Dropout(0.1),
        tf.keras.layers.Dense(8, activation='relu'),
        tf.keras.layers.Dense(1, activation='sigmoid'),
    ])
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model

def _return_label(row):
    days   = _safe_float(row.get('days_since_last', 365))
    visits = _safe_float(row.get('total_visits', 0))
    if days <= 30 and visits >= 3:
        return 1
    if days > 90:
        return 0
    return 1 if visits >= 2 else 0

def train(df):
    if len(df) < 5:
        return None, None, {'status': 'insufficient_data', 'rows': len(df)}

    df = df.copy()
    for col in ['total_visits', 'days_since_last', 'total_spent']:
        df[col] = df[col].apply(_safe_float)

    df['label'] = df.apply(_return_label, axis=1)

    features = df[['total_visits', 'days_since_last', 'total_spent']].values.astype(float)
    scaler   = StandardScaler()
    X        = scaler.fit_transform(features)
    y        = df['label'].values

    model   = build_model()
    history = model.fit(X, y, epochs=80, batch_size=8, validation_split=0.15, verbose=0)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    model.save(MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    acc = round(float(history.history['accuracy'][-1]), 4)
    return model, scaler, {'status': 'trained', 'accuracy': acc, 'rows': len(df)}

def load():
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        return tf.keras.models.load_model(MODEL_PATH), joblib.load(SCALER_PATH)
    return None, None

def predict(model, scaler, df):
    likely, neutral, at_risk = 0, 0, 0
    at_risk_list = []

    for _, row in df.iterrows():
        # Safe cast — prevents 'could not convert string to float: total_visits'
        visits = _safe_float(row.get('total_visits', 0))
        days   = _safe_float(row.get('days_since_last', 365))
        spent  = _safe_float(row.get('total_spent', 0))

        if model and scaler:
            try:
                X     = scaler.transform([[visits, days, spent]])
                score = float(model.predict(X, verbose=0)[0][0])
            except Exception:
                score = 1.0 if days <= 30 and visits >= 3 else (0.0 if days > 90 else 0.5)
        else:
            score = 1.0 if days <= 30 and visits >= 3 else (0.0 if days > 90 else 0.5)

        if score >= 0.65:
            likely += 1
        elif score >= 0.35:
            neutral += 1
        else:
            at_risk += 1
            at_risk_list.append({
                'days_since_last': int(days),
                'score':           round(score, 3),
            })

    at_risk_list.sort(key=lambda x: x['score'])

    return {
        'likely_count':  likely,
        'neutral_count': neutral,
        'at_risk_count': at_risk,
        'at_risk_list':  at_risk_list[:10],
        'model':         'tensorflow_nn' if model else 'heuristic',
    }
