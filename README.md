# 🏗️ FieldBook - Contractor Business Management System

FieldBook is a comprehensive MERN-stack platform designed for waterproofing, heatproofing, and general contractors to manage projects, finances, labor, and suppliers in one centralized location. It features a robust admin panel and a simplified interface for site workers.

## 🚀 Key Features

### 📊 Professional Admin Dashboard
*   **Real-time Metrics:** Tracks Active Projects, Total Revenue Collected, Consolidated Customer Receivables, Supplier Dues, and Pending Labor Payments.
*   **Interactive Shortcuts:** Includes a clickable mini-attendance calendar for quick navigation to history.
*   **Activity Feeds:** View recent projects and see which sites are active today at a glance.
*   **Automated Alerts:** Warning system for site images scheduled for deletion.

### 💼 Project & Customer Management
*   **Financial Tracking:** Precision tracking of "Total Cost", "Paid Till Now", and "Amount Receivable" across all projects.
*   **Integrated Workflow:** Create new projects directly from a customer's detail page with pre-filled data.
*   **Payment History:** Log multiple payments for each project with date and method tracking.
*   **Data Integrity:** Intelligent deletion restrictions—cannot delete customers or projects with outstanding balances.

### 👷 Labor & Attendance System
*   **Flexible Onboarding:** Add laborers with optional email/password for those without digital access.
*   **Consolidated Attendance:** Admin view to see all worker presence on any selected date with status-based highlighting (Green for Present, Red for Absent).
*   **Laborer Home:** A mobile-optimized worker portal featuring:
    *   A large interactive attendance calendar with visual "Present" markers.
    *   The ability to upload multiple site photos directly to assigned projects.
    *   Personal earnings summary showing "Total Received" and "Remaining".

### 📦 Supplier & Material Tracking
*   **Smart Merging:** Automatically merges duplicate supplier records based on phone numbers, consolidating payment history and material logs.
*   **Auto-Calculated Totals:** "Total Purchased" is automatically derived from the grand total of all materials logged.
*   **Inventory Integration:** Link materials directly to projects to track usage and site costs.

### 📄 Invoicing & Reporting
*   **Customer Statements:** Aggregated invoicing view showing total outstanding balance across all projects for each customer.
*   **Professional PDFs:** Generate secure "Outstanding Statement" PDFs listing project breakdowns and grand totals.
*   **Focused View:** The invoice list automatically filters out cleared accounts to focus on pending collections.

### 🖼️ Site Image Gallery
*   **Cloud Storage:** Integrated with Cloudinary for secure image hosting.
*   **Collaborative Uploads:** Both admins and laborers can contribute site photos.
*   **Management:** Centralized gallery for admins to view, download, or manually delete site images.

### 📱 Mobile-First Design
*   **Responsive UI:** Entire application is optimized for smartphones.
*   **Table-to-Card:** Data tables automatically transform into readable cards on narrow screens.
*   **Adaptive Navigation:** Sidebar for desktop and an intuitive bottom navigation bar for mobile users.

---

## 🛠️ How to Run the Project

Follow these steps to get the project running on your local machine.

### Prerequisites
*   **Node.js** (v16 or higher)
*   **MongoDB Atlas** account (or local MongoDB instance)
*   **Cloudinary** account (for image uploads)

### Step 1: Install Dependencies
Open your terminal and run the following commands:

```bash
# Install Backend dependencies
cd server
npm install

# Install Frontend dependencies
cd ../client
npm install
```

### Step 2: Environment Configuration
Create a `.env` file in the **server** directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Create a `.env` file in the **client** directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start the Application
You can start both servers simultaneously using the provided scripts in the root folder:

**Windows:**
```bash
./start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

*Alternatively, run them in separate terminals:*
*   **Backend:** `cd server && npm run dev` (Runs on http://localhost:5000)
*   **Frontend:** `cd client && npm run dev` (Runs on http://localhost:5173)

### Step 4: Default Login
The system automatically seeds a default administrator account on first run:
*   **Email:** `admin@fieldbook.com`
*   **Password:** `admin123`

---
**FieldBook** - Streamlining contractor operations through smart management. 🏗️
