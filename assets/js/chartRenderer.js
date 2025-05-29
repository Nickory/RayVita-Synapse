// RayVita-Synapse Chart Renderer Module
// 处理所有图表的渲染和更新

class ChartRenderer {
    constructor() {
        this.config = window.RayVitaConfig;
        this.charts = {};
        this.defaultOptions = this.config.UI.CHART_OPTIONS;

        this.init();
    }

    init() {
        console.log('Chart Renderer initialized');
        this.setupDefaultChartOptions();
    }

    // 设置默认图表选项
    setupDefaultChartOptions() {
        if (typeof Chart !== 'undefined') {
            Chart.defaults.font.family = this.config.UI.CHART_OPTIONS.FONT_FAMILY;
            Chart.defaults.color = this.config.UI.CHART_COLORS.PRIMARY_CYAN;
            Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
        }
    }

    // 渲染所有图表
    renderAllCharts(healthData) {
        if (!healthData || healthData.length === 0) {
            console.warn('No health data available for chart rendering');
            return;
        }

        // 清理现有图表
        this.destroyAllCharts();

        // 延迟渲染以确保DOM已准备好
        setTimeout(() => {
            this.renderHeartRateChart(healthData);
            this.renderHRVChart(healthData);
            this.renderSpO2Chart(healthData);
            this.renderQualityChart(healthData);
        }, 100);
    }

    // 渲染心率图表
    renderHeartRateChart(healthData) {
        const ctx = document.getElementById('heartRateChart')?.getContext('2d');
        if (!ctx || healthData.length === 0) return;

        if (this.charts.heartRate) {
            this.charts.heartRate.destroy();
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.05)');

        const chartData = healthData.slice().reverse().slice(0, 20); // 最近20条记录

        this.charts.heartRate = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(item => {
                    const date = new Date(item.createdAt || item.timestamp);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }),
                datasets: [{
                    label: 'Heart Rate (BPM)',
                    data: chartData.map(item => item.heartRate),
                    borderColor: this.config.UI.CHART_COLORS.PRIMARY_CYAN,
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.config.UI.CHART_COLORS.PRIMARY_CYAN,
                    pointBorderColor: '#ffffff',
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY, size: 14 },
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: this.config.UI.CHART_COLORS.PRIMARY_CYAN,
                        bodyColor: '#ffffff',
                        borderColor: this.config.UI.CHART_COLORS.PRIMARY_CYAN,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                return `Heart Rate: ${context.parsed.y.toFixed(1)} BPM`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        title: {
                            display: true,
                            text: 'Time',
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY, size: 12 }
                        }
                    },
                    y: {
                        ticks: {
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY },
                            callback: (value) => `${value} BPM`
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        title: {
                            display: true,
                            text: 'Heart Rate (BPM)',
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY, size: 12 }
                        }
                    }
                },
                animation: {
                    duration: this.config.UI.ANIMATION_DURATION,
                    easing: 'easeInOutQuart'
                }
            }
        });

        console.log('Heart rate chart rendered');
    }

    // 渲染HRV雷达图
    renderHRVChart(healthData) {
        const ctx = document.getElementById('hrvChart')?.getContext('2d');
        if (!ctx) return;

        if (this.charts.hrv) {
            this.charts.hrv.destroy();
        }

        const validData = healthData.filter(item => item.hrvResult).slice(0, 3);
        if (validData.length === 0) {
            this.renderNoDataChart(ctx, 'No HRV data available');
            return;
        }

        const colors = [
            this.config.UI.CHART_COLORS.PRIMARY_CYAN,
            this.config.UI.CHART_COLORS.PRIMARY_BLUE,
            this.config.UI.CHART_COLORS.PRIMARY_PURPLE
        ];

        const datasets = validData.map((item, index) => ({
            label: `Session ${index + 1}`,
            data: [
                Math.min(item.hrvResult.rmssd / 10, 100),
                Math.min(item.hrvResult.sdnn / 5, 100),
                Math.min((item.hrvResult.pnn50 || 0) * 5, 100),
                Math.max(0, (1 - item.hrvResult.stressIndex) * 100)
            ],
            borderColor: colors[index],
            backgroundColor: colors[index] + '20',
            borderWidth: 3,
            pointBackgroundColor: colors[index],
            pointBorderColor: '#ffffff',
            pointRadius: 4,
            pointHoverRadius: 6
        }));

        this.charts.hrv = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['RMSSD', 'SDNN', 'pNN50', 'Stress Resistance'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY, size: 14 },
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: this.config.UI.CHART_COLORS.PRIMARY_CYAN,
                        bodyColor: '#ffffff',
                        borderColor: this.config.UI.CHART_COLORS.PRIMARY_CYAN,
                        borderWidth: 1
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.2)',
                            lineWidth: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.2)',
                            lineWidth: 1
                        },
                        pointLabels: {
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY, size: 12 }
                        },
                        ticks: {
                            color: '#ffffff',
                            backdropColor: 'transparent',
                            font: { family: this.defaultOptions.FONT_FAMILY }
                        },
                        beginAtZero: true,
                        max: 100
                    }
                },
                animation: {
                    duration: 2500,
                    easing: 'easeInOutElastic'
                }
            }
        });

        console.log('HRV chart rendered');
    }

    // 渲染SpO2图表
    renderSpO2Chart(healthData) {
        const ctx = document.getElementById('spo2Chart')?.getContext('2d');
        if (!ctx) return;

        if (this.charts.spo2) {
            this.charts.spo2.destroy();
        }

        const validData = healthData.filter(item => item.spo2Result).slice().reverse().slice(0, 15);
        if (validData.length === 0) {
            this.renderNoDataChart(ctx, 'No SpO2 data available');
            return;
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(0, 255, 136, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0.05)');

        this.charts.spo2 = new Chart(ctx, {
            type: 'line',
            data: {
                labels: validData.map(item => {
                    const date = new Date(item.createdAt || item.timestamp);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }),
                datasets: [{
                    label: 'SpO2 (%)',
                    data: validData.map(item => item.spo2Result.spo2),
                    borderColor: this.config.UI.CHART_COLORS.ACCENT_GREEN,
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.config.UI.CHART_COLORS.ACCENT_GREEN,
                    pointBorderColor: '#ffffff',
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY, size: 14 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: this.config.UI.CHART_COLORS.ACCENT_GREEN,
                        bodyColor: '#ffffff',
                        borderColor: this.config.UI.CHART_COLORS.ACCENT_GREEN,
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                const status = value >= 98 ? 'Excellent' : value >= 96 ? 'Good' : 'Monitor';
                                return [`SpO2: ${value.toFixed(1)}%`, `Status: ${status}`];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        }
                    },
                    y: {
                        ticks: {
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY },
                            callback: (value) => `${value}%`
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        min: 95,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Blood Oxygen Saturation (%)',
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY, size: 12 }
                        }
                    }
                },
                animation: {
                    duration: this.config.UI.ANIMATION_DURATION,
                    easing: 'easeInOutQuart'
                }
            }
        });

        console.log('SpO2 chart rendered');
    }

    // 渲染信号质量图表
    renderQualityChart(healthData) {
        const ctx = document.getElementById('qualityChart')?.getContext('2d');
        if (!ctx || healthData.length === 0) return;

        if (this.charts.quality) {
            this.charts.quality.destroy();
        }

        const recentData = healthData.slice(0, 10).reverse();

        this.charts.quality = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: recentData.map((_, index) => `S${index + 1}`),
                datasets: [{
                    label: 'Illumination Quality (%)',
                    data: recentData.map(item =>
                        item.signalQuality ? item.signalQuality.illuminationQuality * 100 : 50
                    ),
                    backgroundColor: this.config.UI.CHART_COLORS.PRIMARY_CYAN + '80',
                    borderColor: this.config.UI.CHART_COLORS.PRIMARY_CYAN,
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                }, {
                    label: 'Signal Clarity (%)',
                    data: recentData.map(item =>
                        item.signalQuality ? (1 - (item.signalQuality.motionArtifact || 0)) * 100 : 80
                    ),
                    backgroundColor: this.config.UI.CHART_COLORS.ACCENT_ORANGE + '80',
                    borderColor: this.config.UI.CHART_COLORS.ACCENT_ORANGE,
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY, size: 14 },
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.config.UI.CHART_COLORS.PRIMARY_CYAN,
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        title: {
                            display: true,
                            text: 'Recent Sessions',
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY, size: 12 }
                        }
                    },
                    y: {
                        ticks: {
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY },
                            callback: (value) => `${value}%`
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Quality Percentage (%)',
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY, size: 12 }
                        }
                    }
                },
                animation: {
                    duration: this.config.UI.ANIMATION_DURATION,
                    easing: 'easeInOutQuart'
                }
            }
        });

        console.log('Quality chart rendered');
    }

    // 渲染波形图表（用于记录查看器）
    renderWaveformChart(container, data, type, label) {
        const canvas = container.querySelector('canvas') || document.createElement('canvas');
        if (!container.querySelector('canvas')) {
            container.appendChild(canvas);
        }

        const ctx = canvas.getContext('2d');

        // 销毁现有图表
        if (canvas.chart) {
            canvas.chart.destroy();
        }

        let color = this.config.UI.CHART_COLORS.PRIMARY_CYAN;
        let yAxisConfig = {};

        switch (type) {
            case 'rppg':
                color = this.config.UI.CHART_COLORS.PRIMARY_CYAN;
                yAxisConfig = { min: -5, max: 5 };
                break;
            case 'heartrate':
                color = this.config.UI.CHART_COLORS.ACCENT_PINK;
                yAxisConfig = { min: 50, max: 120 };
                break;
            case 'quality':
                color = this.config.UI.CHART_COLORS.ACCENT_GREEN;
                yAxisConfig = { min: 0, max: 1 };
                break;
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '08');

        canvas.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map((_, i) => i),
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: color,
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY, size: 14 }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        title: {
                            display: true,
                            text: 'Time / Sample Points',
                            color: '#ffffff'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#ffffff',
                            font: { family: this.defaultOptions.FONT_FAMILY }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        title: {
                            display: true,
                            text: label,
                            color: '#ffffff'
                        },
                        ...yAxisConfig
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });

        return canvas.chart;
    }

    // 渲染无数据图表
    renderNoDataChart(ctx, message) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px ' + this.defaultOptions.FONT_FAMILY;
        ctx.textAlign = 'center';
        ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
    }

    // 更新图表数据
    updateChart(chartName, newData) {
        const chart = this.charts[chartName];
        if (!chart) return;

        chart.data = newData;
        chart.update('active');
        console.log(`Updated ${chartName} chart`);
    }

    // 销毁单个图表
    destroyChart(chartName) {
        if (this.charts[chartName]) {
            this.charts[chartName].destroy();
            delete this.charts[chartName];
            console.log(`Destroyed ${chartName} chart`);
        }
    }

    // 销毁所有图表
    destroyAllCharts() {
        Object.keys(this.charts).forEach(chartName => {
            this.destroyChart(chartName);
        });
        console.log('All charts destroyed');
    }

    // 导出图表为图片
    exportChart(chartName, filename) {
        const chart = this.charts[chartName];
        if (!chart) {
            console.error(`Chart ${chartName} not found`);
            return null;
        }

        const canvas = chart.canvas;
        const url = canvas.toDataURL('image/png');

        // 创建下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `${chartName}-chart.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        console.log(`Exported ${chartName} chart as ${filename}`);
        return url;
    }

    // 获取图表实例
    getChart(chartName) {
        return this.charts[chartName] || null;
    }

    // 检查Chart.js是否可用
    isChartJSAvailable() {
        return typeof Chart !== 'undefined';
    }

    // 获取图表统计信息
    getChartStats() {
        return {
            totalCharts: Object.keys(this.charts).length,
            chartNames: Object.keys(this.charts),
            chartJSAvailable: this.isChartJSAvailable()
        };
    }
}

// 创建全局图表渲染器实例
window.chartRenderer = new ChartRenderer();

// 导出供模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartRenderer;
}