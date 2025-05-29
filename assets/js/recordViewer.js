// RayVita-Synapse Record Viewer Module
// 处理健康记录的详细查看和分析

class RecordViewer {
    constructor() {
        this.config = window.RayVitaConfig;
        this.selectedRecord = null;
        this.waveformChart = null;
        this.currentWaveformType = 'rppg';

        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('Record Viewer initialized');
    }

    setupEventListeners() {
        // 波形控制按钮
        document.querySelectorAll('.waveform-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.waveform-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateWaveform(e.target.dataset.type);
            });
        });

        // 关闭按钮
        const closeBtn = document.querySelector('.close-viewer');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeViewer());
        }

        // 点击背景关闭
        const modal = document.getElementById('recordViewerModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeViewer();
                }
            });
        }

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeViewer();
            }
        });
    }

    // 渲染记录列表
    renderRecordsList(healthData) {
        const container = document.getElementById('recordsList');
        if (!container) return;

        if (healthData.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No rPPG measurements found. Please use RayVita app to see your data here.</p>';
            return;
        }

        container.innerHTML = healthData.map((item, index) => {
            const date = new Date(item.createdAt || item.timestamp);
            const qualityPercent = item.signalQuality ?
                Math.max(item.signalQuality.illuminationQuality * 100, 10) : 50;

            return `
                <div class="record-item" onclick="window.recordViewer.openViewer('${item.sessionId}')">
                    <div class="record-header">
                        <div class="record-id">Session ${String(index + 1).padStart(3, '0')}</div>
                        <div class="record-time">${date.toLocaleString()}</div>
                    </div>

                    <div class="record-metrics">
                        <div class="record-metric">
                            <div class="record-metric-value">${item.heartRate ? item.heartRate.toFixed(1) : 'N/A'}</div>
                            <div class="record-metric-label">Heart Rate</div>
                        </div>
                        <div class="record-metric">
                            <div class="record-metric-value">${item.spo2Result ? item.spo2Result.spo2.toFixed(1) : 'N/A'}</div>
                            <div class="record-metric-label">SpO2 (%)</div>
                        </div>
                        <div class="record-metric">
                            <div class="record-metric-value">${item.hrvResult ? item.hrvResult.rmssd.toFixed(1) : 'N/A'}</div>
                            <div class="record-metric-label">RMSSD</div>
                        </div>
                        <div class="record-metric">
                            <div class="record-metric-value">${item.confidence ? (item.confidence * 100).toFixed(0) : 'N/A'}</div>
                            <div class="record-metric-label">Confidence</div>
                        </div>
                        <div class="record-metric">
                            <div class="record-metric-value">${item.frameCount || 'N/A'}</div>
                            <div class="record-metric-label">Frames</div>
                        </div>
                        <div class="record-metric">
                            <div class="record-metric-value">${item.processingTimeMs || 'N/A'}</div>
                            <div class="record-metric-label">Process (ms)</div>
                        </div>
                    </div>

                    <div class="record-quality">
                        <div class="quality-label">Signal Quality:</div>
                        <div class="quality-bar">
                            <div class="quality-fill" style="width: ${qualityPercent}%"></div>
                        </div>
                        <div class="quality-label">${qualityPercent.toFixed(0)}%</div>
                    </div>
                </div>
            `;
        }).join('');

        console.log(`Rendered ${healthData.length} health records`);
    }

    // 打开记录查看器
    openViewer(sessionId) {
        const healthData = window.app ? window.app.getHealthData() : [];
        const record = healthData.find(item => item.sessionId === sessionId);

        if (!record) {
            console.error('Record not found:', sessionId);
            return;
        }

        this.selectedRecord = record;

        // 显示模态框
        const modal = document.getElementById('recordViewerModal');
        if (modal) {
            modal.style.display = 'flex';
        }

        // 渲染记录详情
        this.renderRecordDetails(record);

        // 重置波形控制
        document.querySelectorAll('.waveform-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.waveform-btn[data-type="rppg"]')?.classList.add('active');

        // 渲染初始波形
        setTimeout(() => {
            this.updateWaveform('rppg');
        }, 100);

        console.log('Opened record viewer for:', sessionId);
    }

    // 关闭记录查看器
    closeViewer() {
        const modal = document.getElementById('recordViewerModal');
        if (modal) {
            modal.style.display = 'none';
        }

        this.selectedRecord = null;

        if (this.waveformChart) {
            this.waveformChart.destroy();
            this.waveformChart = null;
        }

        console.log('Closed record viewer');
    }

    // 渲染记录详情
    renderRecordDetails(record) {
        const date = new Date(record.createdAt || record.timestamp);
        const container = document.getElementById('recordViewerDetails');
        if (!container) return;

        container.innerHTML = `
            <div class="card-grid dense" style="margin-bottom: 30px;">
                <div class="neural-card">
                    <h4 style="color: var(--primary-cyan); margin-bottom: 20px;">📊 Basic Metrics</h4>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <div class="metric-value">${record.heartRate ? record.heartRate.toFixed(1) : 'N/A'}</div>
                            <div class="metric-label">Heart Rate (BPM)</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value">${record.confidence ? (record.confidence * 100).toFixed(0) : 'N/A'}</div>
                            <div class="metric-label">Confidence (%)</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value">${record.frameCount || 'N/A'}</div>
                            <div class="metric-label">Frames</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value">${record.processingTimeMs || 'N/A'}</div>
                            <div class="metric-label">Process Time</div>
                        </div>
                    </div>
                </div>

                <div class="neural-card">
                    <h4 style="color: var(--primary-cyan); margin-bottom: 20px;">💓 HRV Analysis</h4>
                    ${record.hrvResult ? `
                        <div class="metrics-grid">
                            <div class="metric-item">
                                <div class="metric-value">${record.hrvResult.rmssd.toFixed(1)}</div>
                                <div class="metric-label">RMSSD (ms)</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${record.hrvResult.sdnn.toFixed(1)}</div>
                                <div class="metric-label">SDNN (ms)</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${record.hrvResult.pnn50 ? record.hrvResult.pnn50.toFixed(1) : 'N/A'}</div>
                                <div class="metric-label">pNN50 (%)</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${record.hrvResult.stressIndex.toFixed(2)}</div>
                                <div class="metric-label">Stress Index</div>
                            </div>
                        </div>
                    ` : '<p style="text-align: center; color: var(--text-secondary);">No HRV data available</p>'}
                </div>

                <div class="neural-card">
                    <h4 style="color: var(--primary-cyan); margin-bottom: 20px;">🫁 SpO2 Analysis</h4>
                    ${record.spo2Result ? `
                        <div class="metrics-grid">
                            <div class="metric-item">
                                <div class="metric-value">${record.spo2Result.spo2.toFixed(1)}</div>
                                <div class="metric-label">SpO2 (%)</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${record.spo2Result.spo2 >= 98 ? 'Excellent' : record.spo2Result.spo2 >= 96 ? 'Good' : 'Monitor'}</div>
                                <div class="metric-label">Health Status</div>
                            </div>
                        </div>
                    ` : '<p style="text-align: center; color: var(--text-secondary);">No SpO2 data available</p>'}
                </div>
            </div>

            <div class="neural-card">
                <h4 style="color: var(--primary-cyan); margin-bottom: 20px;">📈 Health Assessment & Recommendations</h4>
                <div style="line-height: 1.8;">
                    ${this.generateHealthAssessment(record)}
                </div>
            </div>
        `;

        // 更新标题
        const subtitle = document.getElementById('recordViewerSubtitle');
        if (subtitle) {
            subtitle.textContent = `Session recorded on ${date.toLocaleString()}`;
        }
    }

    // 生成健康评估
    generateHealthAssessment(record) {
        if (window.utils && window.utils.generateHealthAssessment) {
            return window.utils.generateHealthAssessment(record);
        }

        // 简化版健康评估
        let assessment = '';

        if (record.heartRate) {
            const hr = record.heartRate;
            if (hr >= 60 && hr <= 100) {
                assessment += '<div class="education-feature"><div class="feature-icon" style="color: var(--accent-green);">✅</div><div><strong>Normal Heart Rate:</strong> Your heart rate is within healthy range (60-100 BPM).</div></div>';
            } else if (hr < 60) {
                assessment += '<div class="education-feature"><div class="feature-icon" style="color: var(--accent-orange);">⚠️</div><div><strong>Low Heart Rate:</strong> Consider consulting a healthcare provider if you are not a trained athlete.</div></div>';
            } else {
                assessment += '<div class="education-feature"><div class="feature-icon" style="color: var(--accent-pink);">🚨</div><div><strong>Elevated Heart Rate:</strong> This may be due to stress, caffeine, or other factors. Consider rest and monitoring.</div></div>';
            }
        }

        if (record.spo2Result) {
            const spo2 = record.spo2Result.spo2;
            if (spo2 >= 98) {
                assessment += '<div class="education-feature"><div class="feature-icon" style="color: var(--accent-green);">🫁</div><div><strong>Excellent SpO2:</strong> Your blood oxygen saturation is in excellent range.</div></div>';
            } else if (spo2 >= 96) {
                assessment += '<div class="education-feature"><div class="feature-icon" style="color: var(--accent-green);">👍</div><div><strong>Normal SpO2:</strong> Your blood oxygen saturation is within normal range.</div></div>';
            } else {
                assessment += '<div class="education-feature"><div class="feature-icon" style="color: var(--accent-orange);">⚠️</div><div><strong>SpO2 Needs Attention:</strong> Consider consulting a healthcare provider if this persists.</div></div>';
            }
        }

        return assessment || '<p style="text-align: center; color: var(--text-secondary);">No specific health assessment available for this record.</p>';
    }

    // 更新波形显示
    updateWaveform(type) {
        if (!this.selectedRecord) return;

        this.currentWaveformType = type;
        const container = document.querySelector('.waveform-container');
        if (!container) return;

        // 销毁现有图表
        if (this.waveformChart) {
            this.waveformChart.destroy();
        }

        let data = [];
        let label = '';
        let color = this.config.UI.CHART_COLORS.PRIMARY_CYAN;

        switch (type) {
            case 'rppg':
                data = this.selectedRecord.rppgSignal || this.generateSampleWaveform(300, 'rppg');
                label = 'rPPG Signal Intensity';
                color = this.config.UI.CHART_COLORS.PRIMARY_CYAN;
                break;
            case 'heartrate':
                data = this.generateSampleWaveform(100, 'heartrate');
                label = 'Heart Rate Trend (BPM)';
                color = this.config.UI.CHART_COLORS.ACCENT_PINK;
                break;
            case 'quality':
                data = this.generateSampleWaveform(100, 'quality');
                label = 'Signal Quality Index';
                color = this.config.UI.CHART_COLORS.ACCENT_GREEN;
                break;
        }

        // 使用图表渲染器
        if (window.chartRenderer) {
            this.waveformChart = window.chartRenderer.renderWaveformChart(container, data, type, label);
        }

        console.log(`Updated waveform to ${type}`);
    }

    // 生成示例波形数据
    generateSampleWaveform(length, type) {
        if (window.utils && window.utils.generateSampleWaveform) {
            return window.utils.generateSampleWaveform(length, type);
        }

        // 简化版波形生成
        const data = [];
        for (let i = 0; i < length; i++) {
            let value = 0;
            switch (type) {
                case 'rppg':
                    value = Math.sin(i * 0.1) + Math.random() * 0.2 - 0.1;
                    break;
                case 'heartrate':
                    value = 70 + Math.sin(i * 0.05) * 15 + Math.random() * 5 - 2.5;
                    break;
                case 'quality':
                    value = 0.8 + Math.sin(i * 0.03) * 0.15 + Math.random() * 0.1 - 0.05;
                    break;
            }
            data.push(value);
        }
        return data;
    }

    // 导出记录数据
    exportRecord(format = 'json') {
        if (!this.selectedRecord) {
            window.utils?.showMessage('No record selected for export', 'warning');
            return;
        }

        const recordData = {
            ...this.selectedRecord,
            exportDate: new Date().toISOString(),
            healthAssessment: this.generateHealthAssessment(this.selectedRecord)
        };

        let content, filename, mimeType;

        if (format === 'csv') {
            content = this.convertRecordToCSV(recordData);
            filename = `rayvita-record-${this.selectedRecord.sessionId}.csv`;
            mimeType = 'text/csv';
        } else {
            content = JSON.stringify(recordData, null, 2);
            filename = `rayvita-record-${this.selectedRecord.sessionId}.json`;
            mimeType = 'application/json';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        window.utils?.showMessage(`Record exported as ${format.toUpperCase()}`, 'success');
        console.log(`Exported record ${this.selectedRecord.sessionId} as ${format}`);
    }

    // 转换记录为CSV格式
    convertRecordToCSV(record) {
        const headers = [
            'Session ID', 'Timestamp', 'Heart Rate', 'Confidence', 'SpO2',
            'RMSSD', 'SDNN', 'Stress Index', 'Frame Count', 'Processing Time',
            'Illumination Quality', 'Motion Artifact'
        ];

        const values = [
            record.sessionId || '',
            record.createdAt || record.timestamp || '',
            record.heartRate || '',
            record.confidence || '',
            record.spo2Result ? record.spo2Result.spo2 : '',
            record.hrvResult ? record.hrvResult.rmssd : '',
            record.hrvResult ? record.hrvResult.sdnn : '',
            record.hrvResult ? record.hrvResult.stressIndex : '',
            record.frameCount || '',
            record.processingTimeMs || '',
            record.signalQuality ? record.signalQuality.illuminationQuality : '',
            record.signalQuality ? record.signalQuality.motionArtifact : ''
        ];

        return [headers.join(','), values.join(',')].join('\n');
    }

    // 打印记录
    printRecord() {
        if (!this.selectedRecord) {
            window.utils?.showMessage('No record selected for printing', 'warning');
            return;
        }

        // 创建打印窗口
        const printWindow = window.open('', '_blank');
        const printContent = this.generatePrintContent(this.selectedRecord);

        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();

        console.log('Printing record:', this.selectedRecord.sessionId);
    }

    // 生成打印内容
    generatePrintContent(record) {
        const date = new Date(record.createdAt || record.timestamp);

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>RayVita Health Record - ${record.sessionId}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
                    .metric { border: 1px solid #ccc; padding: 15px; text-align: center; }
                    .metric-value { font-size: 24px; font-weight: bold; }
                    .metric-label { font-size: 12px; color: #666; margin-top: 5px; }
                    .section { margin: 20px 0; }
                    .section h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>RayVita Health Record</h1>
                    <h2>Session: ${record.sessionId}</h2>
                    <p>Recorded on: ${date.toLocaleString()}</p>
                </div>
                
                <div class="metrics">
                    <div class="metric">
                        <div class="metric-value">${record.heartRate ? record.heartRate.toFixed(1) : 'N/A'}</div>
                        <div class="metric-label">Heart Rate (BPM)</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${record.confidence ? (record.confidence * 100).toFixed(0) + '%' : 'N/A'}</div>
                        <div class="metric-label">Confidence</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${record.spo2Result ? record.spo2Result.spo2.toFixed(1) + '%' : 'N/A'}</div>
                        <div class="metric-label">SpO2</div>
                    </div>
                </div>
                
                ${record.hrvResult ? `
                <div class="section">
                    <h3>Heart Rate Variability (HRV)</h3>
                    <p>RMSSD: ${record.hrvResult.rmssd.toFixed(1)} ms</p>
                    <p>SDNN: ${record.hrvResult.sdnn.toFixed(1)} ms</p>
                    <p>Stress Index: ${record.hrvResult.stressIndex.toFixed(2)}</p>
                </div>
                ` : ''}
                
                <div class="section">
                    <h3>Technical Details</h3>
                    <p>Frames Processed: ${record.frameCount || 'N/A'}</p>
                    <p>Processing Time: ${record.processingTimeMs || 'N/A'} ms</p>
                    <p>Signal Quality: ${record.signalQuality ? (record.signalQuality.illuminationQuality * 100).toFixed(0) + '%' : 'N/A'}</p>
                </div>
                
                <div class="section">
                    <small>Generated by RayVita-Synapse Health Analytics Platform</small>
                </div>
            </body>
            </html>
        `;
    }

    // 获取当前选中的记录
    getSelectedRecord() {
        return this.selectedRecord;
    }

    // 获取当前波形类型
    getCurrentWaveformType() {
        return this.currentWaveformType;
    }
}

// 创建全局记录查看器实例
window.recordViewer = new RecordViewer();

// 导出供模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecordViewer;
}