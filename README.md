# Ordoo Backend API

Node.js backend API for the Ordoo application with authentication, user management, and profile features.

## Features

- User authentication (signup, login, OTP verification)
- Password reset functionality
- User profile management
- JWT-based authentication
- MySQL database integration
- Email notifications
- Input validation and error handling

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Copy `.env` file and update with your database and email credentials
   - Update database connection details
   - Set JWT secret key
   - Configure email settings for OTP and password reset

3. **Database Setup**
   - Create MySQL database named `ordoo_db`
   - Run the SQL scripts from `../../DataBase/ordoo-auth-service-tables/users.sql`

4. **Start the Server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /signup` - User registration
- `POST /login` - User login
- `POST /send-otp` - Send OTP for verification
- `POST /verify-otp` - Verify OTP code
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token

### User Routes (`/api/user`)

- `GET /profile` - Get user profile (protected)
- `PUT /profile` - Update user profile (protected)
- `POST /profile/setup` - Initial profile setup (protected)

### Health Check

- `GET /api/health` - Server health status

## Request/Response Examples

### Signup
```json
POST /api/auth/signup
{
  "email": "user@example.com",
  "phone_number": "+1234567890",
  "password": "password123"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Profile Update
```json
PUT /api/user/profile
Authorization: Bearer <token>
{
  "full_name": "John Doe",
  "gender": "male",
  "dob": "1990-01-01",
  "bio": "Software developer",
  "location": "New York"
}
```

## Environment Variables

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ordoo_db
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Project Structure

```
BackEnd/ordoo/
├── config/
│   └── database.js
├── controllers/
│   ├── authController.js
│   └── userController.js
├── middleware/
│   └── auth.js
├── models/
│   ├── User.js
│   └── UserProfile.js
├── routes/
│   ├── auth.js
│   └── user.js
├── utils/
│   └── helpers.js
├── .env
├── .gitignore
├── package.json
└── server.js
```