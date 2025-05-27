// 加载挑战
async function loadChallenges() {
    if (!currentUser) return;

    const result = await apiCall(`/challenge/user/${currentUser.user_id}`);

    const container = document.getElementById('challengesContainer');
    if (Array.isArray(result) && result.length > 0) {
        container.innerHTML = result.map(challenge => `
            <div class="challenge-card">
                <div class="feature-badge">智能</div>
                <div class="challenge-header">
                    <div class="challenge-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div>
                        <div class="challenge-title">${challenge.type || '智能健康挑战'}</div>
                        <div class="challenge-status">${challenge.end_dt ? '已完成' : '进行中'}</div>
                    </div>
                </div>
                <div class="challenge-stats">
                    <div class="challenge-stat">
                        <div class="challenge-stat-value">${challenge.score || 0}</div>
                        <div class="challenge-stat-label">AI评分</div>
                    </div>
                    <div class="challenge-stat">
                        <div class="challenge-stat-value">${challenge.punch_count || 0}</div>
                        <div class="challenge-stat-label">完成天数</div>
                    </div>
                    <div class="challenge-stat">
                        <div class="challenge-stat-value">${new Date(challenge.start_dt).toLocaleDateString('zh-CN')}</div>
                        <div class="challenge-stat-label">开始日期</div>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-rocket"></i>
                <h3>开启您的智能健康挑战</h3>
                <p>AI将根据您的健康数据，量身定制个性化挑战计划，帮助您达成健康目标</p>
            </div>
        `;
    }
}

// 创建挑战
async function createChallenge() {
    if (!currentUser) {
        showToast('请先登录您的账户', 'error');
        return;
    }

    const result = await apiCall('/challenge/create', {
        method: 'POST',
        body: JSON.stringify({
            user_id: currentUser.user_id,
            challenge_type: 'ai_smart_challenge'
        }),
    });

    if (result.challenge_id) {
        showToast('智能挑战创建成功！AI已为您定制专属计划', 'success');
        loadChallenges();
        updateDashboard();
    } else {
        showToast('创建失败：' + (result.msg || '请稍后重试'), 'error');
    }
}