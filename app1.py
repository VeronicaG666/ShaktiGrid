from flask import Flask, jsonify, request
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
import requests
import joblib
import pandas as pd
import random
from datetime import datetime
import numpy as np
import pandas as pd
import os
import time

model = None

print("Current working directory:", os.getcwd())
print("Files in current directory:", os.listdir(os.getcwd()))

app = Flask(__name__)
CORS(app)  # This allows requests from all origins by default


# Load the trained model (ensure solar_model.pkl is in the same directory)
MODEL_PATH = "solar_model.pkl"


try:
    model = joblib.load(MODEL_PATH)
    print("Model loaded successfully!")
    print("DEBUG: model type:", type(model))
except Exception as e:
    print(f"Error loading model: {e}")


# Global dictionary to store automatically collected external data
# For example, we collect temperature and wind speed from a weather API.
data_storage = {
    "temperature": 0.0,  # in Celsius
    "wind": 0.0          # in m/s
}

def fetch_weather_data():
    """
    Automatically fetch weather data from an external API (OpenWeatherMap).
    Replace the URL and parameters with the ones for your data source.
    """
    API_KEY = "9eca4417b285f6bf108cd70814020972"  # Replace with your actual API key
    city = "Gujarat"           # Example city; modify as needed
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
    
    try:
        response = requests.get(url)
        data = response.json()
        if data.get("main") and data.get("wind"):
            temperature = data["main"]["temp"]
            wind_speed = data["wind"]["speed"]
            data_storage["temperature"] = temperature
            data_storage["wind"] = wind_speed
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Data collected: Temperature={temperature}, Wind={wind_speed}")
        else:
            print("Error: Unexpected API response structure:", data)
    except Exception as e:
        print("Error fetching external data:", e)

# Set up a scheduler to update data every 10 minutes (600 seconds)
scheduler = BackgroundScheduler()
scheduler.add_job(func=fetch_weather_data, trigger="interval", seconds=600)
scheduler.start()

@app.route('/')
def home():
    return jsonify({"message": "Flask API is running! Data is being collected automatically."})

# Prediction endpoint using the collected external data.
# For simplicity, we'll assume your model expects two features: temperature and wind speed.
@app.route('/predict', methods=['GET'])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded."}), 500
    features = np.array([data_storage["temperature"], data_storage["wind"]]).reshape(1, -1)

    # 1. Current date/time
    now = datetime.now()
    hour = now.hour
    day = now.day
    month = now.month
    year = now.year

    # 2. Slightly randomize consumption to see changing outputs
    default_consumption = random.uniform(15.0, 35.0)

    # 3. Use the wind from your data_storage
    wind_value = data_storage["wind"]

    # 4. Construct the DataFrame with the exact columns your model was trained on
    df_features = pd.DataFrame([{
        "hour": hour,
        "day": day,
        "month": month,
        "year": year,
        "Consumption": default_consumption,
        "Wind": wind_value
    }])

    print("DEBUG: df_features\n", df_features)  # For debugging

    try:
        prediction = model.predict(df_features)
        return jsonify({
            "input_features": df_features.to_dict(orient="records"),
            "prediction": prediction.tolist()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

