# Admin Login Structure Documentation

This document contains the complete admin login structure that can be used in another project.

## Table of Contents
1. [Database Schema](#database-schema)
2. [Backend Structure](#backend-structure)
3. [Frontend Structure](#frontend-structure)
4. [Dependencies](#dependencies)
5. [Environment Variables](#environment-variables)

---

## Database Schema

### 1. Roles Table
```sql
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT IGNORE INTO roles (name, description) VALUES 
('admin', 'Administrator with full system access'),
('user', 'Regular user with limited access'),
('auditor', 'Auditor with read-only access to audit logs');
```

### 2. Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);
```

### 3. User Roles Junction Table (Many-to-Many)
```sql
CREATE TABLE IF NOT EXISTS user_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_role (user_id, role_id)
);

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
```

---

## Backend Structure

### 1. Database Configuration (`config/database.js`)
```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
};

const pool = mysql.createPool(dbConfig);

module.exports = { pool };
```

### 2. Authentication Middleware (`middleware/auth.js`)
```javascript
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user details from database
    const connection = await pool.getConnection();
    const [users] = await connection.execute(`
      SELECT 
        u.*,
        GROUP_CONCAT(r.name) as roles,
        GROUP_CONCAT(r.id) as role_ids
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id 
      WHERE u.id = ? AND u.is_active = 1
      GROUP BY u.id, u.username, u.password, u.is_active, u.last_login, u.created_at, u.updated_at
    `, [decoded.userId]);
    
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Process roles for the user
    const user = {
      ...users[0],
      roles: users[0].roles ? users[0].roles.split(',') : [],
      roleIds: users[0].role_ids ? users[0].role_ids.split(',').map(id => parseInt(id)) : []
    };

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.username === 'sysadmin') {
      return next();
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = Array.isArray(roles) 
      ? roles.some(role => userRoles.includes(role))
      : userRoles.includes(roles);

    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};
```

### 3. Auth Controller (`controllers/auth/authController.js`)
```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const { JWT_SECRET } = require('../../middleware/auth');

class AuthController {
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const connection = await pool.getConnection();
      
      // Get user with role information
      const [users] = await connection.execute(`
        SELECT 
          u.*,
          GROUP_CONCAT(r.name) as roles,
          GROUP_CONCAT(r.id) as role_ids
        FROM users u 
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id 
        WHERE u.username = ? AND u.is_active = 1
        GROUP BY u.id, u.username, u.password, u.is_active, u.last_login, u.created_at, u.updated_at
      `, [username]);

      connection.release();

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = users[0];

      // Validate password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      const updateConnection = await pool.getConnection();
      await updateConnection.execute(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );
      updateConnection.release();

      // Process roles
      const roles = user.roles ? user.roles.split(',') : [];
      const roleIds = user.role_ids ? user.role_ids.split(',').map(id => parseInt(id)) : [];

      // Generate JWT token with roles
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          roles: roles,
          roleIds: roleIds
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const responseData = {
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          roles: roles,
          roleIds: roleIds
        }
      };

      res.json(responseData);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async register(req, res) {
    try {
      const { username, password, roleIds } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const connection = await pool.getConnection();

      // Check if username already exists
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );

      if (existingUsers.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Start transaction
      await connection.beginTransaction();

      try {
        // Insert new user
        const [result] = await connection.execute(`
          INSERT INTO users (username, password) 
          VALUES (?, ?)
        `, [username, hashedPassword]);

        const userId = result.insertId;

        // Add roles if provided
        if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
          const roleValues = roleIds.map(roleId => [userId, roleId]);
          await connection.execute(`
            INSERT INTO user_roles (user_id, role_id) 
            VALUES ?
          `, [roleValues]);
        }

        await connection.commit();
        connection.release();

        res.status(201).json({
          message: 'User created successfully',
          userId: userId
        });
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getProfile(req, res) {
    try {
      const connection = await pool.getConnection();
      const [users] = await connection.execute(`
        SELECT 
          u.id, 
          u.username, 
          u.is_active, 
          u.last_login, 
          u.created_at,
          GROUP_CONCAT(r.name) as roles,
          GROUP_CONCAT(r.id) as role_ids
        FROM users u 
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id 
        WHERE u.id = ?
        GROUP BY u.id, u.username, u.is_active, u.last_login, u.created_at
      `, [req.user.id]);

      connection.release();

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Process roles for the user
      const user = {
        ...users[0],
        roles: users[0].roles ? users[0].roles.split(',') : [],
        roleIds: users[0].role_ids ? users[0].role_ids.split(',').map(id => parseInt(id)) : []
      };

      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      const connection = await pool.getConnection();
      
      // Get current user password
      const [users] = await connection.execute(
        'SELECT password FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
      if (!isValidPassword) {
        connection.release();
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await connection.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedNewPassword, req.user.id]
      );

      connection.release();

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = AuthController;
```

### 4. Auth Routes (`routes/auth.js`)
```javascript
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/change-password', authenticateToken, AuthController.changePassword);

module.exports = router;
```

### 5. Main Server File (Example)
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Protected route example
app.get('/api/dashboard', authenticateToken, (req, res) => {
  res.json({ message: 'Dashboard data', user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Frontend Structure

### 1. Auth Context (`contexts/AuthContext.jsx`)
```javascript
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          // Validate token by trying to get user profile
          const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Token validation error:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        const { token: authToken, user: userData } = data;
        
        setUser(userData);
        setToken(authToken);
        setIsAuthenticated(true);
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setIsLoading(false);
        return { success: true, user: userData };
      } else {
        throw new Error(data.error || 'Username or password is wrong');
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 2. Login Component (`pages/auth/Login.jsx`)
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login(username, password);
            if (result?.success) {
                navigate('/dashboard', { replace: true });
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            setError(err.message || 'Invalid username or password');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2>Admin Login</h2>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-message">{error}</div>
                    )}
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => { setUsername(e.target.value); setError(''); }}
                            required
                            disabled={loading}
                            placeholder="Enter your username"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            required
                            disabled={loading}
                            placeholder="Enter your password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
```

### 3. Protected Route Component (`components/ProtectedRoute.jsx`)
```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user) {
    const hasRole = user.roles && user.roles.includes(requiredRole);
    if (!hasRole && user.username !== 'sysadmin') {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
```

### 4. App.js Example
```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

---

## Dependencies

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  }
}
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0"
  }
}
```

---

## Environment Variables

### Backend (.env)
```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database_name
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## API Endpoints

### POST `/api/auth/login`
**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "roles": ["admin"],
    "roleIds": [1]
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid credentials"
}
```

### GET `/api/auth/profile`
**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "is_active": 1,
    "last_login": "2025-01-15T10:30:00.000Z",
    "created_at": "2025-01-01T00:00:00.000Z",
    "roles": ["admin"],
    "roleIds": [1]
  }
}
```

### PUT `/api/auth/change-password`
**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

---

## Usage Notes

1. **Password Hashing**: Passwords are hashed using bcrypt with a salt rounds of 10
2. **JWT Tokens**: Tokens expire after 24 hours
3. **Role-Based Access**: Use `requireRole` middleware to protect routes by role
4. **Token Storage**: Frontend stores tokens in localStorage
5. **User Roles**: Users can have multiple roles through the `user_roles` junction table
6. **Active Users**: Only active users (`is_active = 1`) can log in

---

## Setup Instructions

1. **Database Setup**: Run the SQL migrations in order (roles → users → user_roles)
2. **Backend Setup**: 
   - Install dependencies: `npm install`
   - Configure `.env` file
   - Start server: `npm start`
3. **Frontend Setup**:
   - Install dependencies: `npm install`
   - Configure `.env` file
   - Start app: `npm start`
4. **Create Admin User**: Use the register endpoint or insert directly into database with hashed password

---

## Security Considerations

- Always use HTTPS in production
- Store JWT_SECRET securely and never commit it to version control
- Implement rate limiting on login endpoints
- Consider adding 2FA for admin accounts
- Regularly rotate JWT secrets
- Implement password strength requirements
- Add account lockout after failed login attempts
