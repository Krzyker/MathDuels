# Purple Buttons Website with Authentication

A beautiful website featuring three interactive purple buttons with user authentication, including Google Sign-In integration.

## Features

- 🔐 **User Authentication**: Sign up and sign in with email/password
- 🌐 **Google Sign-In**: One-click authentication with Google accounts
- 🎨 **Beautiful UI**: Modern design with purple gradient theme
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 💾 **Local Storage**: User data persists in browser
- 🔒 **Session Management**: Stay logged in after page refresh

## Setup Instructions

### 1. Basic Setup
1. Open `index.html` in any modern web browser
2. The website is ready to use with email/password authentication

### 2. Google Sign-In Setup (Optional)

To enable Google Sign-In functionality:

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google+ API**:
   - In the Google Cloud Console, go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application" as the application type
   - Add your domain to "Authorized JavaScript origins":
     - For local development: `http://localhost:3000` or `file://`
     - For production: Your actual domain
   - Add your redirect URI to "Authorized redirect URIs"
   - Click "Create"

4. **Update the Client ID**:
   - Copy your OAuth 2.0 Client ID
   - Open `index.html`
   - Find the line: `data-client_id="YOUR_GOOGLE_CLIENT_ID"`
   - Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID

5. **Test Google Sign-In**:
   - Refresh the page
   - Click the "Sign in with Google" button
   - Complete the Google authentication flow

## Usage

### For New Users:
1. Click "Create Account" tab
2. Fill in your name, email, and password
3. Or use "Sign in with Google" for instant registration

### For Existing Users:
1. Click "Sign In" tab
2. Enter your email and password
3. Or use "Sign in with Google" for one-click login

### After Login:
- Access the three interactive purple buttons
- See your profile information in the top bar
- Click "Logout" to sign out

## File Structure

```
MathDuel/
├── index.html          # Main website file
└── README.md           # This file
```

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: Local storage with JWT decoding for Google tokens
- **Styling**: Custom CSS with modern design patterns
- **Responsive**: Mobile-first design approach
- **Security**: Client-side validation and secure token handling

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Notes

- User data is stored locally in the browser's localStorage
- Google Sign-In requires an internet connection
- For production use, consider implementing server-side authentication
- The Google Client ID should be kept secure and not shared publicly

## Troubleshooting

### Google Sign-In Not Working:
1. Check that your Client ID is correctly set
2. Verify your domain is in the authorized origins
3. Ensure you're using HTTPS in production
4. Check browser console for error messages

### Local Storage Issues:
1. Clear browser cache and localStorage
2. Try in an incognito/private window
3. Check if localStorage is enabled in your browser

## License

This project is open source and available under the MIT License. 