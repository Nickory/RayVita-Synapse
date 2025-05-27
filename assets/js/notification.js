// 加载通知
async function loadNotifications() {
    if (!currentUser) return;

    const result = await apiCall(`/notify/list?user_id=${currentUser.user_id}`);

    const container = document.getElementById('notificationsList');
    if (Array.isArray(result) && result.length > 0) {
        container.innerHTML = result.map(notification => `
            <div class="notification ${notification.is_read ? '' : 'unread'}">
                <div class="notification-content">${notification.content || '系统通知'}</div>
                <div class="notification-date">${new Date(notification.notify_dt).toLocaleString('zh-CN')}</div>
            </div>
        `).join('');
    } else {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell"></i>
                <h3>暂无新消息</h3>
                <p>您目前没有新的通知，系统会实时更新健康提醒和社区动态</p>
            </div>
        `;
    }
}

// 全部标记为已读
async function markAllRead() {
    if (!currentUser) {
        showToast('请先登录您的账户', 'error');
        return;
    }

    const result = await apiCall(`/notify/read`, {
        method: 'POST',
        body: JSON.stringify({
            user_id: currentUser.user_id
        }),
    });

    if (result.success) {
        showToast('所有通知已标记为已读', 'success');
        loadNotifications();
    } else {
        showToast('操作失败：' + (result.msg || '请稍后重试'), 'error');
    }
}