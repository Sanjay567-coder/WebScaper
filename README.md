# Java Web Data Scraper & Management System

> Full-stack Java web application for automated collection, processing, storage, scheduling, monitoring, and management of web data. Built with **Spring Boot (Java 17)**, **React.js**, **Jsoup**, **MySQL 8.0**, and **Docker**.

---

## 🌟 Overview & Architecture

The system replaces manual web-data collection with an automated workflow. An administrator can configure scraping tasks, define CSS selector extraction rules, test scrapes live, schedule recurring background jobs, inspect scraped records, detect duplicate content using cryptographic hashing (SHA-256), and monitor complete execution history via a SaaS admin dashboard.

```
┌────────────────────────────────────────────────────────┐
│             React.js Admin Dashboard                   │
│  (Vite + Tailwind CSS + Lucide Icons + Recharts)       │
│  Port: 5173                                            │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (JWT Auth)
                            ▼
┌────────────────────────────────────────────────────────┐
│            Spring Boot REST Backend                    │
│  (Java 17 + Spring Security + Spring Data JPA)         │
│  • REST Controllers & DTO Validation                   │
│  • Jsoup Scraper Engine & Rate Limiter                 │
│  • TaskScheduler & Background Worker                   │
│  • SHA-256 Duplicate Detector & Cleaner                │
│  Port: 8080                                            │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼ (JPA / Hibernate)          ▼ (HTTP GET)
┌───────────────────────────┐   ┌────────────────────────┐
│     MySQL 8.0 Database    │   │  Permitted Web Sources │
│  (Users, Tasks, Records,  │   │  (books.toscrape.com,  │
│   Runs & Execution Logs)  │   │   quotes.toscrape.com) │
│  Port: 3306               │   └────────────────────────┘
└───────────────────────────┘
```

---

## 🚀 Quick Start (Docker Compose - Recommended)

Zero manual database setup required. Everything runs in isolated containers.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- Docker Compose v2+

### 1. Launch the Stack
```bash
# Clone the repository
git clone https://github.com/Sanjay567-coder/WebScaper.git
cd WebScaper

# Copy environment variables template
cp .env.example .env

# Build and start all services (MySQL, Backend, Frontend)
docker-compose up --build -d
```

### 2. Access the Application
- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend REST API**: [http://localhost:8080/api](http://localhost:8080/api)
- **MySQL Database**: `localhost:3306` (`webscraper_db`)

### 3. Demo Credentials
| Role | Email | Password |
|---|---|---|
| **System Administrator** | `admin@webscraper.local` | `Admin@123` |

---

## 🛠️ Local Development (Fallback without Docker)

If you prefer to run services natively on your machine:

### Prerequisites
- **Java 17 (LTS)** JDK installed
- **Node.js 18+** & npm installed
- **MySQL 8.0** server running locally

### 1. Database Setup
```bash
# Log into your local MySQL instance
mysql -u root -p < docker/mysql/init.sql
```

### 2. Run Backend
```bash
cd backend

# On Windows
./mvnw.cmd spring-boot:run

# On Linux/macOS
./mvnw spring-boot:run
```
Backend will start on `http://localhost:8080`.

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:5173`.

---

## 📁 Repository Structure

```
WebScaper/
├── .env.example              # Sample environment configuration
├── .gitignore                # Git ignore rules
├── docker-compose.yml        # Multi-container orchestration
├── README.md                 # Project documentation
├── docker/
│   └── mysql/
│       └── init.sql          # DB schema and seed data
├── backend/                  # Java Spring Boot 3.x (Java 17)
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/example/webscraper/
│       │   │   ├── config/
│       │   │   ├── controller/
│       │   │   ├── dto/
│       │   │   ├── entity/
│       │   │   ├── exception/
│       │   │   ├── repository/
│       │   │   ├── security/
│       │   │   └── service/
│       │   │       ├── processing/
│       │   │       ├── scheduler/
│       │   │       └── scraper/
│       │   └── resources/
│       │       ├── application.properties
│       │       └── application-prod.properties
│       └── test/
└── frontend/                 # React.js (Vite + Tailwind CSS)
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── components/
        ├── context/
        ├── pages/
        ├── routes/
        ├── services/
        └── App.jsx
```

---

## 🔒 Scraping Safety & Permitted Sources
This application respects web ethics and robots directives:
- Only public/permitted test targets (`books.toscrape.com`, `quotes.toscrape.com`) are configured by default.
- No CAPTCHA bypass, anti-bot evasion, or authentication bypass logic is used.
- Requests include standard user-agent identification and timeout protections.