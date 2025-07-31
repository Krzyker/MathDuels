// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : '/api';

// User data storage
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let authToken = localStorage.getItem('authToken') || null;

// Check if user is already logged in
if (currentUser && authToken) {
    showContent();
}

// API helper functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Tab switching functionality
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginTab = document.querySelector('.tab-btn:first-child');
    const signupTab = document.querySelector('.tab-btn:last-child');
    const googleSignInLogin = document.getElementById('googleSignInLogin');
    const googleSignInSignup = document.getElementById('googleSignInSignup');
    const loginDivider = document.getElementById('loginDivider');

    // Remove any existing signupDivider
    const oldSignupDivider = document.getElementById('signupDivider');
    if (oldSignupDivider) oldSignupDivider.remove();

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        googleSignInLogin.style.display = '';
        googleSignInSignup.style.display = 'none';
        loginDivider.style.display = '';
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        loginTab.classList.remove('active');
        signupTab.classList.add('active');
        googleSignInLogin.style.display = 'none';
        googleSignInSignup.style.display = '';
        loginDivider.style.display = 'none';
        // Add signupDivider after signupForm
        const signupFormElem = document.getElementById('signupForm');
        const signupDivider = document.createElement('div');
        signupDivider.className = 'divider';
        signupDivider.id = 'signupDivider';
        signupDivider.innerHTML = '<span>or</span>';
        signupFormElem.insertAdjacentElement('afterend', signupDivider);
    }
}

// Show content section and hide auth section
function showContent() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('contentSection').classList.remove('hidden');
    document.querySelector('.user-info').classList.remove('hidden');
    document.getElementById('userName').textContent = currentUser.name;
    // Show user picture if available (Google users)
    const userPicture = document.getElementById('userPicture');
    if (currentUser.picture) {
        userPicture.src = currentUser.picture;
        userPicture.classList.remove('hidden');
    } else {
        userPicture.classList.add('hidden');
    }
}

// Show auth section and hide content section
function showAuth() {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('contentSection').classList.remove('hidden');
    document.querySelector('.user-info').classList.add('hidden');
    currentUser = null;
    authToken = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
}

// Logout functionality
function logout() {
    showAuth();
    showMessage('Successfully logged out!', 'success');
}

// Show message function
function showMessage(text, type = 'info') {
    const messageElement = document.getElementById('authMessage');
    messageElement.textContent = text;
    messageElement.className = `message ${type}`;
    messageElement.classList.add('show');
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 3000);
}

// Handle Google Sign-In
async function handleGoogleSignIn(response) {
    try {
        // Decode the JWT token to get user information
        const responsePayload = decodeJwtResponse(response.credential);
        
        // Send to backend
        const data = await apiRequest('/google-signin', {
            method: 'POST',
            body: JSON.stringify({
                email: responsePayload.email,
                name: responsePayload.name,
                googleId: responsePayload.sub,
                picture: responsePayload.picture
            })
        });
        
        // Store user data and token
        currentUser = data.user;
        authToken = data.token;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('authToken', authToken);
        
        showContent();
        showMessage(`Welcome back, ${currentUser.name}!`, 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Decode JWT token from Google
function decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const data = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        // Store user data and token
        currentUser = data.user;
        authToken = data.token;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('authToken', authToken);
        
        showContent();
        showMessage('Successfully logged in!', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Handle signup form submission
document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        
        // Validation
        if (password !== confirmPassword) {
            showMessage('Passwords do not match!', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long!', 'error');
            return;
        }
        
        const data = await apiRequest('/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        
        // Store user data and token
        currentUser = data.user;
        authToken = data.token;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('authToken', authToken);
        
        showContent();
        showMessage('Account created successfully! Welcome!', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Submit score to backend
async function submitScore(score) {
    try {
        await apiRequest('/scores', {
            method: 'POST',
            body: JSON.stringify({ score })
        });
        console.log('Score submitted successfully:', score);
    } catch (error) {
        console.error('Failed to submit score:', error);
    }
}

// Get user's scores
async function getUserScores() {
    try {
        const scores = await apiRequest(`/users/${currentUser.id}/scores`);
        return scores;
    } catch (error) {
        console.error('Failed to get user scores:', error);
        return [];
    }
}

// Get leaderboard
async function getLeaderboard() {
    try {
        const leaderboard = await apiRequest('/leaderboard');
        return leaderboard;
    } catch (error) {
        console.error('Failed to get leaderboard:', error);
        return [];
    }
}

// Original button click handler
function handleClick(buttonNumber) {
    const messages = [
        "You clicked the first purple button!",
        "You clicked the second purple button!",
        "You clicked the third purple button!"
    ];
    const messageElement = document.getElementById('message');
    messageElement.textContent = messages[buttonNumber - 1];
    messageElement.classList.add('show');
    // Hide message after 3 seconds
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 3000);
    // Add a fun animation effect
    const button = event.target;
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = '';
    }, 150);
}

// New Play button click handler
async function playClicked() {
    const messageElement = document.getElementById('message');
    messageElement.textContent = 'Let\'s play!';
    messageElement.classList.add('show');
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 3000);
    const button = event.target;
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = '';
    }, 150);
    
    // Example: Submit a random score when play is clicked
    if (currentUser) {
        const randomScore = Math.floor(Math.random() * 100) + 1;
        await submitScore(randomScore);
        console.log(`Submitted score: ${randomScore}`);
    }
} 