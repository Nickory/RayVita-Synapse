// 显示页面
function showPage(pageId) {
    // 隐藏所有页面
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    // 移除所有侧边栏活跃状态
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => item.classList.remove('active'));

    // 显示目标页面
    document.getElementById(pageId).classList.add('active');

    // 设置对应侧边栏项为活跃状态
    event.target.closest('.sidebar-item').classList.add('active');

    // 根据页面ID加载对应数据
    switch(pageId) {
        case 'ai-analysis':
            loadAIAnalysis();
            break;
        case 'health':
            loadHealthData();
            break;
        case 'social':
            loadPosts();
            break;
        case 'challenges':
            loadChallenges();
            break;
        case 'friends':
            loadFriends();
            break;
        case 'notifications':
            loadNotifications();
            break;
    }
}

// 加载所有数据
async function loadAllData() {
    showToast('正在加载您的健康数据...', 'info');

    await Promise.all([
        loadHealthData(),
        loadPosts(),
        loadChallenges(),
        loadFriends(),
        loadNotifications(),
        loadAISuggestions()
    ]);

    updateDashboard();
    showToast('数据加载完成', 'success');
}

// 更新仪表板
async function updateDashboard() {
    if (!currentUser) return;

    // 获取最新健康数据
    const healthResult = await apiCall(`/twin/user/${currentUser.user_id}`);
    const challengesResult = await apiCall(`/challenge/user/${currentUser.user_id}`);
    const friendsResult = await apiCall(`/friend/list?user_id=${currentUser.user_id}`);

    if (Array.isArray(healthResult) && healthResult.length > 0) {
        const latestData = healthResult[0];
        document.getElementById('avgHeartRate').textContent = `${latestData.avg_hr || '--'} BPM`;
        document.getElementById('avgHRV').textContent = `${latestData.avg_hrv || '--'} ms`;
    }

    document.getElementById('activeChallenges').textContent = Array.isArray(challengesResult) ? challengesResult.length : 0;
    document.getElementById('friendCount').textContent = Array.isArray(friendsResult) ? friendsResult.length : 0;
}