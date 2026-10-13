# 📊 Connecting GLIM Cab Share to Google Sheets (Cloud Excel)

With Google Sheets, your GLIM Cab Share app has a **100% free, real-time cloud database**.
- Every ride posted or seat updated immediately appears as a row in your spreadsheet.
- All students on different laptops and mobile phones stay **100% synchronized in real time** on Netlify.
- You can view, filter, or export to Microsoft Excel (`.xlsx`) directly anytime!

---

## 🚀 3-Minute Setup Guide

### Step 1: Create a Blank Google Sheet
1. Open your browser and go to: [sheets.new](https://sheets.new)
2. Name your spreadsheet: **`GLIM Cab Share Database`**

---

### Step 2: Paste the Apps Script Code
1. In your Google Sheet, click on the top menu: **Extensions** ➔ **Apps Script**.
2. Delete whatever default code is inside `Code.gs`.
3. Open the [`GoogleAppsScript.js`](file:///C:/Users/Ankit/Desktop/cabSharingApp/GoogleAppsScript.js) file from this repository.
4. Copy all its contents and paste it into the Google Apps Script editor.
5. Click the **Save** icon (💾) or press `Ctrl + S`.

---

### Step 3: Deploy as a Web App
1. At the top right of Apps Script, click the blue **Deploy** button ➔ **New deployment**.
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**.
3. Fill in these settings:
   - **Description**: `GLIM Cab Share API`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: **`Anyone`** *(Important: Must be 'Anyone' so the app can fetch/post rides)*
4. Click **Deploy**.
5. Google will ask you to **Authorize access**:
   - Click *Review permissions*
   - Choose your Google account
   - Click *Advanced* (bottom left) ➔ Click *Go to Untitled project (unsafe)*
   - Click *Allow*.
6. Copy the generated **Web App URL** (it looks like `https://script.google.com/macros/s/AKfycb.../exec`).

---

### Step 4: Connect the URL in the App
1. Open the GLIM Cab Share app (locally or on your Netlify URL).
2. Click the **📊 Google Sheet Sync** button in the top navigation or settings.
3. Paste your **Web App URL** and click **Connect & Save**.
4. The status badge will turn **🟢 Cloud Connected**.
5. Done! All students on Netlify will now read and write directly to your Google Sheet!

---

## 📑 Spreadsheet Tabs Created Automatically

The script automatically creates and formats 3 tabs with bold headers:

1. **`Rides`**: Contains all rides (`id`, `student_id`, `origin`, `destination`, `travel_date`, `travel_time`, `total_seats`, `filled_seats`, `notes`, `status`).
2. **`Students`**: Records student registrations, names, and phone numbers.
3. **`OTPs`**: Records security verification codes with timestamps.

---

## 📥 Exporting to Microsoft Excel (`.xlsx`)
Whenever you want an offline copy:
- In your Google Sheet, click **File** ➔ **Download** ➔ **Microsoft Excel (.xlsx)**.
