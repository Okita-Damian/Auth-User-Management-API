# Authentication API

A secure Authentication API built with **Node.js, Express.js, MongoDB, JWT, Joi, and Brevo Email API**. The API provides user registration, email verification via OTP, login, password reset, token refresh, logout, and rate-limited security flows.

---

## Project Structure

```text
src/
│
├── controller/
│   └── authController.js
│
├── routes/
│   └── authRoute.js
│
├── model/
│   └── authModel.js
│
├── service/
│   ├── authService.js
│   ├── otpService.js
│   └── emailService.js
│
├── validation/
│   └── authValidation.js
│
├── middleware/
│   ├── asyncHandler.js
│   ├── validate.js
│   └── rateLimiting.js
│
├── utils/
│   ├── appError.js
│   └── logger.js
│
├── app.js
│
└── server.js
```

### Notes

- `controller/` contains request handling logic.
- `routes/` defines HTTP endpoints and middleware order.
- `service/` contains business logic for authentication, OTP generation, and email delivery.
- `validation/` contains Joi request validation schemas.
- `middleware/` contains reusable middleware such as validation, rate limiting, and async error handling.
- `utils/` contains helper classes and utilities.

---

## Features

- User registration with email OTP verification
- Email delivery powered by Brevo
- JWT access and refresh token authentication
- Refresh token storage and rotation
- Secure logout flow
- Forgot password and password reset via OTP
- OTP resend functionality
- Rate limiting for login and OTP endpoints
- Centralized error handling
- Request validation using Joi
- Structured application logging

---

## Technologies Used

- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Token (JWT)
- Joi Validation
- Brevo Email API
- bcryptjs
- express-rate-limit

---

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

JWT_KEY=your_access_token_secret
JWT_REFRESH_KEY=your_refresh_token_secret

BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_verified_sender_email
```

---

## Base Route

All authentication routes are prefixed with:

```text
/auth
```

---

# Authentication Endpoints

## 1. Register

### Endpoint

```http
POST /auth/register
```

### Description

- Creates a new user account
- Hashes the user's password
- Generates an email verification OTP
- Sends the OTP through Brevo Email API

### Request Body

```json
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "Registration successful. Please check your email for OTP verification."
}
```

---

## 2. Verify OTP

### Endpoint

```http
POST /auth/verify-otp
```

### Description

- Verifies a previously generated OTP
- Activates user email verification
- Deletes OTP after successful verification

### Request Body

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "Email verified successfully."
}
```

---

## 3. Resend OTP

### Endpoint

```http
POST /auth/resend-otp
```

### Description

- Generates a new OTP
- Sends a replacement OTP through Brevo
- Subject to rate limiting

### Request Body

```json
{
  "email": "john@example.com",
  "purpose": "verify-email"
}
```

### Allowed Purposes

```text
verify-email
reset-password
```

### Success Response

```json
{
  "status": "success",
  "message": "OTP sent successfully."
}
```

---

## 4. Login

### Endpoint

```http
POST /auth/login
```

### Description

- Verifies user credentials
- Ensures email has been verified
- Generates access and refresh tokens
- Stores refresh token in the database

### Request Body

```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "Login successful",
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

---

## 5. Request Password Reset

### Endpoint

```http
POST /auth/request-password-reset
```

### Description

- Generates password reset OTP
- Sends OTP through Brevo Email API
- Returns a generic response to prevent email enumeration attacks

### Request Body

```json
{
  "email": "john@example.com"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "If the email exists, a password reset OTP has been sent."
}
```

---

## 6. Reset Password

### Endpoint

```http
POST /auth/reset-password
```

### Description

- Verifies password reset OTP
- Prevents password reuse
- Updates user password
- Deletes OTP after successful reset

### Request Body

```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123"
}
```

### Success Response

```json
{
  "status": "success",
  "message": "Password reset successful."
}
```

---

## 7. Logout

### Endpoint

```http
POST /auth/logout
```

### Description

- Removes refresh token from the database
- Invalidates the user session

### Success Response

```json
{
  "status": "success",
  "message": "Logged out successfully."
}
```

---

## 8. Refresh Token

### Endpoint

```http
POST /auth/refresh-token
```

### Description

- Validates refresh token
- Issues a new access token
- Rotates refresh token

### Success Response

```json
{
  "status": "success",
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

---

# Validation & Middleware

### Joi Validation

All incoming requests are validated before reaching the controller layer.

### Async Handler

All asynchronous route handlers are wrapped to ensure proper error propagation.

### Rate Limiting

Rate limiting is applied to sensitive authentication endpoints to prevent abuse.

---

# Rate Limiting Rules

| Route Type       | Limit                     |
| ---------------- | ------------------------- |
| Login            | 5 attempts / 10 minutes   |
| OTP Verification | 3 attempts / 30 minutes   |
| Password Reset   | 3 attempts / 30 minutes   |
| General Requests | 100 requests / 15 minutes |

---

# Security Features

- Passwords hashed using bcrypt
- Email verification required before login
- Single-use OTPs
- OTP expiration support
- Refresh token rotation
- Secure JWT authentication
- Centralized error handling
- Protection against email enumeration
- Request rate limiting
- Environment variable configuration

---

# Running the Application

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Server URL:

```text
http://localhost:3000
```

---

# Recommended Testing Flow

1. Register a new user
2. Receive OTP through Brevo email
3. Verify email using OTP
4. Login
5. Request password reset
6. Receive password reset OTP
7. Reset password
8. Login using the new password
9. Refresh access token
10. Logout

---

# License

MIT License
