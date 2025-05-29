// RayVita-Synapse Configuration File
// 所有配置项和常量定义

window.RayVitaConfig = {
    // API Configuration
    API: {
        RAYVITA_BASE_URL: 'http://47.96.237.130:5000/api/',
        DEEPSEEK_API_KEY: 'sk-0dd7411c6de74f119e9a06be144a89d6',
        DEEPSEEK_BASE_URL: 'https://api.deepseek.com/',
        REQUEST_TIMEOUT: 10000
    },

    // Application Settings
    APP: {
        NAME: 'RayVita-Synapse',
        VERSION: '1.0.0',
        DEFAULT_LANGUAGE: 'en',
        AUTO_REFRESH_INTERVAL: {
            HEALTH_DATA: 5 * 60 * 1000, // 5 minutes
            SOCIAL_DATA: 2 * 60 * 1000   // 2 minutes
        }
    },

    // UI Configuration
    UI: {
        ANIMATION_DURATION: 2000,
        CHART_COLORS: {
            PRIMARY_CYAN: '#00ffff',
            PRIMARY_BLUE: '#0080ff',
            PRIMARY_PURPLE: '#8000ff',
            ACCENT_PINK: '#ff0080',
            ACCENT_GREEN: '#00ff88',
            ACCENT_ORANGE: '#ff8800',
            ACCENT_GOLD: '#ffd700'
        },
        CHART_OPTIONS: {
            RESPONSIVE: true,
            MAINTAIN_ASPECT_RATIO: false,
            FONT_FAMILY: 'Inter'
        }
    },

    // Health Data Configuration
    HEALTH: {
        NORMAL_HEART_RATE_RANGE: {
            MIN: 60,
            MAX: 100
        },
        NORMAL_SPO2_RANGE: {
            MIN: 95,
            MAX: 100
        },
        HRV_THRESHOLDS: {
            GOOD_RMSSD: 30,
            HIGH_STRESS_INDEX: 0.6
        },
        SIGNAL_QUALITY_THRESHOLDS: {
            EXCELLENT: 0.8,
            GOOD: 0.6
        }
    },

    // Social Configuration
    SOCIAL: {
        POST_MAX_LENGTH: 500,
        FEED_PAGE_SIZE: 20,
        TRENDING_TOPICS: [
            '# Heart Rate Health',
            '# rPPG Technology',
            '# Healthy Lifestyle',
            '# Stress Management',
            '# Fitness Tracking',
            '# Sleep Quality'
        ]
    },

    // Storage Keys
    STORAGE: {
        USER_KEY: 'rayVitaUser',
        SETTINGS_KEY: 'rayVitaSettings',
        LIKED_POSTS_KEY: 'rayVitaLikedPosts'
    },

    // AI Configuration
    AI: {
        SYSTEM_PROMPTS: {
            HEALTH_ASSISTANT: 'You are RayVita\'s professional health AI advisor, specializing in rPPG heart rate detection data analysis. Please provide professional, accurate, and easy-to-understand health advice in English. Focus on heart rate, SpO2, HRV metrics interpretation and health recommendations. Keep responses concise and practical for general users.',
            ANALYSIS_SPECIALIST: 'You are a specialized AI health analyst with expertise in cardiovascular monitoring, rPPG technology, and biometric data interpretation. Provide comprehensive, accurate, and actionable health insights in English.'
        },
        DEFAULT_TEMPERATURE: 0.7,
        MAX_TOKENS: 1000,
        ANALYSIS_MAX_TOKENS: 2000
    },

    // Validation Rules
    VALIDATION: {
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PASSWORD_MIN_LENGTH: 6,
        NICKNAME_MIN_LENGTH: 2,
        NICKNAME_MAX_LENGTH: 50
    },

    // Error Messages
    MESSAGES: {
        ERRORS: {
            NETWORK_ERROR: 'Network error. Please check your connection and try again.',
            AUTH_FAILED: 'Authentication failed. Please check your credentials.',
            DATA_LOAD_FAILED: 'Failed to load data. Please try again.',
            AI_SERVICE_UNAVAILABLE: 'AI service is temporarily unavailable. Please try again later.',
            INVALID_EMAIL: 'Please enter a valid email address.',
            INVALID_PASSWORD: 'Password must be at least 6 characters long.',
            INVALID_NICKNAME: 'Display name must be 2-50 characters long.'
        },
        SUCCESS: {
            REGISTRATION_SUCCESS: 'Neural profile created successfully! Please login to access your dashboard.',
            POST_CREATED: 'Health update shared successfully! 🎉',
            ANALYSIS_COMPLETE: 'AI analysis completed successfully.',
            DATA_SYNCED: 'Data synchronized successfully.'
        },
        INFO: {
            NO_DATA_AVAILABLE: 'No data available. Please use RayVita app to start measuring.',
            LOADING: 'Loading...',
            PROCESSING: 'Processing...'
        }
    },

    // Map Configuration
    MAP: {
        DEFAULT_CENTER: [39.9042, 116.4074], // Beijing coordinates
        DEFAULT_ZOOM: 13,
        TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ATTRIBUTION: ' OpenStreetMap contributors'
    },

    // Sample Data Configuration
    SAMPLE_DATA: {
        GENERATE_RECORDS_COUNT: 15,
        WAVEFORM_LENGTH: 300,
        SOCIAL_POSTS_COUNT: 3
    }
};

// Freeze the configuration to prevent accidental modifications
Object.freeze(window.RayVitaConfig);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.RayVitaConfig;
}

console.log('RayVita Configuration loaded:', window.RayVitaConfig.APP.NAME, 'v' + window.RayVitaConfig.APP.VERSION);