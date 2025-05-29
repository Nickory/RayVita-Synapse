// RayVita-Synapse Main Application Controller
// 协调各个模块，管理应用程序生命周期

class RayVitaApp {
    constructor() {
        this.config = window.RayVitaConfig;
        this.currentPanel = 'dashboard';
        this.healthData = [];
        this.socialPosts = [];
        this.charts = {};
        this.refreshIntervals = {};

        this.init();
    }

    async init() {
        console.log('Initializing RayVita-Synapse Application...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
    }

    onDOMReady() {
        this.setupEventListeners();
        this.initializeBackground();
        this.initializeMap();

        // Check if user is already logged in
        if (window.authManager && window.authManager.isUserLoggedIn()) {
            this.onUserLogin(window.authManager.getCurrentUser());
        }

        console.log('RayVita-Synapse Application initialized successfully');
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const panel = e.target.dataset.panel;
                this.switchPanel(panel);
            });
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Window events
        window.addEventListener('beforeunload', () => this.onBeforeUnload());
        window.addEventListener('online', () => this.onConnectionChange(true));
        window.addEventListener('offline', () => this.onConnectionChange(false));
    }

    initializeBackground() {
        // Create star field effect
        if (window.utils) {
            window.utils.createStarField();
        }
    }

    initializeMap() {
        // Initialize map when contact panel is first opened
        setTimeout(() => {
            if (!this.map) {
                const mapElement = document.getElementById('map');
                if (mapElement && typeof L !== 'undefined') {
                    const { DEFAULT_CENTER, DEFAULT_ZOOM, TILE_LAYER, ATTRIBUTION } = this.config.MAP;

                    this.map = L.map('map').setView(DEFAULT_CENTER, DEFAULT_ZOOM);
                    L.tileLayer(TILE_LAYER, { attribution: ATTRIBUTION }).addTo(this.map);

                    L.marker(DEFAULT_CENTER).addTo(this.map)
                        .bindPopup('<strong>RayVita Technologies HQ</strong><br>Zhongguancun Science Park, Beijing')
                        .openPopup();
                }
            }
        }, 1000);
    }

    // User Lifecycle Events
    onUserLogin(user) {
        console.log('User logged in:', user.user_id);

        // Load initial data
        this.loadHealthData();
        this.loadSocialData();

        // Start auto-refresh intervals
        this.startAutoRefresh();

        // Initialize modules that require user context
        if (window.aiChat) {
            window.aiChat.setUser(user);
        }

        if (window.socialFeatures) {
            window.socialFeatures.setUser(user);
        }
    }

    onUserLogout() {
        console.log('User logged out');

        // Clear data
        this.healthData = [];
        this.socialPosts = [];

        // Stop auto-refresh
        this.stopAutoRefresh();

        // Clear charts
        this.clearAllCharts();

        // Reset to dashboard
        this.switchPanel('dashboard');
    }

    // Panel Management
    switchPanel(panelName) {
        if (this.currentPanel === panelName) return;

        console.log('Switching to panel:', panelName);

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-panel="${panelName}"]`)?.classList.add('active');

        // Show panel
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(panelName)?.classList.add('active');

        // Load panel-specific data
        this.loadPanelData(panelName);

        this.currentPanel = panelName;
    }

    loadPanelData(panelName) {
        switch (panelName) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'records':
                this.renderRecords();
                break;
            case 'ai-chat':
                if (window.aiChat) {
                    window.aiChat.updateRecordsList();
                }
                break;
            case 'social':
                this.loadSocialData();
                break;
            case 'contact':
                // Refresh map size
                if (this.map) {
                    setTimeout(() => this.map.invalidateSize(), 100);
                }
                break;
        }
    }

    // Data Management
    async loadHealthData() {
        if (!window.authManager || !window.authManager.isUserLoggedIn()) return;

        const user = window.authManager.getCurrentUser();
        const loading = document.getElementById('loadingDashboard');

        if (loading) loading.style.display = 'block';

        try {
            if (window.dataManager) {
                this.healthData = await window.dataManager.loadHealthData(user.user_id);
            } else {
                // Generate sample data if dataManager is not available
                this.healthData = this.generateSampleHealthData();
            }

            this.renderDashboard();
            this.renderRecords();

            if (window.aiChat) {
                window.aiChat.updateRecordsList();
            }

        } catch (error) {
            console.error('Error loading health data:', error);
            window.utils?.showMessage(this.config.MESSAGES.ERRORS.DATA_LOAD_FAILED, 'error');
        } finally {
            if (loading) loading.style.display = 'none';
        }
    }

    async loadSocialData() {
        if (!window.authManager || !window.authManager.isUserLoggedIn()) return;

        try {
            if (window.socialFeatures) {
                await window.socialFeatures.loadSocialData();
            }
        } catch (error) {
            console.error('Error loading social data:', error);
        }
    }

    // Dashboard Rendering
    renderDashboard() {
        if (this.healthData.length === 0) {
            document.getElementById('vitalMetrics').innerHTML =
                '<p style="text-align: center; color: var(--text-secondary);">No health data available. Please use RayVita app to start measuring.</p>';
            return;
        }

        this.renderVitalMetrics();
        this.renderRecentActivity();

        // Render charts with delay to ensure DOM is ready
        setTimeout(() => {
            if (window.chartRenderer) {
                window.chartRenderer.renderAllCharts(this.healthData);
            }
        }, 100);
    }

    renderVitalMetrics() {
        const latest = this.healthData[0];
        const previous = this.healthData[1] || latest;
        const container = document.getElementById('vitalMetrics');

        if (!container || !latest) return;

        const heartRateTrend = latest.heartRate - (previous.heartRate || 0);
        const spo2Trend = latest.spo2Result ? latest.spo2Result.spo2 - (previous.spo2Result?.spo2 || 0) : 0;
        const confidenceTrend = latest.confidence - (previous.confidence || 0);

        container.innerHTML = `
            <div class="metric-item">
                <div class="metric-value">${latest.heartRate ? latest.heartRate.toFixed(1) : '--'}</div>
                <div class="metric-label">Heart Rate (BPM)</div>
                <div class="metric-trend ${heartRateTrend > 0 ? 'trend-up' : heartRateTrend < 0 ? 'trend-down' : 'trend-stable'}">
                    ${heartRateTrend > 0 ? '↗' : heartRateTrend < 0 ? '↘' : '→'} ${Math.abs(heartRateTrend).toFixed(1)}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${latest.spo2Result ? latest.spo2Result.spo2.toFixed(1) : '--'}</div>
                <div class="metric-label">SpO2 (%)</div>
                <div class="metric-trend ${spo2Trend > 0 ? 'trend-up' : spo2Trend < 0 ? 'trend-down' : 'trend-stable'}">
                    ${spo2Trend > 0 ? '↗' : spo2Trend < 0 ? '↘' : '→'} ${Math.abs(spo2Trend).toFixed(1)}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${latest.hrvResult ? latest.hrvResult.rmssd.toFixed(1) : '--'}</div>
                <div class="metric-label">RMSSD (ms)</div>
                <div class="metric-trend trend-${latest.hrvResult && latest.hrvResult.rmssd > 30 ? 'up' : 'down'}">
                    ${latest.hrvResult && latest.hrvResult.rmssd > 30 ? 'Good' : 'Monitor'}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${latest.confidence ? (latest.confidence * 100).toFixed(0) : '--'}</div>
                <div class="metric-label">Confidence (%)</div>
                <div class="metric-trend ${confidenceTrend > 0 ? 'trend-up' : confidenceTrend < 0 ? 'trend-down' : 'trend-stable'}">
                    ${confidenceTrend > 0 ? '↗' : confidenceTrend < 0 ? '↘' : '→'} ${Math.abs(confidenceTrend * 100).toFixed(0)}%
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${this.healthData.length}</div>
                <div class="metric-label">Total Sessions</div>
                <div class="metric-trend trend-up">Active</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${latest.hrvResult ? latest.hrvResult.stressIndex.toFixed(2) : '--'}</div>
                <div class="metric-label">Stress Index</div>
                <div class="metric-trend trend-${latest.hrvResult && latest.hrvResult.stressIndex < 0.5 ? 'up' : 'down'}">
                    ${latest.hrvResult && latest.hrvResult.stressIndex < 0.5 ? 'Low' : 'Elevated'}
                </div>
            </div>
        `;
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        const recentData = this.healthData.slice(0, 5);

        if (recentData.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No recent activity</p>';
            return;
        }

        container.innerHTML = recentData.map(item => {
            const date = new Date(item.createdAt || item.timestamp);
            const timeAgo = window.utils ? window.utils.getTimeAgo(date) : 'Recently';

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(0, 255, 255, 0.05); border-radius: 10px; margin-bottom: 10px; border-left: 3px solid var(--primary-cyan);">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 5px;">
                            HR: ${item.heartRate ? item.heartRate.toFixed(1) : 'N/A'} BPM
                            ${item.spo2Result ? `• SpO2: ${item.spo2Result.spo2.toFixed(1)}%` : ''}
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary);">
                            ${timeAgo} • Confidence: ${item.confidence ? (item.confidence * 100).toFixed(0) : 'N/A'}%
                        </div>
                    </div>
                    <div style="color: var(--accent-green); font-size: 18px;">💚</div>
                </div>
            `;
        }).join('');
    }

    renderRecords() {
        // Update statistics
        if (this.healthData.length > 0) {
            const avgHeartRate = this.healthData.reduce((sum, item) => sum + (item.heartRate || 0), 0) / this.healthData.length;
            const avgConfidence = this.healthData.reduce((sum, item) => sum + (item.confidence || 0), 0) / this.healthData.length;
            const lastMeasurement = window.utils ? window.utils.getTimeAgo(new Date(this.healthData[0].createdAt || this.healthData[0].timestamp)) : 'Recently';

            document.getElementById('totalSessions').textContent = this.healthData.length;
            document.getElementById('avgHeartRate').textContent = avgHeartRate.toFixed(1);
            document.getElementById('avgConfidence').textContent = (avgConfidence * 100).toFixed(0) + '%';
            document.getElementById('lastMeasurement').textContent = lastMeasurement;
        }

        // Render records list
        if (window.recordViewer) {
            window.recordViewer.renderRecordsList(this.healthData);
        }
    }

    // Auto-refresh Management
    startAutoRefresh() {
        const { HEALTH_DATA, SOCIAL_DATA } = this.config.APP.AUTO_REFRESH_INTERVAL;

        this.refreshIntervals.healthData = setInterval(() => {
            if (window.authManager && window.authManager.isUserLoggedIn()) {
                this.loadHealthData();
            }
        }, HEALTH_DATA);

        this.refreshIntervals.socialData = setInterval(() => {
            if (window.authManager && window.authManager.isUserLoggedIn()) {
                this.loadSocialData();
            }
        }, SOCIAL_DATA);
    }

    stopAutoRefresh() {
        Object.values(this.refreshIntervals).forEach(interval => {
            clearInterval(interval);
        });
        this.refreshIntervals = {};
    }

    // Chart Management
    clearAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    // Sample Data Generation
    generateSampleHealthData() {
        const sampleData = [];
        const now = new Date();
        const user = window.authManager ? window.authManager.getCurrentUser() : { user_id: 'demo' };

        for (let i = 0; i < this.config.SAMPLE_DATA.GENERATE_RECORDS_COUNT; i++) {
            const date = new Date(now.getTime() - i * 3600000 * Math.random() * 24);
            const baseHR = 70 + Math.random() * 30;
            const confidence = 0.85 + Math.random() * 0.15;

            sampleData.push({
                sessionId: `demo-${i}`,
                user_id: user.user_id,
                timestamp: date.getTime(),
                createdAt: date.toISOString(),
                heartRate: baseHR + (Math.random() - 0.5) * 10,
                confidence: confidence,
                frameCount: Math.floor(200 + Math.random() * 100),
                processingTimeMs: Math.floor(1000 + Math.random() * 500),
                hrvResult: {
                    rmssd: 20 + Math.random() * 40,
                    sdnn: 30 + Math.random() * 30,
                    pnn50: Math.random() * 20,
                    stressIndex: Math.random() * 0.8
                },
                spo2Result: {
                    spo2: 96 + Math.random() * 4
                },
                signalQuality: {
                    illuminationQuality: 0.7 + Math.random() * 0.3,
                    motionArtifact: Math.random() * 0.3
                },
                rppgSignal: window.utils ? window.utils.generateSampleWaveform(this.config.SAMPLE_DATA.WAVEFORM_LENGTH, 'rppg') : [],
                syncStatus: Math.random() > 0.5 ? 'synced' : 'pending'
            });
        }

        return sampleData;
    }

    // Event Handlers
    handleKeyboard(e) {
        // Escape key to close modals
        if (e.key === 'Escape') {
            if (window.recordViewer) {
                window.recordViewer.closeViewer();
            }
        }
    }

    onBeforeUnload() {
        // Clean up intervals and resources
        this.stopAutoRefresh();
        this.clearAllCharts();
    }

    onConnectionChange(isOnline) {
        const message = isOnline ?
            'Connection restored. Data will sync automatically.' :
            'Connection lost. Working in offline mode.';
        const type = isOnline ? 'success' : 'warning';

        if (window.utils) {
            window.utils.showMessage(message, type);
        }
    }

    // Public API
    getHealthData() {
        return this.healthData;
    }

    getCurrentPanel() {
        return this.currentPanel;
    }

    refreshCurrentPanel() {
        this.loadPanelData(this.currentPanel);
    }
}

// Initialize the application
window.app = new RayVitaApp();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RayVitaApp;
}