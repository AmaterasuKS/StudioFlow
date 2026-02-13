# StudioFlow

StudioFlow is a full-stack studio booking platform for musicians, podcasters, and creative teams.

It includes role-based access for `User`, `Manager`, and `Admin`, secure JWT authentication, and booking workflows with conflict validation.

## Tech Stack

### Backend
- ASP.NET Core Web API (.NET 8)
- Entity Framework Core
- SQLite
- JWT Bearer Authentication
- BCrypt password hashing
- Swagger / OpenAPI

### Frontend
- HTML5
- Tailwind CSS (CDN setup)
- Vanilla JavaScript (modular architecture)
- LocalStorage-based session handling

## Core Features

- User registration and login
- JWT-based auth and role-based authorization
- Studio catalog and booking creation
- Booking conflict detection (time overlap checks)
- Booking status management (`Pending`, `Confirmed`, `Cancelled`)
- User dashboard for personal bookings
- Manager dashboard for booking operations
- Admin dashboard for user management and platform stats
- Profile page with account data and booking history

## Project Structure

```text
StudioFlow/
├── Backend/
│   ├── StudioFlow.API/
│   │   ├── Controllers/
│   │   ├── Data/
│   │   ├── Middleware/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Program.cs
│   │   └── appsettings*.json
│   └── TESTING.md
├── Frontend/
│   ├── components/
│   ├── css/
│   ├── js/
│   ├── pages/
│   └── index.html
└── README.md
```

## Getting Started

## 1. Backend

```powershell
cd Backend/StudioFlow.API
dotnet restore
dotnet ef database update
dotnet run
```

Backend endpoints:
- API base: `http://localhost:5000/api`
- Swagger: `http://localhost:5000/swagger/index.html`

## 2. Frontend

From project root:

```powershell
npx serve Frontend -l 5173
```

Frontend URL:
- `http://localhost:5173/`

## Demo Accounts

Use the seeded/test accounts configured in your current database migration/app setup.

If credentials were changed during development, update this section with your final values before sharing.

## Security Notes

- Never commit real secrets, production keys, or real user data.
- Store sensitive values in environment variables or secret managers.
- All sample accounts and data in this project are for demo/testing only.

## Screenshots

### Landing Page
<img width="1903" height="994" alt="image" src="https://github.com/user-attachments/assets/0c8e149d-1ea1-479b-92bd-0d255f45c5d7" />


### Login Page
<img width="1904" height="993" alt="image" src="https://github.com/user-attachments/assets/762cb921-120c-4fa7-ba83-838989f3319c" />


### User Dashboard
<img width="1904" height="991" alt="image" src="https://github.com/user-attachments/assets/8043235b-70b6-4b07-9628-a298e18c74cd" />


### Manager Dashboard
<img width="1904" height="991" alt="image" src="https://github.com/user-attachments/assets/b8d214f7-abd9-4112-8308-53b9e08734b1" />


### Admin Dashboard
<img width="1900" height="993" alt="image" src="https://github.com/user-attachments/assets/92882d4a-8c8f-408f-84b9-278651b1b10f" />


### Profile Page
<img width="1905" height="990" alt="image" src="https://github.com/user-attachments/assets/255f4dfe-9545-4252-a3b1-14366f35c3e0" />


## API Testing

Detailed API request examples are available in:
- `Backend/TESTING.md`

## Status

Current branch is production-ready for local demo and portfolio presentation.
