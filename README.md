# **HydroGenMaps – Green Hydrogen Infrastructure Optimization Platform**

![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Stack](https://img.shields.io/badge/Stack-FastAPI%20|%20Django%20|%20React%20|%20Mapbox%20|%20XGBoost%20|%20Mistral--7B%20\(Groq\)-blue)
HydroGenMaps is an AI-powered Geospatial Decision Support System (DSS) designed to optimize site selection and infrastructure planning for Green Hydrogen projects. It integrates geospatial analytics, machine learning, and generative AI to address fragmented hydrogen infrastructure planning and improve capital allocation.

## YOUTUBE VIDEO DEMO:-
[YouTube Video](https://youtu.be/cVxb_ya0sCs?si=LMQ9BcyDD2SwXHgh)



---

## 🚀 Key Features

### **Geospatial Intelligence**

* Interactive GIS dashboard with **Mapbox GL JS**
* Visualization of hydrogen plants, pipelines, storage hubs, and renewable resources
* Spatial filtering (radius selection, nearest-assets lookup)

### **AI-Powered Site Selection**

* Core Recommendation Engine combining:

  * Geospatial distance calculations
  * Normalized MCDA scoring
  * XGBoost-based risk predictions
* Adjustable user priorities for Infrastructure, Environment, and Economy

### **Generative AI Insights**

* **Mistral-7B on Groq LPUs** for ultra-fast inference
* Automated site summaries & investment-oriented insights
* RAG-powered chatbot (**H2Bot**) for querying reports and asset details

### **Report & Asset Management**

* Django-based system for storing, comparing, and exporting analysis reports
* Role-based authentication using **Firebase**

---

## 🏗️ Architecture Overview

### **Frontend**

* **React.js** for a component-based SPA
* **Mapbox GL JS** for GPU-accelerated vector maps
* **D3.js** for dynamic visualizations (radar charts, risk plots)
* **Firebase Auth** for secure user management

### **Backend**

| Component           | Technology               | Purpose                                                  |
| ------------------- | ------------------------ | -------------------------------------------------------- |
| Inference API       | **FastAPI**              | Handles ML scoring and real-time recommendation requests |
| Application Backend | **Django**               | Asset CRUD, report management, admin console             |
| Database            | **PostgreSQL + PostGIS** | Geospatial storage and spatial queries                   |
| ML Layer            | **XGBoost**              | Tabular risk and suitability modeling                    |
| LLM Layer           | **Mistral-7B (Groq)**    | Generative summaries, RAG-based chatbot                  |

---

## ⚙️ Installation & Setup

### **Prerequisites**

* Python 3.9+
* Node.js 16+
* PostgreSQL (PostGIS recommended)
* Mapbox API Key
* Groq API Key

---

### **Backend Setup**

```bash
git clone https://github.com/dhupthumbadiya2005/HydroGenMaps.git
cd HydroGenMaps/backend

pip install -r requirements.txt

# Start FastAPI (ML inference)
uvicorn main:app --reload

# Start Django backend
python manage.py runserver
```

### **Frontend Setup**

```bash
cd HydroGenMaps/frontend

npm install
npm start
```

---

## 🧠 Core Recommendation Engine Logic

1. User selects a location and radius
2. System retrieves nearby assets via PostGIS spatial queries
3. All metrics normalized into a unified scoring space
4. XGBoost model predicts risk / site viability
5. Final score computed using weighted MCDA:

```
Final Score =
(Infra Score × W_infra) +
(Environment Score × W_envi) +
(Economic Score × W_econ) +
XGBoost Risk Score
```

---

## 📁 Project Structure

```
HydroGenMaps/
│── backend/
│   ├── fastapi/          # ML inference service
│   ├── django/           # Asset & report management
│   └── db/               # PostgreSQL/PostGIS schemas
│
│── frontend/
│   ├── components/       # React UI components
│   ├── map/              # Mapbox layers & interactions
│   └── visualizations/   # D3.js charts & graphs
```

---

## 🤝 Contribution

Contributions are welcome. Please read `CONTRIBUTING.md` before submitting PRs.

---

## 📄 License

Licensed under the MIT License. See `LICENSE` for details.
