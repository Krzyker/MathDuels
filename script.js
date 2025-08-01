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

// Game Variables
let gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    timeLeft: 120,
    questionsAnswered: 0,
    correctAnswers: 0,
    currentQuestion: null,
    timer: null
};

// New Play button click handler
async function playClicked() {
    const gameContainer = document.getElementById('gameContainer');
    const messageElement = document.getElementById('message');
    const contentSection = document.getElementById('contentSection');
    
    // Hide the main content and show the game
    contentSection.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    // Clear any previous messages
    messageElement.classList.remove('show');
    
    // Reset game state and start immediately
    resetGame();
    startGame();
}

// Game Functions
function resetGame() {
    gameState = {
        isPlaying: false,
        isPaused: false,
        score: 0,
        timeLeft: 120,
        questionsAnswered: 0,
        correctAnswers: 0,
        currentQuestion: null,
        timer: null
    };
    
    updateDisplay();
    document.getElementById('answerInput').value = '';
    
    // Hide all buttons initially
    document.getElementById('startBtn').classList.add('hidden');
    document.getElementById('pauseBtn').classList.add('hidden');
    document.getElementById('resumeBtn').classList.add('hidden');
    document.getElementById('endBtn').classList.add('hidden');
    document.getElementById('gameResults').classList.add('hidden');
}

function startGame() {
    gameState.isPlaying = true;
    gameState.isPaused = false;
    
    // Show pause and end buttons
    document.getElementById('pauseBtn').classList.remove('hidden');
    document.getElementById('endBtn').classList.remove('hidden');
    
    // Enable input and focus
    document.getElementById('answerInput').disabled = false;
    document.getElementById('answerInput').focus();
    
    // Start timer
    startTimer();
    
    // Generate first question
    generateQuestion();
}

function pauseGame() {
    gameState.isPaused = true;
    clearInterval(gameState.timer);
    
    document.getElementById('pauseBtn').classList.add('hidden');
    document.getElementById('resumeBtn').classList.remove('hidden');
    document.getElementById('answerInput').disabled = true;
}

function resumeGame() {
    gameState.isPaused = false;
    
    document.getElementById('resumeBtn').classList.add('hidden');
    document.getElementById('pauseBtn').classList.remove('hidden');
    document.getElementById('answerInput').disabled = false;
    document.getElementById('answerInput').focus();
    
    startTimer();
}

function endGame() {
    gameState.isPlaying = false;
    clearInterval(gameState.timer);
    
    // Hide game controls and question area, show results
    document.getElementById('pauseBtn').classList.add('hidden');
    document.getElementById('resumeBtn').classList.add('hidden');
    document.getElementById('endBtn').classList.add('hidden');
    document.querySelector('.game-question').classList.add('hidden');
    document.querySelector('.game-controls').classList.add('hidden');
    
    showResults();
}

function startTimer() {
    gameState.timer = setInterval(() => {
        if (!gameState.isPaused) {
            gameState.timeLeft--;
            updateDisplay();
            
            if (gameState.timeLeft <= 0) {
                endGame();
            }
        }
    }, 1000);
}

function generateQuestion() {
    let question, answer;
    
    // Classic Zetamac rules: random selection of all operations
    const operations = ['+', '-', '×', '÷'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    switch (operation) {
        case '+':
            // Addition: numbers 2-100 (matching Zetamac config)
            const a1 = Math.floor(Math.random() * 99) + 2; // 2 to 100
            const b1 = Math.floor(Math.random() * 99) + 2; // 2 to 100
            question = `${a1} + ${b1}`;
            answer = a1 + b1;
            break;
        case '-':
            // Subtraction: addition problems in reverse (matching Zetamac config)
            const add1 = Math.floor(Math.random() * 99) + 2; // 2 to 100
            const add2 = Math.floor(Math.random() * 99) + 2; // 2 to 100
            const sum = add1 + add2;
            if (Math.random() < 0.5) {
                question = `${sum} - ${add1}`;
                answer = add2;
            } else {
                question = `${sum} - ${add2}`;
                answer = add1;
            }
            break;
        case '×':
            // Multiplication: first number 2-12, second number 2-100 (matching Zetamac config)
            const a3 = Math.floor(Math.random() * 11) + 2; // 2 to 12
            const b3 = Math.floor(Math.random() * 99) + 2; // 2 to 100
            question = `${a3} × ${b3}`;
            answer = a3 * b3;
            break;
        case '÷':
            // Division: (2 to 12) × (2 to 100) in reverse, always whole number answer
            const divisor = Math.floor(Math.random() * 99) + 2; // 2 to 100
            const quotient = Math.floor(Math.random() * 11) + 2; // 2 to 12
            const dividend = divisor * quotient;
            question = `${dividend} ÷ ${divisor}`;
            answer = quotient;
            break;
    }
    
    gameState.currentQuestion = { question, answer };
    document.getElementById('question').textContent = question;
    document.getElementById('answerInput').value = '';
    document.getElementById('answerInput').focus();
}

function checkAnswer() {
    const userAnswer = parseInt(document.getElementById('answerInput').value);
    const correctAnswer = gameState.currentQuestion.answer;
    
    if (userAnswer === correctAnswer) {
        // Correct answer - Zetamac style: 1 point per correct answer
        gameState.score += 1;
        gameState.correctAnswers++;
        document.getElementById('question').classList.add('correct');
        setTimeout(() => {
            document.getElementById('question').classList.remove('correct');
        }, 500);
    } else {
        // Wrong answer - no points, no penalty
        document.getElementById('answerInput').classList.add('wrong');
        setTimeout(() => {
            document.getElementById('answerInput').classList.remove('wrong');
        }, 300);
    }
    
    gameState.questionsAnswered++;
    
    updateDisplay();
    generateQuestion();
}

function updateDisplay() {
    document.getElementById('score').textContent = `Score: ${gameState.score}`;
    document.getElementById('time').textContent = `Time: ${gameState.timeLeft}s`;
}

function showResults() {
    const accuracy = gameState.questionsAnswered > 0 
        ? Math.round((gameState.correctAnswers / gameState.questionsAnswered) * 100) 
        : 0;
    
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('questionsAnswered').textContent = gameState.questionsAnswered;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    
    document.getElementById('gameResults').classList.remove('hidden');
    
    // Submit score to backend if user is logged in
    if (currentUser) {
        submitScore(gameState.score);
    }
}

function playAgain() {
    resetGame();
    document.getElementById('gameResults').classList.add('hidden');
    document.querySelector('.game-question').classList.remove('hidden');
    document.querySelector('.game-controls').classList.remove('hidden');
    document.getElementById('startBtn').classList.remove('hidden');
}

function backToMenu() {
    document.getElementById('gameContainer').classList.add('hidden');
    document.getElementById('contentSection').classList.remove('hidden');
    resetGame();
}

// Leaderboard functionality
let leaderboardData = [];

async function showLeaderboard() {
    const contentSection = document.getElementById('contentSection');
    const leaderboardContainer = document.getElementById('leaderboardContainer');
    
    // Hide main content and show leaderboard
    contentSection.classList.add('hidden');
    leaderboardContainer.classList.remove('hidden');
    
    // Load and display leaderboard data
    await loadLeaderboard();
}

async function loadLeaderboard() {
    try {
        const data = await getLeaderboard();
        leaderboardData = data;
        displayLeaderboard();
        updateLeaderboardStats();
    } catch (error) {
        console.error('Failed to load leaderboard:', error);
        // Show empty leaderboard with error message
        document.getElementById('leaderboardList').innerHTML = 
            '<div class="leaderboard-entry"><p>Failed to load leaderboard data</p></div>';
    }
}

function displayLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    const sortBy = document.getElementById('sortBy').value;
    
    // Sort data based on selected criteria
    let sortedData = [...leaderboardData];
    switch (sortBy) {
        case 'high_score':
            sortedData.sort((a, b) => b.high_score - a.high_score);
            break;
        case 'games_played':
            sortedData.sort((a, b) => b.games_played - a.games_played);
            break;
        case 'avg_score':
            sortedData.sort((a, b) => (b.high_score / b.games_played) - (a.high_score / a.games_played));
            break;
    }
    
    // Generate HTML for leaderboard entries
    const leaderboardHTML = sortedData.map((player, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const avgScore = player.games_played > 0 ? Math.round(player.high_score / player.games_played) : 0;
        
        return `
            <div class="leaderboard-entry ${rankClass}">
                <div class="player-info">
                    <div class="player-rank">#${rank}</div>
                    ${player.picture ? `<img src="${player.picture}" alt="${player.name}" class="player-picture">` : ''}
                    <div class="player-name">${player.name}</div>
                </div>
                <div class="player-stats">
                    <div class="player-high-score">${player.high_score} pts</div>
                    <div class="player-games">${player.games_played} games (avg: ${avgScore})</div>
                </div>
            </div>
        `;
    }).join('');
    
    leaderboardList.innerHTML = leaderboardHTML || '<div class="leaderboard-entry"><p>No players found</p></div>';
}

function updateLeaderboardStats() {
    const totalPlayers = leaderboardData.length;
    const totalGames = leaderboardData.reduce((sum, player) => sum + player.games_played, 0);
    
    document.getElementById('totalPlayers').textContent = `Total Players: ${totalPlayers}`;
    document.getElementById('totalGames').textContent = `Total Games: ${totalGames}`;
}

function sortLeaderboard() {
    displayLeaderboard();
}

function backToMenuFromLeaderboard() {
    document.getElementById('leaderboardContainer').classList.add('hidden');
    document.getElementById('contentSection').classList.remove('hidden');
}

// Event listeners for the game
document.addEventListener('DOMContentLoaded', function() {
    const answerInput = document.getElementById('answerInput');
    
    // Handle input changes and auto-check answers
    answerInput.addEventListener('input', function() {
        // Remove non-numeric characters except minus sign
        this.value = this.value.replace(/[^0-9-]/g, '');
        
        // Auto-check answer when user types
        if (gameState.isPlaying && !gameState.isPaused && this.value.trim() !== '') {
            const userAnswer = parseInt(this.value);
            const correctAnswer = gameState.currentQuestion?.answer;
            
            if (userAnswer === correctAnswer) {
                // Small delay to let user see their answer
                setTimeout(() => {
                    checkAnswer();
                }, 100);
            }
        }
    });
    
    // Still allow Enter key as backup
    answerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && gameState.isPlaying && !gameState.isPaused) {
            if (this.value.trim() !== '') {
                checkAnswer();
            }
        }
    });
}); 