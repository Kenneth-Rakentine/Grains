// ===== MOBILE AUDIO FIXES & PERFORMANCE OPTIMIZATIONS =====

// ===== 1. ENHANCED MOBILE AUDIO FIXES =====

// Mobile Audio Context Manager
class MobileAudioManager {
    constructor() {
        this.audioContext = null;
        this.isUnlocked = false;
        this.silentBuffer = null;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        this.initializeUnlockSystem();
    }
    
    initializeUnlockSystem() {
        // Create multiple event listeners for different interaction types
        const unlockEvents = [
            'touchstart', 'touchend', 'mousedown', 'keydown', 
            'click', 'contextmenu', 'pointerdown'
        ];
        
        unlockEvents.forEach(eventType => {
            document.addEventListener(eventType, this.handleUserInteraction.bind(this), {
                once: true,
                passive: true,
                capture: true
            });
        });
        
        // iOS-specific visibility change handling
        if (this.isIOS) {
            document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
            window.addEventListener('focus', this.handleFocus.bind(this));
            window.addEventListener('pageshow', this.handlePageShow.bind(this));
        }
        
        console.log('Mobile audio unlock system initialized');
    }
    
    async handleUserInteraction(event) {
        if (this.isUnlocked) return;
        
        console.log('User interaction detected:', event.type);
        await this.unlockAudioContext();
        
        // Re-register events if unlock failed
        if (!this.isUnlocked && this.retryCount < this.maxRetries) {
            setTimeout(() => {
                this.initializeUnlockSystem();
            }, 1000);
        }
    }
    
    async handleVisibilityChange() {
        if (!document.hidden && this.audioContext) {
            await this.resumeAudioContext();
        }
    }
    
    async handleFocus() {
        if (this.audioContext) {
            await this.resumeAudioContext();
        }
    }
    
    async handlePageShow(event) {
        if (event.persisted && this.audioContext) {
            await this.resumeAudioContext();
        }
    }
    
    async createSilentBuffer() {
        if (!this.audioContext || this.silentBuffer) return;
        
        try {
            // Create a tiny silent buffer for audio context priming
            this.silentBuffer = this.audioContext.createBuffer(1, 1, 22050);
            const channelData = this.silentBuffer.getChannelData(0);
            channelData[0] = 0; // Silent
            console.log('Silent buffer created for audio context priming');
        } catch (error) {
            console.warn('Failed to create silent buffer:', error);
        }
    }
    
    async playSilentSound() {
        if (!this.audioContext || !this.silentBuffer) return false;
        
        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.silentBuffer;
            source.connect(this.audioContext.destination);
            source.start(0);
            console.log('Silent sound played to unlock audio context');
            return true;
        } catch (error) {
            console.warn('Failed to play silent sound:', error);
            return false;
        }
    }
    
    async unlockAudioContext() {
        if (this.isUnlocked) return true;
        
        this.retryCount++;
        console.log(`Attempting audio context unlock (attempt ${this.retryCount}/${this.maxRetries})`);
        
        try {
            // Create audio context if it doesn't exist
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                await this.createSilentBuffer();
            }
            
            // Multiple unlock strategies
            const unlockStrategies = [
                () => this.audioContext.resume(),
                () => this.playSilentSound().then(() => this.audioContext.resume()),
                () => this.forceAudioContextCreation(),
                () => this.oscillatorUnlockMethod()
            ];
            
            for (const strategy of unlockStrategies) {
                try {
                    await strategy();
                    
                    // Check if unlock was successful
                    if (this.audioContext.state === 'running') {
                        this.isUnlocked = true;
                        console.log('Audio context successfully unlocked!');
                        this.notifyUnlockSuccess();
                        return true;
                    }
                } catch (error) {
                    console.warn('Unlock strategy failed:', error);
                }
            }
            
            // If all strategies failed, wait and try again
            if (!this.isUnlocked) {
                console.warn('All unlock strategies failed, will retry on next interaction');
                return false;
            }
            
        } catch (error) {
            console.error('Critical error during audio unlock:', error);
            return false;
        }
    }
    
    async forceAudioContextCreation() {
        // Force create new audio context
        if (this.audioContext) {
            await this.audioContext.close();
        }
        
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        await this.createSilentBuffer();
        await this.audioContext.resume();
    }
    
    async oscillatorUnlockMethod() {
        // Alternative unlock method using oscillator
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        gainNode.gain.value = 0; // Silent
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 440;
        oscillator.start(0);
        oscillator.stop(this.audioContext.currentTime + 0.01);
        
        await this.audioContext.resume();
    }
    
    async resumeAudioContext() {
        if (!this.audioContext) return false;
        
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('Audio context resumed');
                return true;
            } catch (error) {
                console.warn('Failed to resume audio context:', error);
                return false;
            }
        }
        
        return this.audioContext.state === 'running';
    }
    
    notifyUnlockSuccess() {
        // Dispatch custom event to notify the main application
        window.dispatchEvent(new CustomEvent('audioContextUnlocked', {
            detail: { audioContext: this.audioContext }
        }));
        
        // Update UI to show audio is ready
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = 'Audio Ready';
            statusElement.classList.add('success');
            setTimeout(() => statusElement.classList.remove('success'), 2000);
        }
    }
    
    getAudioContext() {
        return this.audioContext;
    }
    
    isAudioUnlocked() {
        return this.isUnlocked && this.audioContext && this.audioContext.state === 'running';
    }
}

// ===== 2. PERFORMANCE OPTIMIZATIONS =====

// Enhanced RequestAnimationFrame Manager
class OptimizedAnimationManager {
    constructor() {
        this.animationCallbacks = new Map();
        this.isRunning = false;
        this.lastTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.performanceMode = 'balanced'; // 'performance', 'balanced', 'quality'
        this.frameSkipCounter = 0;
        
        this.initializePerformanceDetection();
    }
    
    initializePerformanceDetection() {
        // Detect device capabilities
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        this.deviceCapabilities = {
            highPerformance: navigator.hardwareConcurrency >= 4,
            webGL: !!gl,
            lowLatency: 'scheduling' in window,
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        };
        
        // Adjust performance mode based on capabilities
        if (!this.deviceCapabilities.highPerformance) {
            this.performanceMode = 'performance';
            this.targetFPS = 30;
            this.frameInterval = 1000 / this.targetFPS;
        }
        
        console.log('Device capabilities detected:', this.deviceCapabilities);
        console.log('Performance mode set to:', this.performanceMode);
    }
    
    register(id, callback, priority = 'normal') {
        this.animationCallbacks.set(id, {
            callback,
            priority,
            lastUpdate: 0,
            updateInterval: this.getUpdateInterval(priority),
            enabled: true
        });
        
        if (!this.isRunning) {
            this.start();
        }
    }
    
    unregister(id) {
        this.animationCallbacks.delete(id);
        
        if (this.animationCallbacks.size === 0) {
            this.stop();
        }
    }
    
    getUpdateInterval(priority) {
        const intervals = {
            critical: 16,    // ~60fps
            high: 33,        // ~30fps
            normal: 66,      // ~15fps
            low: 133         // ~7.5fps
        };
        
        if (this.performanceMode === 'performance') {
            // Double intervals in performance mode
            Object.keys(intervals).forEach(key => {
                intervals[key] *= 2;
            });
        }
        
        return intervals[priority] || intervals.normal;
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.animate(0);
    }
    
    stop() {
        this.isRunning = false;
    }
    
    animate(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        
        // Frame skipping for performance
        if (deltaTime < this.frameInterval) {
            requestAnimationFrame(this.animate.bind(this));
            return;
        }
        
        // Additional frame skipping in performance mode
        if (this.performanceMode === 'performance') {
            this.frameSkipCounter++;
            if (this.frameSkipCounter % 2 === 0) {
                requestAnimationFrame(this.animate.bind(this));
                return;
            }
        }
        
        this.lastTime = currentTime;
        
        // Execute callbacks based on priority and timing
        for (const [id, callbackData] of this.animationCallbacks) {
            if (!callbackData.enabled) continue;
            
            const timeSinceLastUpdate = currentTime - callbackData.lastUpdate;
            
            if (timeSinceLastUpdate >= callbackData.updateInterval) {
                try {
                    callbackData.callback(currentTime, deltaTime);
                    callbackData.lastUpdate = currentTime;
                } catch (error) {
                    console.warn(`Animation callback error for ${id}:`, error);
                }
            }
        }
        
        requestAnimationFrame(this.animate.bind(this));
    }
    
    setPerformanceMode(mode) {
        this.performanceMode = mode;
        
        // Update all callback intervals
        for (const [id, callbackData] of this.animationCallbacks) {
            callbackData.updateInterval = this.getUpdateInterval(callbackData.priority);
        }
        
        console.log('Performance mode changed to:', mode);
    }
    
    enableCallback(id, enabled = true) {
        const callbackData = this.animationCallbacks.get(id);
        if (callbackData) {
            callbackData.enabled = enabled;
        }
    }
}

// Web Worker for Non-Audio Intensive Calculations
class ComputationWorker {
    constructor() {
        this.worker = null;
        this.taskQueue = [];
        this.pendingTasks = new Map();
        this.taskId = 0;
        
        this.initializeWorker();
    }
    
    initializeWorker() {
        // Create worker from inline script to avoid external file dependency
        const workerScript = `
            self.onmessage = function(e) {
                const { taskId, type, data } = e.data;
                
                try {
                    let result;
                    
                    switch(type) {
                        case 'spectrumAnalysis':
                            result = performSpectrumAnalysis(data);
                            break;
                        case 'waveformCalculation':
                            result = calculateWaveformData(data);
                            break;
                        case 'presetProcessing':
                            result = processPresetData(data);
                            break;
                        case 'particleCalculations':
                            result = calculateParticlePhysics(data);
                            break;
                        default:
                            throw new Error('Unknown task type: ' + type);
                    }
                    
                    self.postMessage({ taskId, success: true, result });
                } catch (error) {
                    self.postMessage({ taskId, success: false, error: error.message });
                }
            };
            
            function performSpectrumAnalysis(data) {
                const { frequencyData, sampleRate } = data;
                const bins = frequencyData.length;
                const analysis = {
                    peak: 0,
                    average: 0,
                    spectralCentroid: 0,
                    spectralSpread: 0
                };
                
                let sum = 0;
                let weightedSum = 0;
                let totalPower = 0;
                
                for (let i = 0; i < bins; i++) {
                    const magnitude = frequencyData[i];
                    const frequency = (i * sampleRate) / (2 * bins);
                    
                    if (magnitude > analysis.peak) {
                        analysis.peak = magnitude;
                    }
                    
                    sum += magnitude;
                    weightedSum += magnitude * frequency;
                    totalPower += magnitude * magnitude;
                }
                
                analysis.average = sum / bins;
                analysis.spectralCentroid = totalPower > 0 ? weightedSum / sum : 0;
                
                // Calculate spectral spread
                let spreadSum = 0;
                for (let i = 0; i < bins; i++) {
                    const frequency = (i * sampleRate) / (2 * bins);
                    const diff = frequency - analysis.spectralCentroid;
                    spreadSum += frequencyData[i] * diff * diff;
                }
                analysis.spectralSpread = Math.sqrt(spreadSum / sum);
                
                return analysis;
            }
            
            function calculateWaveformData(data) {
                const { audioBuffer, downSampleFactor = 4 } = data;
                const length = Math.floor(audioBuffer.length / downSampleFactor);
                const waveformData = new Float32Array(length);
                
                for (let i = 0; i < length; i++) {
                    const sourceIndex = i * downSampleFactor;
                    let sum = 0;
                    
                    // Average samples for downsampling
                    for (let j = 0; j < downSampleFactor && sourceIndex + j < audioBuffer.length; j++) {
                        sum += Math.abs(audioBuffer[sourceIndex + j]);
                    }
                    
                    waveformData[i] = sum / downSampleFactor;
                }
                
                return { waveformData, length };
            }
            
            function processPresetData(data) {
                const { preset, targetFormat } = data;
                
                // Process and validate preset data
                const processedPreset = {};
                
                for (const [key, value] of Object.entries(preset)) {
                    if (typeof value === 'number') {
                        processedPreset[key] = Math.max(0, Math.min(1, value));
                    } else {
                        processedPreset[key] = value;
                    }
                }
                
                return { processedPreset, timestamp: Date.now() };
            }
            
            function calculateParticlePhysics(data) {
                const { particles, deltaTime, gravity = 0.1 } = data;
                
                return particles.map(particle => ({
                    ...particle,
                    x: particle.x + particle.vx * deltaTime,
                    y: particle.y + particle.vy * deltaTime,
                    vx: particle.vx * 0.99, // Air resistance
                    vy: particle.vy + gravity * deltaTime,
                    life: particle.life - particle.decay * deltaTime,
                    opacity: Math.max(0, particle.life)
                }));
            }
        `;
        
        try {
            const blob = new Blob([workerScript], { type: 'application/javascript' });
            this.worker = new Worker(URL.createObjectURL(blob));
            
            this.worker.onmessage = (e) => {
                const { taskId, success, result, error } = e.data;
                const task = this.pendingTasks.get(taskId);
                
                if (task) {
                    if (success) {
                        task.resolve(result);
                    } else {
                        task.reject(new Error(error));
                    }
                    this.pendingTasks.delete(taskId);
                }
            };
            
            this.worker.onerror = (error) => {
                console.error('Worker error:', error);
            };
            
            console.log('Computation worker initialized successfully');
        } catch (error) {
            console.warn('Failed to initialize web worker:', error);
        }
    }
    
    async executeTask(type, data) {
        if (!this.worker) {
            throw new Error('Worker not available');
        }
        
        const taskId = ++this.taskId;
        
        return new Promise((resolve, reject) => {
            this.pendingTasks.set(taskId, { resolve, reject });
            this.worker.postMessage({ taskId, type, data });
        });
    }
    
    async calculateSpectrum(frequencyData, sampleRate) {
        return this.executeTask('spectrumAnalysis', { frequencyData, sampleRate });
    }
    
    async processWaveform(audioBuffer, downSampleFactor = 4) {
        return this.executeTask('waveformCalculation', { audioBuffer, downSampleFactor });
    }
    
    async processPreset(preset, targetFormat) {
        return this.executeTask('presetProcessing', { preset, targetFormat });
    }
    
    async updateParticles(particles, deltaTime, gravity) {
        return this.executeTask('particleCalculations', { particles, deltaTime, gravity });
    }
    
    destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.pendingTasks.clear();
    }
}

// Selective Visual Updates Manager
class SelectiveUpdateManager {
    constructor() {
        this.updateQueue = new Map();
        this.lastValues = new Map();
        this.updateThresholds = new Map();
        this.dirtyElements = new Set();
        this.batchUpdateTimer = null;
        this.batchDelay = 16; // ~60fps
    }
    
    registerElement(elementId, threshold = 0.01, updateFunction = null) {
        this.updateThresholds.set(elementId, threshold);
        this.lastValues.set(elementId, null);
        
        if (updateFunction) {
            this.updateQueue.set(elementId, updateFunction);
        }
    }
    
    shouldUpdate(elementId, newValue) {
        const lastValue = this.lastValues.get(elementId);
        const threshold = this.updateThresholds.get(elementId) || 0.01;
        
        if (lastValue === null) return true;
        
        if (typeof newValue === 'number' && typeof lastValue === 'number') {
            return Math.abs(newValue - lastValue) > threshold;
        }
        
        return newValue !== lastValue;
    }
    
    queueUpdate(elementId, newValue, customUpdateFn = null) {
        if (this.shouldUpdate(elementId, newValue)) {
            this.lastValues.set(elementId, newValue);
            this.dirtyElements.add(elementId);
            
            if (customUpdateFn) {
                this.updateQueue.set(elementId, customUpdateFn);
            }
            
            this.scheduleBatchUpdate();
        }
    }
    
    scheduleBatchUpdate() {
        if (this.batchUpdateTimer) return;
        
        this.batchUpdateTimer = setTimeout(() => {
            this.processBatchUpdate();
            this.batchUpdateTimer = null;
        }, this.batchDelay);
    }
    
    processBatchUpdate() {
        for (const elementId of this.dirtyElements) {
            const updateFn = this.updateQueue.get(elementId);
            const value = this.lastValues.get(elementId);
            
            try {
                if (updateFn) {
                    updateFn(elementId, value);
                } else {
                    this.defaultUpdate(elementId, value);
                }
            } catch (error) {
                console.warn(`Update error for ${elementId}:`, error);
            }
        }
        
        this.dirtyElements.clear();
    }
    
    defaultUpdate(elementId, value) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        if (element.tagName === 'INPUT' && element.type === 'range') {
            element.value = value;
        } else if (element.tagName === 'CANVAS') {
            // Skip canvas updates in default handler
            return;
        } else {
            element.textContent = value;
        }
    }
    
    forceUpdate(elementId) {
        const element = document.getElementById(elementId);
        const updateFn = this.updateQueue.get(elementId);
        const value = this.lastValues.get(elementId);
        
        if (element && updateFn && value !== null) {
            updateFn(elementId, value);
        }
    }
    
    setUpdateThreshold(elementId, threshold) {
        this.updateThresholds.set(elementId, threshold);
    }
}

// Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 0,
            frameTime: 0,
            audioLatency: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            grainCount: 0,
            audioBufferSize: 0
        };
        
        this.history = {
            fps: [],
            frameTime: [],
            memoryUsage: []
        };
        
        this.historySize = 60; // Keep 60 samples
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.isMonitoring = false;
        
        this.initializeMonitoring();
    }
    
    initializeMonitoring() {
        // FPS and frame time monitoring
        this.startFPSMonitoring();
        
        // Memory monitoring (if available)
        if ('memory' in performance) {
            this.startMemoryMonitoring();
        }
        
        // Audio-specific monitoring
        this.startAudioMonitoring();
        
        console.log('Performance monitoring initialized');
    }
    
    startFPSMonitoring() {
        const measureFrame = (currentTime) => {
            if (!this.isMonitoring) return;
            
            const deltaTime = currentTime - this.lastFrameTime;
            this.metrics.frameTime = deltaTime;
            this.metrics.fps = 1000 / deltaTime;
            
            this.updateHistory('fps', this.metrics.fps);
            this.updateHistory('frameTime', this.metrics.frameTime);
            
            this.lastFrameTime = currentTime;
            this.frameCount++;
            
            requestAnimationFrame(measureFrame);
        };
        
        this.isMonitoring = true;
        requestAnimationFrame(measureFrame);
    }
    
    startMemoryMonitoring() {
        setInterval(() => {
            if (!this.isMonitoring) return;
            
            const memory = performance.memory;
            this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
            
            this.updateHistory('memoryUsage', this.metrics.memoryUsage);
            
            // Warn if memory usage is high
            if (this.metrics.memoryUsage > 0.8) {
                console.warn('High memory usage detected:', (this.metrics.memoryUsage * 100).toFixed(1) + '%');
            }
        }, 1000);
    }
    
    startAudioMonitoring() {
        setInterval(() => {
            if (!this.isMonitoring) return;
            
            // Monitor audio context state
            if (window.granularSampler && window.granularSampler.audioContext) {
                const ctx = window.granularSampler.audioContext;
                this.metrics.audioLatency = ctx.outputLatency || ctx.baseLatency || 0;
                this.metrics.audioBufferSize = ctx.sampleRate || 0;
            }
            
            // Monitor active grain count
            if (window.granularSampler) {
                this.metrics.grainCount = window.granularSampler.activeGrains || 0;
            }
        }, 100);
    }
    
    updateHistory(metric, value) {
        if (!this.history[metric]) {
            this.history[metric] = [];
        }
        
        this.history[metric].push(value);
        
        if (this.history[metric].length > this.historySize) {
            this.history[metric].shift();
        }
    }
    
    getAverageFPS() {
        const fpsHistory = this.history.fps;
        if (fpsHistory.length === 0) return 0;
        
        const sum = fpsHistory.reduce((a, b) => a + b, 0);
        return sum / fpsHistory.length;
    }
    
    getPerformanceGrade() {
        const avgFPS = this.getAverageFPS();
        const memUsage = this.metrics.memoryUsage;
        
        if (avgFPS >= 55 && memUsage < 0.6) return 'excellent';
        if (avgFPS >= 45 && memUsage < 0.75) return 'good';
        if (avgFPS >= 30 && memUsage < 0.85) return 'fair';
        return 'poor';
    }
    
    suggestOptimizations() {
        const suggestions = [];
        const avgFPS = this.getAverageFPS();
        
        if (avgFPS < 30) {
            suggestions.push('Consider reducing grain density');
            suggestions.push('Switch to performance mode');
            suggestions.push('Disable some visual effects');
        }
        
        if (this.metrics.memoryUsage > 0.8) {
            suggestions.push('Clear audio buffers');
            suggestions.push('Reduce reverb buffer size');
            suggestions.push('Limit particle count');
        }
        
        if (this.metrics.grainCount > 50) {
            suggestions.push('Reduce maximum grain count');
            suggestions.push('Increase grain size to reduce density');
        }
        
        return suggestions;
    }
    
    logPerformanceReport() {
        console.group('📊 Performance Report');
        console.log('Average FPS:', this.getAverageFPS().toFixed(1));
        console.log('Frame Time:', this.metrics.frameTime.toFixed(2) + 'ms');
        console.log('Memory Usage:', (this.metrics.memoryUsage * 100).toFixed(1) + '%');
        console.log('Audio Latency:', (this.metrics.audioLatency * 1000).toFixed(1) + 'ms');
        console.log('Active Grains:', this.metrics.grainCount);
        console.log('Performance Grade:', this.getPerformanceGrade());
        
        const suggestions = this.suggestOptimizations();
        if (suggestions.length > 0) {
            console.log('Optimization Suggestions:', suggestions);
        }
        console.groupEnd();
    }
    
    stop() {
        this.isMonitoring = false;
    }
}

// ===== 3. INTEGRATION CODE FOR GRAINS =====

// Initialize all systems
function initializeMobileAndPerformanceOptimizations() {
    // Create global instances
    window.mobileAudioManager = new MobileAudioManager();
    window.optimizedAnimationManager = new OptimizedAnimationManager();
    window.computationWorker = new ComputationWorker();
    window.selectiveUpdateManager = new SelectiveUpdateManager();
    window.performanceMonitor = new PerformanceMonitor();
    
    // Integrate with existing GRAINS system
    integrateWithGrains();
    
    console.log('🎵 Mobile audio fixes and performance optimizations initialized!');
}

function integrateWithGrains() {
    // Wait for audio context unlock
    window.addEventListener('audioContextUnlocked', (event) => {
        if (window.granularSampler) {
            window.granularSampler.audioContext = event.detail.audioContext;
            console.log('GRAINS audio context updated with unlocked context');
        }
    });
    
    // Replace existing animation with optimized version
    if (window.granularSampler) {
        const originalAnimateGrains = window.granularSampler.animateGrains;
        
        window.granularSampler.animateGrains = function() {
            window.optimizedAnimationManager.register('grainAnimation', () => {
                if (originalAnimateGrains) {
                    originalAnimateGrains.call(this);
                }
            }, 'high');
        };
    }
    
    // Register UI elements for selective updates
    const uiElements = [
        'masterVolume', 'grainSize', 'grainDensity', 'windowScan', 
        'timeStretch', 'filterFreq', 'filterRes', 'lfoSpeed', 'lfoDepth'
    ];
    
    uiElements.forEach(elementId => {
        window.selectiveUpdateManager.registerElement(elementId, 0.01);
    });
    
    // Performance monitoring integration
    setInterval(() => {
        if (window.performanceMonitor.getAverageFPS() < 20) {
            console.warn('Low FPS detected - switching to performance mode');
            window.optimizedAnimationManager.setPerformanceMode('performance');
        }
    }, 5000);
}

// Enhanced error handling
window.addEventListener('error', (event) => {
    console.error('Enhanced error handler:', event.error);
    
    // Try to recover audio context if needed
    if (event.error.name === 'InvalidStateError' && window.mobileAudioManager) {
        window.mobileAudioManager.unlockAudioContext();
    }
});

// Performance report hotkey (Ctrl+Shift+P)
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        if (window.performanceMonitor) {
            window.performanceMonitor.logPerformanceReport();
        }
    }
});

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMobileAndPerformanceOptimizations);
} else {
    initializeMobileAndPerformanceOptimizations();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.computationWorker) {
        window.computationWorker.destroy();
    }
    if (window.optimizedAnimationManager) {
        window.optimizedAnimationManager.stop();
    }
    if (window.performanceMonitor) {
        window.performanceMonitor.stop();
    }
});

console.log('🚀 Mobile Audio & Performance Optimization System Ready!');