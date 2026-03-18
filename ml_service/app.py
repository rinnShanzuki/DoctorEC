"""
app.py
Flask REST API — entry point for the TensorFlow ML microservice.
Runs on http://localhost:5001
"""
import os, sys, threading
# Suppress TensorFlow verbose logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

from flask import Flask, jsonify, request
from flask_cors import CORS
import trainer
from data_loader import (
    load_daily_appointments,
    load_service_stats,
    load_product_sales,
    load_patient_data,
)
from models import appointment_model, service_model, inventory_model, patient_model

app = Flask(__name__)
CORS(app)

# ─── STARTUP ─────────────────────────────────────────────────────────────────

def startup():
    """Load saved models, or train from scratch if none exist."""
    print("[App] Starting TensorFlow Clinic ML Service...")
    loaded = trainer.load_saved_models()
    if not loaded:
        print("[App] No saved models found — training from scratch...")
        trainer.train_all()
    else:
        # Check if any model wasn't found on disk → retrain those
        models = trainer.get_models()
        needs_train = any(v.get('meta', {}).get('status') == 'not_found' for v in models.values())
        if needs_train:
            print("[App] Some models missing — running full training...")
            trainer.train_all()
    print("[App] Service ready.")

# Run startup in background thread so Flask starts immediately
threading.Thread(target=startup, daemon=True).start()


# ─── HEALTH ──────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'service': 'DocEC TensorFlow ML Service',
        'version': '1.0.0',
        **trainer.get_status(),
    })


# ─── RETRAIN ─────────────────────────────────────────────────────────────────

@app.route('/retrain', methods=['GET', 'POST'])
def retrain():
    threading.Thread(target=trainer.train_all, daemon=True).start()
    return jsonify({'message': 'Retraining started in background', 'status': 'training'})


# ─── PREDICT — APPOINTMENTS ──────────────────────────────────────────────────

@app.route('/predict/appointments', methods=['GET', 'POST'])
def predict_appointments():
    try:
        models = trainer.get_models()
        df     = load_daily_appointments(180)
        result = appointment_model.predict(
            models['appointment']['model'],
            models['appointment']['scaler'],
            df,
            forecast_days=30,
        )
        return jsonify({'status': 'success', 'data': result})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# ─── PREDICT — SERVICES ──────────────────────────────────────────────────────

@app.route('/predict/services', methods=['GET', 'POST'])
def predict_services():
    try:
        models = trainer.get_models()
        df     = load_service_stats()
        result = service_model.predict(
            models['service']['model'],
            models['service'].get('bundle'),
            df,
        )
        return jsonify({'status': 'success', 'data': result})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# ─── PREDICT — INVENTORY ─────────────────────────────────────────────────────

@app.route('/predict/inventory', methods=['GET', 'POST'])
def predict_inventory():
    try:
        models = trainer.get_models()
        df     = load_product_sales()
        result = inventory_model.predict(
            models['inventory']['model'],
            models['inventory']['scaler'],
            df,
        )
        return jsonify({'status': 'success', 'data': result})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# ─── PREDICT — PATIENTS ──────────────────────────────────────────────────────

@app.route('/predict/patients', methods=['GET', 'POST'])
def predict_patients():
    try:
        models = trainer.get_models()
        df     = load_patient_data()
        result = patient_model.predict(
            models['patient']['model'],
            models['patient']['scaler'],
            df,
        )
        return jsonify({'status': 'success', 'data': result})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


# ─── PREDICT — ALL (single call for Laravel) ─────────────────────────────────

@app.route('/predict/all', methods=['GET', 'POST'])
def predict_all():
    try:
        models = trainer.get_models()

        appt_df  = load_daily_appointments(180)
        svc_df   = load_service_stats()
        inv_df   = load_product_sales()
        pat_df   = load_patient_data()

        appt   = appointment_model.predict(models['appointment']['model'], models['appointment']['scaler'], appt_df)
        svc    = service_model.predict(models['service']['model'], models['service'].get('bundle'), svc_df)
        inv    = inventory_model.predict(models['inventory']['model'], models['inventory']['scaler'], inv_df)
        pat    = patient_model.predict(models['patient']['model'], models['patient']['scaler'], pat_df)

        import time
        return jsonify({
            'status': 'success',
            'engine': 'tensorflow',
            'generated_at': time.strftime('%Y-%m-%dT%H:%M:%S'),
            'data': {
                'appointment_forecast': appt,
                'service_demand':       svc,
                'inventory_alerts':     inv,
                'patient_return':       pat,
            }
        })
    except Exception as e:
        import traceback
        return jsonify({'status': 'error', 'message': str(e), 'trace': traceback.format_exc()}), 500


# ─── MAIN ─────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('ML_PORT', 5001))
    print(f"[App] TensorFlow ML Service starting on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
