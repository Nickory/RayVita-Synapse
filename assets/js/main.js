// ===========================
// RayVita - 主页面脚本
// Apple风格扁平化设计
// ===========================

// 全局变量
const API_BASE = 'http://47.96.237.130:5000/api';
let currentUser = null;
let currentPage = 'dashboard';
let isLoading = false;

// ===========================
// 核心功能函数
// ===========================

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (info|success|error|warning)
 * @param {number} duration - 显示时长（毫秒）
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.error('提示消息容器未找到');
        return;
    }

    // 如果已有消息在显示，先隐藏
    if (toast.classList.contains('show')) {
        toast.classList.remove('show');
        setTimeout(() => showToastContent(), 150);
    } else {
        showToastContent();
    }

    function showToastContent() {
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        // 添加图标
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<i class="fas fa-check-circle"></i> ';
                break;
            case 'error':
                icon = '<i class="fas fa-exclamation-circle"></i> ';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle"></i> ';
                break;
            default:
                icon = '<i class="fas fa-info-circle"></i> ';
        }

        toast.innerHTML = icon + message;

        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
}

/**
 * API调用函数
 * @param {string} endpoint - API端点
 * @param {object} options - 请求选项
 * @returns {Promise} API响应
 */
async function apiCall(endpoint, options = {}) {
    // 防止重复请求
    if (isLoading && options.preventDuplicate !== false) {
        console.warn('请求正在进行中，跳过重复请求');
        return { error: '请求正在处理中' };
    }

    isLoading = true;

    // 显示加载指示器
    const loadingIndicator = showLoadingIndicator();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

        const response = await fetch(`${API_BASE}${endpoint}`, {
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': currentUser?.token ? `Bearer ${currentUser.token}` : '',
                ...options.headers,
            },
            ...options,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // 处理HTTP错误状态
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // 处理API级别的错误
        if (data.error) {
            throw new Error(data.error);
        }

        return data;

    } catch (error) {
        console.error('API调用失败:', error);

        let errorMessage = '网络请求失败，请稍后重试';

        if (error.name === 'AbortError') {
            errorMessage = '请求超时，请检查网络连接';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = '无法连接到服务器，请检查网络';
        } else if (error.message.includes('401')) {
            errorMessage = '登录已过期，请重新登录';
            setTimeout(() => logout(), 2000);
        } else if (error.message.includes('403')) {
            errorMessage = '权限不足，无法执行此操作';
        } else if (error.message.includes('404')) {
            errorMessage = '请求的资源不存在';
        } else if (error.message.includes('500')) {
            errorMessage = '服务器内部错误，请稍后重试';
        }

        showToast(errorMessage, 'error');
        return { error: error.message };

    } finally {
        isLoading = false;
        hideLoadingIndicator(loadingIndicator);
    }
}

/**
 * 显示加载指示器
 * @returns {HTMLElement} 加载指示器元素
 */
function showLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'loading-indicator';
    indicator.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
        </div>
    `;
    indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        padding: 20px;
        border-radius: 12px;
        box-shadow: var(--shadow-heavy);
        z-index: 9998;
        font-size: 18px;
        color: var(--primary-color);
    `;

    document.body.appendChild(indicator);
    return indicator;
}

/**
 * 隐藏加载指示器
 * @param {HTMLElement} indicator - 加载指示器元素
 */
function hideLoadingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
        indicator.style.opacity = '0';
        setTimeout(() => {
            indicator.remove();
        }, 300);
    }
}

// ===========================
// 页面管理功能
// ===========================

/**
 * 页面切换函数
 * @param {string} pageId - 页面ID
 */
function showPage(pageId) {
    if (pageId === currentPage) {
        return; // 如果是当前页面，不做任何操作
    }

    console.log(`切换页面: ${currentPage} -> ${pageId}`);

    try {
        // 移除所有页面的 active 类
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.remove('active');
            page.style.animation = 'fadeOut 0.2s ease-out';
        });

        // 移除所有侧边栏项的 active 类
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => {
            item.classList.remove('active');
        });

        // 延迟显示新页面，创建平滑过渡
        setTimeout(() => {
            // 添加目标页面的 active 类
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
                targetPage.style.animation = 'fadeIn 0.3s ease-out';
                currentPage = pageId;

                // 更新浏览器历史记录
                if (history.pushState) {
                    history.pushState({ page: pageId }, null, `#${pageId}`);
                }
            } else {
                showToast(`页面 "${pageId}" 未找到`, 'error');
                return;
            }

            // 添加目标侧边栏项的 active 类
            const targetItem = document.querySelector(`.sidebar-item[onclick*="${pageId}"]`);
            if (targetItem) {
                targetItem.classList.add('active');

                // 添加点击动画
                targetItem.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    targetItem.style.transform = 'scale(1)';
                }, 150);
            }

            // 根据页面执行特定的初始化
            initializePage(pageId);

        }, 200);

    } catch (error) {
        console.error('页面切换失败:', error);
        showToast('页面切换失败，请刷新重试', 'error');
    }
}

/**
 * 初始化特定页面
 * @param {string} pageId - 页面ID
 */
function initializePage(pageId) {
    switch (pageId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'health-records':
            loadHealthRecords();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'reports':
            loadReports();
            break;
        case 'settings':
            loadSettings();
            break;
        default:
            console.log(`页面 "${pageId}" 无需特殊初始化`);
    }
}

/**
 * 加载仪表板数据
 */
async function loadDashboardData() {
    console.log('加载仪表板数据...');

    try {
        // 模拟加载各种数据
        const promises = [
            loadHealthSummary(),
            loadRecentActivities(),
            loadUpcomingAppointments()
        ];

        await Promise.allSettled(promises);

    } catch (error) {
        console.error('仪表板数据加载失败:', error);
        showToast('仪表板数据加载失败', 'error');
    }
}

/**
 * 加载健康记录
 */
async function loadHealthRecords() {
    console.log('加载健康记录...');
    showToast('健康记录加载中...', 'info', 1000);

    // 模拟API调用
    setTimeout(() => {
        showToast('健康记录加载完成', 'success');
    }, 1500);
}

/**
 * 加载预约信息
 */
async function loadAppointments() {
    console.log('加载预约信息...');
    showToast('预约信息加载中...', 'info', 1000);

    // 模拟API调用
    setTimeout(() => {
        showToast('预约信息加载完成', 'success');
    }, 1500);
}

/**
 * 加载报告数据
 */
async function loadReports() {
    console.log('加载报告数据...');
    showToast('报告数据加载中...', 'info', 1000);

    // 模拟API调用
    setTimeout(() => {
        showToast('报告数据加载完成', 'success');
    }, 1500);
}

/**
 * 加载设置页面
 */
async function loadSettings() {
    console.log('加载设置页面...');
    showToast('设置页面加载中...', 'info', 1000);

    // 模拟API调用
    setTimeout(() => {
        showToast('设置页面加载完成', 'success');
    }, 1500);
}

// ===========================
// 数据加载函数
// ===========================

/**
 * 加载健康概要
 */
async function loadHealthSummary() {
    try {
        const result = await apiCall('/health/summary', {
            method: 'GET',
            preventDuplicate: false
        });

        if (result.error) {
            console.warn('健康概要加载失败:', result.error);
            return;
        }

        console.log('健康概要加载成功:', result);

    } catch (error) {
        console.error('健康概要加载失败:', error);
    }
}

/**
 * 加载最近活动
 */
async function loadRecentActivities() {
    try {
        const result = await apiCall('/activities/recent', {
            method: 'GET',
            preventDuplicate: false
        });

        if (result.error) {
            console.warn('最近活动加载失败:', result.error);
            return;
        }

        console.log('最近活动加载成功:', result);

    } catch (error) {
        console.error('最近活动加载失败:', error);
    }
}

/**
 * 加载即将到来的预约
 */
async function loadUpcomingAppointments() {
    try {
        const result = await apiCall('/appointments/upcoming', {
            method: 'GET',
            preventDuplicate: false
        });

        if (result.error) {
            console.warn('即将到来的预约加载失败:', result.error);
            return;
        }

        console.log('即将到来的预约加载成功:', result);

    } catch (error) {
        console.error('即将到来的预约加载失败:', error);
    }
}

/**
 * 加载所有数据
 */
async function loadAllData() {
    console.log('开始加载所有数据...');

    if (!currentUser) {
        console.warn('用户未登录，跳过数据加载');
        return;
    }

    try {
        showToast('正在加载数据...', 'info', 2000);

        // 并行加载所有数据
        const loadingPromises = [
            loadHealthSummary(),
            loadRecentActivities(),
            loadUpcomingAppointments()
        ];

        const results = await Promise.allSettled(loadingPromises);

        // 检查加载结果
        const failedCount = results.filter(result => result.status === 'rejected').length;

        if (failedCount === 0) {
            showToast('数据加载完成', 'success');
        } else if (failedCount < results.length) {
            showToast(`部分数据加载失败 (${failedCount}/${results.length})`, 'warning');
        } else {
            showToast('数据加载失败，请刷新重试', 'error');
        }

    } catch (error) {
        console.error('数据加载过程中发生错误:', error);
        showToast('数据加载失败', 'error');
    }
}

// ===========================
// 用户管理功能
// ===========================

/**
 * 退出登录
 */
function logout() {
    if (!confirm('确定要退出登录吗？')) {
        return;
    }

    console.log('用户退出登录');

    try {
        // 清除用户信息
        clearUserData();

        // 清除页面状态
        currentPage = 'dashboard';

        // 显示退出成功消息
        showToast('已安全退出登录', 'success');

        // 添加退出动画
        const mainContainer = document.querySelector('.main-container, body');
        if (mainContainer) {
            mainContainer.style.animation = 'fadeOut 0.5s ease-out';
        }

        // 跳转到登录页面
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1000);

    } catch (error) {
        console.error('退出登录失败:', error);
        showToast('退出登录失败，请刷新页面', 'error');

        // 强制跳转
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 2000);
    }
}

/**
 * 初始化用户信息
 */
function initializeUser() {
    try {
        // 从localStorage或sessionStorage获取用户信息
        let userData = null;

        try {
            userData = JSON.parse(localStorage.getItem('currentUser'));
        } catch (error) {
            console.warn('localStorage读取失败，尝试sessionStorage');
            userData = JSON.parse(sessionStorage.getItem('currentUser'));
        }

        if (userData && userData.user_id) {
            currentUser = userData;

            // 验证用户信息的有效性
            if (isUserDataValid(userData)) {
                // 更新用户界面显示
                updateUserDisplay();
                console.log('用户信息初始化成功:', currentUser);
                return true;
            } else {
                console.warn('用户信息无效，清除存储');
                clearUserData();
                return false;
            }

        } else {
            console.warn('未找到有效的用户信息');
            return false;
        }

    } catch (error) {
        console.error('用户信息初始化失败:', error);
        clearUserData();
        return false;
    }
}

/**
 * 验证用户数据有效性
 * @param {object} userData - 用户数据
 * @returns {boolean} 是否有效
 */
function isUserDataValid(userData) {
    if (!userData || typeof userData !== 'object') {
        return false;
    }

    // 检查必需字段
    const requiredFields = ['user_id', 'email'];
    for (const field of requiredFields) {
        if (!userData[field]) {
            return false;
        }
    }

    // 检查邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
        return false;
    }

    // 检查登录时间（如果存在）
    if (userData.loginTime) {
        const loginTime = new Date(userData.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

        // 如果登录时间超过24小时，认为已过期
        if (hoursDiff > 24) {
            console.warn('用户登录信息已过期');
            return false;
        }
    }

    return true;
}

/**
 * 清除用户数据
 */
function clearUserData() {
    try {
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
        currentUser = null;
    } catch (error) {
        console.error('清除用户数据失败:', error);
    }
}

/**
 * 更新用户显示信息
 */
function updateUserDisplay() {
    if (!currentUser) return;

    try {
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        const userEmail = document.getElementById('userEmail');

        if (userName) {
            userName.textContent = currentUser.nickname || currentUser.email;
        }

        if (userAvatar) {
            const initials = getInitials(currentUser.nickname || currentUser.email);
            userAvatar.textContent = initials;
            userAvatar.style.background = generateAvatarColor(currentUser.email);
        }

        if (userEmail) {
            userEmail.textContent = currentUser.email;
        }

    } catch (error) {
        console.error('用户显示信息更新失败:', error);
        showToast('用户信息显示异常', 'warning');
    }
}

/**
 * 获取用户名首字母
 * @param {string} name - 用户名
 * @returns {string} 首字母
 */
function getInitials(name) {
    if (!name) return '?';

    const words = name.trim().split(' ');
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    } else {
        return name.substring(0, 2).toUpperCase();
    }
}

/**
 * 生成头像颜色
 * @param {string} email - 用户邮箱
 * @returns {string} CSS颜色值
 */
function generateAvatarColor(email) {
    if (!email) return 'var(--primary-gradient)';

    const colors = [
        'linear-gradient(135deg, #667eea, #764ba2)',
        'linear-gradient(135deg, #f093fb, #f5576c)',
        'linear-gradient(135deg, #4facfe, #00f2fe)',
        'linear-gradient(135deg, #43e97b, #38f9d7)',
        'linear-gradient(135deg, #fa709a, #fee140)',
        'linear-gradient(135deg, #a8edea, #fed6e3)',
        'linear-gradient(135deg, #ff9a9e, #fecfef)',
        'linear-gradient(135deg, #ffecd2, #fcb69f)'
    ];

    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

// ===========================
// 工具函数
// ===========================

/**
 * 格式化日期
 * @param {Date|string} date - 日期
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===========================
// 事件监听器
// ===========================

/**
 * 添加全局事件监听器
 */
function addGlobalEventListeners() {
    // 处理浏览器前进后退
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.page) {
            showPage(event.state.page);
        } else {
            // 从URL hash获取页面
            const hash = location.hash.substring(1);
            if (hash) {
                showPage(hash);
            }
        }
    });

    // 处理页面可见性变化
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && currentUser) {
            console.log('页面重新可见，刷新数据');
            // 防抖刷新数据
            const debouncedRefresh = debounce(() => {
                loadAllData();
            }, 1000);
            debouncedRefresh();
        }
    });

    // 处理网络状态变化
    window.addEventListener('online', function() {
        showToast('网络连接已恢复', 'success');
        if (currentUser) {
            loadAllData();
        }
    });

    window.addEventListener('offline', function() {
        showToast('网络连接已断开', 'warning');
    });

    // 处理键盘快捷键
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + R: 刷新数据
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            if (currentUser) {
                showToast('手动刷新数据...', 'info');
                loadAllData();
            }
        }

        // Esc: 关闭模态框或取消操作
        if (event.key === 'Escape') {
            // 这里可以添加关闭模态框的逻辑
            console.log('ESC键被按下');
        }
    });
}

// ===========================
// 主初始化函数
// ===========================

/**
 * 页面加载完成后的初始化
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('RayVita Main - 初始化开始');

    try {
        // 添加全局事件监听器
        addGlobalEventListeners();

        // 初始化用户信息
        const userInitialized = initializeUser();

        if (userInitialized) {
            // 用户已登录，继续初始化

            // 从URL获取初始页面
            const hash = location.hash.substring(1);
            const initialPage = hash || 'dashboard';

            // 初始化默认页面
            showPage(initialPage);

            // 加载所有数据
            if (typeof loadAllData === 'function') {
                loadAllData();
            } else {
                console.warn('loadAllData 函数未定义，跳过数据加载');
            }

            // 添加欢迎提示
            setTimeout(() => {
                const welcomeMessage = `欢迎回来，${currentUser.nickname || currentUser.email}!`;
                showToast(welcomeMessage, 'success');
            }, 1000);

        } else {
            // 用户未登录，跳转到登录页面
            showToast('请先登录', 'warning');
            console.log('用户未登录，跳转到登录页面');

            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 1500);
        }

        console.log('RayVita Main - 初始化完成');

    } catch (error) {
        console.error('主页面初始化失败:', error);
        showToast('页面初始化失败，请刷新重试', 'error');
    }
});

// ===========================
// 全局函数导出
// ===========================

// 将主要函数添加到全局作用域（用于HTML中的onclick等）
window.showPage = showPage;
window.logout = logout;
window.loadAllData = loadAllData;

// 导出调试接口
window.RayVitaMain = {
    showPage,
    logout,
    loadAllData,
    showToast,
    apiCall,
    currentUser: () => currentUser,
    currentPage: () => currentPage
};

// ===========================
// 错误处理
// ===========================

// 全局错误处理
window.addEventListener('error', function(event) {
    console.error('全局错误:', event.error);
    showToast('页面发生错误，请刷新重试', 'error');
});

// Promise 错误处理
window.addEventListener('unhandledrejection', function(event) {
    console.error('未处理的Promise错误:', event.reason);
    showToast('操作失败，请重试', 'error');
    event.preventDefault();
});

console.log('RayVita Main Script - 加载完成');