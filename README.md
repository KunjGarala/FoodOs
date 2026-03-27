# 🍴 FoodOs - Enterprise Restaurant Management System

![FoodOs Logo](Logo.svg)

> **FoodOs** is a comprehensive, production-grade Restaurant Management System (RMS) designed to streamline operations from the point of sale (POS) to the kitchen and beyond. 

---

## 🚀 Overview

FoodOs provides a robust ecosystem for managing modern restaurant workflows. It features a real-time order tracking system, kitchen management, and a 3D-enhanced landing page for a premium customer experience.

### 🌟 Key Highlights
- **Architecture**: Domain-Driven Design (DDD) with a micro-monolith structure.
- **Real-Time**: WebSocket-powered live updates for Kitchen and Table status.
- **Scalable**: Pagination, optimized queries, and AWS S3 integration.
- **Security**: JWT-based authentication with Role-Based Access Control (RBAC).

---

## 🛠️ Tech Stack

### **Backend (Spring Boot)**
*   **Language**: Java 21
*   **Framework**: Spring Boot 3.5.7
*   **Database**: PostgreSQL (Production), H2 (Development/Testing)
*   **Auth**: Spring Security, JWT (jjwt), Google OAuth2
*   **Storage**: AWS S3 (via SDK v2)
*   **Real-time**: STOMP WebSockets
*   **Documentation**: Springdoc OpenAPI (Swagger UI)

### **Frontend (React)**
*   **Framework**: Vite + React 19
*   **State Management**: Redux Toolkit
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **3D Elements**: Three.js, React Three Fiber, R3F Drei
*   **API Client**: Axios

---

## 📦 Core Modules

### 📋 Order Management
A complete state-machine driven order system supporting:
- **Dine-in, Takeaway, and Delivery** order types.
- **Dynamic Item Management**: Add/remove items with modifiers.
- **Partial Payments**: Support for 8+ payment methods and split billing.
- **UUID Integration**: Secure, non-sequential identifiers for all public-facing IDs.

### 👨‍🍳 Kitchen Order Ticket (KOT)
Streamlined kitchen operations:
- **Station-wise Routing**: Send tickets to specific kitchen sections.
- **Real-time Preparation Tracking**: Live status updates from the kitchen dashboard.
- **Priority Management**: Highlight urgent or modified orders.

### 🍔 Product & Menu Management
Comprehensive catalog management:
- **Modifier Groups**: Manage variations and add-ons efficiently.
- **Stock Management**: Track availability at the product level.
- **Image Hosting**: Direct integration with AWS S3 for product visuals.

### 🪑 Table & Floor Management
- **Visual Table Layout**: Real-time status tracking (Available, Occupied, Dirty).
- **RBAC**: Fine-grained permissions for Waiters, Chefs, and Managers.

---

## 📂 Project Structure

```bash
FoodOs-Workspace/
├── FoodOs/                 # Backend (Spring Boot)
│   ├── src/main/java       # Source code (DDD Structure)
│   ├── src/main/resources  # Configuration & SQL migrations
│   └── pom.xml             # Maven dependencies
├── FoodOs-Frontend/        # Frontend (React + Vite)
│   ├── src/                # Components, Pages, Redux Logic
│   ├── public/             # Static Assets
│   └── package.json        # Node dependencies
└── README.md               # Main Project Documentation
```

---

## 🏁 Getting Started

### 1️⃣ Prerequisites
- **Java**: JDK 21+
- **Node.js**: v18+ (LTS recommended)
- **PostgreSQL**: Running instance with a database named `foodos`.
- **AWS S3**: Bucket and Credentials (for image uploads).

### 2️⃣ Backend Setup
1. Navigate to the `FoodOs` directory.
2. Update `src/main/resources/application.properties` with your database credentials.
3. Run the application:
   ```bash
   mvn spring-boot:run
   ```
   *The backend will be available at `http://localhost:8081`.*

### 3️⃣ Frontend Setup
1. Navigate to the `FoodOs-Frontend` directory.
2. Create a `.env` file (refer to `.env.example` if available):
   ```env
   VITE_API_BASE_URL=http://localhost:8081
   VITE_GOOGLE_CLIENT_ID=your_google_id
   ```
3. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`.*

---

## 📖 API Documentation
Once the backend is running, you can access the interactive API documentation:
- **Swagger UI**: `http://localhost:8081/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:8081/v3/api-docs`

---

## 🛡️ Quality & Performance
- **DDD Implementation**: Aggregate roots (Order) manage children (OrderItems) for consistency.
- **N+1 Prevention**: Strategic use of `@EntityGraph` and joint fetches.
- **Audit Trail**: Tracking created/modified metadata via `BaseSoftDeleteEntity`.
- **Soft Delete**: Safeguarding data against accidental deletion.

---

## 🤝 Contributing
For detailed information on specific modules, please refer to:
- [Order System Documentation](FoodOs/ORDER_SYSTEM_DOCUMENTATION.md)
- [Architecture Diagram](FoodOs-Frontend/ARCHITECTURE_DIAGRAM.md)

---

## 📝 License
This project is proprietary and for internal use only.

---
*Developed with ❤️ by the FoodOs Team.*
