// friends.js - 好友系统管理
let friendsData = [];

// 初始化好友系统
export function initFriends() {
    bindFriendEvents();
    loadFriends();
}

// 绑定好友相关事件
function bindFriendEvents() {
    document.getElementById('friendSearch').addEventListener('input', handleFriendSearch);
    document.getElementById('addFriendBtn').addEventListener('click', showAddFriendModal);
}

// 加载好友列表
export async function loadFriends() {
    if (!currentUser) return;

    const container = document.getElementById('friendsList');
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-users"></i>
            <p>正在加载健康伙伴...</p>
        </div>
    `;

    try {
        const result = await apiCall(`/friend/list?user_id=${currentUser.user_id}`);
        friendsData = Array.isArray(result) ? result : [];

        renderFriends(friendsData);
        updateFriendCount();
    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>数据加载失败</h3>
                <p>${error.message || '请检查网络连接后重试'}</p>
            </div>
        `;
    }
}

// 渲染好友列表
function renderFriends(friends) {
    const container = document.getElementById('friendsList');

    if (friends.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <h3>建立您的健康社交网络</h3>
                <p>添加健康伙伴，一起监督、鼓励，共同实现健康目标</p>
            </div>
        `;
        return;
    }

    container.innerHTML = friends.map(friend => `
        <div class="friend-card" data-friend-id="${friend.user_id}">
            <div class="friend-avatar">
                ${(friend.nickname || friend.user_id).toString().charAt(0).toUpperCase()}
            </div>
            <div class="friend-info">
                <div class="friend-name">
                    ${friend.nickname || '健康伙伴' + friend.user_id}
                    ${friend.is_online ? 
                        '<span class="online-indicator pulse"></span>' : ''}
                </div>
                <div class="friend-id">ID: ${friend.user_id}</div>
                <div class="friend-last-active">
                    最近活跃: ${formatLastActive(friend.last_active)}
                </div>
            </div>
            <div class="friend-actions">
                <button class="btn-icon" onclick="showFriendMenu(event, ${friend.user_id})">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 显示好友操作菜单
function showFriendMenu(event, friendId) {
    const menuHtml = `
        <div class="context-menu">
            <div class="menu-item" onclick="viewFriendDetail(${friendId})">
                <i class="fas fa-user-circle"></i> 查看资料
            </div>
            <div class="menu-item" onclick="removeFriend(${friendId})">
                <i class="fas fa-user-times"></i> 移除好友
            </div>
            <div class="menu-item" onclick="startChallengeWithFriend(${friendId})">
                <i class="fas fa-trophy"></i> 发起挑战
            </div>
        </div>
    `;

    showContextMenu(event, menuHtml);
}

// 查看好友详情
async function viewFriendDetail(friendId) {
    try {
        const [friendInfo, healthData] = await Promise.all([
            apiCall(`/user/${friendId}`),
            apiCall(`/twin/user/${friendId}`)
        ]);

        showFriendModal(friendInfo, healthData);
    } catch (error) {
        showToast('获取好友信息失败: ' + (error.message || '服务不可用'), 'error');
    }
}

// 显示好友资料模态框
function showFriendModal(friendInfo, healthData) {
    const modalHtml = `
        <div class="modal">
            <div class="modal-header">
                <h3>${friendInfo.nickname || '健康伙伴'}的资料</h3>
                <button class="btn-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="friend-stats">
                    <div class="stat-item">
                        <div class="stat-value">${healthData.avg_hr || '--'} BPM</div>
                        <div class="stat-label">平均心率</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${healthData.avg_hrv || '--'} ms</div>
                        <div class="stat-label">HRV</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${healthData.sleep_quality || '--'}/5</div>
                        <div class="stat-label">睡眠质量</div>
                    </div>
                </div>
                <div class="ai-analysis">
                    <h4>AI健康分析</h4>
                    <p>${healthData.tips_text || '暂无分析数据'}</p>
                </div>
            </div>
        </div>
    `;

    showModal(modalHtml);
}

// 移除好友
async function removeFriend(friendId) {
    if (!confirm(`确定要移除该好友吗？`)) return;

    try {
        const result = await apiCall(`/friend/remove`, {
            method: 'POST',
            body: JSON.stringify({
                user_id: currentUser.user_id,
                friend_id: friendId
            })
        });

        if (result.success) {
            showToast('好友已移除', 'success');
            loadFriends();
        }
    } catch (error) {
        showToast('移除失败: ' + (error.message || '服务不可用'), 'error');
    }
}

// 显示添加好友模态框
function showAddFriendModal() {
    const modalHtml = `
        <div class="modal">
            <div class="modal-header">
                <h3>添加健康伙伴</h3>
                <button class="btn-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label><i class="fas fa-search"></i> 搜索用户</label>
                    <input type="text" id="searchInput" placeholder="输入用户ID或昵称">
                </div>
                <div id="searchResults" class="search-results"></div>
            </div>
        </div>
    `;

    const modal = showModal(modalHtml);
    modal.querySelector('#searchInput').addEventListener('input', handleUserSearch);
}

// 处理用户搜索
async function handleUserSearch(event) {
    const keyword = event.target.value.trim();
    const resultsContainer = document.getElementById('searchResults');

    if (keyword.length < 2) {
        resultsContainer.innerHTML = '<div class="hint">输入至少2个字符开始搜索</div>';
        return;
    }

    try {
        const result = await apiCall(`/user/search?q=${encodeURIComponent(keyword)}`);
        renderSearchResults(result);
    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>搜索失败: ${error.message || '服务不可用'}</p>
            </div>
        `;
    }
}

// 渲染搜索结果
function renderSearchResults(users) {
    const container = document.getElementById('searchResults');

    if (!Array.isArray(users) || users.length === 0) {
        container.innerHTML = '<div class="empty-state">未找到匹配的用户</div>';
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="search-result-item">
            <div class="user-info">
                <div class="user-avatar">
                    ${(user.nickname || user.user_id).toString().charAt(0).toUpperCase()}
                </div>
                <div>
                    <div class="user-name">${user.nickname || '用户' + user.user_id}</div>
                    <div class="user-id">ID: ${user.user_id}</div>
                </div>
            </div>
            <button class="btn-primary" onclick="sendFriendRequest(${user.user_id})">
                <i class="fas fa-user-plus"></i> 添加
            </button>
        </div>
    `).join('');
}

// 发送好友请求
async function sendFriendRequest(targetId) {
    try {
        const result = await apiCall(`/friend/request`, {
            method: 'POST',
            body: JSON.stringify({
                from_user: currentUser.user_id,
                to_user: targetId
            })
        });

        if (result.success) {
            showToast('好友请求已发送', 'success');
            closeModal();
        }
    } catch (error) {
        showToast('请求失败: ' + (error.message || '服务不可用'), 'error');
    }
}

// 更新好友数量显示
function updateFriendCount() {
    const countElements = document.querySelectorAll('.friend-count');
    countElements.forEach(el => el.textContent = friendsData.length);
}

// 工具函数：格式化最后活跃时间
function formatLastActive(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}分钟前`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;

    const days = Math.floor(hours / 24);
    return `${days}天前`;
}

// 上下文菜单管理
let currentContextMenu = null;

function showContextMenu(event, menuHtml) {
    closeContextMenu();

    currentContextMenu = document.createElement('div');
    currentContextMenu.className = 'context-menu-container';
    currentContextMenu.innerHTML = menuHtml;

    const rect = event.target.getBoundingClientRect();
    currentContextMenu.style.left = `${rect.left + 20}px`;
    currentContextMenu.style.top = `${rect.top}px`;

    document.body.appendChild(currentContextMenu);
    document.addEventListener('click', closeContextMenu);
}

function closeContextMenu() {
    if (currentContextMenu) {
        currentContextMenu.remove();
        currentContextMenu = null;
    }
    document.removeEventListener('click', closeContextMenu);
}