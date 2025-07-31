const express = require('express');
const pool = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT,
        google_id TEXT,
        picture TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create scores table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        game_type TEXT DEFAULT 'math_duel',
        achieved_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database on startup
initializeDatabase();

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await pool.query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, name, hash]
    );
    
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      } 
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'User with this email already exists' });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        picture: user.picture 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google Sign-In endpoint
app.post('/api/google-signin', async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;
    
    if (!email || !name || !googleId) {
      return res.status(400).json({ error: 'Google authentication data required' });
    }

    // Check if user exists
    let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = result.rows[0];

    if (!user) {
      // Create new user
      result = await pool.query(
        'INSERT INTO users (email, name, google_id, picture) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, name, googleId, picture]
      );
      user = result.rows[0];
    } else if (!user.google_id) {
      // Update existing user with Google ID
      result = await pool.query(
        'UPDATE users SET google_id = $1, picture = $2 WHERE id = $3 RETURNING *',
        [googleId, picture, user.id]
      );
      user = result.rows[0];
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        picture: user.picture 
      } 
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a score
app.post('/api/scores', authenticateToken, async (req, res) => {
  try {
    const { score, gameType = 'math_duel' } = req.body;
    const userId = req.user.userId;
    
    if (!score || typeof score !== 'number') {
      return res.status(400).json({ error: 'Valid score is required' });
    }

    const result = await pool.query(
      'INSERT INTO scores (user_id, score, game_type) VALUES ($1, $2, $3) RETURNING *',
      [userId, score, gameType]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Add score error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's scores
app.get('/api/users/:userId/scores', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.userId;
    
    // Users can only access their own scores
    if (parseInt(userId) !== requestingUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM scores WHERE user_id = $1 ORDER BY score DESC, achieved_at DESC LIMIT 10',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get user scores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get global leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.name, u.picture, MAX(s.score) as high_score, COUNT(s.id) as games_played
       FROM scores s
       JOIN users u ON s.user_id = u.id
       GROUP BY u.id, u.name, u.picture
       ORDER BY high_score DESC
       LIMIT 10`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(
      'SELECT id, email, name, picture, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Math Duels API is running!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the API: http://localhost:${PORT}/api/test`);
}); 