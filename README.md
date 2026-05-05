# 🚗 Vehicle Rental System

> A production-ready REST API for managing vehicle rentals for vehicles, customers, bookings, and role-based authentication, built with Node.js, TypeScript, Express, and PostgreSQL.

🌐 **Live URL:** `https://vehicle-rental-system-rose.vercel.app`

---

## Features

- **Authentication**: JWT-based login and registration with bcrypt password hashing
- **Role-Based Access Control**: `admin` and `customer` roles with per-route authorization
- **Vehicle Management**: Full CRUD for vehicles with availability tracking (`available` / `booked`)
- **Customer Management**: Admin can manage all users; customers can update their own profile
- **Booking System**: Create bookings with automatic price calculation and vehicle status updates
- **Booking Lifecycle**: Customers can cancel (before start date); admins can mark as returned
- **Auto-Return**: Bookings past their end date are automatically marked as `returned` and vehicles freed
- **Deletion Guards**: Users and vehicles with active bookings cannot be deleted
- **Atomic Transactions**: Booking creation, cancellation, and return use PostgreSQL transactions for data consistency
- **Modular Architecture**: Feature-based modules with clean `routes → controller → service` separation

---

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js v5 |
| Database | PostgreSQL |
| Authentication | JSON Web Token |
| Password Hashing | `bcryptjs` |

---

## API Endpoints

All protected routes require `Authorization: Bearer <token>` in the request header.

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/v1/auth/signup` | Public | Register a new user |
| POST | `/api/v1/auth/signin` | Public | Login and receive a JWT |

### Vehicles

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/v1/vehicles` | Admin | Add a new vehicle |
| GET | `/api/v1/vehicles` | Public | List all vehicles |
| GET | `/api/v1/vehicles/:vehicleId` | Public | Get a single vehicle |
| PUT | `/api/v1/vehicles/:vehicleId` | Admin | Update vehicle details |
| DELETE | `/api/v1/vehicles/:vehicleId` | Admin | Delete vehicle (no active bookings) |

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/v1/users` | Admin | List all users |
| PUT | `/api/v1/users/:userId` | Admin or Own | Update user profile |
| DELETE | `/api/v1/users/:userId` | Admin | Delete user (no active bookings) |

### Bookings

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/v1/bookings` | Admin or Customer | Create a booking |
| GET | `/api/v1/bookings` | Admin or Customer | Admin: all bookings Customer: own bookings |
| PUT | `/api/v1/bookings/:bookingId` | Admin or Customer | Customer: cancel Admin: mark returned |

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/Hossain-Md-Shahriar/vehicle-rental-system.git
cd vehicle-rental-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env` (see [Environment Variables](#environment-variables) below).

### 4. Create the PostgreSQL database

```sql
CREATE DATABASE vehicle_rental;
```

> **Note:** Table creation is fully automated. When the server starts, it runs `initDB()` which issues `CREATE TABLE IF NOT EXISTS` for all three tables. You do not need to run any migration scripts.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `5000` |
| `CONNECTION_STR` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/vehicle_rental` |
| `JWT_SECRET` | Secret key used to sign JWTs | `my_super_secret_key` |

**Example `.env` file:**

```env
PORT=5000
CONNECTION_STR=postgresql://postgres:password@localhost:5432/vehicle_rental
JWT_SECRET=your_jwt_secret_key_here
```

---

## Running the Project

### Development (hot reload)

```bash
npm run dev
```

The server starts on the configured `PORT` (default `5000`) with hot reload via `tsx watch`. Any file change restarts the server automatically — no build step required.

### Verify the server is running

```bash
curl http://localhost:5000/
# {"success":true,"message":"Vehicle Rental API is running"}
```

---

## Authentication

### Register a new user

```bash
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "securePassword123",
    "phone": "01712345678",
    "role": "customer"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securePassword123"
  }'
```

The response includes a `token`. Use it in all protected requests:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens are valid for **7 days**.

---

## Business Logic

### Price Calculation

Total price is automatically calculated when a booking is created:

```
total_price = daily_rent_price × number_of_days
number_of_days = rent_end_date − rent_start_date
```

### Vehicle Availability

| Event | Vehicle status change |
|---|---|
| Booking created | `available` → `booked` |
| Booking cancelled | `booked` → `available` |
| Booking marked returned | `booked` → `available` |
| Auto-return triggered | `booked` → `available` |

### Auto-Return

On every call to `GET /api/v1/bookings`, the system checks for any active bookings where `rent_end_date` has passed. Those bookings are automatically transitioned to `returned` and their vehicles are freed — no cron job required.

### Cancellation Rules

- Only the **customer who owns the booking** can cancel it
- Cancellation is only allowed **before the `rent_start_date`**
- Only `active` bookings can be cancelled

### Deletion Constraints

- A **user** cannot be deleted if they have any bookings with `status = 'active'`
- A **vehicle** cannot be deleted if it has any bookings with `status = 'active'`

### Role Permissions Summary

| Action | Admin | Customer |
|---|---|---|
| View all users | ✅ | ❌ |
| Update any user | ✅ | ❌ |
| Update own profile | ✅ | ✅ |
| Manage vehicles | ✅ | ❌ |
| View all bookings | ✅ | ❌ |
| View own bookings | ✅ | ✅ |
| Create booking | ✅ | ✅ |
| Cancel booking | ❌ | ✅ (own, before start) |
| Mark booking returned | ✅ | ❌ |

---

## Response Format

All endpoints follow a consistent envelope:

**Success**
```json
{
  "success": true,
  "message": "Operation description",
  "data": { }
}
```

**Error**
```json
{
  "success": false,
  "message": "Error description",
  "errors": "Detailed error message"
}
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK — successful GET / PUT / DELETE |
| 201 | Created — successful POST |
| 400 | Bad Request — validation error or constraint violation |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — valid token but insufficient permissions |
| 404 | Not Found — resource does not exist |
| 500 | Internal Server Error |