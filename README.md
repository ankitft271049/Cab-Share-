# 🚖 GLIM Cab Share

[![Deploy to Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white)](https://www.netlify.com/)
[![Database: Google Sheets](https://img.shields.io/badge/Database-Google%20Sheets-34A853?style=flat-square&logo=googlesheets&logoColor=white)](https://docs.google.com/spreadsheets)
[![GLIM Campus](https://img.shields.io/badge/Campus-GLIM%20Chennai-0A192F?style=flat-square&logo=googlemaps&logoColor=D4AF37)](https://www.greatlakes.edu.in/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

A lightweight, serverless cab-sharing and travel-buddy matching platform for students of **Great Lakes Institute of Management (GLIM, Manamai / ECR)**. 

Students can coordinate shared rides to and from **Chennai Airport (MAA)**, **Chennai Central (MAS)**, **Chennai Egmore (MS)**, **CMBT / Kilambakkam**, and **Tambaram** during term breaks and weekends.

---

## ✨ Features

- **🎓 Direct Student Login**: Simple sign-in with Roll Number (FT/DM), Full Name, and WhatsApp Number.
- **🎯 Smart Route Matching**: Matches students traveling on the same route within **±60 minutes** of each other, plus lists same-day alternatives.
- **👥 Live Seat Management**: Track occupancy dynamically (e.g., *2 of 3 seats filled*). Ride owners can increment/decrement co-passengers with 1 click.
- **💬 1-Click WhatsApp Connect**: Open pre-filled peer-to-peer WhatsApp chats directly from match cards.
- **📊 Real-Time Google Sheets Cloud Sync**: Free, multi-device cloud database running on Google Apps Script without traditional server hosting bills.
- **⚡ Automated Nightly Archiving**: Cleans past/completed rides automatically every night to keep searches lightning fast.
- **👑 Admin Controls**: Cloud sync configuration and global moderation restricted to Admin roll number (`FT271049`).

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, Vanilla CSS3 (GLIM Navy & Gold design system), Vanilla JavaScript (ES6+) |
| **Backend** | Google Apps Script (Serverless V8 Web App) |
| **Database** | Google Sheets (`Students`, `Rides`, `Archived_Rides`, `OTPs`) |
| **Hosting** | Netlify Edge CDN (100% self-contained single-page bundle) |
| **Local Dev** | Node.js, Express.js, SQLite (`better-sqlite3`) |

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/glim-cab-share.git
cd glim-cab-share

# 2. Install dependencies
npm install

# 3. Start local development server
npm start
# App running at http://localhost:3000
```

---

## 🌐 Deploy to Netlify (Production)

This project includes a custom zero-dependency bundler that compiles the entire app into a self-contained single-page distribution to eliminate Netlify MIME-type / routing conflicts:

```bash
# Build the production bundle
node build.js
```

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop the generated **`dist/`** folder (or **`dist.zip`**).
3. Your app is live with HTTPS!

---

## 📊 Google Sheets Cloud Sync Setup

1. Open a blank Google Sheet at [sheets.new](https://sheets.new).
2. Go to **Extensions** ➔ **Apps Script**.
3. Paste the contents of [`GoogleAppsScript.js`](./GoogleAppsScript.js) and click **Save**.
4. Click **Deploy** ➔ **New deployment** ➔ Type: **Web app**
   - Execute as: *Me*
   - Who has access: *Anyone*
5. Copy the generated Web App URL and paste it into the **Cloud Sync** modal in the app.

---

## 🔒 Security & Admin

- **Admin Roll Number**: `FT271049` (Ankit Agrawal)
- Admin can manage cloud sync connections, run on-demand database archiving, and moderate any ride post campus-wide.

---

## 📄 License

This project is licensed under the MIT License - feel free to adapt it for your campus community!
