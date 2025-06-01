// RayVita-Synapse AI Analysis Module
// 处理AI健康分析功能和DeepSeek API集成


class AiAnalysisManager {
    constructor() {
        this.config = window.RayVitaConfig;
        this.currentUser = null;
        this.isAnalyzing = false;
        this.currentAnalysis = null;
        this.analysisHistory = [];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeUI();
        console.log('AI Analysis Manager initialized');
    }

    setupEventListeners() {
        // 导出按钮事件监听
        document.addEventListener('click', (e) => {
            if (e.target.matches('.export-btn[data-format]')) {
                const format = e.target.getAttribute('data-format');
                this.exportAnalysis(format);
            }
        });
    }

    // 初始化UI
    initializeUI() {
        this.updateAnalysisHistory();
    }

    // 设置当前用户
    setUser(user) {
        this.currentUser = user;
        console.log('AI Analysis user set:', user.user_id);
    }

    // 执行AI分析
    async performAnalysis() {
        console.log('Starting AI health analysis...');

        // 检查用户登录状态和数据
        if (!this.validateAnalysisConditions()) {
            return;
        }

        if (this.isAnalyzing) {
            this.showMessage(this.config.MESSAGES.INFO.PROCESSING, 'warning');
            return;
        }

        this.isAnalyzing = true;
        this.showLoadingState();

        try {
            // 获取健康数据
            const healthData = this.getHealthData();

            // 准备分析数据
            const analysisData = this.prepareAnalysisData(healthData);

            // 调用AI分析API
            const analysis = await this.callAnalysisAPI(analysisData);

            // 显示分析结果
            this.displayAnalysisResult(analysis, healthData.length);

            // 保存到历史记录
            this.saveAnalysisToHistory(analysis, healthData.length);

            this.showMessage(this.config.MESSAGES.SUCCESS.ANALYSIS_COMPLETE, 'success');

        } catch (error) {
            console.error('AI analysis error:', error);
            this.showErrorState(error);
        } finally {
            this.isAnalyzing = false;
        }
    }

    // 验证分析条件
    validateAnalysisConditions() {
        // 检查用户登录
        if (!window.authManager || !window.authManager.isUserLoggedIn()) {
            this.showMessage('Please login to perform AI analysis.', 'error');
            return false;
        }

        this.currentUser = window.authManager.getCurrentUser();

        // 检查健康数据
        const healthData = this.getHealthData();
        if (!healthData || healthData.length === 0) {
            this.showMessage(this.config.MESSAGES.ERRORS.DATA_LOAD_FAILED, 'error');
            return false;
        }

        return true;
    }

    // 获取健康数据
    getHealthData() {
        if (window.app && window.app.getHealthData) {
            return window.app.getHealthData();
        }
        return [];
    }

    // 准备分析数据
    prepareAnalysisData(healthData) {
        const latestData = healthData.slice(0, 10);

        return {
            userProfile: {
                userId: this.currentUser.user_id,
                nickname: this.currentUser.nickname || this.currentUser.email,
                totalSessions: healthData.length,
                analysisDate: new Date().toISOString()
            },
            recentMeasurements: latestData.map(item => ({
                timestamp: item.createdAt || item.timestamp,
                heartRate: item.heartRate,
                spo2: item.spo2Result?.spo2,
                hrvMetrics: item.hrvResult ? {
                    rmssd: item.hrvResult.rmssd,
                    sdnn: item.hrvResult.sdnn,
                    pnn50: item.hrvResult.pnn50,
                    stressIndex: item.hrvResult.stressIndex
                } : null,
                confidence: item.confidence,
                signalQuality: item.signalQuality
            })),
            statisticalSummary: this.calculateHealthStatistics(healthData),
            healthTrends: this.analyzeHealthTrends(healthData)
        };
    }

    // 计算健康统计数据
    calculateHealthStatistics(healthData) {
        const stats = {
            heartRate: this.calculateMetricStats(healthData, 'heartRate'),
            confidence: this.calculateMetricStats(healthData, 'confidence')
        };

        // SpO2 统计
        const spo2Data = healthData.filter(item => item.spo2Result);
        if (spo2Data.length > 0) {
            stats.spo2 = this.calculateMetricStats(spo2Data, item => item.spo2Result.spo2);
        }

        // HRV 统计
        const hrvData = healthData.filter(item => item.hrvResult);
        if (hrvData.length > 0) {
            stats.hrv = {
                averageRMSSD: this.calculateAverage(hrvData, item => item.hrvResult.rmssd),
                averageSDNN: this.calculateAverage(hrvData, item => item.hrvResult.sdnn),
                averageStressIndex: this.calculateAverage(hrvData, item => item.hrvResult.stressIndex)
            };
        }

        return stats;
    }

    // 计算指标统计
    calculateMetricStats(data, accessor) {
        const values = data.map(item => {
            return typeof accessor === 'function' ? accessor(item) : item[accessor];
        }).filter(val => val != null);

        if (values.length === 0) return null;

        return {
            average: this.calculateAverage(values),
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length
        };
    }

    // 计算平均值
    calculateAverage(data, accessor = null) {
        if (data.length === 0) return 0;

        const sum = data.reduce((acc, item) => {
            const value = accessor ? accessor(item) : item;
            return acc + (value || 0);
        }, 0);

        return sum / data.length;
    }

    // 分析健康趋势
    analyzeHealthTrends(healthData) {
        if (healthData.length < 2) return null;

        const recentData = healthData.slice(0, 7); // 最近7条记录
        const olderData = healthData.slice(7, 14); // 之前7条记录

        if (olderData.length === 0) return null;

        const recentAvgHR = this.calculateAverage(recentData, item => item.heartRate);
        const olderAvgHR = this.calculateAverage(olderData, item => item.heartRate);

        return {
            heartRateTrend: recentAvgHR - olderAvgHR,
            dataPoints: recentData.length,
            timespan: this.calculateTimespan(recentData)
        };
    }

    // 计算时间跨度
    calculateTimespan(data) {
        if (data.length < 2) return 0;

        const latest = new Date(data[0].createdAt || data[0].timestamp);
        const earliest = new Date(data[data.length - 1].createdAt || data[data.length - 1].timestamp);

        return Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24)); // 天数
    }

    // 调用AI分析API
    async callAnalysisAPI(analysisData) {
        const prompt = this.generateAnalysisPrompt(analysisData);

        const requestBody = {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: this.config.AI.SYSTEM_PROMPTS.ANALYSIS_SPECIALIST
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            stream: false,
            temperature: this.config.AI.DEFAULT_TEMPERATURE,
            max_tokens: this.config.AI.ANALYSIS_MAX_TOKENS
        };

        const response = await fetch(`${this.config.API.DEEPSEEK_BASE_URL}v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.API.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify(requestBody),
            timeout: this.config.API.REQUEST_TIMEOUT
        });

        if (!response.ok) {
            throw new Error(`AI analysis failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // 生成分析提示词
    generateAnalysisPrompt(analysisData) {
        return `As an advanced health analytics AI specialized in cardiovascular monitoring and rPPG technology, analyze this comprehensive biometric dataset:

${JSON.stringify(analysisData, null, 2)}

Please provide a detailed health analysis including:

🔍 **ASSESSMENT OVERVIEW**
- Overall cardiovascular health status based on heart rate patterns
- Key trends and patterns identified in the data
- Data quality and reliability assessment
- Measurement consistency evaluation

⚠️ **HEALTH INSIGHTS**
- Heart rate variability analysis and what it indicates
- Stress level indicators from HRV data
- Blood oxygenation patterns (if available)
- Any concerning trends or anomalies that need attention
- Comparison with normal healthy ranges

💡 **PERSONALIZED RECOMMENDATIONS**
- Lifestyle improvements based on the data patterns
- Monitoring frequency suggestions
- Areas requiring medical attention (if any)
- Wellness optimization strategies
- Exercise and stress management recommendations

📊 **TECHNICAL ANALYSIS**
- rPPG signal quality evaluation
- Measurement accuracy assessment
- Suggested improvements for data collection
- Optimal measurement conditions

🎯 **ACTION ITEMS**
- Immediate steps for health improvement
- Long-term monitoring goals
- When to consult healthcare providers
- Follow-up measurement schedule

Format your response with clear sections and actionable insights. Focus on being informative, supportive, and scientifically accurate while remaining accessible to the user. Include specific numerical references to the data when making assessments.`;
    }

    // 显示加载状态
    showLoadingState() {
        const container = document.getElementById('aiAnalysisContent');
        if (!container) return;

        container.innerHTML = `
            <div class="ai-analysis">
                <div class="ai-header">
                    <div class="ai-icon">🧠</div>
                    <div>
                        <div class="ai-title">DeepSeek Neural Analysis</div>
                        <div class="ai-status">Processing biometric data...</div>
                    </div>
                </div>
                <div class="loading">
                    <div class="spinner"></div>
                    <div>AI analyzing your health patterns...</div>
                    <div style="margin-top: 15px; font-size: 14px; color: var(--text-secondary);">
                        This may take up to 30 seconds for comprehensive analysis
                    </div>
                </div>
            </div>
        `;
    }

    // 显示分析结果
    displayAnalysisResult(analysis, totalMeasurements) {
        const container = document.getElementById('aiAnalysisContent');
        if (!container) return;

        const formattedAnalysis = this.formatAnalysisContent(analysis);
        const timestamp = new Date().toLocaleString();

        container.innerHTML = `
            <div class="ai-analysis">
                <div class="ai-header">
                    <div class="ai-icon">🧠</div>
                    <div>
                        <div class="ai-title">DeepSeek Neural Analysis Complete</div>
                        <div class="ai-status">Analysis based on ${totalMeasurements} measurements • ${timestamp}</div>
                    </div>
                </div>
                <div class="ai-content">
                    ${formattedAnalysis}
                </div>
                <div style="margin-top: 30px; text-align: center; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button class="auth-button" onclick="window.aiAnalysis.performAnalysis()" 
                            style="background: linear-gradient(45deg, var(--primary-purple), var(--accent-pink)); padding: 12px 24px;">
                        🔄 Regenerate Analysis
                    </button>
                    <button class="auth-button" onclick="window.aiAnalysis.showExportOptions()" 
                            style="background: linear-gradient(45deg, var(--accent-green), var(--primary-cyan)); padding: 12px 24px;">
                        📄 Export Report
                    </button>
                </div>
            </div>
        `;

        this.currentAnalysis = {
            content: analysis,
            timestamp: new Date(),
            measurements: totalMeasurements
        };

        // 显示导出选项
        this.toggleExportSection(true);
    }

    // 显示错误状态
    showErrorState(error) {
        const container = document.getElementById('aiAnalysisContent');
        if (!container) return;

        const errorType = this.categorizeError(error);
        const errorMessage = this.getErrorMessage(errorType);

        container.innerHTML = `
            <div class="ai-analysis">
                <div class="ai-header">
                    <div class="ai-icon">❌</div>
                    <div>
                        <div class="ai-title">Analysis Unavailable</div>
                        <div class="ai-status">${errorType.title}</div>
                    </div>
                </div>
                <div class="ai-content">
                    <div class="ai-insight alert">
                        <strong>Service Notice:</strong> ${errorMessage.description}
                    </div>
                    <div class="ai-insight">
                        <strong>Alternative:</strong> ${errorMessage.alternative}
                    </div>
                    <div class="ai-insight">
                        <strong>What you can do:</strong>
                        <ul style="margin-left: 20px; margin-top: 10px;">
                            ${errorMessage.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                        </ul>
                    </div>
                    <div style="margin-top: 20px; text-align: center;">
                        <button class="auth-button" onclick="window.aiAnalysis.performAnalysis()" 
                                style="background: linear-gradient(45deg, var(--accent-orange), var(--accent-pink)); padding: 12px 24px;">
                            🔄 Try Again
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // 错误分类
    categorizeError(error) {
        const message = error.message.toLowerCase();

        if (message.includes('fetch') || message.includes('network')) {
            return {type: 'network', title: 'Network Connection Issue'};
        } else if (message.includes('401') || message.includes('403')) {
            return {type: 'auth', title: 'Authentication Error'};
        } else if (message.includes('429') || message.includes('quota')) {
            return {type: 'quota', title: 'Service Limit Reached'};
        } else if (message.includes('timeout')) {
            return {type: 'timeout', title: 'Request Timeout'};
        } else {
            return {type: 'unknown', title: 'Service Temporarily Unavailable'};
        }
    }

    // 获取错误消息
    getErrorMessage(errorType) {
        const messages = {
            network: {
                description: 'Unable to connect to AI analysis service. Please check your internet connection.',
                alternative: 'You can still view your health metrics in the Dashboard and Records sections.',
                suggestions: [
                    'Check your internet connection',
                    'Try refreshing the page',
                    'Wait a moment and try again'
                ]
            },
            auth: {
                description: 'Authentication failed with AI service. This may be a temporary issue.',
                alternative: 'Manual analysis of your health data is still available in other sections.',
                suggestions: [
                    'Try again in a few minutes',
                    'Check if the service is undergoing maintenance',
                    'Contact support if the problem persists'
                ]
            },
            quota: {
                description: 'AI analysis service has reached its usage limit. Please try again later.',
                alternative: 'You can export your data for analysis by healthcare professionals.',
                suggestions: [
                    'Try again in an hour',
                    'Use the manual analysis features',
                    'Export your data for offline analysis'
                ]
            },
            timeout: {
                description: 'Analysis request timed out. The service may be experiencing high demand.',
                alternative: 'Your health data is still accessible for manual review.',
                suggestions: [
                    'Try again with a shorter analysis period',
                    'Wait a few minutes before retrying',
                    'Check your internet connection speed'
                ]
            },
            unknown: {
                description: 'An unexpected error occurred during analysis. Our team has been notified.',
                alternative: 'All your health data remains safe and accessible in other sections.',
                suggestions: [
                    'Try again in a few minutes',
                    'Refresh the page if the problem persists',
                    'Contact support if you continue experiencing issues'
                ]
            }
        };

        return messages[errorType.type] || messages.unknown;
    }

   formatAnalysisContent(analysis) {
    let formatted = analysis
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/#{1,6}\s*(.*?)$/gm, '<h4>$1</h4>')
        .replace(/^- (.*?)$/gm, '<li>$1</li>')
        .replace(/^(\d+\.)\s*(.*?)$/gm, '<li><strong>$1</strong> $2</li>')
        .replace(/\n/g, '<br>');

    // 包装列表项
    formatted = formatted
        .replace(/(<li>.*?(?:<\/li>\s*)+)/gs, '<ul>$1</ul>')
        .replace(/(<li><strong>\d+\..*?(?:<\/li>\s*)+)/gs, '<ol>$1</ol>');

    // 添加特殊标记样式
    formatted = formatted
        .replace(/🔍\s*<strong>ASSESSMENT OVERVIEW<\/strong>/g, '<h4>🔍 ASSESSMENT OVERVIEW</h4>')
        .replace(/⚠️\s*<strong>HEALTH INSIGHTS<\/strong>/g, '<h4 class="warning">⚠️ HEALTH INSIGHTS</h4>')
        .replace(/💡\s*<strong>PERSONALIZED RECOMMENDATIONS<\/strong>/g, '<h4>💡 PERSONALIZED RECOMMENDATIONS</h4>')
        .replace(/📊\s*<strong>TECHNICAL ANALYSIS<\/strong>/g, '<h4>📊 TECHNICAL ANALYSIS</h4>')
        .replace(/🎯\s*<strong>ACTION ITEMS<\/strong>/g, '<h4 class="alert">🎯 ACTION ITEMS</h4>');

    return formatted;
}

    // 保存分析到历史记录
    saveAnalysisToHistory(analysis, measurementCount) {
        const analysisRecord = {
            id: Date.now(),
            timestamp: new Date(),
            content: analysis,
            measurementCount,
            userId: this.currentUser ? this.currentUser.user_id : null
        };

        this.analysisHistory.unshift(analysisRecord);

        // 只保留最近10次分析
        if (this.analysisHistory.length > 10) {
            this.analysisHistory = this.analysisHistory.slice(0, 10);
        }

        // 保存到localStorage
        try {
            localStorage.setItem('rayVitaAnalysisHistory', JSON.stringify(this.analysisHistory));
        } catch (error) {
            console.warn('Could not save analysis history to localStorage:', error);
        }

        this.updateAnalysisHistory();
    }

    // 更新分析历史显示
    updateAnalysisHistory() {
        const container = document.getElementById('analysisHistory');
        if (!container) return;

        // 从localStorage加载历史记录
        try {
            const saved = localStorage.getItem('rayVitaAnalysisHistory');
            if (saved) {
                this.analysisHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Could not load analysis history from localStorage:', error);
        }

        if (this.analysisHistory.length === 0) {
            container.innerHTML = `
                <div style="font-size: 32px; margin-bottom: 10px; opacity: 0.6;">📋</div>
                <div>No analysis history yet</div>
                <div style="font-size: 14px; margin-top: 5px;">Your AI analysis reports will appear here</div>
            `;
            return;
        }

        container.innerHTML = this.analysisHistory.map((record, index) => `
            <div style="padding: 15px; margin-bottom: 10px; background: rgba(0, 255, 255, 0.05); border-radius: 10px; border-left: 3px solid var(--primary-cyan); cursor: pointer;" 
                 onclick="window.aiAnalysis.viewHistoryRecord(${record.id})">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: 600; color: var(--primary-cyan);">Analysis #${index + 1}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">${new Date(record.timestamp).toLocaleDateString()}</div>
                </div>
                <div style="font-size: 14px; color: var(--text-primary);">
                    Based on ${record.measurementCount} measurements
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">
                    ${new Date(record.timestamp).toLocaleTimeString()}
                </div>
            </div>
        `).join('');
    }

    // 查看历史记录
    viewHistoryRecord(recordId) {
        const record = this.analysisHistory.find(r => r.id === recordId);
        if (!record) return;

        this.currentAnalysis = {
            content: record.content,
            timestamp: record.timestamp,
            measurements: record.measurementCount
        };

        this.displayAnalysisResult(record.content, record.measurementCount);
    }

    // 显示导出选项
    showExportOptions() {
        if (!this.currentAnalysis) {
            this.showMessage('No analysis available to export', 'warning');
            return;
        }

        const exportModal = document.createElement('div');
        exportModal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8); z-index: 2000; display: flex;
            align-items: center; justify-content: center; backdrop-filter: blur(10px);
        `;

        exportModal.innerHTML = `
            <div style="background: var(--card-bg); border: 2px solid var(--border-glow); border-radius: 20px; padding: 40px; max-width: 500px; width: 90%;">
                <h3 style="color: var(--primary-cyan); margin-bottom: 30px; text-align: center; font-family: var(--font-display);">Export Analysis Report</h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <button onclick="window.aiAnalysis.exportAnalysis('txt'); document.body.removeChild(this.closest('.export-modal'))" 
                            style="padding: 15px 20px; background: rgba(0, 255, 255, 0.1); border: 1px solid rgba(0, 255, 255, 0.3); border-radius: 10px; color: var(--primary-cyan); cursor: pointer; font-size: 16px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        📄 Export as Text (.txt)
                    </button>
                    <button onclick="window.aiAnalysis.exportAnalysis('json'); document.body.removeChild(this.closest('.export-modal'))" 
                            style="padding: 15px 20px; background: rgba(128, 0, 255, 0.1); border: 1px solid rgba(128, 0, 255, 0.3); border-radius: 10px; color: var(--primary-purple); cursor: pointer; font-size: 16px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        📋 Export as JSON (.json)
                    </button>
                    <button onclick="window.aiAnalysis.exportAnalysis('pdf'); document.body.removeChild(this.closest('.export-modal'))" 
                            style="padding: 15px 20px; background: rgba(255, 215, 0, 0.1); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 10px; color: var(--accent-gold); cursor: pointer; font-size: 16px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        📎 Export as PDF (HTML)
                    </button>
                </div>
                <button onclick="document.body.removeChild(this.closest('.export-modal'))" 
                        style="margin-top: 20px; width: 100%; padding: 10px; background: rgba(255, 0, 128, 0.1); border: 1px solid rgba(255, 0, 128, 0.3); border-radius: 10px; color: var(--accent-pink); cursor: pointer;">
                    Cancel
                </button>
            </div>
        `;

        exportModal.className = 'export-modal';
        document.body.appendChild(exportModal);
    }

    // 导出分析结果
    exportAnalysis(format = 'txt') {
    if (!this.currentAnalysis) {
        this.showMessage('No analysis available to export', 'warning');
        return;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    let filename = `rayvita-health-analysis-${timestamp}.${format}`;
    let content = '';
    let mimeType = 'text/plain';

    switch (format) {
        case 'txt':
            content = this.generateTextReport();
            break;
        case 'json':
            content = this.generateJSONReport();
            mimeType = 'application/json';
            break;
        case 'pdf':
            content = this.generateHTMLReport();
            mimeType = 'text/html';
            filename = `rayvita-health-analysis-${timestamp}.html`; // 改为 .html
            break;
        default:
            content = this.generateTextReport();
    }

    this.downloadFile(content, filename, mimeType);
    this.showMessage(`Analysis exported as ${filename}`, 'success');
}

    // 生成文本报告
    generateTextReport() {
        const analysis = this.currentAnalysis;
        const cleanText = analysis.content.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '');

        return `RayVita Health Analysis Report
Generated: ${analysis.timestamp.toLocaleString()}
Based on: ${analysis.measurements} measurements
User: ${this.currentUser ? this.currentUser.nickname || this.currentUser.email : 'Unknown'}

${cleanText}

---
Report generated by RayVita-Synapse Neural Health Analytics Platform
© ${new Date().getFullYear()} RayVita Technologies
`;
    }

    // 生成JSON报告
    generateJSONReport() {
        return JSON.stringify({
            report: {
                title: 'RayVita Health Analysis Report',
                generatedAt: this.currentAnalysis.timestamp,
                measurementCount: this.currentAnalysis.measurements,
                user: this.currentUser ? {
                    id: this.currentUser.user_id,
                    nickname: this.currentUser.nickname || this.currentUser.email
                } : null
            },
            analysis: {
                content: this.currentAnalysis.content,
                rawText: this.currentAnalysis.content.replace(/<[^>]*>/g, '')
            },
            metadata: {
                version: this.config.APP.VERSION,
                platform: 'RayVita-Synapse',
                exportFormat: 'json',
                timestamp: new Date().toISOString()
            }
        }, null, 2);
    }

    generateHTMLReport() {
    const formattedContent = this.formatAnalysisContent(this.currentAnalysis.content);
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RayVita Health Analysis Report</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            background: #f9f9f9;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #00ffff;
            padding-bottom: 20px;
            margin-bottom: 40px;
        }
        .title {
            color: #00ffff;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .meta {
            color: #666;
            font-size: 16px;
            line-height: 1.4;
        }
        .content {
            margin: 20px 0;
        }
        h4 {
            color: #00ffff;
            font-size: 22px;
            margin: 30px 0 15px;
            font-weight: 600;
        }
        .ai-insight {
            margin: 10px 0;
            padding-left: 20px;
            font-size: 16px;
        }
        .ai-insight.warning {
            border-left: 4px solid #ff5555;
            padding: 10px 15px;
            background: rgba(255, 85, 85, 0.05);
        }
        .ai-insight.alert {
            border-left: 4px solid #ffd700;
            padding: 10px 15px;
            background: rgba(255, 215, 0, 0.05);
        }
        strong {
            color: #333;
            font-weight: 600;
        }
        em {
            font-style: italic;
            color: #555;
        }
        ul, ol {
            margin: 10px 0 10px 30px;
            padding: 0;
        }
        li {
            margin-bottom: 8px;
        }
        hr {
            border: 0;
            border-top: 1px solid #ddd;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            color: #666;
            font-size: 14px;
        }
        @media print {
            body {
                background: #fff;
                margin: 20px;
            }
            .header {
                border-bottom-color: #000;
            }
            .title {
                color: #000;
            }
            h4 {
                color: #000;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">RayVita Health Analysis Report</h1>
        <div class="meta">
            Generated: ${this.currentAnalysis.timestamp.toLocaleString()}<br>
            Based on: ${this.currentAnalysis.measurements} measurements<br>
            User: ${this.currentUser ? this.currentUser.nickname || this.currentUser.email : 'Unknown'}
        </div>
    </div>
    <div class="content">
        ${formattedContent.replace(/---/g, '<hr>')}
    </div>
    <div class="footer">
        Report generated by RayVita-Synapse Neural Health Analytics Platform<br>
        © ${new Date().getFullYear()} RayVita Technologies
    </div>
</body>
</html>`;
    }

    // 下载文件
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], {type: mimeType});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 切换导出选项显示
    toggleExportSection(show) {
        const section = document.getElementById('exportSection');
        if (section) {
            section.style.display = show ? 'block' : 'none';
        }
    }

    // 显示消息
    showMessage(message, type = 'info') {
        if (window.utils && window.utils.showMessage) {
            window.utils.showMessage(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // 获取分析状态
    getAnalysisStatus() {
        return {
            isAnalyzing: this.isAnalyzing,
            hasCurrentAnalysis: !!this.currentAnalysis,
            historyCount: this.analysisHistory.length,
            currentUser: this.currentUser ? this.currentUser.user_id : null
        };
    }

    // 清除分析历史
    clearAnalysisHistory() {
        this.analysisHistory = [];
        localStorage.removeItem('rayVitaAnalysisHistory');
        this.updateAnalysisHistory();
        this.showMessage('Analysis history cleared', 'success');
    }

    // 重置分析状态
    reset() {
        this.isAnalyzing = false;
        this.currentAnalysis = null;
        this.selectedRecord = null;
        this.updateAnalysisHistory();
        console.log('AI Analysis reset');
    }
}

// 创建全局AI分析管理器实例
window.aiAnalysis = new AiAnalysisManager();

// 为向后兼容性提供全局函数
window.performAIAnalysis = () => {
    window.aiAnalysis.performAnalysis();
};

// 导出供模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AiAnalysisManager;
}