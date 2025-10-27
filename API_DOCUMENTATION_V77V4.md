# API Documentation V77V4

## Authentication Verification System

### Overview
This document describes the authentication verification endpoint used for global route protection in the application. This endpoint is called before any page loads (except login pages) to verify user authentication and authorization.

---

## Authentication Verification Endpoint

### `GET /auth/verify`

**Purpose**: Verifies if the current user session is valid and authorized to access protected routes.

**Authentication**: Required - Bearer Token

**Description**: 
This endpoint serves as a global authentication check that runs before any protected page is rendered. It validates the user's authentication token and ensures they have the necessary permissions to access the application.

### Request

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
```

#### Request Example
```http
GET /auth/verify HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json
```

### Response

#### Success Response (200 OK)
When the user is authenticated and authorized:

```json
{
  "success": true,
  "message": "تم التحقق من الهوية بنجاح",
  "data": {
    "user": {
      "id": 123,
      "username": "john_doe",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "permissions": ["read", "write", "delete"],
      "department": "IT",
      "position": "System Administrator",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    "token_expires_in": 3600,
    "last_activity": "2024-01-15T12:00:00Z"
  }
}
```

#### Error Responses

##### 401 Unauthorized - Invalid Token
```json
{
  "success": false,
  "message": "رمز المصادقة غير صالح",
  "errors": {
    "token": ["Token is invalid or expired"]
  }
}
```

##### 401 Unauthorized - Missing Token
```json
{
  "success": false,
  "message": "مطلوب رمز المصادقة",
  "errors": {
    "authorization": ["Authorization header is required"]
  }
}
```

##### 403 Forbidden - Insufficient Permissions
```json
{
  "success": false,
  "message": "ليس لديك صلاحية للوصول إلى هذا المورد",
  "errors": {
    "permissions": ["User does not have required permissions"]
  }
}
```

##### 500 Internal Server Error
```json
{
  "success": false,
  "message": "خطأ داخلي في الخادم",
  "errors": {
    "server": ["An unexpected error occurred"]
  }
}
```

---

## Frontend Implementation

### Route Protection Component
The frontend uses a `RouteProtection` component that automatically calls this endpoint:

```typescript
const checkAuth = async () => {
  try {
    await apiCall('/auth/verify', { method: 'GET' }, true);
    setIsAuthorized(true);
  } catch (error) {
    console.error('Auth check failed:', error);
    setIsAuthorized(false);
  } finally {
    setIsChecking(false);
  }
};
```

### Flow Diagram
```
User navigates to protected route
         ↓
RouteProtection component loads
         ↓
Call GET /auth/verify
         ↓
    Success? ────→ No ────→ Redirect to /login
         ↓
        Yes
         ↓
    Render page
```

---

## Token Management

### Token Storage
- Admin tokens: `localStorage.getItem('admin_token')`
- Staff tokens: `localStorage.getItem('staff_token')`

### Token Format
```
Bearer <JWT_TOKEN>
```

### Token Validation
The server should validate:
1. Token signature
2. Token expiration
3. User existence
4. User permissions
5. Token blacklist (if applicable)

---

## Security Considerations

1. **Token Expiration**: Tokens should have reasonable expiration times
2. **Rate Limiting**: Implement rate limiting on the verify endpoint
3. **Logging**: Log all authentication attempts for security monitoring
4. **HTTPS**: Always use HTTPS in production
5. **Token Refresh**: Consider implementing token refresh mechanism

---

## Error Handling

### Frontend Error Handling
```typescript
try {
  await authApi.verifyAuth();
  // User is authenticated
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        // Redirect to login
        break;
      case 403:
        // Show insufficient permissions message
        break;
      default:
        // Show generic error message
    }
  }
}
```

### Loading States
The RouteProtection component shows a loading spinner while verification is in progress:

```jsx
if (isChecking) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">جاري التحقق من الصلاحيات...</p>
      </div>
    </div>
  );
}
```

---

## Testing

### Test Cases

1. **Valid Token**: Should return 200 with user data
2. **Expired Token**: Should return 401 with appropriate message
3. **Invalid Token**: Should return 401 with appropriate message
4. **Missing Token**: Should return 401 with appropriate message
5. **Insufficient Permissions**: Should return 403 with appropriate message

### Example Test Request
```bash
curl -X GET "http://localhost:8000/api/auth/verify" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## Notes

- This endpoint is called automatically by the frontend on every route navigation
- Excludes login pages (`/admin/login` and `/login`)
- Failures result in automatic redirect to login page
- Success allows normal page rendering to proceed
- The endpoint should be lightweight and fast as it's called frequently