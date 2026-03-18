"""
appointment_model.py
LSTM neural network for appointment demand forecasting.
Uses past daily appointment counts to predict future demand.
"""
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
import joblib, os

MODEL_PATH   = os.path.join(os.path.dirname(__file__), '..', 'saved_models', 'appointment_model.keras')
SCALER_PATH  = os.path.join(os.path.dirname(__file__), '..', 'saved_models', 'appointment_scaler.pkl')
SEQ_LEN      = 14   # use 14 days of history to predict 1 day ahead

def build_model(seq_len):
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(seq_len, 3)),       # count, day_of_week, month
        tf.keras.layers.LSTM(64, return_sequences=True),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.LSTM(32),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(16, activation='relu'),
        tf.keras.layers.Dense(1),
    ])
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    return model

def train(df):
    """Train on historical daily appointment data."""
    if len(df) < SEQ_LEN + 5:
        return None, None, {'status': 'insufficient_data', 'rows': len(df)}

    scaler = MinMaxScaler()
    features = df[['count', 'day_of_week', 'month']].values
    scaled   = scaler.fit_transform(features)

    X, y = [], []
    for i in range(SEQ_LEN, len(scaled)):
        X.append(scaled[i - SEQ_LEN:i])
        y.append(scaled[i, 0])
    X, y = np.array(X), np.array(y)

    model = build_model(SEQ_LEN)
    history = model.fit(X, y, epochs=50, batch_size=8, validation_split=0.1, verbose=0)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    model.save(MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    val_mae = round(float(np.mean(history.history.get('val_mae', [0])[-5:])), 4)
    return model, scaler, {'status': 'trained', 'val_mae': val_mae, 'rows': len(df)}

def load():
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        return tf.keras.models.load_model(MODEL_PATH), joblib.load(SCALER_PATH)
    return None, None

def predict(model, scaler, df, forecast_days=30):
    """Forecast next `forecast_days` daily appointment counts."""
    if model is None or len(df) < SEQ_LEN:
        return _fallback_forecast(df, forecast_days)

    features = df[['count', 'day_of_week', 'month']].values
    scaled   = scaler.transform(features)
    sequence = scaled[-SEQ_LEN:].copy()

    predictions = []
    for i in range(forecast_days):
        seq_input = sequence.reshape(1, SEQ_LEN, 3)
        pred_scaled = model.predict(seq_input, verbose=0)[0][0]

        # inverse-scale just the count (first feature)
        inverse_row = np.zeros((1, 3))
        inverse_row[0, 0] = pred_scaled
        count = max(0, round(scaler.inverse_transform(inverse_row)[0][0]))
        predictions.append(count)

        # shift sequence
        next_row = sequence[-1].copy()
        next_row[0] = pred_scaled
        sequence = np.vstack([sequence[1:], next_row])

    import pandas as pd
    from datetime import datetime, timedelta
    start = df['date'].iloc[-1] + timedelta(days=1)
    dates = [(start + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(forecast_days)]

    avg = int(np.mean(predictions))
    confidence = 'high' if len(df) >= 60 else 'medium' if len(df) >= 30 else 'low'

    return {
        'next_30_days': sum(predictions[:30]),
        'daily_average': avg,
        'confidence': confidence,
        'daily_breakdown': [{'date': d, 'predicted': int(p)} for d, p in zip(dates, predictions)],
        'model': 'tensorflow_lstm',
    }

def _fallback_forecast(df, forecast_days):
    avg = int(df['count'].mean()) if len(df) > 0 else 2
    import pandas as pd
    from datetime import datetime, timedelta
    start = datetime.now()
    dates = [(start + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(forecast_days)]
    return {
        'next_30_days': avg * 30,
        'daily_average': avg,
        'confidence': 'low',
        'daily_breakdown': [{'date': d, 'predicted': avg} for d in dates],
        'model': 'fallback_average',
    }
