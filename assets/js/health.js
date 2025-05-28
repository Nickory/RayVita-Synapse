const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
if (!currentUser) {
    alert('请先登录');
    window.location.href = 'auth.html';
}

// 配置 - 修改自动刷新时间为5分钟
const CONFIG = {
    API_BASE: 'http://47.96.237.130:5000/api/health_measurements',
    USER_ID: parseInt(currentUser.user_id),
    REFRESH_INTERVAL: 300000, // 5分钟 = 300000毫秒
    PAGE_SIZE: 10
};

// 全局状态
let healthData = [];
let currentFilter = 'all';
let refreshTimer = null;
let currentPage = 1;
let selectedDate = null;
let currentView = 'day';
let refreshCountdown = 300; // 5分钟倒计时

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    setupEventListeners();
    loadHealthData();
    startAutoRefresh();
    startRefreshCountdown();
});

// 页面初始化
function initializePage() {
    updateCurrentPeriod();
    setInterval(updateCurrentDate, 60000);
    initializePagination();
    initializeDatePicker();
}

// 初始化日期选择器
function initializeDatePicker() {
    const datePicker = document.getElementById('datePicker');
    datePicker.value = new Date().toISOString().split('T')[0];
    selectedDate = new Date();
}

// 设置事件监听器
function setupEventListeners() {
    // 标签切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            setActiveTab(e.target);
            currentPage = 1;
            currentFilter = e.target.dataset.type;
            filterData();
        });
    });

    // 视图切换
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentView = e.target.dataset.view;
            updateCalendarView();
        });
    });

    // 快速选择按钮
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const days = parseInt(e.target.dataset.days);
            const date = new Date();
            date.setDate(date.getDate() - days);
            selectedDate = date;
            updateCurrentPeriod();
            filterData();
        });
    });

    // 日历导航
    document.getElementById('prevPeriod').addEventListener('click', () => navigatePeriod(-1));
    document.getElementById('nextPeriod').addEventListener('click', () => navigatePeriod(1));

    // 刷新按钮
    document.getElementById('refreshBtn').addEventListener('click', refreshData);

    // 日期选择
    document.getElementById('datePicker').addEventListener('change', (e) => {
        selectedDate = new Date(e.target.value);
        currentPage = 1;
        filterData();
    });

    // 分页控件
    document.getElementById('pagination').addEventListener('click', (e) => {
        if (e.target.id === 'prevPage' && currentPage > 1) {
            currentPage--;
            filterData();
            updatePaginationDots();
        } else if (e.target.id === 'nextPage') {
            currentPage++;
            filterData();
            updatePaginationDots();
        }
    });
}

// 更新日历视图
function updateCalendarView() {
    updateCurrentPeriod();
    filterData();
}

// 导航时间周期
function navigatePeriod(direction) {
    const date = selectedDate || new Date();

    switch(currentView) {
        case 'day':
            date.setDate(date.getDate() + direction);
            break;
        case 'week':
            date.setDate(date.getDate() + (direction * 7));
            break;
        case 'month':
            date.setMonth(date.getMonth() + direction);
            break;
    }

    selectedDate = date;
    updateCurrentPeriod();
    filterData();
}

// 更新当前时间周期显示
function updateCurrentPeriod() {
    const date = selectedDate || new Date();
    const periodElement = document.getElementById('currentPeriod');

    switch(currentView) {
        case 'day':
            periodElement.textContent = date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
            break;
        case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            periodElement.textContent = `${weekStart.toLocaleDateString('zh-CN')} - ${weekEnd.toLocaleDateString('zh-CN')}`;
            break;
        case 'month':
            periodElement.textContent = date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long'
            });
            break;
    }
}

// 开始刷新倒计时
function startRefreshCountdown() {
    const timerElement = document.getElementById('refreshTimer');

    setInterval(() => {
        refreshCountdown--;

        if (refreshCountdown <= 0) {
            refreshCountdown = 300; // 重置为5分钟
        }

        const minutes = Math.floor(refreshCountdown / 60);
        const seconds = refreshCountdown % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// 更新当前日期
function updateCurrentDate() {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    };
    // 保持原有的日期更新逻辑
}

// 设置活动标签
function setActiveTab(activeBtn) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

// API 调用
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('API调用失败:', error);
        showError(`网络连接失败：${error.message}`);
        return null;
    }
}

// 加载健康数据
async function loadHealthData() {
    showLoading(true);
    try {
        const data = await apiCall(`/user/${CONFIG.USER_ID}`);
        if (data && Array.isArray(data)) {
            healthData = data.sort((a, b) => b.timestamp - a.timestamp);
            filterData();
            updateStatistics();
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        showError('数据加载失败，请稍后重试');
    } finally {
        showLoading(false);
    }
}

// 过滤数据（支持日周月视图）
function filterData() {
    let filteredData = healthData;

    // 根据视图类型过滤日期
    if (selectedDate) {
        const targetDate = new Date(selectedDate);

        switch(currentView) {
            case 'day':
                filteredData = filteredData.filter(d => {
                    const recordDate = new Date(d.timestamp);
                    return recordDate.toDateString() === targetDate.toDateString();
                });
                break;
            case 'week':
                const weekStart = new Date(targetDate);
                weekStart.setDate(targetDate.getDate() - targetDate.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                filteredData = filteredData.filter(d => {
                    const recordDate = new Date(d.timestamp);
                    return recordDate >= weekStart && recordDate <= weekEnd;
                });
                break;
            case 'month':
                filteredData = filteredData.filter(d => {
                    const recordDate = new Date(d.timestamp);
                    return recordDate.getMonth() === targetDate.getMonth() &&
                           recordDate.getFullYear() === targetDate.getFullYear();
                });
                break;
        }
    }

    // 类型过滤
    switch (currentFilter) {
        case 'hr':
            filteredData = filteredData.filter(d => d.heartRate && d.heartRate > 0);
            break;
        case 'hrv':
            filteredData = filteredData.filter(d => d.hrvResult && d.hrvResult.isValid);
            break;
        case 'spo2':
            filteredData = filteredData.filter(d => d.spo2Result && d.spo2Result.isValid);
            break;
    }

    // 分页
    const start = (currentPage - 1) * CONFIG.PAGE_SIZE;
    const end = start + CONFIG.PAGE_SIZE;
    const paginatedData = filteredData.slice(start, end);

    renderHealthRecords(paginatedData);
    updatePagination(filteredData.length);
    updateRecordsCount(filteredData.length);
}

// 渲染健康记录
function renderHealthRecords(data) {
    const container = document.getElementById('healthRecords');

    if (!data || data.length === 0) {
        showEmptyState();
        return;
    }

    container.innerHTML = data.map(record => createRecordCard(record)).join('');

    container.querySelectorAll('.record-card').forEach(card => {
        card.addEventListener('click', () => toggleCard(card));
    });

    data.forEach((record, index) => {
        setTimeout(() => {
            renderWaveform(record.sessionId, record.rppgSignal);
        }, index * 100);
    });
}

// 创建记录卡片（去掉同步状态显示）
function createRecordCard(record) {
    const time = formatTime(record.timestamp);
    const heartRate = record.heartRate ? Math.round(record.heartRate) : '--';
    const heartRateClass = getHeartRateClass(record.heartRate);
    const sessionId = record.sessionId.slice(-6);
    const hrv = record.hrvResult || {};
    const spo2 = record.spo2Result || {};
    const signalQuality = record.signalQuality || {};

    return `
        <div class="record-card" data-session-id="${record.sessionId}" title="点击查看详细数据">
            <div class="record-header">
                <div class="record-time">${time}</div>
                <div class="record-id">#${sessionId}</div>
            </div>

            <div class="heart-rate-section">
                <div class="heart-rate-main">
                    <span class="heart-rate-value ${heartRateClass}">${heartRate}</span>
                    <span class="heart-rate-unit">BPM</span>
                </div>
                <div class="heart-icon">💗</div>
            </div>

            <div class="metrics-grid">
                ${hrv.rmssd ? `
                    <div class="metric-item">
                        <div class="metric-icon">🌊</div>
                        <div class="metric-info">
                            <span class="metric-label">HRV</span>
                            <span class="metric-value">${Math.round(hrv.rmssd)}ms</span>
                        </div>
                    </div>
                ` : ''}
                ${spo2.spo2 ? `
                    <div class="metric-item">
                        <div class="metric-icon">🫁</div>
                        <div class="metric-info">
                            <span class="metric-label">SpO2</span>
                            <span class="metric-value">${Math.round(spo2.spo2)}%</span>
                        </div>
                    </div>
                ` : ''}
                <div class="metric-item">
                    <div class="metric-icon">🎯</div>
                    <div class="metric-info">
                        <span class="metric-label">置信度</span>
                        <span class="metric-value">${Math.round((record.confidence || 0) * 100)}%</span>
                    </div>
                </div>
            </div>

            <div class="waveform-container" id="waveform-container-${record.sessionId}">
                <div class="waveform-header">
                    <span class="waveform-title">PPG信号</span>
                    <span class="waveform-quality">质量: ${getSignalQualityText(signalQuality)}</span>
                </div>
                <canvas class="waveform-canvas" id="waveform-${record.sessionId}" width="300" height="80"></canvas>
            </div>

            <div class="expanded-content">
                <div class="detail-metrics">
                    ${record.frameCount ? `
                        <div class="detail-item">
                            <span class="detail-label">帧数</span>
                            <span class="detail-value">${record.frameCount}</span>
                        </div>
                    ` : ''}
                    ${record.processingTimeMs ? `
                        <div class="detail-item">
                            <span class="detail-label">处理时间</span>
                            <span class="detail-value">${record.processingTimeMs}ms</span>
                        </div>
                    ` : ''}
                    ${signalQuality.illuminationQuality ? `
                        <div class="detail-item">
                            <span class="detail-label">光照质量</span>
                            <span class="detail-value">${Math.round(signalQuality.illuminationQuality * 100)}%</span>
                        </div>
                    ` : ''}
                    ${signalQuality.snr ? `
                        <div class="detail-item">
                            <span class="detail-label">信噪比</span>
                            <span class="detail-value">${Math.round(signalQuality.snr)}dB</span>
                        </div>
                    ` : ''}
                    ${hrv.pnn50 ? `
                        <div class="detail-item">
                            <span class="detail-label">PNN50</span>
                            <span class="detail-value">${Math.round(hrv.pnn50)}%</span>
                        </div>
                    ` : ''}
                    ${hrv.stressIndex ? `
                        <div class="detail-item">
                            <span class="detail-label">压力指数</span>
                            <span class="detail-value">${hrv.stressIndex.toFixed(2)}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="action-buttons">
                    <button class="detail-btn" onclick="showDetailModal('${record.sessionId}')">
                        详细分析
                    </button>
                    <button class="export-btn" onclick="exportRecord('${record.sessionId}')">
                        导出数据
                    </button>
                </div>
            </div>

            <div class="expand-indicator">
                <span class="expand-text"></span>
                <div class="expand-arrow">↓</div>
            </div>
        </div>
    `;
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
        return `${diffMins}分钟前`;
    } else if (diffHours < 24) {
        return `${diffHours}小时前`;
    } else if (diffDays < 7) {
        return `${diffDays}天前`;
    } else {
        return date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
}

// 获取心率颜色类
function getHeartRateClass(heartRate) {
    if (!heartRate) return '';
    if (heartRate < 60 || heartRate > 100) return 'high';
    if (heartRate < 70 || heartRate > 90) return 'elevated';
    return 'normal';
}

// 获取信号质量文本
function getSignalQualityText(signalQuality) {
    const snr = signalQuality.snr || 0;
    if (snr > 15) return '优秀';
    if (snr > 10) return '良好';
    if (snr > 5) return '一般';
    return '较差';
}

// 切换卡片展开状态
function toggleCard(card) {
    card.classList.toggle('expanded');
}

// 渲染波形
function renderWaveform(sessionId, rppgSignal) {
    let signalData = rppgSignal || [];
    if (typeof rppgSignal === 'string') {
        try {
            signalData = JSON.parse(rppgSignal);
        } catch {
            signalData = generateMockSignal();
        }
    }
    if (!Array.isArray(signalData) || signalData.length === 0) {
        signalData = generateMockSignal();
    }

    renderAdvancedWaveform(`waveform-container-${sessionId}`, signalData);
}

// 生成模拟信号数据
function generateMockSignal() {
    const data = [];
    const length = 200;
    for (let i = 0; i < length; i++) {
        const base = Math.sin(i * 0.1) * 0.5;
        const noise = (Math.random() - 0.5) * 0.2;
        const heartbeat = Math.sin(i * 0.8) * 0.3;
        data.push(base + noise + heartbeat);
    }
    return data;
}

// 更新统计信息
function updateStatistics(statType = 'hr') {
    if (!healthData.length) return;

    const filteredData = selectedDate ? healthData.filter(d => {
        const recordDate = new Date(d.timestamp);
        return recordDate.toDateString() === selectedDate.toDateString();
    }) : healthData;

    if (filteredData.length === 0) return;

    const heartRates = filteredData.map(d => d.heartRate).filter(hr => hr && hr > 0);
    const spo2Values = filteredData.map(d => d.spo2Result?.spo2).filter(spo2 => spo2 && spo2 > 0);
    const hrvValues = filteredData.map(d => d.hrvResult?.rmssd).filter(rmssd => rmssd && rmssd > 0);

    if (heartRates.length > 0) {
        const min = Math.min(...heartRates);
        const max = Math.max(...heartRates);
        const avg = Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length);

        document.getElementById('hrRange').textContent = `${min}-${max}`;
        document.getElementById('hrAvg').textContent = avg;
    } else {
        document.getElementById('hrRange').textContent = '--';
        document.getElementById('hrAvg').textContent = '--';
    }

    document.getElementById('spo2Avg').textContent = spo2Values.length > 0 ? Math.round(spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length) : '--';
    document.getElementById('hrvAvg').textContent = hrvValues.length > 0 ? Math.round(hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length) : '--';
}

// 初始化分页
function initializePagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = `
        <button id="prevPage" class="page-btn prev">
            <span>❮</span>
        </button>
        <div class="page-indicators" id="pageIndicators"></div>
        <button id="nextPage" class="page-btn next">
            <span>❯</span>
        </button>
        <div class="page-info" id="pageInfo">第 1 页</div>
    `;
}

// 更新分页
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / CONFIG.PAGE_SIZE);
    currentPage = Math.min(currentPage, totalPages || 1);
    document.getElementById('pageInfo').textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;

    updatePaginationDots();
}

// 更新分页点指示器
function updatePaginationDots() {
    const indicatorsContainer = document.getElementById('pageIndicators');
    const totalPages = Math.ceil(healthData.length / CONFIG.PAGE_SIZE);

    indicatorsContainer.innerHTML = '';

    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        const dot = document.createElement('div');
        dot.className = `page-dot ${i === currentPage ? 'active' : ''}`;
        indicatorsContainer.appendChild(dot);
    }
}

// 更新记录数量显示
function updateRecordsCount(count) {
    const countElement = document.getElementById('recordsCount');
    countElement.textContent = `共 ${count} 条记录`;
}

// 刷新数据
async function refreshData() {
    const refreshBtn = document.getElementById('refreshBtn');
    const originalText = refreshBtn.textContent;

    refreshBtn.textContent = '刷新中...';
    refreshBtn.disabled = true;

    await loadHealthData();

    // 重置倒计时
    refreshCountdown = 300;

    setTimeout(() => {
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
    }, 1000);
}

// 显示加载状态
function showLoading(show) {
    const container = document.getElementById('healthRecords');
    const emptyState = document.getElementById('emptyState');

    if (show) {
        container.innerHTML = `
            <div class="loading">
                <div class="loading-pulse"></div>
                <div class="loading-text">正在加载健康数据...</div>
            </div>
        `;
        emptyState.style.display = 'none';
    }
}

// 显示空状态
function showEmptyState() {
    const container = document.getElementById('healthRecords');
    const emptyState = document.getElementById('emptyState');

    container.innerHTML = '';
    emptyState.style.display = 'block';
}

// 显示错误信息
function showError(message) {
    const container = document.getElementById('healthRecords');
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #ff3b30;">
            <p>❌ ${message}</p>
            <button onclick="refreshData()" style="margin-top: 16px; padding: 8px 16px; border: none; border-radius: 6px; background: #007aff; color: white; cursor: pointer;">
                重试
            </button>
        </div>
    `;
}

// 开始自动刷新
function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(loadHealthData, CONFIG.REFRESH_INTERVAL);
}

// 停止自动刷新
function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

// 高级波形渲染（使用 Chart.js）
function renderAdvancedWaveform(containerId, data) {
    const canvas = document.querySelector(`#${containerId} canvas`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // 清除之前的内容
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 简化版波形绘制
    const width = canvas.width;
    const height = canvas.height;
    const padding = 10;
    const drawWidth = width - padding * 2;
    const drawHeight = height - padding * 2;

    // 归一化数据
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    ctx.beginPath();
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;

    data.forEach((value, index) => {
        const x = padding + (index / (data.length - 1)) * drawWidth;
        const y = padding + drawHeight - ((value - min) / range) * drawHeight;

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // 添加渐变填充
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#667eea';
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fill();
}

// 显示详细模态框
function showDetailModal(sessionId) {
    console.log('显示详细数据:', sessionId);
    // 这里可以实现详细数据模态框
}

// 导出记录
function exportRecord(sessionId) {
    console.log('导出记录:', sessionId);
    // 这里可以实现数据导出功能
}

// 处理页面可见性变化
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopAutoRefresh();
    } else {
        startAutoRefresh();
        loadHealthData();
    }
});

// 清理
window.addEventListener('beforeunload', stopAutoRefresh);

// 导出函数供外部调用
window.HealthApp = {
    loadData: loadHealthData,
    refreshData: refreshData,
    setUserId: (userId) => { CONFIG.USER_ID = userId; },
    setApiBase: (apiBase) => { CONFIG.API_BASE = apiBase; }
};