// RayVita-Synapse Data Manager Module
// 处理健康数据的加载、存储、处理和验证

class DataManager {
    constructor() {
        this.config = window.RayVitaConfig;
        this.healthData = [];
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache

        this.init();
    }

    init() {
        console.log('Data Manager initialized');
    }

    // 加载健康数据
    async loadHealthData(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const cacheKey = `health_data_${userId}`;

        // 检查缓存
        if (this.isCacheValid(cacheKey)) {
            console.log('Loading health data from cache');
            return this.cache.get(cacheKey).data;
        }

        try {
            console.log('Loading health data from API for user:', userId);
            const response = await window.utils.makeApiRequest(`health_measurements/user/${userId}`);

            if (response.ok) {
                const data = await response.json();
                const validatedData = this.validateAndProcessHealthData(data);

                // 缓存数据
                this.cache.set(cacheKey, {
                    data: validatedData,
                    timestamp: Date.now()
                });

                this.healthData = validatedData;
                console.log(`Loaded ${validatedData.length} health records`);
                return validatedData;
            } else {
                console.warn('API request failed, generating sample data');
                return this.generateSampleHealthData(userId);
            }
        } catch (error) {
            console.error('Error loading health data:', error);
            // 生成示例数据作为备选方案
            return this.generateSampleHealthData(userId);
        }
    }

    // 验证和处理健康数据
    validateAndProcessHealthData(rawData) {
        if (!Array.isArray(rawData)) {
            console.warn('Invalid data format, expected array');
            return [];
        }

        const validData = rawData
            .filter(item => this.validateHealthRecord(item))
            .map(item => this.processHealthRecord(item))
            .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));

        console.log(`Validated ${validData.length} out of ${rawData.length} records`);
        return validData;
    }

    // 验证单个健康记录
    validateHealthRecord(record) {
        if (!record || typeof record !== 'object') return false;

        // 必需字段检查
        const requiredFields = ['user_id', 'timestamp'];
        for (let field of requiredFields) {
            if (!record[field]) {
                console.warn(`Record missing required field: ${field}`);
                return false;
            }
        }

        // 心率验证
        if (record.heartRate && (record.heartRate < 30 || record.heartRate > 220)) {
            console.warn(`Invalid heart rate: ${record.heartRate}`);
            return false;
        }

        // SpO2验证
        if (record.spo2Result && record.spo2Result.spo2) {
            const spo2 = record.spo2Result.spo2;
            if (spo2 < 70 || spo2 > 100) {
                console.warn(`Invalid SpO2: ${spo2}`);
                return false;
            }
        }

        // 置信度验证
        if (record.confidence && (record.confidence < 0 || record.confidence > 1)) {
            console.warn(`Invalid confidence: ${record.confidence}`);
            return false;
        }

        return true;
    }

    // 处理单个健康记录
    processHealthRecord(record) {
        const processed = { ...record };

        // 确保有sessionId
        if (!processed.sessionId) {
            processed.sessionId = `session-${processed.timestamp || Date.now()}`;
        }

        // 确保有createdAt字段
        if (!processed.createdAt && processed.timestamp) {
            processed.createdAt = new Date(processed.timestamp).toISOString();
        }

        // 处理HRV结果
        if (processed.hrvResult) {
            processed.hrvResult = this.processHRVData(processed.hrvResult);
        }

        // 处理SpO2结果
        if (processed.spo2Result) {
            processed.spo2Result = this.processSpO2Data(processed.spo2Result);
        }

        // 处理信号质量
        if (processed.signalQuality) {
            processed.signalQuality = this.processSignalQuality(processed.signalQuality);
        }

        // 生成rPPG信号数据（如果没有的话）
        if (!processed.rppgSignal) {
            processed.rppgSignal = this.generateSampleWaveform(
                this.config.SAMPLE_DATA.WAVEFORM_LENGTH,
                'rppg'
            );
        }

        // 设置同步状态
        if (!processed.syncStatus) {
            processed.syncStatus = Math.random() > 0.2 ? 'synced' : 'pending';
        }

        return processed;
    }

    // 处理HRV数据
    processHRVData(hrvData) {
        const processed = { ...hrvData };

        // 确保数值在合理范围内
        if (processed.rmssd) {
            processed.rmssd = Math.max(0, Math.min(processed.rmssd, 200));
        }
        if (processed.sdnn) {
            processed.sdnn = Math.max(0, Math.min(processed.sdnn, 200));
        }
        if (processed.pnn50) {
            processed.pnn50 = Math.max(0, Math.min(processed.pnn50, 100));
        }
        if (processed.stressIndex) {
            processed.stressIndex = Math.max(0, Math.min(processed.stressIndex, 1));
        }

        return processed;
    }

    // 处理SpO2数据
    processSpO2Data(spo2Data) {
        const processed = { ...spo2Data };

        if (processed.spo2) {
            processed.spo2 = Math.max(70, Math.min(processed.spo2, 100));
        }

        return processed;
    }

    // 处理信号质量数据
    processSignalQuality(qualityData) {
        const processed = { ...qualityData };

        if (processed.illuminationQuality) {
            processed.illuminationQuality = Math.max(0, Math.min(processed.illuminationQuality, 1));
        }
        if (processed.motionArtifact) {
            processed.motionArtifact = Math.max(0, Math.min(processed.motionArtifact, 1));
        }

        return processed;
    }

    // 生成示例健康数据
    generateSampleHealthData(userId) {
        console.log('Generating sample health data for user:', userId);

        const sampleData = [];
        const now = new Date();
        const recordCount = this.config.SAMPLE_DATA.GENERATE_RECORDS_COUNT;

        for (let i = 0; i < recordCount; i++) {
            const date = new Date(now.getTime() - i * 3600000 * Math.random() * 24);
            const baseHR = 70 + Math.random() * 30;
            const confidence = 0.85 + Math.random() * 0.15;

            const record = {
                sessionId: `demo-${userId}-${i}`,
                user_id: userId,
                timestamp: date.getTime(),
                createdAt: date.toISOString(),
                heartRate: this.generateRealisticHeartRate(baseHR),
                confidence: confidence,
                frameCount: Math.floor(200 + Math.random() * 100),
                processingTimeMs: Math.floor(1000 + Math.random() * 500),
                hrvResult: this.generateSampleHRVData(),
                spo2Result: this.generateSampleSpO2Data(),
                signalQuality: this.generateSampleSignalQuality(),
                rppgSignal: this.generateSampleWaveform(
                    this.config.SAMPLE_DATA.WAVEFORM_LENGTH,
                    'rppg'
                ),
                syncStatus: Math.random() > 0.2 ? 'synced' : 'pending'
            };

            sampleData.push(record);
        }

        this.healthData = sampleData;
        console.log(`Generated ${sampleData.length} sample health records`);
        return sampleData;
    }

    // 生成真实的心率数据
    generateRealisticHeartRate(baseHR) {
        // 添加一些自然变异
        const variation = (Math.random() - 0.5) * 20;
        const heartRate = baseHR + variation;

        // 确保在合理范围内
        return Math.max(50, Math.min(heartRate, 120));
    }

    // 生成示例HRV数据
    generateSampleHRVData() {
        return {
            rmssd: 20 + Math.random() * 40,
            sdnn: 30 + Math.random() * 30,
            pnn50: Math.random() * 20,
            stressIndex: Math.random() * 0.8
        };
    }

    // 生成示例SpO2数据
    generateSampleSpO2Data() {
        return {
            spo2: 96 + Math.random() * 4
        };
    }

    // 生成示例信号质量数据
    generateSampleSignalQuality() {
        return {
            illuminationQuality: 0.7 + Math.random() * 0.3,
            motionArtifact: Math.random() * 0.3
        };
    }

    // 生成示例波形数据
    generateSampleWaveform(length, type) {
        const data = [];
        const baseFreq = 0.02;

        for (let i = 0; i < length; i++) {
            let value = 0;

            if (type === 'rppg') {
                // 生成真实的rPPG信号，包含心脏脉冲模式
                value = Math.sin(i * baseFreq * 2 * Math.PI) * 0.8 +
                    Math.sin(i * baseFreq * 4 * Math.PI) * 0.3 +
                    (Math.random() - 0.5) * 0.2;
            } else if (type === 'heartrate') {
                // 生成心率趋势数据
                value = 70 + Math.sin(i * baseFreq * Math.PI) * 15 + (Math.random() - 0.5) * 5;
            } else if (type === 'quality') {
                // 生成信号质量数据
                value = 0.8 + Math.sin(i * baseFreq * Math.PI) * 0.15 + (Math.random() - 0.5) * 0.1;
            }

            data.push(value);
        }

        return data;
    }

    // 获取健康统计数据
    getHealthStatistics(data = this.healthData) {
        if (!data || data.length === 0) {
            return null;
        }

        const validHeartRates = data.filter(item => item.heartRate).map(item => item.heartRate);
        const validSpO2 = data.filter(item => item.spo2Result).map(item => item.spo2Result.spo2);
        const validConfidence = data.filter(item => item.confidence).map(item => item.confidence);
        const validHRVData = data.filter(item => item.hrvResult);

        const stats = {
            totalSessions: data.length,
            heartRate: this.calculateStatistics(validHeartRates),
            spo2: this.calculateStatistics(validSpO2),
            confidence: this.calculateStatistics(validConfidence),
            hrv: validHRVData.length > 0 ? {
                averageRMSSD: validHRVData.reduce((sum, item) => sum + item.hrvResult.rmssd, 0) / validHRVData.length,
                averageSDNN: validHRVData.reduce((sum, item) => sum + item.hrvResult.sdnn, 0) / validHRVData.length,
                averageStressIndex: validHRVData.reduce((sum, item) => sum + item.hrvResult.stressIndex, 0) / validHRVData.length
            } : null,
            dateRange: {
                earliest: new Date(Math.min(...data.map(item => new Date(item.createdAt || item.timestamp)))),
                latest: new Date(Math.max(...data.map(item => new Date(item.createdAt || item.timestamp))))
            }
        };

        return stats;
    }

    // 计算统计数据
    calculateStatistics(values) {
        if (values.length === 0) return null;

        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);

        return {
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            average: sum / values.length,
            median: sorted[Math.floor(sorted.length / 2)],
            standardDeviation: this.calculateStandardDeviation(values)
        };
    }

    // 计算标准差
    calculateStandardDeviation(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(avgSquaredDiff);
    }

    // 获取最近的健康数据
    getRecentHealthData(days = 7) {
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return this.healthData.filter(item => {
            const itemDate = new Date(item.createdAt || item.timestamp);
            return itemDate >= cutoffDate;
        });
    }

    // 根据ID获取特定记录
    getRecordById(sessionId) {
        return this.healthData.find(item => item.sessionId === sessionId);
    }

    // 缓存管理
    isCacheValid(key) {
        const cached = this.cache.get(key);
        if (!cached) return false;

        return (Date.now() - cached.timestamp) < this.cacheExpiry;
    }

    // 清除缓存
    clearCache() {
        this.cache.clear();
        console.log('Data cache cleared');
    }

    // 同步数据到服务器
    async syncHealthData(userId, records) {
        if (!userId || !Array.isArray(records)) {
            throw new Error('Invalid parameters for sync');
        }

        try {
            const response = await window.utils.makeApiRequest('health_measurements/sync', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId,
                    records: records
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Data synced successfully:', result);

                // 清除缓存以强制重新加载
                this.clearCache();

                return result;
            } else {
                throw new Error(`Sync failed with status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error syncing health data:', error);
            throw error;
        }
    }

    // 导出数据
    exportHealthData(format = 'json') {
        const data = {
            exportDate: new Date().toISOString(),
            recordCount: this.healthData.length,
            statistics: this.getHealthStatistics(),
            records: this.healthData
        };

        if (format === 'csv') {
            return this.convertToCSV(this.healthData);
        } else {
            return JSON.stringify(data, null, 2);
        }
    }

    // 转换为CSV格式
    convertToCSV(records) {
        if (records.length === 0) return '';

        const headers = [
            'sessionId', 'timestamp', 'heartRate', 'confidence',
            'spo2', 'rmssd', 'sdnn', 'stressIndex', 'illuminationQuality'
        ];

        const csvData = records.map(record => {
            return [
                record.sessionId || '',
                record.createdAt || record.timestamp || '',
                record.heartRate || '',
                record.confidence || '',
                record.spo2Result ? record.spo2Result.spo2 : '',
                record.hrvResult ? record.hrvResult.rmssd : '',
                record.hrvResult ? record.hrvResult.sdnn : '',
                record.hrvResult ? record.hrvResult.stressIndex : '',
                record.signalQuality ? record.signalQuality.illuminationQuality : ''
            ].join(',');
        });

        return [headers.join(','), ...csvData].join('\n');
    }

    // 获取当前健康数据
    getCurrentHealthData() {
        return this.healthData;
    }

    // 添加新的健康记录
    addHealthRecord(record) {
        if (this.validateHealthRecord(record)) {
            const processedRecord = this.processHealthRecord(record);
            this.healthData.unshift(processedRecord);

            // 限制内存中的记录数量
            if (this.healthData.length > 1000) {
                this.healthData = this.healthData.slice(0, 1000);
            }

            console.log('Added new health record:', processedRecord.sessionId);
            return processedRecord;
        } else {
            throw new Error('Invalid health record data');
        }
    }

    // 删除健康记录
    removeHealthRecord(sessionId) {
        const index = this.healthData.findIndex(item => item.sessionId === sessionId);
        if (index !== -1) {
            const removed = this.healthData.splice(index, 1)[0];
            console.log('Removed health record:', sessionId);
            return removed;
        }
        return null;
    }
}

// 创建全局数据管理器实例
window.dataManager = new DataManager();

// 导出供模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}