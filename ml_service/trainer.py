"""
trainer.py
Orchestrates training of all 4 TensorFlow models.
Called at startup if no saved models exist, or on /retrain request.
"""
import os, time, traceback
from data_loader import (
    load_daily_appointments,
    load_service_stats,
    load_product_sales,
    load_patient_data,
)
from models import appointment_model, service_model, inventory_model, patient_model

# Global model registry
_models = {
    'appointment': {'model': None, 'scaler': None, 'meta': {}},
    'service':     {'model': None, 'bundle': None, 'meta': {}},
    'inventory':   {'model': None, 'scaler': None, 'meta': {}},
    'patient':     {'model': None, 'scaler': None, 'meta': {}},
}
_last_trained = None
_training_status = 'not_started'

def get_status():
    return {
        'status':       _training_status,
        'last_trained': _last_trained,
        'models': {k: v.get('meta', {}) for k, v in _models.items()},
    }

def load_saved_models():
    """Load previously trained models from disk (fast startup)."""
    global _training_status
    _training_status = 'loading'
    try:
        m, s = appointment_model.load()
        _models['appointment']['model']  = m
        _models['appointment']['scaler'] = s
        _models['appointment']['meta']   = {'status': 'loaded'} if m else {'status': 'not_found'}

        m, b = service_model.load()
        _models['service']['model']  = m
        _models['service']['bundle'] = b
        _models['service']['meta']   = {'status': 'loaded'} if m else {'status': 'not_found'}

        m, s = inventory_model.load()
        _models['inventory']['model']  = m
        _models['inventory']['scaler'] = s
        _models['inventory']['meta']   = {'status': 'loaded'} if m else {'status': 'not_found'}

        m, s = patient_model.load()
        _models['patient']['model']  = m
        _models['patient']['scaler'] = s
        _models['patient']['meta']   = {'status': 'loaded'} if m else {'status': 'not_found'}

        _training_status = 'ready'
        return True
    except Exception as e:
        _training_status = 'load_error'
        print(f"[Trainer] Load error: {e}")
        return False

def train_all():
    """Train all 4 models from scratch using live DB data."""
    global _training_status, _last_trained
    _training_status = 'training'
    print("[Trainer] Starting training of all models...")
    t0 = time.time()

    # ─── 1. Appointment LSTM ──────────────────────────────────────────────────
    try:
        print("[Trainer] Training appointment LSTM...")
        df = load_daily_appointments()
        m, s, meta = appointment_model.train(df)
        _models['appointment'] = {'model': m, 'scaler': s, 'meta': meta}
        print(f"[Trainer] Appointment: {meta}")
    except Exception:
        print(f"[Trainer] Appointment training failed:\n{traceback.format_exc()}")
        _models['appointment']['meta'] = {'status': 'error'}

    # ─── 2. Service Demand NN ─────────────────────────────────────────────────
    try:
        print("[Trainer] Training service demand NN...")
        df = load_service_stats()
        m, b, meta = service_model.train(df)
        _models['service'] = {'model': m, 'bundle': b, 'meta': meta}
        print(f"[Trainer] Service: {meta}")
    except Exception:
        print(f"[Trainer] Service training failed:\n{traceback.format_exc()}")
        _models['service']['meta'] = {'status': 'error'}

    # ─── 3. Inventory Depletion NN ───────────────────────────────────────────
    try:
        print("[Trainer] Training inventory depletion NN...")
        df = load_product_sales()
        m, s, meta = inventory_model.train(df)
        _models['inventory'] = {'model': m, 'scaler': s, 'meta': meta}
        print(f"[Trainer] Inventory: {meta}")
    except Exception:
        print(f"[Trainer] Inventory training failed:\n{traceback.format_exc()}")
        _models['inventory']['meta'] = {'status': 'error'}

    # ─── 4. Patient Return NN ─────────────────────────────────────────────────
    try:
        print("[Trainer] Training patient return NN...")
        df = load_patient_data()
        m, s, meta = patient_model.train(df)
        _models['patient'] = {'model': m, 'scaler': s, 'meta': meta}
        print(f"[Trainer] Patient: {meta}")
    except Exception:
        print(f"[Trainer] Patient training failed:\n{traceback.format_exc()}")
        _models['patient']['meta'] = {'status': 'error'}

    elapsed = round(time.time() - t0, 1)
    _last_trained = time.strftime('%Y-%m-%d %H:%M:%S')
    _training_status = 'ready'
    print(f"[Trainer] All models trained in {elapsed}s")
    return get_status()

def get_models():
    return _models
