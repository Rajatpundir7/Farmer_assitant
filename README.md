# 🌾 Kisan.JI - Smart Agriculture Platform & AgriGraph Optimizer

<div align="center">
  <img src="frontend/public/images/1i.png" alt="Kisan.JI Logo" width="220"/>
  
  <h3>AI-Powered Agricultural Intelligence & Decision Support System</h3>
  
  <p><strong>A Next-Generation "Village Nervous System" for Indian Farmers</strong></p>

  [![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)
  [![PyTorch Geometric](https://img.shields.io/badge/PyTorch_Geometric-GNN-FF6F61?logo=pytorch&logoColor=white)](https://pytorch-geometric.readthedocs.io/)
  [![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime-Inference-00599C?logo=onnx&logoColor=white)](https://onnxruntime.ai/)
</div>

---

## 🔗 Project Links & Demos
*   **Live Web Application**: [kisanji-frontend.vercel.app](https://kisanji-frontend.vercel.app)
*   **Explanatory Video Tour**: [YouTube Walkthrough](https://youtu.be/ETIP463LaVk?si=M5DlUlwCZ6KcZCZz)
*   **Database Schema Blueprint**: [Google Drive Document](https://drive.google.com/file/d/1XOMa5s7_Mx0_X0nSupDs70ZFKi4kaB4u/view?usp=sharing)
*   **Developer & Architect**: Rajat Pundir ([@Rajatpundir7](https://github.com/Rajatpundir7))

---

## 📖 Project Overview
**Kisan.JI** is an AI-powered, mobile-first "village nervous system" designed to solve crop loss, poor market access, and sub-optimal chemical dosage for Indian farmers. By combining advanced deep learning, graph networks, reinforcement learning, and a modern web application, Kisan.JI acts as a complete digital partner for rural agriculture.

It integrates real-time Mandi market intelligence, OpenWeather forecasts, conversational voice assistants, ML-based crop recommenders, lightweight ONNX computer vision models for disease detection, and **AgriGraph Optimizer**—a state-of-the-art backend optimizer that recommends pesticide/fertilizer dosages using Graph Attention Networks (GAT), Generative Adversarial Networks (WGAN-GP), and Proximal Policy Optimization (PPO) Reinforcement Learning.

---

## 🌟 Visualizing Kisan.JI

### Main Interface & Features
<div align="center">
  <table width="100%">
    <tr>
      <td width="50%">
        <p align="center"><strong>Market Intelligence & Weather Forecasts</strong></p>
        <img src="frontend/public/images/12i.png" alt="Market & Weather dashboard background" width="100%" />
      </td>
      <td width="50%">
        <p align="center"><strong>Smart Subsidies & Schemes</strong></p>
        <img src="frontend/public/images/9i.png" alt="Govt Schemes and Subsidies background" width="100%" />
      </td>
    </tr>
    <tr>
      <td width="50%">
        <p align="center"><strong>Interactive Crop Recommendations</strong></p>
        <img src="frontend/public/images/7i.jpg" alt="Crop Recommendation system background" width="100%" />
      </td>
      <td width="50%">
        <p align="center"><strong>Plant Health & Pest Detection</strong></p>
        <img src="frontend/public/images/8i.jpg" alt="Pest detection model background" width="100%" />
      </td>
    </tr>
  </table>
</div>

---

## 🛠️ Complete Feature Matrix

### 1. 🧠 AgriGraph Optimizer (GNN + GAN + RL)
A multi-agent optimization suite to calculate optimal fertilizer and pesticide dosages based on spatial neighbor effects, synthetic climate anomalies, and reward-driven policy actions.
*   **Graph Intelligence (GAT)**: Models agricultural regions using Graph Attention Networks. It builds a spatial farm network (K-nearest neighbors, $k=5$) and applies multi-head attention (4 heads) to extract neighborhood graph embeddings representing regional pest/disease spread.
*   **Scenario Simulation (WGAN-GP)**: Generates synthetic crop environments (temperature, rainfall, pest level, climate anomalies) using a Wasserstein GAN with Gradient Penalty. This ensures the Reinforcement Learning agent is trained against realistic worst-case climate and outbreak scenarios.
*   **Dosage Policy Optimization (PPO)**: Trains an Actor-Critic Reinforcement Learning agent using Proximal Policy Optimization. The agent takes actions (recommended chemical and fertilizer dosage levels in a continuous `[0, 1]` scale) to maximize crop health while minimizing environmental chemical toxicity.

<div align="center">
  <table width="100%">
    <tr>
      <td width="50%">
        <p align="center"><strong>Synthetic Environmental Simulation</strong></p>
        <img src="AgriGraph_Optimizer/outputs/sample_scenario.png" alt="Sample Scenario Output" width="100%" />
      </td>
      <td width="50%">
        <p align="center"><strong>Scenario Distribution Convergence</strong></p>
        <img src="AgriGraph_Optimizer/outputs/test_gan_output.png" alt="GAN Training output" width="100%" />
      </td>
    </tr>
  </table>
</div>

### 2. 🤖 AI-Powered Multilingual Voice Assistant
*   **Gemini AI Core**: Smart chatbot powered by Google Gemini, primed with prompt engineering context to answer complex questions about crop disease, crop cycles, and organic alternatives.
*   **Whisper Speech-to-Text**: Converts regional languages (Hindi, Marathi, Tamil, Telugu, etc.) to text for seamless inputs.
*   **Regional TTS**: Converts backend responses back to clear audio speech in the user's preferred Indian language, providing hands-free operation for farmers.

### 3. 🌱 Computer Vision Disease & Pest Detection
*   **ONNX Edge Inference**: Incorporates optimized, lightweight mobile-ready ONNX models for fast inference directly on servers or client applications.
    *   `corn_mobile_v2.onnx` (Corn Disease Detection)
    *   `rice_mobile_v2.onnx` (Rice Disease Detection)
    *   `sugarcane_mobile_v2.onnx` (Sugarcane Disease Detection)
    *   `wheat_mobile_v2.onnx` (Wheat Disease Detection)
    *   `cotton_disease_v2.onnx` (Cotton Disease Detection)
*   **YOLOv8 Pest Detection**: Identifies crop-destroying pests in real time.
*   **PyTorch Plant Doctor**: PyTorch-based comprehensive plant health model (`plant_doctor.pt`) to detect visual degradation.

### 4. 🌾 Soil-Nutrient Crop Recommendation
*   **Random Forest Machine Learning Engine**: Suggests optimal crops based on input parameters: Nitrogen (N), Phosphorus (P), Potassium (K), pH Level, Rainfall, and Water Source (Rain-fed vs. Tube-well).
*   Integrates dynamic IMD weather forecast indexes to evaluate suitability index.

### 5. 📊 Market Mandi Price Feed & Weather Scheduling
*   **Live Mandi Prices**: Real-time market commodity prices pulled from the government eNAM API platform. Include filters for states, districts, and crop varieties.
*   **Price Trends**: Historical price graphs to identify seasonal fluctuations.
*   **Spray Feasibility Scheduler**: Assesses current temperature, wind speed, and humidity to tell the farmer if it is safe to apply sprays (e.g. avoiding high wind speeds that cause chemical drift or high humidity that decreases absorption).

### 6. 🛡️ User Profiles, Subsidies & Schemes
*   **Secure OTP Login**: Passwordless email-OTP authentication powered by SMTP.
*   **Profile Customization**: Land size (hectare), Soil profile (clay, loam, sand), and Irrigation type parameters used to customize AI recommendations.
*   **Scheme Portal**: Details on PM-KISAN, crop insurance (PMFBY), and state-level fertilizer and equipment subsidies.

---

## 💻 Tech Stack & Architecture

### Frontend
*   **Framework**: React (v19)
*   **Styling**: Tailwind CSS & Craco Config
*   **Components**: Radix UI primitives, Lucide React icons, Recharts for graphs, Framer Motion for animations.

### Backend
*   **Framework**: FastAPI (Python 3.11)
*   **Database**: MongoDB Atlas (Async Motor Client connection with TLS verification)
*   **Libraries**: PyTorch, PyTorch Geometric, ONNX Runtime, NumPy, SciPy, httpx, python-dotenv.

---

## 🗄️ Database Schema design
The MongoDB Atlas architecture holds key collections modeled with Pydantic validations:

*   **`users`**: Storing accounts, password hashes, emails, role privileges, regional language choices, and voice activation flags.
*   **`farmer_profile`**: Links to `user_id` containing physical parameters: land size, irrigation source, soil composition.
*   **`disease_results`**: Historical record of uploads, model classifications, severity scores, and treatment outcomes.
*   **`market_prices`**: Caches and indexes local Mandi price statistics.
*   **`schemes`** & **`scheme_notifications`**: Holds central and state-wide subsidies and dynamically triggers push/in-app notifications when new subsidies match a user profile.
*   **`gan`**: Holds mapping metadata of crop disease classes.

---

## 🚀 Setup & Execution Guide

### Prerequisites
*   Node.js (18+)
*   Python (3.11+)
*   MongoDB Atlas Account
*   Google Gemini API Key
*   OpenWeatherMap API Key

### Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On UNIX
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and fill in your API credentials:
   ```env
   MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   DB_NAME=echoharvest_db
   WEATHER_API_KEY=your_openweathermap_api_key
   MARKET_API_KEY=your_mandi_data_gov_in_api_key
   GEMINI_API_KEY=your_gemini_api_key
   GMAIL_USER=your_gmail@gmail.com
   GMAIL_APP_PASSWORD=your_gmail_app_specific_password
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup
1. Open a terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install node modules:
   ```bash
   npm install
   ```
3. Create a `.env` file or configure endpoints:
   ```env
   REACT_APP_API_URL=http://localhost:8000/api
   ```
4. Run the React Web App:
   ```bash
   npm start
   ```

### AgriGraph Optimizer Setup & Training Pipeline
To train or test the GAT, WGAN-GP, and PPO Reinforcement Learning agents:
1. Navigate to the optimizer directory:
   ```bash
   cd AgriGraph_Optimizer
   ```
2. Install specialized PyTorch and PyTorch Geometric dependencies:
   ```bash
   pip install torch torchvision torchaudio
   pip install torch-geometric
   pip install -r requirements.txt
   ```
3. Run test suites for individual modules:
   *   **GAT Graph test**: `python tests/test_graph.py`
   *   **WGAN Generator test**: `python tests/test_gan.py`
   *   **PPO RL Agent test**: `python tests/test_rl.py`
4. Run the full optimization integration pipeline:
   ```bash
   python main.py
   ```

---

## 🤝 Contributing & License
*   **Author & Main Developer**: Rajat Pundir ([@Rajatpundir7](https://github.com/Rajatpundir7))
*   **License**: Licensed under the MIT License - see the LICENSE file for details.
*   **Event & College**: Created for the *Hack The Winter* hackathon at *Graphic Era Hill University, Dehradun* by Team Kedari.

---
<p align="center">Made with ❤️ for Indian Farmers. Promoting Sustainable and Intelligent Agriculture.</p>
