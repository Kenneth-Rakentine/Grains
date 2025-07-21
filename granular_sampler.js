class GranularSampler {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.grains = [];
        this.isPlaying = false;
        this.playheadPosition = 0;
        this.loopPosition = 0;
        this.looperEnabled = false;
        this.scanPosition = 0;
        this.currentPitch = 1.0;
        this.activePitchKeys = new Set();
        
        // Granular parameters
        this.grainSize = 50; // ms
        this.density = 4;
        this.windowScan = 0; // percentage
        
        // Filter
        this.filterNode = null;
        this.filterFreq = 1000;
        this.filterQ = 1;
        this.envAmount = 0;
        
        // Volume
        this.masterGainNode = null;
        this.volume = 0.7; // Default to 70%
        
        // Delay effect
        this.delayNode = null;
        this.feedbackNode = null;
        this.delayTime = 0.2; // 200ms
        this.delayFeedback = 0.3; // 30%
        this.delayMix = 0; // 0% wet signal initially
        
        // Envelope
        this.envelopeTime = 0; // 0 = shortest, 100 = longest
        
        this.initAudio();
        this.setupEventListeners();
        this.setupKeyboardControls();
        this.setupMobileKeyboard();
        this.drawFilterEnvelope();
    }
    
    async initAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create delay effect
        this.delayNode = this.audioContext.createDelay(1.0); // Max 1 second delay
        this.delayNode.delayTime.value = this.delayTime;
        
        this.feedbackNode = this.audioContext.createGain();
        this.feedbackNode.gain.value = this.delayFeedback;
        
        this.delayWetNode = this.audioContext.createGain();
        this.delayWetNode.gain.value = this.delayMix;
        
        this.delayDryNode = this.audioContext.createGain();
        this.delayDryNode.gain.value = 1 - this.delayMix;
        
        // Create master volume control
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.gain.value = this.volume;
        this.masterGainNode.connect(this.audioContext.destination);
        
        // Create filter
        this.filterNode = this.audioContext.createBiquadFilter();
        this.filterNode.type = 'bandpass';
        this.filterNode.frequency.value = this.filterFreq;
        this.filterNode.Q.value = this.filterQ;
        
        // Connect delay chain: filter -> dry/wet -> delay -> feedback -> master
        this.filterNode.connect(this.delayDryNode);
        this.filterNode.connect(this.delayNode);
        this.delayNode.connect(this.delayWetNode);
        this.delayNode.connect(this.feedbackNode);
        this.feedbackNode.connect(this.delayNode);
        
        this.delayDryNode.connect(this.masterGainNode);
        this.delayWetNode.connect(this.masterGainNode);
    }
    
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            console.log('Resuming audio context...');
            await this.audioContext.resume();
            console.log('Audio context state:', this.audioContext.state);
        }
    }
    
    setupEventListeners() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        
        // Drag and drop
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) this.loadAudioFile(files[0]);
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) this.loadAudioFile(e.target.files[0]);
        });
        
        // Controls
        this.setupSliderControls();
        
        document.getElementById('looperToggle').addEventListener('click', () => {
            this.looperEnabled = !this.looperEnabled;
            document.getElementById('looperToggle').textContent = 
                `Looper: ${this.looperEnabled ? 'ON' : 'OFF'}`;
        });
    }
    
    setupSliderControls() {
        const sliders = {
            grainSize: (val) => { this.grainSize = parseInt(val); document.getElementById('grainSizeValue').textContent = val + 'ms'; },
            density: (val) => { this.density = parseInt(val); document.getElementById('densityValue').textContent = val; },
            windowScan: (val) => { this.windowScan = parseInt(val); document.getElementById('windowScanValue').textContent = val + '%'; },
            filterFreq: (val) => { 
                this.filterFreq = parseInt(val); 
                this.filterNode.frequency.value = this.filterFreq;
                document.getElementById('filterFreqValue').textContent = val + 'Hz';
            },
            filterQ: (val) => { 
                this.filterQ = parseFloat(val); 
                this.filterNode.Q.value = this.filterQ;
                document.getElementById('filterQValue').textContent = val;
            },
            envAmount: (val) => { 
                this.envAmount = parseInt(val); 
                document.getElementById('envAmountValue').textContent = val + '%';
                this.drawFilterEnvelope();
            },
            volume: (val) => { 
                this.volume = parseFloat(val); 
                this.masterGainNode.gain.value = this.volume;
                document.getElementById('volumeValue').textContent = Math.round(val * 100) + '%';
            },
            delayTime: (val) => { 
                this.delayTime = parseFloat(val); 
                this.delayNode.delayTime.value = this.delayTime;
                document.getElementById('delayTimeValue').textContent = Math.round(val * 1000) + 'ms';
            },
            delayFeedback: (val) => { 
                this.delayFeedback = parseFloat(val); 
                this.feedbackNode.gain.value = this.delayFeedback;
                document.getElementById('delayFeedbackValue').textContent = Math.round(val * 100) + '%';
            },
            delayMix: (val) => { 
                this.delayMix = parseFloat(val); 
                this.delayWetNode.gain.value = this.delayMix;
                this.delayDryNode.gain.value = 1 - this.delayMix;
                document.getElementById('delayMixValue').textContent = Math.round(val * 100) + '%';
            },
            envelopeTime: (val) => { 
                this.envelopeTime = parseInt(val); 
                document.getElementById('envelopeTimeValue').textContent = val + '%';
            }
        };
        
        Object.keys(sliders).forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                sliders[id](e.target.value);
            });
        });
    }
    
    setupKeyboardControls() {
        // Chromatic pitch mapping
        const chromaticKeys = {
            'q': -12, 'w': -11, 'e': -10, 'r': -9, 't': -8, 'y': -7, 'u': -6, 'i': -5, 'o': -4, 'p': -3,
            'a': -2, 's': -1, 'd': 0, 'f': 1, 'g': 2, 'h': 3, 'j': 4, 'k': 5, 'l': 6,
            'z': 7, 'x': 8, 'c': 9, 'v': 10, 'b': 11, 'n': 12, 'm': 13
        };
        
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            
            // Resume audio context on first interaction (iOS requirement)
            this.resumeAudioContext();
            
            // Spacebar - play/stop
            if (key === ' ') {
                e.preventDefault();
                this.togglePlayback();
                return;
            }
            
            // Number keys - scan position
            if (key >= '0' && key <= '9') {
                const position = key === '0' ? 0 : parseInt(key) / 9;
                this.setScanPosition(position);
                return;
            }
            
            // Chromatic keys - pitch
            if (chromaticKeys.hasOwnProperty(key)) {
                const semitones = chromaticKeys[key];
                this.activePitchKeys.add(key);
                this.updateCurrentPitch();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            const chromaticKeys = {
                'q': true, 'w': true, 'e': true, 'r': true, 't': true, 'y': true, 'u': true, 'i': true, 'o': true, 'p': true,
                'a': true, 's': true, 'd': true, 'f': true, 'g': true, 'h': true, 'j': true, 'k': true, 'l': true,
                'z': true, 'x': true, 'c': true, 'v': true, 'b': true, 'n': true, 'm': true
            };
            
            if (chromaticKeys[key]) {
                this.activePitchKeys.delete(key);
                this.updateCurrentPitch();
            }
        });
    }
    
    setupMobileKeyboard() {
        const chromaticKeys = {
            'q': -12, 'w': -11, 'e': -10, 'r': -9, 't': -8, 'y': -7, 'u': -6, 'i': -5, 'o': -4, 'p': -3,
            'a': -2, 's': -1, 'd': 0, 'f': 1, 'g': 2, 'h': 3, 'j': 4, 'k': 5, 'l': 6,
            'z': 7, 'x': 8, 'c': 9, 'v': 10, 'b': 11, 'n': 12, 'm': 13
        };
        
        const keyButtons = document.querySelectorAll('.key-btn');
        
        keyButtons.forEach(btn => {
            const key = btn.dataset.key;
            
            // Touch events for mobile
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleKeyDown(key);
                btn.classList.add('active');
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleKeyUp(key);
                btn.classList.remove('active');
            });
            
            // Mouse events for desktop
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleKeyDown(key);
                btn.classList.add('active');
            });
            
            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.handleKeyUp(key);
                btn.classList.remove('active');
            });
            
            btn.addEventListener('mouseleave', (e) => {
                this.handleKeyUp(key);
                btn.classList.remove('active');
            });
        });
    }
    
    handleKeyDown(key) {
        // Spacebar - play/stop
        if (key === ' ') {
            this.togglePlayback();
            return;
        }
        
        // Number keys - scan position
        if (key >= '0' && key <= '9') {
            const position = key === '0' ? 0 : parseInt(key) / 9;
            this.setScanPosition(position);
            return;
        }
        
        // Chromatic keys - pitch
        const chromaticKeys = {
            'q': -12, 'w': -11, 'e': -10, 'r': -9, 't': -8, 'y': -7, 'u': -6, 'i': -5, 'o': -4, 'p': -3,
            'a': -2, 's': -1, 'd': 0, 'f': 1, 'g': 2, 'h': 3, 'j': 4, 'k': 5, 'l': 6,
            'z': 7, 'x': 8, 'c': 9, 'v': 10, 'b': 11, 'n': 12, 'm': 13
        };
        
        if (chromaticKeys.hasOwnProperty(key)) {
            this.activePitchKeys.add(key);
            this.updateCurrentPitch();
        }
    }
    
    handleKeyUp(key) {
        const chromaticKeys = {
            'q': true, 'w': true, 'e': true, 'r': true, 't': true, 'y': true, 'u': true, 'i': true, 'o': true, 'p': true,
            'a': true, 's': true, 'd': true, 'f': true, 'g': true, 'h': true, 'j': true, 'k': true, 'l': true,
            'z': true, 'x': true, 'c': true, 'v': true, 'b': true, 'n': true, 'm': true
        };
        
        if (chromaticKeys[key]) {
            this.activePitchKeys.delete(key);
            this.updateCurrentPitch();
        }
    }
    
    updateCurrentPitch() {
        if (this.activePitchKeys.size === 0) {
            this.currentPitch = 1.0;
            return;
        }
        
        const chromaticKeys = {
            'q': -12, 'w': -11, 'e': -10, 'r': -9, 't': -8, 'y': -7, 'u': -6, 'i': -5, 'o': -4, 'p': -3,
            'a': -2, 's': -1, 'd': 0, 'f': 1, 'g': 2, 'h': 3, 'j': 4, 'k': 5, 'l': 6,
            'z': 7, 'x': 8, 'c': 9, 'v': 10, 'b': 11, 'n': 12, 'm': 13
        };
        
        // Use the highest pitch if multiple keys are pressed
        let highestSemitone = -999;
        for (const key of this.activePitchKeys) {
            if (chromaticKeys[key] > highestSemitone) {
                highestSemitone = chromaticKeys[key];
            }
        }
        
        this.currentPitch = Math.pow(2, highestSemitone / 12);
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               ('ontouchstart' in window);
    }
    
    async loadAudioFile(file) {
        document.getElementById('status').textContent = 'Loading audio file...';
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            document.getElementById('status').textContent = 
                `Loaded: ${file.name} (${this.audioBuffer.duration.toFixed(2)}s)`;
            
            this.drawWaveform();
            document.getElementById('waveformContainer').style.display = 'block';
            document.getElementById('controls').style.display = 'grid';
            document.getElementById('mobileKeyboard').style.display = 'block';
            
        } catch (error) {
            document.getElementById('status').textContent = 'Error loading audio file: ' + error.message;
        }
    }
    
    drawWaveform() {
        const canvas = document.getElementById('waveform');
        const ctx = canvas.getContext('2d');
        
        if (!this.audioBuffer || !canvas) {
            console.log('No audio buffer or canvas found');
            return;
        }
        
        // Get the actual displayed size
        const rect = canvas.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;
        
        // Set canvas resolution to match display size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        
        // Clear the canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        // Get audio data
        const data = this.audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / displayWidth);
        
        console.log('Drawing waveform:', {
            bufferLength: data.length,
            canvasWidth: displayWidth,
            canvasHeight: displayHeight,
            step: step
        });
        
        // Draw waveform
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        for (let i = 0; i < displayWidth; i++) {
            let min = 1.0;
            let max = -1.0;
            
            // Sample multiple points for better visualization
            for (let j = 0; j < step && (i * step + j) < data.length; j++) {
                const sample = data[i * step + j] || 0;
                if (sample < min) min = sample;
                if (sample > max) max = sample;
            }
            
            // Convert to canvas coordinates
            const y1 = ((min + 1) * displayHeight) / 2;
            const y2 = ((max + 1) * displayHeight) / 2;
            
            // Draw line for this column
            if (i === 0) {
                ctx.moveTo(i, y1);
            }
            ctx.moveTo(i, y1);
            ctx.lineTo(i, y2);
        }
        
        ctx.stroke();
        console.log('Waveform drawn successfully');
    }
    
    setScanPosition(position) {
        if (!this.audioBuffer) return;
        
        this.scanPosition = position;
        this.loopPosition = position * this.audioBuffer.duration;
        
        // Update playhead visual
        const playhead = document.getElementById('playhead');
        playhead.style.left = (position * 100) + '%';
        
        document.getElementById('loopPos').textContent = this.loopPosition.toFixed(2) + 's';
    }
    
    async togglePlayback() {
        if (!this.audioBuffer) return;
        
        // Resume audio context on first interaction (iOS requirement)
        await this.resumeAudioContext();
        
        if (this.isPlaying) {
            this.stopPlayback();
        } else {
            await this.startPlayback();
        }
    }
    
    async startPlayback() {
        if (!this.audioBuffer || this.isPlaying) return;
        
        // Make sure audio context is running
        await this.resumeAudioContext();
        
        console.log('Starting playback, audio context state:', this.audioContext.state);
        
        this.isPlaying = true;
        document.getElementById('playingStatus').textContent = 'Playing';
        
        // Start grain generation
        this.scheduleGrains();
    }
    
    stopPlayback() {
        this.isPlaying = false;
        document.getElementById('playingStatus').textContent = 'Stopped';
        
        // Stop all grains
        this.grains.forEach(grain => {
            if (grain.source) {
                grain.source.stop();
            }
        });
        this.grains = [];
        document.getElementById('activeGrains').textContent = '0';
    }
    
    scheduleGrains() {
        if (!this.isPlaying) return;
        
        // Generate grains based on density
        for (let i = 0; i < this.density; i++) {
            const delay = (i / this.density) * (this.grainSize / 1000);
            setTimeout(() => {
                if (this.isPlaying) this.createGrain();
            }, delay * 1000);
        }
        
        // Schedule next batch
        setTimeout(() => {
            if (this.isPlaying) this.scheduleGrains();
        }, this.grainSize);
    }
    
    createGrain() {
        if (!this.audioBuffer) return;
        
        console.log('Creating grain, audio context state:', this.audioContext.state);
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.audioBuffer;
        source.playbackRate.value = this.currentPitch;
        
        // Apply window scan randomization
        const scanRange = (this.windowScan / 100) * this.audioBuffer.duration;
        const randomOffset = (Math.random() - 0.5) * scanRange;
        let startTime = this.looperEnabled ? this.loopPosition : this.playheadPosition;
        startTime += randomOffset;
        startTime = Math.max(0, Math.min(startTime, this.audioBuffer.duration - (this.grainSize / 1000)));
        
        // Grain envelope (variable attack/decay based on envelope setting)
        const grainDuration = this.grainSize / 1000;
        const now = this.audioContext.currentTime;
        
        // Calculate envelope times: 0% = 1ms attack/decay, 100% = 50% of grain duration
        const minEnvTime = 0.001; // 1ms minimum
        const maxEnvTime = grainDuration * 0.5; // 50% of grain duration maximum
        const envTime = minEnvTime + (this.envelopeTime / 100) * (maxEnvTime - minEnvTime);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + envTime); // Attack
        gainNode.gain.setValueAtTime(0.3, now + grainDuration - envTime); // Sustain
        gainNode.gain.linearRampToValueAtTime(0, now + grainDuration); // Decay
        
        // Connect: source -> gain -> filter -> delay chain
        source.connect(gainNode);
        gainNode.connect(this.filterNode);
        
        try {
            source.start(now, startTime, grainDuration);
            source.stop(now + grainDuration);
            console.log('Grain started successfully');
        } catch (error) {
            console.error('Error starting grain:', error);
        }
        
        // Track grain
        const grain = { source, startTime: now, duration: grainDuration };
        this.grains.push(grain);
        
        // Clean up finished grains
        source.onended = () => {
            const index = this.grains.indexOf(grain);
            if (index > -1) this.grains.splice(index, 1);
        };
        
        // Update display
        document.getElementById('activeGrains').textContent = this.grains.length;
        
        // Update playhead position if not looping
        if (!this.looperEnabled) {
            this.playheadPosition += grainDuration / 4; // Advance slowly
            if (this.playheadPosition >= this.audioBuffer.duration) {
                this.playheadPosition = 0;
            }
            document.getElementById('currentPos').textContent = this.playheadPosition.toFixed(2) + 's';
        }
    }
    
    drawFilterEnvelope() {
        const canvas = document.getElementById('filterEnvelope');
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Simple ADSR-like envelope visualization
        const envHeight = (this.envAmount / 100) * canvas.height;
        
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(canvas.width * 0.1, canvas.height - envHeight);
        ctx.lineTo(canvas.width * 0.3, canvas.height - envHeight * 0.7);
        ctx.lineTo(canvas.width * 0.7, canvas.height - envHeight * 0.7);
        ctx.lineTo(canvas.width, canvas.height);
        
        ctx.stroke();
    }
}

// Initialize the sampler when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.granularSampler = new GranularSampler();
});

// Add resize listener for waveform
window.addEventListener('resize', () => {
    if (window.granularSampler && window.granularSampler.audioBuffer) {
        window.granularSampler.drawWaveform();
    }
});