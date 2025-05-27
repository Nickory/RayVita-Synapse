// ===========================
// RayVita - 登录页面脚本
// Apple风格扁平化设计
// ===========================

// 全局变量
const API_BASE = 'http://47.96.237.130:5000/api';
let currentUser = null;
let isRegistering = false;

// ===========================
// 核心功能函数
// ===========================

/**
 * 密码显示/隐藏切换
 * @param {string} inputId - 输入框ID
 */
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) {
        showToast('输入框未找到', 'error');
        return;
    }

    const wrapper = input.closest('.input-wrapper');
    const btn = wrapper?.querySelector('.password-toggle i');

    if (!btn) {
        showToast('密码切换按钮未找到', 'error');
        return;
    }

    // 添加切换动画
    btn.style.transform = 'scale(0.8)';
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
    }, 150);

    if (input.type === 'password') {
        input.type = 'text';
        btn.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        btn.className = 'fas fa-eye';
    }
}

/**
 * 切换登录/注册模式
 */
function switchAuthMode() {
    isRegistering = !isRegistering;

    const elements = {
        subtitle: document.getElementById('authSubtitle'),
        nicknameGroup: document.getElementById('nicknameGroup'),
        confirmPasswordGroup: document.getElementById('confirmPasswordGroup'),
        authBtn: document.getElementById('authBtn'),
        switchAuth: document.getElementById('switchAuth')
    };

    // 检查所有必需元素是否存在
    const missingElements = Object.entries(elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);

    if (missingElements.length > 0) {
        showToast(`界面元素加载失败: ${missingElements.join(', ')}`, 'error');
        return;
    }

    // 添加切换动画
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
        formContainer.style.transform = 'scale(0.98)';
        formContainer.style.opacity = '0.8';

        setTimeout(() => {
            formContainer.style.transform = 'scale(1)';
            formContainer.style.opacity = '1';
        }, 200);
    }

    // 更新界面内容
    if (isRegistering) {
        elements.subtitle.textContent = 'Create your Account';
        elements.nicknameGroup.style.display = 'block';
        elements.confirmPasswordGroup.style.display = 'block';
        elements.authBtn.innerHTML = '<span class="btn-text">SIGN UP</span><i class="fas fa-user-plus btn-icon"></i>';
        elements.switchAuth.innerHTML = '<span>Already have an account? <strong>Sign In</strong></span>';

        // 动画显示新字段
        setTimeout(() => {
            elements.nicknameGroup.style.animation = 'slideInFromLeft 0.3s ease-out';
            elements.confirmPasswordGroup.style.animation = 'slideInFromLeft 0.3s ease-out 0.1s both';
        }, 100);
    } else {
        elements.subtitle.textContent = 'Sign in to your Account';
        elements.nicknameGroup.style.display = 'none';
        elements.confirmPasswordGroup.style.display = 'none';
        elements.authBtn.innerHTML = '<span class="btn-text">SIGN IN</span><i class="fas fa-sign-in-alt btn-icon"></i>';
        elements.switchAuth.innerHTML = '<span>Don\'t have an account? <strong>Sign Up</strong></span>';
    }

    // 清空表单（保留邮箱）
    const email = document.getElementById('email').value;
    document.getElementById('password').value = '';
    document.getElementById('nickname').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('email').value = email;

    // 聚焦到第一个可见输入框
    setTimeout(() => {
        const firstInput = isRegistering ?
            document.getElementById('email') :
            document.getElementById('email');
        if (firstInput && firstInput.value === '') {
            firstInput.focus();
        }
    }, 300);
}

/**
 * 表单验证
 * @returns {boolean} 验证是否通过
 */
function validateForm() {
    const formData = {
        email: document.getElementById('email')?.value.trim(),
        password: document.getElementById('password')?.value,
        nickname: document.getElementById('nickname')?.value.trim(),
        confirmPassword: document.getElementById('confirmPassword')?.value
    };

    // 清除之前的错误状态
    clearFormErrors();

    // 基础验证
    if (!formData.email || !formData.password) {
        showToast('请填写完整的登录信息', 'error');
        highlightErrorField('email', !formData.email);
        highlightErrorField('password', !formData.password);
        return false;
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showToast('请输入有效的邮箱地址', 'error');
        highlightErrorField('email', true);
        return false;
    }

    // 密码长度验证
    if (formData.password.length < 6) {
        showToast('密码长度至少6位', 'error');
        highlightErrorField('password', true);
        return false;
    }

    // 注册模式额外验证
    if (isRegistering) {
        if (!formData.nickname || formData.nickname.length < 2) {
            showToast('请输入至少2个字符的昵称', 'error');
            highlightErrorField('nickname', true);
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            showToast('两次输入的密码不一致', 'error');
            highlightErrorField('confirmPassword', true);
            return false;
        }
    }

    return true;
}

/**
 * 高亮错误字段
 * @param {string} fieldId - 字段ID
 * @param {boolean} isError - 是否为错误状态
 */
function highlightErrorField(fieldId, isError) {
    const input = document.getElementById(fieldId);
    if (!input) return;

    const wrapper = input.closest('.input-wrapper');
    if (!wrapper) return;

    if (isError) {
        wrapper.classList.add('error');
        setTimeout(() => {
            wrapper.style.animation = 'shake 0.5s ease-in-out';
        }, 100);
    } else {
        wrapper.classList.remove('error');
        wrapper.classList.add('success');
        setTimeout(() => {
            wrapper.classList.remove('success');
        }, 2000);
    }
}

/**
 * 清除表单错误状态
 */
function clearFormErrors() {
    const errorWrappers = document.querySelectorAll('.input-wrapper.error');
    errorWrappers.forEach(wrapper => {
        wrapper.classList.remove('error');
        wrapper.style.animation = '';
    });
}

/**
 * 处理登录/注册
 */
async function handleAuth() {
    if (!validateForm()) return;

    const formData = {
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        nickname: document.getElementById('nickname').value.trim()
    };

    const authBtn = document.getElementById('authBtn');
    if (!authBtn) {
        showToast('按钮元素未找到', 'error');
        return;
    }

    // 禁用按钮并显示加载状态
    setButtonLoading(authBtn, true);

    try {
        let result;

        if (isRegistering) {
            result = await apiCall('/user/register', {
                method: 'POST',
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    nickname: formData.nickname || formData.email.split('@')[0],
                }),
            });

            if (result.user_id) {
                showToast('注册成功！请使用新账户登录', 'success');

                // 切换到登录模式并保留邮箱
                setTimeout(() => {
                    switchAuthMode();
                    document.getElementById('email').value = formData.email;
                    document.getElementById('password').value = '';
                    document.getElementById('password').focus();

                    // 额外提示
                    setTimeout(() => {
                        showToast('请输入密码登录', 'info');
                    }, 500);
                }, 1500);
            } else {
                showToast(result.msg || '注册失败，请稍后重试', 'error');
            }
        } else {
            result = await apiCall('/user/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            if (result.user_id) {
                // 存储用户信息到内存（不使用localStorage以符合artifacts限制）
                currentUser = {
                    user_id: result.user_id,
                    email: formData.email,
                    nickname: formData.nickname || formData.email.split('@')[0],
                };

                showToast('登录成功！欢迎回来', 'success');

                // 添加成功动画
                const formContainer = document.querySelector('.form-container');
                if (formContainer) {
                    formContainer.style.animation = 'successPulse 0.6s ease-out';
                }

                // 模拟跳转（在实际应用中会跳转到 main.html）
                setTimeout(() => {
                    showToast('正在跳转到主界面...', 'info');
                    window.location.href = 'main.html';

                    // 演示用：显示登录成功信息
                    setTimeout(() => {
                        showToast(`欢迎 ${currentUser.nickname || currentUser.email}！`, 'success');
                    }, 1000);
                }, 1000);
            } else {
                showToast(result.msg || '登录失败，请检查账户信息', 'error');
            }
        }
    } catch (error) {
        console.error('认证失败:', error);
        showToast('网络请求失败，请稍后重试', 'error');
    } finally {
        // 恢复按钮状态
        setTimeout(() => {
            setButtonLoading(authBtn, false);
        }, 1000);
    }
}

/**
 * 设置按钮加载状态
 * @param {HTMLElement} button - 按钮元素
 * @param {boolean} isLoading - 是否为加载状态
 */
function setButtonLoading(button, isLoading) {
    if (!button) return;

    button.disabled = isLoading;

    if (isLoading) {
        button.classList.add('loading');
        button.innerHTML = '<span class="btn-text">Processing...</span><i class="fas fa-spinner fa-spin btn-icon"></i>';
    } else {
        button.classList.remove('loading');
        if (isRegistering) {
            button.innerHTML = '<span class="btn-text">SIGN UP</span><i class="fas fa-user-plus btn-icon"></i>';
        } else {
            button.innerHTML = '<span class="btn-text">SIGN IN</span><i class="fas fa-sign-in-alt btn-icon"></i>';
        }
    }
}

// ===========================
// 辅助功能函数
// ===========================

/**
 * 创建简化的粒子效果
 */
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) {
        console.warn('粒子容器未找到');
        return;
    }

    const particleCount = window.innerWidth < 768 ? 15 : 25; // 移动端减少粒子数量

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (Math.random() * 4 + 6) + 's';

        // 随机粒子大小
        const size = Math.random() * 2 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';

        particlesContainer.appendChild(particle);
    }
}

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

    // 清除之前的显示状态
    toast.classList.remove('show');

    setTimeout(() => {
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }, 100);
}

/**
 * API调用函数
 * @param {string} endpoint - API端点
 * @param {object} options - 请求选项
 * @returns {Promise} API响应
 */
async function apiCall(endpoint, options = {}) {
    const loadingToast = setTimeout(() => {
        showToast('正在处理请求...', 'info', 1000);
    }, 500);

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        clearTimeout(loadingToast);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        clearTimeout(loadingToast);
        console.error('API调用失败:', error);

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showToast('网络连接失败，请检查网络设置', 'error');
        } else {
            showToast('网络请求失败，请稍后重试', 'error');
        }

        return { error: error.message };
    }
}

// ===========================
// 交互增强功能
// ===========================

/**
 * 添加输入框动画效果
 */
function addInputAnimations() {
    const inputs = document.querySelectorAll('input');

    inputs.forEach(input => {
        const wrapper = input.closest('.input-wrapper');
        if (!wrapper) return;

        // 聚焦动画
        input.addEventListener('focus', function() {
            wrapper.style.transform = 'translateY(-2px)';

            // 添加聚焦指示器
            const indicator = document.createElement('div');
            indicator.className = 'focus-indicator';
            indicator.style.cssText = `
                position: absolute;
                bottom: -2px;
                left: 50%;
                transform: translateX(-50%) scaleX(0);
                width: 100%;
                height: 2px;
                background: var(--primary-gradient);
                border-radius: 1px;
                transition: transform 0.3s ease;
                z-index: 3;
            `;
            wrapper.appendChild(indicator);

            setTimeout(() => {
                indicator.style.transform = 'translateX(-50%) scaleX(1)';
            }, 100);
        });

        input.addEventListener('blur', function() {
            wrapper.style.transform = 'translateY(0)';

            // 移除聚焦指示器
            const indicator = wrapper.querySelector('.focus-indicator');
            if (indicator) {
                indicator.style.transform = 'translateX(-50%) scaleX(0)';
                setTimeout(() => {
                    indicator.remove();
                }, 300);
            }
        });

        // 输入验证实时反馈
        input.addEventListener('input', function() {
            clearFormErrors();

            // 实时验证
            if (this.type === 'email' && this.value) {
                const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value);
                highlightErrorField(this.id, !isValid);
            }

            if (this.type === 'password' && this.value) {
                const isValid = this.value.length >= 6;
                highlightErrorField(this.id, !isValid);
            }
        });
    });
}

/**
 * 添加按钮波纹效果
 */
function addRippleEffect() {
    const buttons = document.querySelectorAll('.auth-btn, .social-btn, .btn');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // 防止在禁用状态下触发
            if (this.disabled) return;

            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: ripple-animation 0.6s linear;
                pointer-events: none;
                z-index: 1;
            `;

            ripple.classList.add('ripple');
            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

/**
 * 添加键盘导航支持
 */
function addKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Enter键提交表单
        if (e.key === 'Enter' && !e.shiftKey) {
            const activeElement = document.activeElement;

            // 如果焦点在输入框上，提交表单
            if (activeElement && activeElement.tagName === 'INPUT') {
                e.preventDefault();
                handleAuth();
            }
        }

        // Escape键清除焦点
        if (e.key === 'Escape') {
            document.activeElement?.blur();
        }

        // Tab键增强
        if (e.key === 'Tab') {
            const focusableElements = document.querySelectorAll(
                'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );

            // 添加视觉指示
            setTimeout(() => {
                const newFocus = document.activeElement;
                if (newFocus && focusableElements.length > 0) {
                    newFocus.style.outline = '2px solid var(--primary-color)';
                    newFocus.style.outlineOffset = '2px';

                    setTimeout(() => {
                        newFocus.style.outline = '';
                        newFocus.style.outlineOffset = '';
                    }, 2000);
                }
            }, 10);
        }
    });
}

/**
 * 添加社交登录按钮功能
 */
function addSocialLoginHandlers() {
    const socialButtons = document.querySelectorAll('.social-btn');

    socialButtons.forEach(button => {
        button.addEventListener('click', function() {
            const platform = this.classList.contains('facebook') ? 'Facebook' :
                           this.classList.contains('google') ? 'Google' :
                           this.classList.contains('linkedin') ? 'LinkedIn' : '未知平台';

            showToast(`${platform} 登录功能开发中`, 'info');

            // 模拟加载状态
            this.disabled = true;
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            setTimeout(() => {
                this.disabled = false;
                this.innerHTML = originalHTML;
            }, 1500);
        });
    });
}

/**
 * 创建演示主页面（当main.html不存在时）
 */
function createDemoMainPage() {
    // 创建主页面HTML内容
    const mainPageHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RayVita - 健康管理平台</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(20px);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
        }
        .logo { font-size: 4rem; margin-bottom: 1rem; }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; font-weight: 700; }
        p { font-size: 1.1rem; margin-bottom: 2rem; opacity: 0.9; }
        .user-info {
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 16px;
            margin: 2rem 0;
        }
        .btn {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 12px 24px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 1rem;
            margin: 0.5rem;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 16px;
            text-align: center;
        }
        .feature i { font-size: 2rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo"><i class="fas fa-heart-pulse"></i></div>
        <h1>欢迎使用 RayVita</h1>
        <p>智能健康管理平台，为您提供个性化的健康服务</p>
        
        <div class="user-info">
            <h3><i class="fas fa-user"></i> 当前用户</h3>
            <p id="userDisplay">加载中...</p>
        </div>
        
        <div class="features">
            <div class="feature">
                <i class="fas fa-chart-line"></i>
                <h4>健康监测</h4>
                <p>实时追踪您的健康数据</p>
            </div>
            <div class="feature">
                <i class="fas fa-calendar-check"></i>
                <h4>预约管理</h4>
                <p>便捷的医疗预约服务</p>
            </div>
            <div class="feature">
                <i class="fas fa-file-medical"></i>
                <h4>健康报告</h4>
                <p>详细的健康分析报告</p>
            </div>
        </div>
        
        <div style="margin-top: 2rem;">
            <button class="btn" onclick="logout()" style="background: rgba(255, 59, 48, 0.8);">
                <i class="fas fa-sign-out-alt"></i> 退出登录
            </button>
            <a href="auth.html" class="btn">
                <i class="fas fa-arrow-left"></i> 返回登录页
            </a>
        </div>
    </div>

    <script>
        // 显示用户信息
        function displayUserInfo() {
            try {
                const userData = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
                if (userData) {
                    document.getElementById('userDisplay').innerHTML = 
                        \`<strong>\${userData.nickname || userData.email}</strong><br>
                        <small>\${userData.email}</small><br>
                        <small>登录时间: \${new Date(userData.loginTime).toLocaleString()}</small>\`;
                } else {
                    document.getElementById('userDisplay').textContent = '未找到用户信息';
                }
            } catch (error) {
                document.getElementById('userDisplay').textContent = '用户信息解析失败';
            }
        }
        
        // 退出登录
        function logout() {
            if (confirm('确定要退出登录吗？')) {
                localStorage.removeItem('currentUser');
                sessionStorage.removeItem('currentUser');
                window.location.href = 'auth.html';
            }
        }
        
        // 页面加载时显示用户信息
        document.addEventListener('DOMContentLoaded', displayUserInfo);
    </script>
</body>
</html>`;

    // 创建并打开新页面
    const newWindow = window.open('', '_self');
    newWindow.document.write(mainPageHTML);
    newWindow.document.close();
}
function addDemoFeatures() {
    // 延迟添加演示按钮
    setTimeout(() => {
        const demoBtn = document.createElement('button');
        demoBtn.textContent = '填入演示数据';
        demoBtn.className = 'demo-btn';
        demoBtn.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 24px;
            background: var(--primary-gradient);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            opacity: 0.8;
            transition: all 0.3s ease;
            box-shadow: var(--shadow-medium);
            backdrop-filter: blur(20px);
        `;

        demoBtn.addEventListener('click', function() {
            document.getElementById('email').value = 'demo@rayvita.com';
            document.getElementById('password').value = 'demo123';

            if (isRegistering) {
                document.getElementById('nickname').value = 'Demo User';
                document.getElementById('confirmPassword').value = 'demo123';
            }

            showToast('演示账户信息已填入', 'success');

            // 添加成功动画
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });

        demoBtn.addEventListener('mouseenter', function() {
            this.style.opacity = '1';
            this.style.transform = 'translateY(-2px)';
        });

        demoBtn.addEventListener('mouseleave', function() {
            this.style.opacity = '0.8';
            this.style.transform = 'translateY(0)';
        });

        document.body.appendChild(demoBtn);
    }, 3000);
}

// ===========================
// 初始化函数
// ===========================

/**
 * 页面加载完成后的初始化
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('RayVita Auth - 初始化开始');

    try {
        // 创建粒子效果
        createParticles();

        // 添加交互动画
        addInputAnimations();
        addRippleEffect();
        addKeyboardNavigation();
        addSocialLoginHandlers();

        // 防止表单默认提交
        const form = document.getElementById('authForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleAuth();
            });
        }

        // 绑定回车键提交
        document.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                const activeEl = document.activeElement;
                // 只有当焦点在输入框时才触发提交
                if (activeEl && activeEl.tagName === 'INPUT') {
                    e.preventDefault();
                    handleAuth();
                }
            }
        });

        // 添加欢迎提示
        setTimeout(() => {
            showToast('Welcome to RayVita Health Platform!', 'success');
        }, 1000);

        // 添加演示功能
        addDemoFeatures();

        // 监听窗口大小变化，重新生成粒子
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const particles = document.getElementById('particles');
                if (particles) {
                    particles.innerHTML = '';
                    createParticles();
                }
            }, 500);
        });

        console.log('RayVita Auth - 初始化完成');

    } catch (error) {
        console.error('初始化过程中发生错误:', error);
        showToast('页面初始化失败，请刷新重试', 'error');
    }
});

// ===========================
// 添加自定义样式
// ===========================

// 动态添加一些CSS动画
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes successPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
    
    @keyframes slideInFromLeft {
        from { transform: translateX(-30px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .demo-btn:active {
        transform: scale(0.95) !important;
    }
`;

// 确保样式表只添加一次
if (!document.querySelector('style[data-auth-styles]')) {
    styleSheet.setAttribute('data-auth-styles', 'true');
    document.head.appendChild(styleSheet);
}

// 导出主要函数（用于调试）
window.RayVitaAuth = {
    togglePassword,
    switchAuthMode,
    handleAuth,
    showToast,
    validateForm
};