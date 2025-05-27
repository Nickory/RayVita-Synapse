// 全局变量
const API_BASE = 'http://47.96.237.130:5000/api';
let currentUser = null;
let isRegistering = false;

// 密码显示/隐藏切换
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) {
        showToast('输入框未找到', 'error');
        return;
    }
    const btn = input.nextElementSibling?.querySelector('i');
    if (!btn) {
        showToast('密码切换按钮未找到', 'error');
        return;
    }

    if (input.type === 'password') {
        input.type = 'text';
        btn.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        btn.className = 'fas fa-eye';
    }
}

// 切换登录/注册模式
function switchAuthMode() {
    isRegistering = !isRegistering;
    const subtitle = document.getElementById('authSubtitle');
    const nicknameGroup = document.getElementById('nicknameGroup');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const authBtn = document.getElementById('authBtn');
    const switchAuth = document.getElementById('switchAuth');

    if (!subtitle || !nicknameGroup || !confirmPasswordGroup || !authBtn || !switchAuth) {
        showToast('界面元素加载失败', 'error');
        return;
    }

    subtitle.textContent = isRegistering
        ? '加入RayVita大家庭，开启智能健康生活'
        : '智能健康管理平台，开启健康新生活';
    nicknameGroup.style.display = isRegistering ? 'block' : 'none';
    confirmPasswordGroup.style.display = isRegistering ? 'block' : 'none';
    authBtn.innerHTML = isRegistering
        ? '<i class="fas fa-user-plus"></i> 立即注册'
        : '<i class="fas fa-sign-in-alt"></i> 立即登录';
    switchAuth.innerHTML = isRegistering
        ? '<i class="fas fa-sign-in-alt"></i> 已有账户？立即登录'
        : '<i class="fas fa-user-plus"></i> 还没有账户？立即注册';
}

// 表单验证
function validateForm() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const nickname = document.getElementById('nickname')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    if (!email || !password) {
        showToast('请填写完整的登录信息', 'error');
        return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('请输入有效的邮箱地址', 'error');
        return false;
    }

    if (password.length < 6) {
        showToast('密码长度至少6位', 'error');
        return false;
    }

    if (isRegistering) {
        if (!nickname || nickname.length < 2) {
            showToast('请输入至少2个字符的昵称', 'error');
            return false;
        }

        if (password !== confirmPassword) {
            showToast('两次输入的密码不一致', 'error');
            return false;
        }
    }

    return true;
}

// 处理登录/注册
async function handleAuth() {
    if (!validateForm()) return;

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const nickname = document.getElementById('nickname').value;
    const authBtn = document.getElementById('authBtn');

    if (!authBtn) {
        showToast('按钮元素未找到', 'error');
        return;
    }

    // 禁用按钮防止重复提交
    authBtn.disabled = true;
    authBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';

    try {
        if (isRegistering) {
            const result = await apiCall('/user/register', {
                method: 'POST',
                body: JSON.stringify({
                    email: email,
                    password: password,
                    nickname: nickname || email.split('@')[0],
                }),
            });

            if (result.user_id) {
                showToast('注册成功！请使用新账户登录', 'success');
                switchAuthMode();
                document.getElementById('email').value = email;
                document.getElementById('password').value = '';
            } else {
                showToast(result.msg || '注册失败，请稍后重试', 'error');
            }
        } else {
            const result = await apiCall('/user/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: email,
                    password: password,
                }),
            });

            if (result.user_id) {
                // 存储用户信息
                localStorage.setItem('currentUser', JSON.stringify({
                    user_id: result.user_id,
                    email: email,
                    nickname: nickname || email.split('@')[0],
                }));

                showToast('登录成功！欢迎回来', 'success');

                // 跳转到主界面
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 1000);
            } else {
                showToast(result.msg || '登录失败，请检查账户信息', 'error');
            }
        }
    } catch (error) {
        showToast('网络请求失败，请稍后重试', 'error');
    } finally {
        // 恢复按钮状态
        authBtn.disabled = false;
        authBtn.innerHTML = isRegistering
            ? '<i class="fas fa-user-plus"></i> 立即注册'
            : '<i class="fas fa-sign-in-alt"></i> 立即登录';
    }
}

// 创建粒子效果
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) {
        showToast('粒子容器未找到', 'error');
        return;
    }

    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        particlesContainer.appendChild(particle);
    }
}

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

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 创建粒子效果
    createParticles();

    // 绑定回车键登录
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleAuth();
        }
    });

    // 添加初始提示
    setTimeout(() => {
        showToast('欢迎使用RayVita智能健康管理平台！', 'success');
    }, 1000);
});