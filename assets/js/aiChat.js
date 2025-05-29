// RayVita-Synapse AI Chat Module
// 处理AI聊天功能和DeepSeek API集成

class AiChatManager {
    constructor() {
        this.config = window.RayVitaConfig;
        this.currentUser = null;
        this.selectedRecord = null;
        this.chatMessages = [];
        this.isProcessing = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeChat();
        console.log('AI Chat Manager initialized');
    }

    setupEventListeners() {
        // Chat input auto-resize
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('input', (e) => this.handleInputResize(e));
            chatInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        }

        // Send button
        const sendBtn = document.querySelector('.chat-send-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
    }

    // 初始化聊天界面
    initializeChat() {
        this.addWelcomeMessage();
    }

    // 添加欢迎消息
    addWelcomeMessage() {
//         const welcomeMessage = `👋 Welcome! I'm your RayVita AI Health Assistant. I can help you with:
//
// • 💓 Analyzing your heart rate and HRV data
// • 📊 Interpreting specific measurement records
// • 💡 Providing personalized health recommendations
// • 🏥 Assessing your cardiovascular health status
//
// Please select a record from the right panel for detailed analysis, or ask me any health-related questions!`;
//
//         this.addChatMessage('ai', welcomeMessage);
    }

    // 设置当前用户
    setUser(user) {
        this.currentUser = user;
        console.log('AI Chat user set:', user.user_id);
    }

    // 处理输入框大小调整
    handleInputResize(e) {
        const input = e.target;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 140) + 'px';
    }

    // 处理键盘事件
    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    // 发送消息
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message || this.isProcessing) return;

        // 添加用户消息
        this.addChatMessage('user', message);
        input.value = '';
        input.style.height = 'auto';

        // 显示处理状态
        this.isProcessing = true;
        const typingId = this.addChatMessage('ai', 'Analyzing...');

        try {
            // 准备AI上下文
            const context = this.prepareAIContext(message);

            // 调用DeepSeek API
            const aiResponse = await this.callDeepSeekAPI(context);

            // 移除处理消息并显示回复
            this.removeChatMessage(typingId);
            this.addChatMessage('ai', aiResponse);

        } catch (error) {
            console.error('AI Chat error:', error);
            this.removeChatMessage(typingId);
            this.addChatMessage('ai', this.getErrorMessage());
        } finally {
            this.isProcessing = false;
        }
    }

    // 准备AI上下文
    prepareAIContext(userMessage) {
        let context = `User question: ${userMessage}\n\n`;

        // 添加选中记录的信息
        if (this.selectedRecord) {
            context += this.formatRecordContext(this.selectedRecord);
        }

        // 添加用户健康历史概览
        if (window.app && window.app.getHealthData) {
            const healthData = window.app.getHealthData();
            context += this.formatHealthHistoryContext(healthData);
        }

        return context;
    }

    // 格式化记录上下文
    formatRecordContext(record) {
        let context = `Currently analyzing health record:\n`;
        context += `- Measurement time: ${new Date(record.createdAt || record.timestamp).toLocaleString()}\n`;
        context += `- Heart rate: ${record.heartRate ? record.heartRate.toFixed(1) + ' BPM' : 'No data'}\n`;
        context += `- SpO2: ${record.spo2Result ? record.spo2Result.spo2.toFixed(1) + '%' : 'No data'}\n`;
        context += `- Confidence: ${record.confidence ? (record.confidence * 100).toFixed(0) + '%' : 'No data'}\n`;

        if (record.hrvResult) {
            context += `- HRV metrics:\n`;
            context += `  - RMSSD: ${record.hrvResult.rmssd.toFixed(1)} ms\n`;
            context += `  - SDNN: ${record.hrvResult.sdnn.toFixed(1)} ms\n`;
            context += `  - Stress index: ${record.hrvResult.stressIndex.toFixed(2)}\n`;
        }

        return context + '\n';
    }

    // 格式化健康历史上下文
    formatHealthHistoryContext(healthData) {
        if (!healthData || healthData.length === 0) {
            return 'User health history: No data available\n';
        }

        let context = `User health history overview:\n`;
        context += `- Total records: ${healthData.length}\n`;

        const avgHR = healthData.reduce((sum, item) => sum + (item.heartRate || 0), 0) / healthData.length;
        context += `- Average heart rate: ${avgHR.toFixed(1)} BPM\n`;

        const avgConf = healthData.reduce((sum, item) => sum + (item.confidence || 0), 0) / healthData.length;
        context += `- Average confidence: ${(avgConf * 100).toFixed(0)}%\n`;

        // 最近一周的数据
        const recentData = this.getRecentData(healthData, 7);
        if (recentData.length > 0) {
            const recentAvgHR = recentData.reduce((sum, item) => sum + (item.heartRate || 0), 0) / recentData.length;
            context += `- Recent week average HR: ${recentAvgHR.toFixed(1)} BPM\n`;
        }

        return context + '\n';
    }

    // 获取最近数据
    getRecentData(healthData, days) {
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return healthData.filter(item => {
            const itemDate = new Date(item.createdAt || item.timestamp);
            return itemDate >= cutoffDate;
        });
    }

    // 调用DeepSeek API
    async callDeepSeekAPI(context) {
        const response = await fetch(`${this.config.API.DEEPSEEK_BASE_URL}v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.API.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: this.config.AI.SYSTEM_PROMPTS.HEALTH_ASSISTANT
                    },
                    {
                        role: 'user',
                        content: context
                    }
                ],
                stream: false,
                temperature: this.config.AI.DEFAULT_TEMPERATURE,
                max_tokens: this.config.AI.MAX_TOKENS
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // 获取错误消息
    getErrorMessage() {
        return `Sorry, AI service is temporarily unavailable. Please try again later. 

You can view health metrics in the dashboard or record details page for analysis information.

Common health insights I can help with:
• Heart rate 60-100 BPM is generally normal for adults
• SpO2 levels above 95% are typically healthy
• Higher HRV usually indicates better stress resilience
• Regular monitoring helps track health trends`;
    }

    // 添加聊天消息
    addChatMessage(sender, content) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return null;

        const messageId = 'msg-' + Date.now() + Math.random();

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.id = messageId;
        messageDiv.innerHTML = this.formatChatMessage(content);

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // 保存到消息历史
        this.chatMessages.push({
            id: messageId,
            sender,
            content,
            timestamp: new Date()
        });

        return messageId;
    }

    // 移除聊天消息
    removeChatMessage(messageId) {
        const message = document.getElementById(messageId);
        if (message) {
            message.remove();
        }

        // 从历史中移除
        this.chatMessages = this.chatMessages.filter(msg => msg.id !== messageId);
    }

    // 格式化聊天消息
    formatChatMessage(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/•/g, '•');
    }

    // 选择记录进行分析
    selectRecordForChat(sessionId) {
        // 移除之前的选择
        document.querySelectorAll('.record-item-chat').forEach(item => {
            item.classList.remove('selected');
        });

        // 添加选择到点击的项目
        const clickedItem = event.target.closest('.record-item-chat');
        if (clickedItem) {
            clickedItem.classList.add('selected');
        }

        // 查找记录
        const healthData = window.app ? window.app.getHealthData() : [];
        const record = healthData.find(item => item.sessionId === sessionId);

        if (record) {
            this.selectedRecord = record;

            // 添加记录选择消息
            const recordSummary = this.formatRecordSummary(record);
            this.addChatMessage('ai', recordSummary);

            console.log('Selected record for chat analysis:', sessionId);
        }
    }

    // 格式化记录摘要
    formatRecordSummary(record) {
        const date = new Date(record.createdAt || record.timestamp);
        const formattedDate = date.toLocaleString();

        let summary = `📊 Selected record for analysis:\n`;
        summary += `• Measurement Time: ${formattedDate}\n`;
        summary += `• Heart Rate: ${record.heartRate ? record.heartRate.toFixed(1) + ' BPM' : 'N/A'}\n`;
        summary += `• SpO2: ${record.spo2Result ? record.spo2Result.spo2.toFixed(1) + '%' : 'N/A'}\n`;
        summary += `• Confidence: ${record.confidence ? (record.confidence * 100).toFixed(0) + '%' : 'N/A'}\n`;

        if (record.hrvResult) {
            summary += `• HRV RMSSD: ${record.hrvResult.rmssd.toFixed(1)} ms\n`;
            summary += `• Stress Index: ${record.hrvResult.stressIndex.toFixed(2)}\n`;
        }

        summary += `\nI've analyzed this record. What would you like to know? For example:\n`;
        summary += `• Is the heart rate normal?\n`;
        summary += `• HRV data interpretation\n`;
        summary += `• Stress level assessment\n`;
        summary += `• Health recommendations`;

        return summary;
    }

    // 更新记录列表
    updateRecordsList() {
        const container = document.getElementById('chatRecordsList');
        if (!container) return;

        const healthData = window.app ? window.app.getHealthData() : [];

        if (healthData.length === 0) {
            container.innerHTML = '<div class="record-item-chat" style="text-align: center; color: var(--text-secondary);">No records available for analysis</div>';
            return;
        }

        container.innerHTML = healthData.slice(0, 10).map((record, index) => {
            const date = new Date(record.createdAt || record.timestamp);
            return `
                <div class="record-item-chat" onclick="window.aiChat.selectRecordForChat('${record.sessionId}')">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-weight: 600; color: var(--primary-cyan);">Session ${String(index + 1).padStart(2, '0')}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">${date.toLocaleDateString()}</div>
                    </div>
                    <div style="font-size: 14px; color: var(--text-primary);">
                        HR: ${record.heartRate ? record.heartRate.toFixed(1) : 'N/A'} BPM
                        ${record.spo2Result ? ` • SpO2: ${record.spo2Result.spo2.toFixed(1)}%` : ''}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">
                        Confidence: ${record.confidence ? (record.confidence * 100).toFixed(0) : 'N/A'}%
                    </div>
                </div>
            `;
        }).join('');

        console.log('Updated chat records list');
    }

    // 清除聊天历史
    clearChatHistory() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }

        this.chatMessages = [];
        this.selectedRecord = null;

        // 重新添加欢迎消息
        this.addWelcomeMessage();

        console.log('Chat history cleared');
    }

    // 导出聊天历史
    exportChatHistory() {
        const chatData = {
            exportDate: new Date().toISOString(),
            user: this.currentUser ? this.currentUser.user_id : null,
            selectedRecord: this.selectedRecord ? this.selectedRecord.sessionId : null,
            messageCount: this.chatMessages.length,
            messages: this.chatMessages.map(msg => ({
                sender: msg.sender,
                content: msg.content,
                timestamp: msg.timestamp
            }))
        };

        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `rayvita-chat-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
        console.log('Chat history exported');
    }

    // 获取聊天统计
    getChatStats() {
        return {
            totalMessages: this.chatMessages.length,
            userMessages: this.chatMessages.filter(msg => msg.sender === 'user').length,
            aiMessages: this.chatMessages.filter(msg => msg.sender === 'ai').length,
            selectedRecord: this.selectedRecord ? this.selectedRecord.sessionId : null,
            currentUser: this.currentUser ? this.currentUser.user_id : null,
            isProcessing: this.isProcessing
        };
    }

    // 重置聊天状态
    reset() {
        this.clearChatHistory();
        this.selectedRecord = null;
        this.isProcessing = false;
        console.log('AI Chat reset');
    }
}

// 创建全局AI聊天管理器实例
window.aiChat = new AiChatManager();

// 导出供模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AiChatManager;
}

