"""
service_model.py
Dense neural network for service demand classification.
Classifies each service as High / Medium / Low demand.
"""
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib, os

MODEL_PATH   = os.path.join(os.path.dirname(__file__), '..', 'saved_models', 'service_model.keras')
SCALER_PATH  = os.path.join(os.path.dirname(__file__), '..', 'saved_models', 'service_scaler.pkl')

def _label(count):
    count = int(float(count))   # always numeric — guard against str from DB
    if count >= 10: return 'High'
    if count >= 3:  return 'Medium'
    return 'Low'

def build_model():
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(3,)),
        tf.keras.layers.Dense(16, activation='relu'),
        tf.keras.layers.Dense(8, activation='relu'),
        tf.keras.layers.Dense(3, activation='softmax'),
    ])
    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
    return model

def train(df):
    if len(df) < 3:
        return None, None, {'status': 'insufficient_data', 'rows': len(df)}

    labels_raw = df['times_availed'].apply(_label).values
    le = LabelEncoder()
    le.fit(['High', 'Medium', 'Low'])
    y = le.transform(labels_raw)

    features = df[['times_availed', 'days_since_last', 'price']].fillna(0).values.astype(float)
    scaler   = StandardScaler()
    X        = scaler.fit_transform(features)

    model = build_model()
    history = model.fit(X, y, epochs=80, batch_size=4, verbose=0)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    model.save(MODEL_PATH)
    joblib.dump({'scaler': scaler, 'label_encoder': le}, SCALER_PATH)

    acc = round(float(history.history['accuracy'][-1]), 4)
    return model, {'scaler': scaler, 'le': le}, {'status': 'trained', 'accuracy': acc, 'rows': len(df)}

def load():
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        bundle = joblib.load(SCALER_PATH)
        return tf.keras.models.load_model(MODEL_PATH), {'scaler': bundle['scaler'], 'le': bundle['label_encoder']}
    return None, None

def predict(model, bundle, df):
    results = []

    for _, row in df.iterrows():
        # Always cast to numeric — guards against str values from DB
        availed   = int(float(row.get('times_availed', 0) or 0))
        days      = float(row.get('days_since_last', 365) or 365)
        price_raw = str(row.get('price', 0) or 0).replace('₱', '').replace(',', '')
        price     = float(price_raw) if price_raw else 0.0

        if model is None:
            level = _label(availed)
        else:
            scaler = bundle['scaler']
            le     = bundle['le']
            X      = scaler.transform([[availed, days, price]])
            probs  = model.predict(X, verbose=0)[0]
            idx    = int(np.argmax(probs))
            level  = le.inverse_transform([idx])[0]

        results.append({
            'service':       str(row['name']),
            'times_availed': availed,
            'demand_level':  level,
            'model':         'tensorflow_nn' if model else 'rule_based',
        })
    return results
