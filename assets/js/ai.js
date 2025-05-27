// 加载AI建议
async function loadAISuggestions() {
    const container = document.getElementById('aiSuggestions');
    const suggestions = [
        {
            icon: 'fas fa-heart',
            title: '心率管理建议',
            content: '根据您的心率数据分析，建议保持规律运动，每周至少3次中等强度运动。',
            priority: 'high'
        },
        {
            icon: 'fas fa-moon',
            title: '睡眠质量优化',
            content: 'AI检测到您的睡眠质量有改善空间，建议睡前1小时减少电子设备使用。',
            priority: 'medium'
        },
        {
            icon: 'fas fa-apple-alt',
            title: '营养搭配建议',
            content: '基于您的健康目标，推荐增加蛋白质摄入，减少高糖食物。',
            priority: 'low'
        }
    ];

    container.innerHTML = suggestions.map(suggestion => `
        <div class="data-item" style="margin-bottom: 15px;">
            <div class="data-item-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                <i class="${suggestion.icon}"></i>
            </div>
            <div class="data-item-content">
                <div class="data-item-title">${suggestion.title}</div>
                <div class="data-item-subtitle">${suggestion.content}</div>
            </div>
            <div class="ai-indicator" style="position: static;">
                <i class="fas fa-brain"></i> AI建议
            </div>
        </div>
    `).join('');
}

// 加载AI分析
async function loadAIAnalysis() {
    // 这里可以添加更多AI分析功能
    showToast('AI分析功能正在持续升级中...', 'info');
}