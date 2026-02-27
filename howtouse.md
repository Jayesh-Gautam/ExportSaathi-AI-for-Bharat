# 🚀 ExportSaathi – Setup & Run Guide

This guide will help you clone and run the project for the first time.

Repository:
[https://github.com/Jayesh-Gautam/ExportSaathi-AI-for-Bharat/tree/dev](https://github.com/Jayesh-Gautam/ExportSaathi-AI-for-Bharat/tree/dev)

---

# 📌 Prerequisites

Before starting, make sure you have installed:

* ✅ Git
* ✅ Python (3.9 or above)
* ✅ Node.js (LTS version recommended)
* ✅ npm (comes with Node.js)

You can check installations:

```
git --version
python --version
node --version
npm --version
```

---

# 1️⃣ Clone the Repository

Open **Command Prompt** or **PowerShell** and run:

```
git clone -b dev https://github.com/Jayesh-Gautam/ExportSaathi-AI-for-Bharat.git
```

Then move into the project folder:

```
cd ExportSaathi-AI-for-Bharat
```

---

# 🔷 Backend Setup (FastAPI)

## Step 1: Navigate to Backend Folder

```
cd backend
```

---

## Step 2: Create Virtual Environment

This creates an isolated Python environment for the project.

```
python -m venv venv
```

---

## Step 3: Activate Virtual Environment

On Windows:

```
.\venv\Scripts\activate
```

You should now see `(venv)` in your terminal.

---

## Step 4: Install Dependencies

```
pip install -r requirements.txt
```

This will install all required Python libraries.

---

## Step 5: Setup Environment Variables

Copy the example file:

```
copy .env.example .env
```

Now open the `.env` file and add your API keys and configuration values.

---

## Step 6: Start Backend Server

```
python -m uvicorn main:app --reload --port 8000
```

If successful, you should see:

```
Uvicorn running on http://127.0.0.1:8000
```

Backend is now running ✅

---

# 🔷 Frontend Setup (React + Vite)

Open a **new terminal window** (keep backend running).

---

## Step 1: Navigate to Frontend Folder

From project root:

```
cd frontend
```

---

## Step 2: Install Dependencies

```
npm install
```

This installs all required frontend packages.

---

## Step 3: Start Development Server

```
npm run dev
```

You should see something like:

```
Local: http://localhost:5173/
```

Open that URL in your browser.

Frontend is now running ✅

---

# 🎯 Final Result

* Backend running on → [http://127.0.0.1:8000](http://127.0.0.1:8000)
* Frontend running on → [http://localhost:5173](http://localhost:5173)

Make sure:

* Backend terminal stays open
* Frontend terminal stays open

---

# 🛠 Common Issues

### 1. Virtual environment not activating?

Use:

```
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try activating again.

### 2. Port already in use?

Change port:

```
python -m uvicorn main:app --reload --port 8001
```

---

# ✅ You're Ready!

Your ExportSaathi application should now be running locally.

If you want, I can also format this into a proper `README.md` file ready to push to GitHub.
