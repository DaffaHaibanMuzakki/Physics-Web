from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import re
import nltk
from nltk.corpus import stopwords
import os

app = Flask(__name__)
CORS(app)

try:
    stopwords.words('indonesian')
except:
    nltk.download('stopwords')

MODEL_PATH = 'models/model_classifier.pkl'
VECTORIZER_PATH = 'models/vectorizer.pkl'

print("🔄 Loading model...")
try:
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None
    vectorizer = None

def preprocess_text(text):
    """Preprocessing teks"""
    text = text.lower()
    text = re.sub(r'[^a-z\s]', '', text)
    
    stop_words = set(stopwords.words('indonesian'))
    words = text.split()
    words = [w for w in words if w not in stop_words and len(w) > 2]
    
    return ' '.join(words)

@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        'status': 'online',
        'message': 'Forum Fisika AI API',
        'model_loaded': model is not None
    })

@app.route('/classify', methods=['POST'])
def classify():
    """
    Endpoint untuk klasifikasi teks
    
    Request body:
    {
        "text": "Apakah gravitasi sama dengan gaya elektromagnetik?"
    }
    
    Response:
    {
        "success": true,
        "text": "...",
        "prediction": "Pertanyaan",
        "confidence": 0.95,
        "probabilities": {
            "Pertanyaan": 0.95,
            "Konsep Fisika": 0.03,
            "Penelitian": 0.02
        }
    }
    """
    if model is None or vectorizer is None:
        return jsonify({
            'success': False,
            'error': 'Model not loaded'
        }), 500
    
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'Text is required'
            }), 400
        
        # Preprocess
        text_clean = preprocess_text(text)
        
        # Vectorize
        text_vec = vectorizer.transform([text_clean])
        
        # Predict
        prediction = model.predict(text_vec)[0]
        probabilities = model.predict_proba(text_vec)[0]
        
        # Get class names
        classes = model.classes_
        
        # Build response
        proba_dict = {
            classes[i]: float(probabilities[i]) 
            for i in range(len(classes))
        }
        
        return jsonify({
            'success': True,
            'text': text,
            'prediction': prediction,
            'confidence': float(max(probabilities)),
            'probabilities': proba_dict
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/classify/batch', methods=['POST'])
def classify_batch():
    """
    Klasifikasi multiple texts sekaligus
    
    Request body:
    {
        "texts": ["text1", "text2", "text3"]
    }
    """
    if model is None or vectorizer is None:
        return jsonify({
            'success': False,
            'error': 'Model not loaded'
        }), 500
    
    try:
        data = request.get_json()
        texts = data.get('texts', [])
        
        if not texts or not isinstance(texts, list):
            return jsonify({
                'success': False,
                'error': 'texts array is required'
            }), 400
        
        results = []
        for text in texts:
            text_clean = preprocess_text(text)
            text_vec = vectorizer.transform([text_clean])
            prediction = model.predict(text_vec)[0]
            confidence = float(max(model.predict_proba(text_vec)[0]))
            
            results.append({
                'text': text,
                'prediction': prediction,
                'confidence': confidence
            })
        
        return jsonify({
            'success': True,
            'count': len(results),
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Forum Fisika AI API Starting...")
    print("="*60)
    print("📍 Server: http://localhost:5000")
    print("📚 Endpoints:")
    print("   GET  /           - Health check")
    print("   POST /classify   - Classify single text")
    print("   POST /classify/batch - Classify multiple texts")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)