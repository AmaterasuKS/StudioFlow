# Backend Testing Guide

This guide contains copy-paste commands for running and testing the StudioFlow backend.

## 1. Run the Backend

```powershell
cd "c:\Users\sverb\OneDrive\Рабочий стол\IT\Для работы\Amaterasu Studio\StudioFlow\Backend\StudioFlow.API"
dotnet restore
dotnet ef database update
dotnet run
```

Default local URL:
- `https://localhost:7xxx`
- `http://localhost:5xxx`

Use your actual port from console output.

## 2. cURL Examples (Postman-ready)

Set your base URL first:

```powershell
$BASE_URL = "https://localhost:7001"
```

### Register

```bash
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@studioflow.com",
    "password": "password123",
    "confirmPassword": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login

```bash
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@studioflow.com",
    "password": "password123"
  }'
```

### Create Booking (Bearer token required)

```bash
curl -X POST "$BASE_URL/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "studioId": 1,
    "bookingDate": "2026-02-20T00:00:00Z",
    "startTime": "10:00:00",
    "endTime": "12:00:00"
  }'
```

### Get My Bookings (Bearer token required)

```bash
curl -X GET "$BASE_URL/api/bookings" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Booking Status (Manager/Admin role required)

```bash
curl -X PUT "$BASE_URL/api/bookings/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": 1
  }'
```

`status` values:
- `0` = Pending
- `1` = Confirmed
- `2` = Cancelled

### Get All Users (Admin role required)

```bash
curl -X GET "$BASE_URL/api/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 3. Test Credentials

- Admin: `admin@studioflow.com` / `password123`
- Manager: `manager@studioflow.com` / `password123`
- User: `user@studioflow.com` / `password123`

If the `User` account does not exist yet, create it via `POST /api/auth/register`.
