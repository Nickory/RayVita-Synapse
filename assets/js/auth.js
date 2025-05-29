// RayVita-Synapse Authentication Module
// 处理用户认证相关的所有功能

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.isRegistering = false;
        this.config = window.RayVitaConfig;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Auth form submission
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuth(e));
        }

        // Toggle between login and register
        const toggleAuth = document.getElementById('toggleAuth');
        if (toggleAuth) {
            toggleAuth.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthMode();
            });
        }
    }

    checkAuthStatus() {
        // Check if user is already logged in (localStorage)
        const savedUser = localStorage.getItem(this.config.STORAGE.USER_KEY);
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.showMainApp();
            } catch (error) {
                console.error('Error parsing saved user data:', error);
                localStorage.removeItem(this.config.STORAGE.USER_KEY);
            }
        }
    }

    async handleAuth(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const nickname = document.getElementById('nickname').value.trim();

        // Validation
        if (!this.validateInput(email, password, nickname)) {
            return;
        }

        try {
            let response;
            const requestBody = { email, password };

            if (this.isRegistering) {
                requestBody.nickname = nickname;
                response = await this.makeAuthRequest('user/register', requestBody);
            } else {
                response = await this.makeAuthRequest('user/login', requestBody);
            }

            const data = await response.json();

            if (response.ok) {
                if (this.isRegistering) {
                    window.utils.showMessage(this.config.MESSAGES.SUCCESS.REGISTRATION_SUCCESS, 'success');
                    this.toggleAuthMode();
                } else {
                    await this.handleSuccessfulLogin(data);
                }
            } else {
                window.utils.showMessage(data.msg || this.config.MESSAGES.ERRORS.AUTH_FAILED, 'error');
            }
        } catch (error) {
            console.error('Auth error:', error);
            window.utils.showMessage(this.config.MESSAGES.ERRORS.NETWORK_ERROR, 'error');
        }
    }

    async makeAuthRequest(endpoint, body) {
        return fetch(`${this.config.API.RAYVITA_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            timeout: this.config.API.REQUEST_TIMEOUT
        });
    }

    validateInput(email, password, nickname) {
        // Email validation
        if (!this.config.VALIDATION.EMAIL_REGEX.test(email)) {
            window.utils.showMessage(this.config.MESSAGES.ERRORS.INVALID_EMAIL, 'error');
            return false;
        }

        // Password validation
        if (password.length < this.config.VALIDATION.PASSWORD_MIN_LENGTH) {
            window.utils.showMessage(this.config.MESSAGES.ERRORS.INVALID_PASSWORD, 'error');
            return false;
        }

        // Nickname validation (only for registration)
        if (this.isRegistering) {
            if (nickname.length < this.config.VALIDATION.NICKNAME_MIN_LENGTH ||
                nickname.length > this.config.VALIDATION.NICKNAME_MAX_LENGTH) {
                window.utils.showMessage(this.config.MESSAGES.ERRORS.INVALID_NICKNAME, 'error');
                return false;
            }
        }

        return true;
    }

    async handleSuccessfulLogin(data) {
        try {
            // Get user details
            const userResponse = await fetch(`${this.config.API.RAYVITA_BASE_URL}user/${data.user_id}`);
            const userData = await userResponse.json();

            this.currentUser = userData;
            localStorage.setItem(this.config.STORAGE.USER_KEY, JSON.stringify(this.currentUser));
            this.showMainApp();
        } catch (error) {
            console.error('Error fetching user details:', error);
            window.utils.showMessage('Login successful but failed to load user details.', 'error');
        }
    }

    toggleAuthMode() {
        this.isRegistering = !this.isRegistering;
        const button = document.getElementById('authButton');
        const toggle = document.getElementById('toggleAuth');
        const nicknameGroup = document.getElementById('nicknameGroup');

        if (this.isRegistering) {
            button.textContent = 'Create Neural Profile';
            toggle.innerHTML = 'Already have access? <a href="#">Access Neural Network</a>';
            nicknameGroup.style.display = 'block';
        } else {
            button.textContent = 'Access Neural Network';
            toggle.innerHTML = 'New to RayVita? <a href="#">Create Neural Profile</a>';
            nicknameGroup.style.display = 'none';
        }

        // Clear form
        document.getElementById('authForm').reset();
        this.clearMessages();
    }

    showMainApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        this.isLoggedIn = true;

        // Update user info in header
        this.updateUserInterface();

        // Trigger app initialization
        if (window.app && window.app.onUserLogin) {
            window.app.onUserLogin(this.currentUser);
        }
    }

    updateUserInterface() {
        const displayName = this.currentUser.nickname || this.currentUser.email;
        const userInitial = displayName.charAt(0).toUpperCase();

        // Update header user info
        const userName = document.getElementById('userName');
        const userId = document.getElementById('userId');
        const userAvatar = document.getElementById('userAvatar');
        const composerAvatar = document.getElementById('composerAvatar');

        if (userName) userName.textContent = displayName;
        if (userId) userId.textContent = this.currentUser.user_id;
        if (userAvatar) userAvatar.textContent = userInitial;
        if (composerAvatar) composerAvatar.textContent = userInitial;
    }

    logout() {
        // Clear stored data
        localStorage.removeItem(this.config.STORAGE.USER_KEY);
        localStorage.removeItem(this.config.STORAGE.LIKED_POSTS_KEY);

        // Reset state
        this.currentUser = null;
        this.isLoggedIn = false;

        // Show login screen
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';

        // Clear form and messages
        document.getElementById('authForm').reset();
        this.clearMessages();

        // Notify app of logout
        if (window.app && window.app.onUserLogout) {
            window.app.onUserLogout();
        }

        window.utils.showMessage('Logged out successfully', 'success');
    }

    clearMessages() {
        const container = document.getElementById('authMessage');
        if (container) {
            container.innerHTML = '';
        }
    }

    // Utility methods
    getCurrentUser() {
        return this.currentUser;
    }

    isUserLoggedIn() {
        return this.isLoggedIn && this.currentUser !== null;
    }

    getUserId() {
        return this.currentUser ? this.currentUser.user_id : null;
    }

    getUserDisplayName() {
        return this.currentUser ? (this.currentUser.nickname || this.currentUser.email) : null;
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}