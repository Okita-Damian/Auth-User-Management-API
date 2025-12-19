# Authentication API

The API provides user registration, login, Email sending OTP, OTP verification, password reset, token refresh, logout, and rate-limited security flows.

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

**Notes**

- `controller/` contains request handling logic
- `routes/` defines HTTP endpoints and middleware order
- `service/` contains business logic (auth, OTP, email)
- `validation/` holds Joi schemas
- `middleware/` contains shared middleware (rate limiting, async handling)
- `utils/` contains reusable helpers

---

## Features

- User registration with OTP email verification
- Login with JWT access token
- Refresh token rotation (stored in DB + HttpOnly cookie)
- Logout with refresh token invalidation
- Forgot password & reset password via OTP
- OTP resend with rate limiting
- Centralized async error handling
- Joi validation on all requests

---

## Base Route

All routes are prefixed with:

```
/auth
```

---

## Auth Routes

### 1. Register

`POST /auth/register`

**Description**

- Creates a new user
- Generates an OTP for email verification
- Sends verification OTP to email

**Request Body**

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response**

```json
{
  "status": "success",
  "message": "Registration successful. Please check your email for otp Verification"
}
```

---

### 2. Verify OTP

`POST /auth/verify-otp`

**Description**

- Verifies OTP for:

  - Email verification
  - Password reset

- OTP is deleted after use

**Request Body**

```json
{
  "email": "john@example.com",
  "otp": "a1b2c3"
}
```

**Response**

```json
{
  "status": "success",
  "message": "Email verified successfully."
}
```

---

### 3. Resend OTP

`POST /auth/resend-otp`

**Description**

- Resend OTP for a specific purpose
- Enforces OTP resend rate limiting

**Request Body**

```json
{
  "email": "john@example.com",
  "purpose": "verify-email"
}
```

**Allowed purposes**

- `verify-email`
- `reset-password`

---

### 4. Login

`POST /auth/login`

**Description**

- Authenticates user credentials
- Returns JWT access token
- Sets refresh token as HttpOnly cookie

**Request Body**

```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response**

```json
{
  "status": "success",
  "message": "Login successful",
  "token": "<access_token>",
  "user": {
    "id": "userId",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### 5. Request Password Reset

`POST /auth/request-password-reset`

**Description**

- Sends OTP for password reset
- Always returns success to prevent email enumeration

**Request Body**

```json
{
  "email": "john@example.com"
}
```

---

### 6. Reset Password

`POST /auth/reset-password`

**Description**

- Verifies OTP
- Updates user password
- Deletes OTP after use

**Request Body**

```json
{
  "email": "john@example.com",
  "otp": "a1b2c3",
  "newPassword": "NewPassword123"
}
```

---

### 7. Logout

`POST /auth/logout`

**Description**

- Clears refresh token from database
- Clears refresh token cookie

---

### 8. Refresh Token

`POST /auth/refresh-token`

**Description**

- Verifies refresh token
- Rotates refresh token
- Returns new access token

---

## Validation & Middleware

- **Joi validation** runs before controllers
- **Rate limiting** is applied on:

  - Login routes
  - OTP routes
  - Password reset routes

- **asyncHandler** ensures all async errors are caught

---

## Rate Limiting Rules

| Route Type  | Limit                                 |
| ----------- | ------------------------------------- |
| Login       | 5 failed attempts / 10 min (IP-based) |
| OTP / Reset | 3 attempts / 30 min                   |
| General     | 100 requests / 15 min                 |

---

## Security Notes

- OTPs are single-use and time-limited
- Passwords are hashed before storage
- Refresh tokens are stored securely and rotated
- Cookies are HttpOnly and secure in production
- Email existence is not leaked during password reset

---

## How to Run

```bash
npm install
npm run dev
```

Server runs on:

```
http://localhost:5000
```

---

## Testing Flow (Recommended)

1. Register
2. Verify OTP
3. Login
4. Request password reset
5. Verify OTP
6. Reset password
7. Login again

---

## License

MIT
