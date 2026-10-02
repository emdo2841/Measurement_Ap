# API Documentation

This API is mounted under the base path `/api/v1`.

Examples:
- User routes: `/api/v1/users/...`
- Client routes: `/api/v1/clients/...`
- Order routes: `/api/v1/orders/...`
- Measurement routes: `/api/v1/measurement/...`
- Auth routes: `/api/v1/auth/...`

## 1. Authentication

The application uses JWT access tokens for authenticated requests.

Header format:

```http
Authorization: Bearer <access_token>
```

Authentication middleware:
- File: `src/middleWare/authMiddleware.ts`
- Validation: checks the `Authorization` header, extracts the token, verifies it with JWT, and attaches `req.user`.

Authenticated route currently implemented:
- `GET /api/v1/users/profile`

If the token is missing or invalid, the API responds with:

```json
{ "message": "Access tokrn missing" }
```

or

```json
{ "message": "Invalid or Expired Token" }
```

Refresh tokens are handled with an HTTP-only cookie named `refreshToken`.

---

## 2. Common response patterns

### Success responses
- `200 OK` for reads and updates
- `201 Created` for creation
- `400 Bad Request` for validation issues
- `401 Unauthorized` for missing/invalid authentication
- `403 Forbidden` for invalid or expired refresh token or expired JWT
- `404 Not Found` when a record does not exist
- `500 Internal Server Error` for unexpected server issues

### Common JSON shapes

Single object response:

```json
{
  "id": "uuid",
  "name": "Example Name"
}
```

Array response:

```json
[
  {
    "id": "uuid",
    "name": "Example Name"
  },
  {
    "id": "uuid",
    "name": "Another Name"
  }
]
```

---

## 3. Auth routes

Base path: `/api/v1/auth`

### 3.1 Login

`POST /api/v1/auth/login`

Purpose: authenticate a user and return a JWT access token.

Request body:

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

Success response:

```json
{
  "message": "successfully Login",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

Notes:
- Sets a refresh token in an HTTP-only cookie.
- Validates email and password with Zod.

Error responses:
- `400` if body is invalid
- `401` if credentials are wrong

### 3.2 Refresh token

`POST /api/v1/auth/refresh-token`

Purpose: renew access token using the refresh token cookie.

Request: no JSON body required; uses the cookie `refreshToken`.

Success response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

Possible errors:
- `401` if refresh token is missing
- `403` if refresh token is invalid, expired, or reused maliciously

### 3.3 Logout

`POST /api/v1/auth/logout`

Purpose: revoke the refresh token and log the user out.

Success response:

```json
{
  "message": "Logged out successfully"
}
```

### 3.4 Forgot password

`POST /api/v1/auth/forgot-password`

Request body:

```json
{
  "email": "user@example.com"
}
```

Success response:

```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

Notes:
- This is intentionally generic to avoid user enumeration.
- If a matching user exists, a reset token is created and an email is sent.

### 3.5 Reset password

`POST /api/v1/auth/reset-password`

Request body:

```json
{
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword123"
}
```

Success response:

```json
{
  "message": "Password reset successful. You can now log in."
}
```

Validation rules:
- token is required
- newPassword must be at least 8 characters long

---

## 4. User routes

Base path: `/api/v1/users`

### 4.1 Create user

`POST /api/v1/users`

Purpose: create a new user account.

Form-data / multipart upload is supported because of `multer`.

Expected body fields:
- `name` (string, required)
- `email` (string, required)
- `password` (string, required, minimum 6 chars)
- `phone` (string, required)
- `image` (optional file upload)

Success response: returns the created user object.

Example:

```json
{
  "id": "d5f4c9d1-4f2a-4d6d-a514-516f815b2e8b",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$...",
  "phone": "+2348123456789",
  "image": "https://example.com/user.jpg",
  "imagePublicId": "users/abc123",
  "createdAt": "2026-09-10T12:00:00.000Z",
  "updatedAt": "2026-09-10T12:00:00.000Z"
}
```

### 4.2 Get user by id

`GET /api/v1/users/:id`

Purpose: fetch a single user.

Success response:

```json
{
  "id": "d5f4c9d1-4f2a-4d6d-a514-516f815b2e8b",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+2348123456789",
  "image": "https://example.com/user.jpg",
  "createdAt": "2026-09-10T12:00:00.000Z",
  "updatedAt": "2026-09-10T12:00:00.000Z"
}
```

### 4.3 Get all users

This route is not directly defined in the router file. The current router registers `GET /:id` and `GET /profile` before it, so the list route is not exposed as a standard all-users endpoint. The route file currently has:

- `GET /api/v1/users/profile`
- `POST /api/v1/users`
- `GET /api/v1/users/:id`

There is no `GET /api/v1/users` implementation mounted as a list endpoint.

### 4.4 Get authenticated profile

`GET /api/v1/users/profile`

Authentication: required

Success response:

```json
{
  "id": "d5f4c9d1-4f2a-4d6d-a514-516f815b2e8b",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+2348123456789",
  "image": "https://example.com/user.jpg",
  "createdAt": "2026-09-10T12:00:00.000Z"
}
```

### 4.5 Update user

`PATCH /api/v1/users/:id`

Purpose: update user data.

Success response: updated user object.

### 4.6 Delete user

`DELETE /api/v1/users/:id`

Purpose: remove a user and associated uploaded images.

Success response:

```json
{
  "message": "User and associated images deleted successfully"
}
```

---

## 5. Client routes

Base path: `/api/v1/clients`

### 5.1 Create client

`POST /api/v1/clients`

Purpose: create a client record.

Body example:

```json
{
  "name": "Ada Bello",
  "phone": "08031234567",
  "email": "ada@example.com",
  "address": "Lagos",
  "gender": "FEMALE",
  "tailorId": "d5f4c9d1-4f2a-4d6d-a514-516f815b2e8b",
  "measurements": [
    {
      "title": "Chest",
      "unit": "INCHES",
      "data": {
        "value": 40
      }
    }
  ]
}
```

Success response: created client object with nested measurements, tailor info, and recent order overview.

Example:

```json
{
  "id": "c1d8f7e2-9e84-4473-9b12-7b0dcfc29567",
  "name": "Ada Bello",
  "phone": "08031234567",
  "address": "Lagos",
  "email": "ada@example.com",
  "gender": "FEMALE",
  "tailorId": "d5f4c9d1-4f2a-4d6d-a514-516f815b2e8b",
  "image": "https://example.com/client.jpg",
  "imagePublicId": "clients/xyz",
  "createdAt": "2026-09-10T12:00:00.000Z",
  "updatedAt": "2026-09-10T12:00:00.000Z",
  "measurements": [
    {
      "id": "m1",
      "title": "Chest",
      "unit": "INCHES",
      "data": { "value": 40 },
      "clientId": "c1d8f7e2-9e84-4473-9b12-7b0dcfc29567"
    }
  ],
  "tailor": {
    "id": "d5f4c9d1-4f2a-4d6d-a514-516f815b2e8b",
    "name": "John Doe"
  },
  "orders": [
    {
      "dueDate": "2026-09-20T00:00:00.000Z",
      "status": "PENDING",
      "totalAmount": 25000
    }
  ]
}
```

### 5.2 Get all clients

`GET /api/v1/clients`

Purpose: return a list of all clients.

Expected return array:

```json
[
  {
    "id": "c1d8f7e2-9e84-4473-9b12-7b0dcfc29567",
    "name": "Ada Bello",
    "phone": "08031234567",
    "address": "Lagos",
    "email": "ada@example.com",
    "gender": "FEMALE",
    "tailorId": "d5f4c9d1-4f2a-4d6d-a514-516f815b2e8b",
    "image": "https://example.com/client.jpg",
    "measurements": [],
    "tailor": {
      "id": "d5f4c9d1-4f2a-4d6d-a514-516f815b2e8b",
      "name": "John Doe"
    },
    "orders": []
  }
]
```

### 5.3 Get client by id

`GET /api/v1/clients/:id`

Purpose: fetch one client.

Success response: single client object similar to the create response.

### 5.4 Update client

`PATCH /api/v1/clients/:id`

Purpose: update client data, image, or measurements.

Success response: updated client object.

### 5.5 Delete client

`DELETE /api/v1/clients/:id`

Success response:

```json
{
  "message": "Client deleted successfully"
}
```

---

## 6. Order routes

Base path: `/api/v1/orders`

### 6.1 Create order

`POST /api/v1/orders`

Request body example:

```json
{
  "clientId": "c1d8f7e2-9e84-4473-9b12-7b0dcfc29567",
  "status": "PENDING",
  "dueDate": "2026-09-20",
  "totalAmount": 25000,
  "notes": "Need a matching blazer",
  "image": "https://example.com/order.jpg"
}
```

Success response:

```json
{
  "id": "o1",
  "clientId": "c1d8f7e2-9e84-4473-9b12-7b0dcfc29567",
  "status": "PENDING",
  "dueDate": "2026-09-20T00:00:00.000Z",
  "totalAmount": 25000,
  "notes": "Need a matching blazer",
  "image": "https://example.com/order.jpg",
  "client": {
    "id": "c1d8f7e2-9e84-4473-9b12-7b0dcfc29567",
    "name": "Ada Bello",
    "image": "https://example.com/client.jpg"
  }
}
```

### 6.2 Get all orders

`GET /api/v1/orders`

Purpose: return a list of all orders.

Expected return array:

```json
[
  {
    "id": "o1",
    "clientId": "c1d8f7e2-9e84-4473-9b12-7b0dcfc29567",
    "status": "PENDING",
    "dueDate": "2026-09-20T00:00:00.000Z",
    "totalAmount": 25000,
    "notes": "Need a matching blazer",
    "image": "https://example.com/order.jpg",
    "client": {
      "id": "c1d8f7e2-9e84-4473-9b12-7b0dcfc29567",
      "name": "Ada Bello",
      "image": "https://example.com/client.jpg"
    }
  }
]
```

### 6.3 Get order by id

`GET /api/v1/orders/:id`

Purpose: fetch one order.

Success response: single order object.

### 6.4 Update order

`PATCH /api/v1/orders/:id`

Purpose: update order status, total amount, notes, or client relation.

Success response: updated order object.

### 6.5 Delete order

`DELETE /api/v1/orders/:id`

Success response:

```json
{
  "message": "order deleted successfully"
}
```

Allowed statuses:
- `PENDING`
- `CUTTING`
- `SEWING`
- `FITTING`
- `COMPLETED`
- `DELIVERED`

---

## 7. Measurement routes

Base path: `/api/v1/measurement`

### 7.1 Create measurement

`POST /api/v1/measurement`

Request body example:

```json
{
  "title": "Chest",
  "unit": "INCHES",
  "data": {
    "value": 40,
    "left": 20,
    "right": 20
  },
  "clientId": "c1d8f7e2-9e84-4473-9b12-7b0dcfc29567"
}
```

Success response:

```json
{
  "id": "m1",
  "title": "Chest",
  "unit": "INCHES",
  "data": {
    "value": 40,
    "left": 20,
    "right": 20
  },
  "clientId": "c1d8f7e2-9e84-4473-9b12-7b0dcfc29567",
  "createdAt": "2026-09-10T12:00:00.000Z",
  "updatedAt": "2026-09-10T12:00:00.000Z"
}
```

### 7.2 Get all measurements

`GET /api/v1/measurement`

Purpose: return a list of all measurements.

Expected return array:

```json
[
  {
    "id": "m1",
    "title": "Chest",
    "unit": "INCHES",
    "data": {
      "value": 40
    },
    "clientId": "c1d8f7e2-9e84-4473-9b12-7b0dcfc29567",
    "createdAt": "2026-09-10T12:00:00.000Z",
    "updatedAt": "2026-09-10T12:00:00.000Z",
    "client": {
      "id": "c1d8f7e2-9e84-4473-9b12-7b0dcfc29567",
      "name": "Ada Bello",
      "image": "https://example.com/client.jpg"
    }
  }
]
```

### 7.3 Get one measurement

`GET /api/v1/measurement/:id`

The router currently also has a route registered as `/api/v1/measurement/id`, but the controller expects `req.params.id`. This makes the measurement route a little unclear and may need a code fix for consistency.

Expected response: single measurement object.

### 7.4 Get measurements by client

`GET /api/v1/measurement/:id`

This route is logically intended to return measurements for a specific client.

Expected return array:

```json
[
  {
    "id": "m1",
    "title": "Chest",
    "unit": "INCHES",
    "data": {
      "value": 40
    },
    "clientId": "c1d8f7e2-9e84-4473-9b12-7b0dcfc29567"
  }
]
```

### 7.5 Update measurement

`PATCH /api/v1/measurement/:id`

Purpose: update measurement title, unit, or data.

### 7.6 Delete measurement

`DELETE /api/v1/measurement/:id`

Success response:

```json
{
  "message": "Measurement deleted successfully"
}
```

---

## 8. Security notes

- JWT tokens are validated using the `Authorization` header.
- Refresh tokens are stored as hashed values in the database and compared with a hash of the incoming cookie token.
- Password reset tokens are also hashed before storage.
- Uploaded images are processed through Cloudinary utilities.
- The app uses rate limiters on route groups.

---

## 9. Recommended use summary

### Public routes
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/logout`
- `POST /api/v1/users`

### Authenticated route
- `GET /api/v1/users/profile`

### Other resources appear to be open in the current implementation
- clients CRUD
- orders CRUD
- measurement CRUD
- user `GET/UPDATE/DELETE` by id

> Note: some endpoints are currently public even though they likely should be protected in a production-ready version.

---

## 10. Quick example flow

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secret123"
}
```

Response:

```json
{
  "message": "successfully Login",
  "accessToken": "..."
}
```

Then:

```http
GET /api/v1/users/profile
Authorization: Bearer ...
```

Response:

```json
{
  "id": "d5f4c9d1-4f2a-4d6d-a514-516f815b2e8b",
  "name": "John Doe",
  "email": "john@example.com"
}
```

This is a simplified overview of the API as it is currently implemented.
