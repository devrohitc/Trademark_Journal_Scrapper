# India Trademark Journal Scraper - Complete Setup Guide

A full-stack automated system to scrape, extract, and manage trademark application data from India's IP Office Trademark Journal website.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Important Notes](#important-notes)

---

## ✨ Features

- **Automated Scraping**: Downloads latest 2 PDFs from India's Trademark Journal website
- **PDF Data Extraction**: Extracts trademark application details using pdfplumber
- **Weekly Automation**: Scheduled scraper runs every Monday at 9:00 AM IST
- **RESTful API**: FastAPI backend with comprehensive endpoints
- **React Dashboard**: Modern UI to view journals, trademarks, and statistics
- **Search Functionality**: Full-text search across trademark data
- **MySQL Database**: Stores journals, PDFs, and trademark applications
- **Python 3.13 Compatible**: Fixed for latest Python version
- **Duplicate Prevention**: Automatically skips already downloaded PDFs
- **Data Cleanup**: One-click deletion of all data and downloaded files

---

## 🛠️ Technology Stack

### Backend
- **Python 3.13**
- **FastAPI 0.123.4** - Web framework
- **Playwright 1.56.0** - Web scraping (sync API for Python 3.13)
- **pdfplumber 0.11.8** - PDF text extraction
- **SQLAlchemy 2.0.44** - ORM
- **PyMySQL 1.1.2** - MySQL driver
- **APScheduler 3.11.1** - Task scheduling

### Frontend
- **React 18.2.0**
- **Vite 5.0.8** - Build tool
- **TanStack Query 5.14.2** - Data fetching
- **Tailwind CSS 3.3.6** - Styling
- **Axios 1.6.2** - HTTP client

### Database
- **MySQL 8.0+** with utf8mb4 character set

---

## 📦 Prerequisites

### Required Software

1. **Python 3.13**
   - Download: https://www.python.org/downloads/
   - Ensure "Add to PATH" is checked during installation

2. **Node.js 18+** and npm
   - Download: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

3. **MySQL 8.0+**
   - Download: https://dev.mysql.com/downloads/mysql/
   - Remember your root password during installation

4. **Git** (optional)
   - Download: https://git-scm.com/downloads

---

## 🚀 Installation

### Step 1: Clone/Extract Project

```powershell
# If using Git
git clone <repository-url>
cd RKD

# Or extract the ZIP file to C:\Users\acer\OneDrive\Desktop\RKD\
```

### Step 2: Database Setup

1. **Start MySQL Server** (if not already running)

2. **Create Database** - Run in MySQL Workbench or command line:

```sql
CREATE DATABASE IF NOT EXISTS trademark_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

3. **Create Tables** - Execute the schema:

```powershell
# Option 1: Using MySQL Workbench
# - Open database/schema.sql
# - Execute the SQL script

# Option 2: Using mysql command (if in PATH)
mysql -u root -p trademark_db < database/schema.sql
```

### Step 3: Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Install Playwright browser
python -m playwright install chromium
```

### Step 4: Frontend Setup

```powershell
# Open a NEW terminal window
cd frontend

# Install dependencies
npm install
```

---

## ⚙️ Configuration

### Backend Configuration

1. **Create Environment File**:

```powershell
cd backend
Copy-Item .env.example .env
```

2. **Edit `.env` file** with your settings:

```env
# Database Configuration
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/trademark_db

# Application Settings
SECRET_KEY=your-secret-key-change-this-in-production
DEBUG=True
ENVIRONMENT=development

# Server Settings
HOST=0.0.0.0
PORT=8000

# Scraper Settings
SCRAPER_SCHEDULE_ENABLED=True
SCRAPER_SCHEDULE_DAY=monday
SCRAPER_SCHEDULE_HOUR=9
SCRAPER_SCHEDULE_MINUTE=0
MAX_JOURNALS_TO_SCRAPE=2

# Download Settings
DOWNLOAD_DIR=downloads
DOWNLOAD_TIMEOUT=300

# PDF Processing
PDF_EXTRACTION_TIMEOUT=600

# Logging
LOG_LEVEL=INFO
LOG_FILE=app.log

# CORS (Important: JSON array format)
ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

**⚠️ IMPORTANT**: Replace `YOUR_PASSWORD` with your actual MySQL root password.

### Frontend Configuration

The frontend is pre-configured to connect to `http://localhost:8000`. If you change the backend port, update `frontend/src/services/api.ts`.

---

## 🏃 Running the Application

### Start Backend Server

```powershell
# In backend directory with virtual environment activated
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```

You should see:
```
✅ Database tables created/verified
✅ Scheduler started - next run: 2025-12-08 09:00:00+05:30
⏰ Scheduler started - runs every monday at 9:00
INFO:     Application startup complete.
```

Backend runs at: **http://localhost:8000**

### Start Frontend Development Server

```powershell
# In a NEW terminal window
cd frontend
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 📖 Usage

### Web Interface

1. **Open Browser**: Navigate to `http://localhost:5173`

2. **Dashboard**: View statistics and recent journals

3. **Trigger Scraper**:
   - Click "Run Scraper" button
   - Scraper downloads latest 2 PDFs
   - Extracts trademark data
   - Updates dashboard

4. **View Journals**: See all downloaded journals

5. **Search Trademarks**: Full-text search across applications

### API Endpoints

**API Documentation**: http://localhost:8000/docs

Key endpoints:
- `POST /api/scraper/run` - Trigger scraper manually
- `DELETE /api/scraper/cleanup` - Delete all data and PDF files ⚠️
- `GET /api/journals` - List all journals
- `GET /api/trademarks` - List trademark applications
- `GET /api/trademarks/search?q=query` - Search trademarks
- `GET /api/stats` - Get statistics

### Automated Schedule

The scraper automatically runs **every Monday at 9:00 AM IST** when enabled in `.env`.

---

## 📁 Project Structure

```
RKD/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.py          # Database connection
│   │   │   └── settings.py          # Environment settings
│   │   ├── models/
│   │   │   └── models.py            # SQLAlchemy models
│   │   ├── routes/
│   │   │   ├── journals.py          # Journal endpoints
│   │   │   ├── trademarks.py        # Trademark endpoints
│   │   │   ├── scraper.py           # Scraper control
│   │   │   ├── stats.py             # Statistics
│   │   │   └── schemas.py           # Pydantic schemas
│   │   ├── services/
│   │   │   ├── scraper_service.py   # Web scraping logic
│   │   │   └── pdf_extractor_service.py  # PDF extraction
│   │   └── schedulers/
│   │       └── weekly_scraper.py    # APScheduler config
│   ├── downloads/                   # Downloaded PDFs
│   ├── main.py                      # FastAPI app entry
│   ├── requirements.txt             # Python dependencies
│   └── .env                         # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── pages/                   # Page components
│   │   ├── services/                # API services
│   │   └── App.jsx                  # Main app
│   ├── package.json                 # Node dependencies
│   └── vite.config.js               # Vite configuration
│
├── database/
│   └── schema.sql                   # MySQL schema
│
└── README.md                        # This file
```

---

## 📚 API Documentation

### Scraper Endpoints

#### `POST /api/scraper/run`
Manually trigger the scraper.

**Response:**
```json
{
  "message": "Scraper started in background",
  "status": "running"
}
```

#### `GET /api/scraper/status`
Get scraper status and statistics.

#### `GET /api/scraper/logs?limit=20`
Get scraper execution logs.

### Journal Endpoints

#### `GET /api/journals?page=1&limit=20`
List all journals with pagination.

#### `GET /api/journals/{id}`
Get specific journal details.

### Trademark Endpoints

#### `GET /api/trademarks?page=1&limit=50`
List trademark applications with pagination.

#### `GET /api/trademarks/search?q=keyword`
Search trademarks by name, applicant, or description.

#### `GET /api/trademarks/{id}`
Get specific trademark details.

### Statistics Endpoints

#### `GET /api/stats`
Get overall statistics including:
- Total journals, PDFs, trademarks
- Latest journal info
- Class distribution
- Top applicants
- Office location breakdown

---

## 🔧 Troubleshooting

### Backend Won't Start

**Issue**: `ModuleNotFoundError` or import errors

**Solution**:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

**Issue**: Database connection error `Access denied for user 'root'@'localhost'`

**Solution**: Update `DATABASE_URL` in `.env` with correct password:
```env
DATABASE_URL=mysql+pymysql://root:YOUR_ACTUAL_PASSWORD@localhost:3306/trademark_db
```

---

**Issue**: `LookupError: 'pending' is not among the defined enum values`

**Solution**: Run the enum fix script:
```powershell
cd backend
python fix_enums.py
```

---

### Scraper Issues

**Issue**: No PDFs downloaded (0 PDFs found)

**Solution**: This is normal if the website structure changed. The debug output shows what's happening. The current implementation handles form-based downloads.

---

**Issue**: `NotImplementedError` with Playwright (Python 3.13)

**Solution**: Already fixed! The scraper uses sync Playwright API. See `PYTHON_313_FIX.md` for details.

---

### Frontend Issues

**Issue**: Cannot connect to backend

**Solution**: 
1. Ensure backend is running on port 8000
2. Check CORS settings in backend `.env`
3. Verify `ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:3000"]`

---

**Issue**: `npm install` fails

**Solution**:
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall
npm install
```

---

### Database Issues

**Issue**: Tables not created

**Solution**: Manually run schema:
```powershell
# In MySQL Workbench or command line
USE trademark_db;
SOURCE database/schema.sql;
```

---

**Issue**: Character encoding errors

**Solution**: Ensure database uses utf8mb4:
```sql
ALTER DATABASE trademark_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

---

## ⚠️ Important Notes

### Python 3.13 Compatibility

This project is **fully compatible with Python 3.13**. The Playwright scraper uses the **sync API** instead of async to avoid subprocess issues. See `PYTHON_313_FIX.md` for technical details.

### Enum Values

Enum values in the database are **UPPERCASE** (e.g., 'PENDING', 'PROCESSING', 'COMPLETED', 'ERROR'). If you encounter enum errors, run:
```powershell
cd backend
python fix_enums.py
```

### Download Directory

PDFs are saved to `backend/downloads/` organized by journal number. Ensure this directory has write permissions.

### Scheduled Jobs

The weekly scraper runs **every Monday at 9:00 AM IST**. To disable, set in `.env`:
```env
SCRAPER_SCHEDULE_ENABLED=False
```

### Form-Based Downloads

The IP India website uses **form submissions** (not direct links) to download PDFs. The scraper handles this by:
1. Finding forms in the download cell
2. Extracting hidden input values
3. **Checking if PDF already exists** (duplicate prevention)
4. Clicking submit buttons (only if PDF not found)
5. Capturing the download

### Duplicate Prevention

The scraper intelligently avoids re-downloading PDFs:
- ✅ Checks database for existing PDF records (by journal_id + filename)
- ✅ Checks disk for existing files
- ✅ Skips download if valid PDF already exists
- ✅ Creates DB record for orphaned files
- ✅ Deletes and re-downloads corrupted/empty files

This saves bandwidth and time on subsequent runs!

### Data Cleanup

**Delete All Data Button** (Dashboard top-right):
- ⚠️ **Permanently deletes**:
  - All database records (journals, PDFs, trademarks, scraper logs)
  - All downloaded PDF files from disk
- **Two-step confirmation** required:
  - Click once → button turns red
  - Click again within 3 seconds → confirms deletion
- **Cannot be undone** - use with caution!
- Useful for: Testing, resetting project, or clearing old data

### Resource Usage

- **Chromium Browser**: Playwright downloads ~241MB for the Chromium browser
- **PDF Storage**: Each journal PDF is typically 5-50 MB
- **Memory**: Backend uses ~200-500 MB RAM during scraping

---

## 🎯 Quick Start Summary

```powershell
# 1. Setup Database
mysql -u root -p
# CREATE DATABASE trademark_db CHARACTER SET utf8mb4;
# SOURCE database/schema.sql;

# 2. Backend Setup
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m playwright install chromium
Copy-Item .env.example .env
# Edit .env with your MySQL password

# 3. Frontend Setup (NEW terminal)
cd frontend
npm install

# 4. Start Backend
cd backend
.\venv\Scripts\Activate.ps1
python main.py

# 5. Start Frontend (NEW terminal)
cd frontend
npm run dev

# 6. Open Browser
# http://localhost:5173
```

---

## 📞 Support

### System Requirements
- **OS**: Windows 10/11, macOS, Linux
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB minimum for dependencies and downloads

### Target Website
**India Trademark Journal**: https://search.ipindia.gov.in/IPOJournal/Journal/Trademark

### Data Extracted
- Journal Number
- Publication Date
- Application Number
- Filing Date
- Trademark Name
- Applicant Name & Address
- Class Number
- Goods/Services Description
- Attorney Details
- Office Location

---

## 🔄 Maintenance

### Updating Dependencies

```powershell
# Backend
cd backend
.\venv\Scripts\Activate.ps1
pip install --upgrade -r requirements.txt

# Frontend
cd frontend
npm update
```

### Database Backup

```powershell
mysqldump -u root -p trademark_db > backup_$(Get-Date -Format 'yyyyMMdd').sql
```

### Clearing Old Data

```sql
-- Delete old journals (older than 6 months)
DELETE FROM journals 
WHERE publication_date < DATE_SUB(CURDATE(), INTERVAL 6 MONTH);
```

---

## 📄 License

This project is for educational purposes. Ensure compliance with IP India's terms of service when scraping their website.

---

## 🙏 Acknowledgments

- **IP India** for providing public trademark journal data
- **FastAPI** for the excellent web framework
- **Playwright** for robust web scraping
- **pdfplumber** for PDF text extraction

---

**Last Updated**: December 3, 2025  
**Version**: 1.0.0  
**Python**: 3.13+  
**Node.js**: 18+  
**MySQL**: 8.0+
