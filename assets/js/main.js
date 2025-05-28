// 全局变量
const API_BASE = 'http://47.96.237.130:5000/api';


// 显示提示消息
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.error('提示消息容器未找到');
        return;
    }

    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// API调用函数
async function apiCall(endpoint, options = {}) {
    try {
        showToast('正在处理请求...', 'info', 1000);
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API调用失败:', error);
        showToast('网络请求失败，请检查连接', 'error');
        return { error: error.message };
    }
}

// 页面切换函数
function showPage(pageId) {
    // 移除所有页面的 active 类
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    // 移除所有侧边栏项的 active 类
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });

    // 添加目标页面的 active 类
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        showToast('页面未找到', 'error');
    }

    // 添加目标侧边栏项的 active 类
    const targetItem = document.querySelector(`.sidebar-item[onclick="showPage('${pageId}')"]`);
    if (targetItem) {
        targetItem.classList.add('active');
    }
}

// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        // 清除用户信息
        localStorage.removeItem('currentUser');
        showToast('已安全退出登录', 'success');

        // 跳转到登录页面
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 500);
    }
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 加载用户信息
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (userData) {
        currentUser = userData;
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        if (userName && userAvatar) {
            userName.textContent = currentUser.nickname || currentUser.email;
            userAvatar.textContent = (currentUser.nickname || currentUser.email).charAt(0).toUpperCase();
        } else {
            showToast('用户信息显示元素未找到', 'error');
        }
    } else {
        // 未登录，跳转到 auth.html
        showToast('请先登录', 'error');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1000);
    }

    // 初始化默认页面（仪表板）
    showPage('dashboard');

    // 加载所有数据（假设其他模块定义了 loadAllData）
    if (typeof loadAllData === 'function') {
        loadAllData();
    } else {
        console.warn('loadAllData 函数未定义');
    }

    // 添加初始提示
    setTimeout(() => {
        showToast(`欢迎回来，${currentUser?.nickname || currentUser?.email}!`, 'success');
    }, 1000);
});