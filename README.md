# Vehicle Maintenance Management System (React Web App Prototype)

A clean, responsive desktop-first **Vehicle Maintenance Management System** built with **React.js**, **Tailwind CSS**, and **Vite** for a college project review.

![Vehicle Maintenance System](https://img.shields.io/badge/Status-Prototype-emerald)
![Tech Stack](https://img.shields.io/badge/Tech-React_18_%7C_Tailwind_CSS_%7C_Vite-blue)

---

## 🚗 Features Overview

- **Dashboard**: High-level KPIs (Total Vehicles, Services Due, Open Repairs, Total Maintenance Cost), service warning banner, upcoming service schedule, and recent maintenance activity.
- **Vehicles Directory**: Interactive fleet table with search, vehicle type filters (Car/Scooter), status filters (Active/Service Due/Under Repair), **Add Vehicle modal form**, and **View Vehicle Details overview modal**.
- **Maintenance Logs**: Log table for routine servicing and repair jobs with mileage tracking, costs, descriptions, and an **Add Maintenance Event modal**.
- **Spare Parts Inventory**: Parts replacement records (Part Name, Vehicle, Quantity, Replacement Date, Cost) with an **Add Spare Part modal**.
- **Financial & Cost Breakdown**: Total maintenance expenditure, routine service vs repair vs parts breakdown, SVG cost distribution bar chart, and vehicle-wise expense summary.
- **Chronological History**: Audit log timeline with vehicle dropdown filtering.

---

## 🛠️ Project Structure

```
vehicle-maintenance-app/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── src/
    ├── index.css                   # Theme styles & table utilities
    ├── dummyData.js                # Initial dataset (Cars & Scooters)
    ├── App.jsx                     # State manager & navigation router
    ├── main.jsx                    # React 18 entry point
    ├── components/
    │   ├── Sidebar.jsx             # Left desktop sidebar
    │   ├── Header.jsx              # Header bar with active tab title
    │   └── Modal.jsx               # Reusable dialog backdrop wrapper
    └── pages/
        ├── LoginPage.jsx           # Demo authentication page
        ├── DashboardPage.jsx       # Overview KPI cards & tables
        ├── VehiclesPage.jsx        # Vehicle directory table & forms
        ├── VehicleDetailsModal.jsx # Vehicle profile & history modal
        ├── MaintenancePage.jsx     # Service & repair logs table
        ├── SparePartsPage.jsx      # Spare parts inventory log
        ├── CostsPage.jsx           # Expense analysis & SVG charts
        └── HistoryPage.jsx         # Chronological audit timeline
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm / yarn

### Installation & Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/Anantha534/vehicle-maintenance-management-system.git
   cd vehicle-maintenance-management-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:3000/`.

---

## 📄 License
This project is created for educational/academic project review purposes.
