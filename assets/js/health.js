// 加载健康数据
async function loadHealthData() {
    if (!currentUser) return;

    const result = await apiCall(`/twin/user/${currentUser.user_id}`);

    const container = document.getElementById('healthDataList');
    if (Array.isArray(result) && result.length > 0) {
        container.innerHTML = result.slice(0, 10).map(data => `
            <div class="data-item">
                <div class="data-item-icon" style="background: linear-gradient(135deg, #ff6b6b, #ee5a52);">
                    <i class="fas fa-heartbeat"></i>
                </div>
                <div class="data-item-content">
                    <div class="data-item-title">心率: ${data.avg_hr || '--'} BPM | HRV: ${data.avg_hrv || '--'} ms</div>
                    <div class="data-item-subtitle">压力等级: ${data.stress_level || '--'}/5 | 睡眠质量: ${data.sleep_quality || '--'}/5</div>
                    <div class="data-item-subtitle">${data.tips_text || 'AI正在分析您的健康状况...'}</div>
                </div>
                <div class="data-item-date">${new Date(data.snapshot_dt).toLocaleDateString('zh-CN')}</div>
            </div>
        `).join('');
    } else {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>开始您的健康监测之旅</h3>
                <p>点击"添加健康数据"按钮，开始记录您的健康信息，让AI为您提供个性化建议</p>
            </div>
        `;
    }
}

// 添加健康数据
async function addHealthData() {
    if (!currentUser) {
        showToast('请先登录您的账户', 'error');
        return;
    }

    const newData = {
        user_id: currentUser.user_id,
        avg_hr: Math.floor(Math.random() * 40) + 60, // 60-100 BPM
        avg_hrv: Math.floor(Math.random() * 30) + 20, // 20-50 ms
        stress_level: Math.floor(Math.random() * 5) + 1, // 1-5
        sleep_quality: Math.floor(Math.random() * 5) + 1, // 1-5
        tips_text: "AI建议：保持良好的作息习惯，适量运动有助于改善健康状况"
    };

    const result = await apiCall('/twin/add', {
        method: 'POST',
        body: JSON.stringify(newData),
    });

    if (result.twin_id) {
        showToast('健康数据添加成功！AI正在为您分析...', 'success');
        loadHealthData();
        updateDashboard();
        loadAISuggestions();
    } else {
        showToast('添加失败：' + (result.msg || '请稍后重试'), 'error');
    }
}