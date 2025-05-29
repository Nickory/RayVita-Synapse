// RayVita-Synapse Utility Functions
// 通用工具函数库

window.utils = {
    config: window.RayVitaConfig,

    // Time and Date Utilities
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'Just now';
    },

    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        const formatOptions = { ...defaultOptions, ...options };
        return new Intl.DateTimeFormat('en-US', formatOptions).format(date);
    },

    // Message and Notification System
    showMessage(message, type = 'info') {
        this.createFloatingNotification(message, type);
        this.updateAuthMessage(message, type);
    },

    createFloatingNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `${type}-message`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: 600;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
        `;

        const icon = this.getMessageIcon(type);
        notification.innerHTML = `${icon} ${message}`;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    },

    updateAuthMessage(message, type) {
        const container = document.getElementById('authMessage');
        if (container) {
            const icon = this.getMessageIcon(type);
            container.innerHTML = `<div class="${type}-message">${icon} ${message}</div>`;
            setTimeout(() => {
                container.innerHTML = '';
            }, 5000);
        }
    },

    getMessageIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    },

    // Health Data Utilities
    generateSampleWaveform(length, type) {
        const data = [];
        const baseFreq = 0.02;

        for (let i = 0; i < length; i++) {
            let value = 0;

            if (type === 'rppg') {
                // Generate realistic rPPG signal with cardiac pulse pattern
                value = Math.sin(i * baseFreq * 2 * Math.PI) * 0.8 +
                    Math.sin(i * baseFreq * 4 * Math.PI) * 0.3 +
                    (Math.random() - 0.5) * 0.2;
            } else if (type === 'heartrate') {
                // Generate heart rate trend data
                value = 70 + Math.sin(i * baseFreq * Math.PI) * 15 + (Math.random() - 0.5) * 5;
            } else if (type === 'quality') {
                // Generate signal quality data
                value = 0.8 + Math.sin(i * baseFreq * Math.PI) * 0.15 + (Math.random() - 0.5) * 0.1;
            }

            data.push(value);
        }

        return data;
    },

    generateHealthAssessment(record) {
        let assessment = '';

        // Heart Rate Assessment
        if (record.heartRate) {
            const { MIN, MAX } = this.config.HEALTH.NORMAL_HEART_RATE_RANGE;
            if (record.heartRate < MIN) {
                assessment += this.createAssessmentItem('⚠️', 'Low Heart Rate',
                    'Your resting heart rate is below normal range. If you are not a trained athlete, consider consulting a doctor.', 'warning');
            } else if (record.heartRate > MAX) {
                assessment += this.createAssessmentItem('🚨', 'Elevated Heart Rate',
                    'Your heart rate is above normal range. This may be due to stress, caffeine, or other factors. Consider rest and monitoring.', 'alert');
            } else {
                assessment += this.createAssessmentItem('✅', 'Normal Heart Rate',
                    `Your heart rate is within healthy range (${MIN}-${MAX} BPM).`, 'good');
            }
        }

        // HRV Assessment
        if (record.hrvResult) {
            const { GOOD_RMSSD, HIGH_STRESS_INDEX } = this.config.HEALTH.HRV_THRESHOLDS;
            if (record.hrvResult.rmssd > GOOD_RMSSD) {
                assessment += this.createAssessmentItem('💚', 'Good HRV',
                    'RMSSD value indicates good autonomic nervous system balance and stress management capacity.', 'good');
            } else {
                assessment += this.createAssessmentItem('⚠️', 'HRV Needs Attention',
                    'RMSSD value is low, which may indicate higher stress or need for more rest. Consider relaxation practices.', 'warning');
            }

            if (record.hrvResult.stressIndex > HIGH_STRESS_INDEX) {
                assessment += this.createAssessmentItem('😰', 'High Stress',
                    'Stress index is elevated. Consider deep breathing, meditation, or other relaxation activities.', 'alert');
            }
        }

        // SpO2 Assessment
        if (record.spo2Result) {
            if (record.spo2Result.spo2 >= 98) {
                assessment += this.createAssessmentItem('🫁', 'Excellent SpO2',
                    'Your blood oxygen saturation is in excellent range, indicating good respiratory and circulatory system function.', 'good');
            } else if (record.spo2Result.spo2 >= 96) {
                assessment += this.createAssessmentItem('👍', 'Normal SpO2',
                    'Your blood oxygen saturation is within normal range.', 'good');
            } else {
                assessment += this.createAssessmentItem('⚠️', 'SpO2 Needs Attention',
                    'Blood oxygen saturation is slightly low. If this persists, consider consulting a healthcare provider.', 'warning');
            }
        }

        // Signal Quality Assessment
        if (record.signalQuality) {
            const { EXCELLENT, GOOD } = this.config.HEALTH.SIGNAL_QUALITY_THRESHOLDS;
            const quality = record.signalQuality.illuminationQuality;

            if (quality > EXCELLENT) {
                assessment += this.createAssessmentItem('📡', 'Excellent Signal Quality',
                    'Measurement environment and conditions were good, ensuring high data reliability.', 'good');
            } else if (quality > GOOD) {
                assessment += this.createAssessmentItem('📶', 'Moderate Signal Quality',
                    'Consider measuring in well-lit, relatively still environments for better results.', 'warning');
            } else {
                assessment += this.createAssessmentItem('📱', 'Signal Quality Needs Improvement',
                    'Consider improving lighting conditions and maintaining stability during measurement.', 'alert');
            }
        }

        // General Recommendations
        assessment += this.createRecommendationsSection();

        return assessment;
    },

    createAssessmentItem(icon, title, description, type) {
        const colorClass = type === 'good' ? 'var(--accent-green)' :
                          type === 'warning' ? 'var(--accent-orange)' : 'var(--accent-pink)';

        return `
            <div class="education-feature">
                <div class="feature-icon" style="color: ${colorClass};">${icon}</div>
                <div>
                    <strong>${title}:</strong><br>
                    ${description}
                </div>
            </div>
        `;
    },

    createRecommendationsSection() {
        return `
            <div style="margin-top: 25px; padding: 20px; background: rgba(0, 255, 255, 0.05); border-radius: 15px; border-left: 4px solid var(--primary-cyan);">
                <h5 style="color: var(--primary-cyan); margin-bottom: 15px;">💡 Personalized Recommendations</h5>
                <ul style="margin-left: 20px; line-height: 1.8;">
                    <li>Maintain regular sleep schedule with adequate rest (7-9 hours)</li>
                    <li>Engage in moderate aerobic exercise like walking, swimming, or cycling</li>
                    <li>Learn stress management techniques like deep breathing, meditation, or yoga</li>
                    <li>Maintain balanced diet and moderate caffeine intake</li>
                    <li>Regular health checkups to monitor cardiovascular health</li>
                </ul>
            </div>
        `;
    },

    // Data Validation Utilities
    validateHealthData(data) {
        if (!data || typeof data !== 'object') return false;

        // Basic required fields
        const requiredFields = ['user_id', 'timestamp'];
        for (let field of requiredFields) {
            if (!data[field]) return false;
        }

        // Validate heart rate if present
        if (data.heartRate && (data.heartRate < 30 || data.heartRate > 220)) {
            return false;
        }

        // Validate SpO2 if present
        if (data.spo2Result && data.spo2Result.spo2 &&
            (data.spo2Result.spo2 < 70 || data.spo2Result.spo2 > 100)) {
            return false;
        }

        return true;
    },

    // DOM Utilities
    createStarField() {
        const constellation = document.querySelector('.constellation');
        if (!constellation) return;

        for (let i = 0; i < 25; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.top = Math.random() * 100 + '%';
            star.style.left = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            constellation.appendChild(star);
        }
    },

    // Format Chat Message
    formatChatMessage(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/•/g, '•');
    },

    // Local Storage Utilities
    setStorageItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },

    getStorageItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },

    removeStorageItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },

    // API Utilities
    async makeApiRequest(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: this.config.API.REQUEST_TIMEOUT
        };

        const finalOptions = { ...defaultOptions, ...options };
        const url = endpoint.startsWith('http') ? endpoint : `${this.config.API.RAYVITA_BASE_URL}${endpoint}`;

        try {
            const response = await fetch(url, finalOptions);
            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    // HTML Escaping
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    // Debounce Function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Initialize utilities
    init() {
        this.addNotificationStyles();
        console.log('RayVita Utils initialized');
    },

    addNotificationStyles() {
        if (document.getElementById('utilsStyles')) return;

        const style = document.createElement('style');
        style.id = 'utilsStyles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.utils.init());
} else {
    window.utils.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.utils;
}