# 🛡️ PatchWise

**Vulnerability Intelligence That Knows Your Business**

PatchWise is an AI-powered vulnerability triage and risk prioritization platform built during the **Nexora 24-Hour Hackathon**.

Instead of treating every vulnerability equally, PatchWise combines multiple security signals with organisational context to identify which vulnerabilities actually matter.

---

## 🚀 Why PatchWise?

Security teams often deal with hundreds or thousands of vulnerabilities.

Traditional approaches focus only on severity scores, causing:

* Too many "critical" alerts
* Alert fatigue
* Time spent on irrelevant vulnerabilities
* Delayed response to real threats

PatchWise solves this by prioritizing vulnerabilities using business and technical context.

---

## 🎯 Core Idea

Rather than asking:

> "Which vulnerabilities are globally severe?"

PatchWise asks:

> "Which vulnerabilities matter most to THIS organisation?"

---

## ⚡ Features

✅ CVSS-based severity analysis

✅ EPSS exploitation probability scoring

✅ CISA KEV integration for known exploited vulnerabilities

✅ Internet exposure awareness

✅ Service criticality scoring

✅ Organisation-specific prioritisation

✅ Explainable 0–100 risk score

✅ AI-powered vulnerability explanations

✅ Audit logging

✅ Deterministic scoring engine

✅ Negative testing support

---

## 🧠 Scoring Model

PatchWise combines:

```text
CVSS
+ EPSS
+ CISA KEV
+ Internet Exposure
+ Service Importance
--------------------------------
Final Priority Score (0–100)
```

Every contribution is visible, weighted, and explainable.

No black-box scoring.

---

## 🏗️ System Architecture

```text
                PATCHWISE
                     │
                     ▼
            Organisation Profile
                     │
                     ▼
              Product Matching
                     │
                     ▼
        CVE Data Enrichment Layer
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
   CVSS            EPSS          CISA KEV
                     │
                     ▼
            Exposure Analysis
                     │
                     ▼
          Importance Assessment
                     │
                     ▼
          Priority Scoring Engine
                     │
                     ▼
             Top 5 Vulnerabilities
                     │
                     ▼
           AI Explanation Layer
```

---

## 🛠️ Tech Stack

### Backend

* Python
* FastAPI
* Pandas
* REST APIs
* JSON Audit Logs

### Frontend

* React
* Vite
* Tailwind CSS

### AI

* LLM Integration
* Safe Prompting
* Fact-Grounded Responses

### Testing

* Pytest

---

## 📂 Project Structure

```text
PatchWise/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── main.py
│   ├── scoring/
│   ├── matching/
│   ├── ai/
│   ├── data/
│   └── requirements.txt
│
├── docs/
├── screenshots/
└── README.md
```

---

## 📸 Screenshots

Add screenshots here:

### Dashboard

### Vulnerability Details

### AI Assistant

---

## ▶️ Running Locally

### Clone Repository

```bash
git clone https://github.com/allanborder/PatchWise.git
cd PatchWise
```

### Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn main:app --reload
```

Backend runs at:

```text
http://localhost:8000
```

---

### Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

## 🧪 Testing

Run backend tests:

```bash
pytest
```

---

## 🎖️ Hackathon

Built during:

🏆 **Nexora 24-Hour Hackathon**

From idea → architecture → implementation → testing → working prototype in just 24 hours.

---

## 🔮 Future Improvements

* Live CVE feeds
* User authentication
* Multi-organisation support
* Historical risk trends
* Dashboard analytics
* Deployment support
* Real-time notifications

---

## 🤝 Contributors

* Allan Paul Raj V
* Yoshidha M
* Tivin Elvis PJ
* DhanyaSri VA

---

## 📜 License

MIT License

---

⭐ If you found this project interesting, consider giving it a star!
