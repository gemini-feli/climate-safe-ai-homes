# 🏡 ClimateSafe AI Homes

ClimateSafe AI Homes is an intelligent web platform that helps homeowners design climate-resilient and sustainable homes. The system analyzes regional climate risks such as heatwaves, flooding, heavy rainfall, and extreme weather conditions and provides personalized home customization recommendations.

The project aims to promote safer, greener, and more energy-efficient housing through AI-driven recommendations and sustainability insights.

---

## 🌟 Problem Statement

Many homeowners are unaware of how climate conditions affect home safety, energy consumption, and long-term sustainability. Traditional home planning often ignores regional climate risks, leading to higher maintenance costs and environmental impact.

ClimateSafe AI Homes addresses this challenge by providing smart recommendations tailored to local climate conditions.

---

## 🚀 Features

### 🔐 User Authentication
- User Registration
- User Login
- Secure Authentication using Firebase

### 🏠 Climate-Based Home Recommendations
- Heatwave Protection Suggestions
- Flood-Resistant Design Recommendations
- Rainwater Management Solutions
- Energy-Efficient Home Modifications

### 🌍 Sustainability Features
- Carbon Footprint Tracking
- Eco-Friendly Material Suggestions
- Green Energy Recommendations
- Water Conservation Tips

### 🤖 AI Recommendation Engine
- Rule-Based Climate Analysis
- Personalized Home Improvement Suggestions
- Regional Risk Assessment

### 🖼️ Virtual Home Layout
- Interactive Home Design Interface
- Visualization of Recommended Modifications

### 📊 Dashboard
- User Profile
- Climate Risk Summary
- Recommendation History
- Sustainability Score

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Java
- Spring Boot

### Database & Authentication
- Firebase Firestore
- Firebase Authentication

### APIs
- REST APIs
- Spring Web

### Tools & Platforms
- IntelliJ IDEA / VS Code
- Postman
- Git & GitHub
- Firebase Console

---

## 📂 Project Structure

```text
ClimateSafe-AI-Homes/
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── css/
│   └── js/
│
├── backend/
│   ├── src/main/java/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── model/
│   │   ├── repository/
│   │   └── config/
│   │
│   └── resources/
│
├── firebase/
│   └── serviceAccountKey.json
│
├── screenshots/
│
└── README.md
```

---

## ⚙️ Installation Guide

### Prerequisites

Install the following:

- Java 17+
- Maven
- Git
- Firebase Account
- VS Code or IntelliJ IDEA

---

### Step 1: Clone Repository

```bash
git clone https://github.com/your-username/ClimateSafe-AI-Homes.git
```

```bash
cd ClimateSafe-AI-Homes
```

---

### Step 2: Configure Firebase

1. Create a Firebase Project.
2. Enable Authentication.
3. Enable Firestore Database.
4. Download Service Account Key.
5. Place the file inside:

```text
firebase/serviceAccountKey.json
```

---

### Step 3: Configure Backend

Open:

```properties
application.properties
```

Configure:

```properties
server.port=8080
```

---

### Step 4: Build Spring Boot Project

```bash
mvn clean install
```

---

### Step 5: Run Backend

```bash
mvn spring-boot:run
```

Backend will run on:

```text
http://localhost:8080
```

---

### Step 6: Launch Frontend

Open:

```text
frontend/index.html
```

or use VS Code Live Server.

Frontend will be available at:

```text
http://localhost:5500
```

---

## 🔄 Application Workflow

1. User registers/login.
2. User enters location and climate details.
3. System analyzes climate risks.
4. AI Recommendation Engine generates suggestions.
5. User receives personalized home modification recommendations.
6. Dashboard displays sustainability metrics and risk analysis.

---

## 📸 Screenshots

Add screenshots of:

- Home Page
- Login Page
- Dashboard
- Climate Risk Analysis
- AI Recommendations
- Carbon Footprint Tracker

Example:

```markdown
![Dashboard](screenshots/dashboard.png)
```

---

## 🎯 Future Enhancements

- Machine Learning-Based Predictions
- Real-Time Weather API Integration
- Satellite Data Analysis
- Smart Home IoT Integration
- Mobile Application
- Advanced Energy Consumption Analytics
- Voice Assistant Support

---

## 🏆 Hackathon Project

Developed for innovation and sustainability-focused hackathons to promote climate-resilient housing and environmental awareness.

---

## 👩‍💻 Author

**Felixeena Thomas**

B.E. Information Technology

Passionate about Java Development, AI Applications, Cloud Technologies, and Sustainable Innovation.

---

## 📜 License

This project is developed for educational, research, and hackathon purposes.
