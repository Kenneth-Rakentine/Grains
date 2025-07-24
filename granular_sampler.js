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
        this.independentTimeStretch = 1.0; // New: time stretch independent of pitch
        
        // Micro-stepping for buffer navigation
        this.microStep = 0; // 0-4, five positions between each major step
        this.currentMajorStep = 0; // 0-9
        
        // Filter
        this.filterNode = null;
        this.filterFreq = 1000;
        this.filterQ = 1;
        this.envAmount = 0;

        // LFO for filter modulation
        this.lfoOscillator = null;
        this.lfoGain = null;
        this.lfoShape = 'sine';
        this.lfoSpeed = 0.5;
        this.lfoDepth = 0;
        this.lfoShaper = null;
        
        // Volume
        this.masterGainNode = null;
        this.volume = 0.7;
        
        // Multi-tap delay (upgraded from simple delay)
        this.multiTapDelays = [];
        this.multiTapGains = [];
        this.multiTapFeedbacks = [];
        this.delayTimes = [0.125, 0.25, 0.375, 0.5]; // Different tap times
        this.delayFeedback = 0.3;
        this.delayMix = 0;
        
        // Envelope
        this.envelopeTime = 0;
        
        // Granular Reverb
        this.reverbDelays = [];
        this.reverbGains = [];
        this.reverbFilters = [];
        this.reverbPreDelay = null;
        this.reverbMixer = null;
        this.reverbDryGain = null;
        this.reverbWetGain = null;
        this.reverbSize = 50;
        this.reverbDecay = 30;
        this.reverbPreDelayTime = 0;
        this.reverbMix = 0;

        // Formant filterbank with mix control
        this.formantFilters = [];
        this.formantFreqs = [400, 800, 1200, 2400, 3200];
        this.formantGains = [];
        this.formantMixer = null;
        this.formantDryGain = null; // New: for dry/wet mixing
        this.formantWetGain = null; // New: for formant processing
        this.formantMix = 50; // New: 0-100% wet/dry mix
        
        // Formant Sequencer
        this.sequencer = {
            isRunning: false,
            currentStep: 0,
            steps: [64, 64, 64, 64, 64],
            tempo: 120,
            intervalId: null,
            stepInterval: 0
        };

        // Enhanced Wavefolder
        this.wavefolder = null;
        this.foldAmount = 0;
        
        // Ring modulator / Vocoder
        this.noiseSource = null;
        this.ringModulator = null;
        this.ringModGain = null;
        this.ringModMix = 0;
        this.vocoderEnabled = false;

        // Recording
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingDestination = null;
        this.recordingStream = null;
        
        // 3D Grain Visualization
        this.grainParticles = [];
        this.visualizationCanvas = null;
        this.visualizationContext = null;
        
        // iOS Audio Context Management
        this.audioContextResumed = false;
        this.pendingAudioStart = false;
        
        this.updateSequencerInterval();
        this.initAudio();
        this.setupEventListeners();
        this.setupKeyboardControls();
        this.setupMobileKeyboard();
        this.setupGrainVisualization();
        this.drawFilterEnvelope();
    }
    
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context created, state:', this.audioContext.state);
            
            // Create multi-tap delay system (replacing simple delay)
            this.createMultiTapDelay();
            
            // Create master volume control
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = this.volume;
            this.masterGainNode.connect(this.audioContext.destination);
            
            // Create recording destination
            this.recordingDestination = this.audioContext.createMediaStreamDestination();
            this.masterGainNode.connect(this.recordingDestination);
            this.recordingStream = this.recordingDestination.stream;
            
            // Create filter
            this.filterNode = this.audioContext.createBiquadFilter();
            this.filterNode.type = 'bandpass';
            this.filterNode.frequency.value = this.filterFreq;
            this.filterNode.Q.value = this.filterQ;
            
            // Create LFO for filter modulation
            this.createFilterLFO();

            // Create formant filterbank with dry/wet mixing
            this.createFormantFilterbank();
            
            // Create enhanced wavefolder
            this.createEnhancedWavefolder();
            
            // Create ring modulator
            this.createRingModulator();
            
            // Create granular reverb
            this.createGranularReverb();
            
            // Connect the audio chain
            this.connectAudioChain();
            
            console.log('Audio system initialized successfully');
            
        } catch (error) {
            console.error('Audio initialization failed:', error);
            alert('Audio system failed to initialize. Please refresh and try again.');
        }
    }
    
    createMultiTapDelay() {
        // Create multiple delay lines for richer delay texture
        this.multiTapDelays = [];
        this.multiTapGains = [];
        this.multiTapFeedbacks = [];
        
        this.delayMixer = this.audioContext.createGain();
        this.delayDryGain = this.audioContext.createGain();
        this.delayWetGain = this.audioContext.createGain();
        
        this.delayDryGain.gain.value = 1 - this.delayMix;
        this.delayWetGain.gain.value = this.delayMix;
        
        // Create 4 delay taps with different timing
        const tapTimes = [0.125, 0.25, 0.375, 0.5];
        const tapGains = [0.4, 0.3, 0.2, 0.1];
        
        for (let i = 0; i < tapTimes.length; i++) {
            const delay = this.audioContext.createDelay(2.0);
            const gain = this.audioContext.createGain();
            const feedback = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            delay.delayTime.value = tapTimes[i];
            gain.gain.value = tapGains[i];
            feedback.gain.value = this.delayFeedback * 0.7; // Reduce to prevent buildup
            
            // High-cut filter for each tap (classic delay sound)
            filter.type = 'lowpass';
            filter.frequency.value = 4000 - (i * 800); // Each tap gets duller
            filter.Q.value = 0.7;
            
            // Connect: input -> delay -> filter -> gain -> output
            //                      -> feedback -> delay (loop)
            delay.connect(filter);
            filter.connect(gain);
            filter.connect(feedback);
            feedback.connect(delay);
            gain.connect(this.delayWetGain);
            
            this.multiTapDelays.push(delay);
            this.multiTapGains.push(gain);
            this.multiTapFeedbacks.push(feedback);
        }
    }
    
    createFormantFilterbank() {
        // Create dry/wet mixer for formant processing
        this.formantDryGain = this.audioContext.createGain();
        this.formantWetGain = this.audioContext.createGain();
        this.formantMixer = this.audioContext.createGain();
        
        // Set initial mix (50% wet/dry)
        this.updateFormantMix(this.formantMix);
        
        // Create 5 formant filters
        for (let i = 0; i < 5; i++) {
            const filter = this.audioContext.createBiquadFilter();
            const gain = this.audioContext.createGain();
            
            filter.type = 'bandpass';
            filter.frequency.value = this.formantFreqs[i];
            filter.Q.value = 12; // Very sharp formant peaks for strong effect
            gain.gain.value = 1.0;
            
            this.formantFilters.push(filter);
            this.formantGains.push(gain);
            
            // Connect: input -> filter -> gain -> wet mixer
            filter.connect(gain);
            gain.connect(this.formantWetGain);
        }
        
        // Mix dry and wet signals
        this.formantWetGain.connect(this.formantMixer);
        this.formantDryGain.connect(this.formantMixer);
        this.formantMixer.gain.value = 0.3; // Overall formant level
    }
    
    createEnhancedWavefolder() {
        // Create a more aggressive wavefolder
        this.wavefolder = this.audioContext.createWaveShaper();
        this.wavefolder.curve = this.createEnhancedFoldCurve(this.foldAmount);
        this.wavefolder.oversample = '4x'; // Better quality
        
        // Add post-fold filtering to tame harsh frequencies
        this.foldFilter = this.audioContext.createBiquadFilter();
        this.foldFilter.type = 'lowpass';
        this.foldFilter.frequency.value = 8000;
        this.foldFilter.Q.value = 0.7;
        
        this.wavefolder.connect(this.foldFilter);
    }
    
    createRingModulator() {
        // Create enhanced ring modulator
        this.noiseSource = this.audioContext.createBufferSource();
        this.noiseSource.buffer = this.createNoiseBuffer();
        this.noiseSource.loop = true;
        
        this.ringModulator = this.audioContext.createGain();
        this.ringModGain = this.audioContext.createGain();
        this.ringModGain.gain.value = 0;
        
        // Add filtering to the noise for more interesting modulation
        this.noiseFilter = this.audioContext.createBiquadFilter();
        this.noiseFilter.type = 'bandpass';
        this.noiseFilter.frequency.value = 1000;
        this.noiseFilter.Q.value = 5;
        
        this.noiseSource.connect(this.noiseFilter);
        this.noiseFilter.connect(this.ringModGain);
        this.ringModGain.connect(this.ringModulator.gain);
        this.noiseSource.start();
    }
    
    connectAudioChain() {
        // Main signal path:
        // filter -> formantFilters -> formantMixer -> wavefolder -> ringMod -> multiTapDelay -> reverb -> master
        
        // Connect to both dry and formant processing
        for (let i = 0; i < this.formantFilters.length; i++) {
            this.filterNode.connect(this.formantFilters[i]);
        }
        this.filterNode.connect(this.formantDryGain);
        
        // Formant mixer -> wavefolder -> ring modulator
        this.formantMixer.connect(this.foldFilter);
        this.foldFilter.connect(this.ringModulator);
        
        // Ring modulator -> multi-tap delay
        this.ringModulator.connect(this.delayDryGain);
        for (let i = 0; i < this.multiTapDelays.length; i++) {
            this.ringModulator.connect(this.multiTapDelays[i]);
        }
        
        // Delay mixer -> reverb
        this.delayDryGain.connect(this.reverbDryGain);
        this.delayDryGain.connect(this.reverbPreDelay);
        this.delayWetGain.connect(this.reverbDryGain);
        this.delayWetGain.connect(this.reverbPreDelay);
        
        // Reverb -> master output
        this.reverbDryGain.connect(this.masterGainNode);
        this.reverbWetGain.connect(this.masterGainNode);
    }
    
    setupGrainVisualization() {
        // Create visualization canvas overlay on the waveform
        const waveformContainer = document.getElementById('waveform');
        if (waveformContainer) {
            // Create canvas for grain particles
            this.visualizationCanvas = document.createElement('canvas');
            this.visualizationCanvas.style.position = 'absolute';
            this.visualizationCanvas.style.top = '0';
            this.visualizationCanvas.style.left = '0';
            this.visualizationCanvas.style.width = '100%';
            this.visualizationCanvas.style.height = '100%';
            this.visualizationCanvas.style.pointerEvents = 'none';
            this.visualizationCanvas.style.zIndex = '5';
            
            waveformContainer.parentElement.appendChild(this.visualizationCanvas);
            this.visualizationContext = this.visualizationCanvas.getContext('2d');
            
            // Start visualization loop
            this.animateGrainVisualization();
        }
    }
    
    animateGrainVisualization() {
        if (!this.visualizationCanvas || !this.visualizationContext) return;
        
        const canvas = this.visualizationCanvas;
        const ctx = this.visualizationContext;
        
        // Match waveform canvas size
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw grain particles
        this.grainParticles = this.grainParticles.filter(particle => {
            particle.life -= 0.02;
            particle.y += particle.velocity;
            particle.x += particle.drift;
            particle.opacity = particle.life;
            
            if (particle.life > 0) {
                ctx.save();
                ctx.globalAlpha = particle.opacity * 0.6;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                return true;
            }
            return false;
        });
        
        requestAnimationFrame(() => this.animateGrainVisualization());
    }
    
    addGrainParticle(position, pitch) {
        if (!this.visualizationCanvas) return;
        
        const canvas = this.visualizationCanvas;
        const x = (position * canvas.width) || Math.random() * canvas.width;
        const y = canvas.height * 0.5 + (Math.random() - 0.5) * 100;
        
        // Color based on pitch
        const hue = 120 + (pitch - 1) * 60; // Green to yellow/red for higher pitches
        const color = `hsl(${hue}, 80%, 60%)`;
        
        this.grainParticles.push({
            x: x,
            y: y,
            size: 2 + Math.random() * 3,
            velocity: -0.5 - Math.random() * 2,
            drift: (Math.random() - 0.5) * 2,
            life: 1.0,
            opacity: 1.0,
            color: color
        });
    }
    
    // iOS-specific audio context management
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            console.log('Resuming audio context for iOS...');
            try {
                await this.audioContext.resume();
                this.audioContextResumed = true;
                console.log('Audio context resumed successfully, state:', this.audioContext.state);
                
                // If there was a pending audio start, execute it now
                if (this.pendingAudioStart) {
                    this.pendingAudioStart = false;
                    setTimeout(() => this.startPlayback(), 100);
                }
            } catch (error) {
                console.error('Failed to resume audio context:', error);
            }
        }
    }
    
    // Enhanced mobile-friendly audio loading
    async loadAudioFile(file) {
        document.getElementById('status').textContent = 'Loading audio file...';
        
        try {
            // iOS file size check
            if (file.size > 50 * 1024 * 1024) { // 50MB limit for mobile
                alert('File too large for mobile. Please use a file smaller than 50MB.');
                return;
            }
            
            // Enhanced file type checking for iOS compatibility
            const supportedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'];
            if (!supportedTypes.includes(file.type) && !file.name.match(/\\.(mp3|wav|m4a|aac)$/i)) {
                console.warn('File type may not be supported on iOS:', file.type);
                // Continue anyway, but warn user
                if (this.isMobile()) {
                    alert('This file type may not work on mobile devices. MP3 files work best.');
                }
            }
            
            console.log('Loading file:', file.name, 'Size:', file.size, 'Type:', file.type);
            
            const arrayBuffer = await file.arrayBuffer();
            console.log('File loaded into buffer, decoding...');
            
            // Add timeout for decoding on slower mobile devices
            const decodePromise = this.audioContext.decodeAudioData(arrayBuffer);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Decode timeout')), 30000); // 30 second timeout
            });
            
            this.audioBuffer = await Promise.race([decodePromise, timeoutPromise]);
            
            console.log('Audio decoded successfully:', {
                duration: this.audioBuffer.duration,
                sampleRate: this.audioBuffer.sampleRate,
                channels: this.audioBuffer.numberOfChannels
            });
            
            document.getElementById('status').textContent = 
                `Loaded: ${file.name} (${this.audioBuffer.duration.toFixed(2)}s)`;
            
            // Show containers
            document.getElementById('waveformContainer').style.display = 'block';
            document.getElementById('controls').style.display = 'grid';
            document.getElementById('mobileKeyboard').style.display = 'block';
            
            // Draw waveform with retry logic
            setTimeout(() => this.drawWaveform(), 50);
            setTimeout(() => {
                if (this.needsWaveformRedraw()) {
                    console.log('Retrying waveform draw...');
                    this.drawWaveform();
                }
            }, 500);
            
        } catch (error) {
            console.error('Audio loading/decoding failed:', error);
            document.getElementById('status').textContent = 
                `Error loading audio: ${error.message}. Try a different file format (MP3 recommended).`;
        }
    }
    
    needsWaveformRedraw() {
        const canvas = document.getElementById('waveform');
        if (!canvas) return false;
        
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Check if canvas is mostly black (failed draw)
        let nonBlackPixels = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            if (r > 10 || g > 10 || b > 10) nonBlackPixels++;
        }
        
        return nonBlackPixels < 100; // If less than 100 non-black pixels, redraw
    }
    
    // Enhanced playback with iOS fixes
    async togglePlayback() {
        if (!this.audioBuffer) return;
        
        // Always try to resume audio context on any user interaction
        await this.resumeAudioContext();
        
        if (this.isPlaying) {
            this.stopPlayback();
        } else {
            await this.startPlayback();
        }
    }
    
    async startPlayback() {
        if (!this.audioBuffer) return;
        
        // Check if audio context is ready
        if (this.audioContext.state === 'suspended') {
            console.log('Audio context suspended, attempting resume...');
            this.pendingAudioStart = true;
            await this.resumeAudioContext();
            return; // resumeAudioContext will retry if successful
        }
        
        if (this.isPlaying) return;
        
        console.log('Starting playback, audio context state:', this.audioContext.state);
        
        this.isPlaying = true;
        document.getElementById('playingStatus').textContent = 'Playing';
        
        // Start grain generation
        this.scheduleGrains();
    }
    
    // Enhanced grain creation with time stretching and visualization
    createGrain() {
        if (!this.audioBuffer || this.audioContext.state !== 'running') {
            console.log('Cannot create grain: no buffer or audio context not running');
            return;
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.audioBuffer;
        
        // Independent time stretching and pitch control
        const pitchShift = this.currentPitch;
        const timeStretch = this.independentTimeStretch;
        source.playbackRate.value = pitchShift * timeStretch;
        
        // Calculate grain position with micro-stepping
        const totalSteps = 90; // 9 major steps * 10 micro-steps
        const currentStep = (this.currentMajorStep * 10) + this.microStep;
        const basePosition = (currentStep / totalSteps) * this.audioBuffer.duration;
        
        // Apply window scan randomization
        const scanRange = (this.windowScan / 100) * this.audioBuffer.duration;
        const randomOffset = (Math.random() - 0.5) * scanRange;
        let startTime = this.looperEnabled ? this.loopPosition : basePosition;
        startTime += randomOffset;
        startTime = Math.max(0, Math.min(startTime, this.audioBuffer.duration - (this.grainSize / 1000)));
        
        // Enhanced grain envelope
        const grainDuration = (this.grainSize / 1000) / timeStretch;
        const now = this.audioContext.currentTime;
        
        const minEnvTime = 0.001;
        const maxEnvTime = grainDuration * 0.5;
        const envTime = minEnvTime + (this.envelopeTime / 100) * (maxEnvTime - minEnvTime);
        
        // More dynamic gain scaling
        const baseGain = 0.4 / Math.sqrt(this.density); // Scale with density
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(baseGain, now + envTime);
        gainNode.gain.setValueAtTime(baseGain, now + grainDuration - envTime);
        gainNode.gain.linearRampToValueAtTime(0, now + grainDuration);
        
        // Connect to audio chain
        source.connect(gainNode);
        gainNode.connect(this.filterNode);
        
        try {
            source.start(now, startTime, grainDuration);
            source.stop(now + grainDuration);
            
            // Add visual particle
            this.addGrainParticle(startTime / this.audioBuffer.duration, pitchShift);
            
            console.log('Grain created:', {
                position: startTime.toFixed(3),
                duration: grainDuration.toFixed(3),
                pitch: pitchShift.toFixed(2),
                timeStretch: timeStretch.toFixed(2)
            });
        } catch (error) {
            console.error('Error starting grain:', error);
            return null;
        }
        
        // Track grain
        const grain = { source, startTime: now, duration: grainDuration };
        this.grains.push(grain);
        
        // Clean up
        source.onended = () => {
            const index = this.grains.indexOf(grain);
            if (index > -1) this.grains.splice(index, 1);
        };
        
        // Update display
        document.getElementById('activeGrains').textContent = this.grains.length;
        
        return grain;
    }
    
    // Micro-stepping navigation
    handleArrowNavigation(direction) {
        if (!this.audioBuffer) return;
        
        if (direction === 'right') {
            this.microStep++;
            if (this.microStep > 9) {
                this.microStep = 0;
                this.currentMajorStep = Math.min(this.currentMajorStep + 1, 9);
            }
        } else if (direction === 'left') {
            this.microStep--;
            if (this.microStep < 0) {
                this.microStep = 9;
                this.currentMajorStep = Math.max(this.currentMajorStep - 1, 0);
            }
        }
        
        // Update position
        const totalSteps = 90;
        const currentStep = (this.currentMajorStep * 10) + this.microStep;
        const position = currentStep / totalSteps;
        
        this.setScanPosition(position);
        
        // Update display
        this.updateNavigationDisplay();
    }
    
    updateNavigationDisplay() {
        const totalSteps = 90;
        const currentStep = (this.currentMajorStep * 10) + this.microStep;
        const percentage = ((currentStep / totalSteps) * 100).toFixed(1);
        
        // Update position display
        document.getElementById('currentPos').textContent = 
            `${this.currentMajorStep}.${this.microStep} (${percentage}%)`;
    }
    
    // Enhanced setup methods with iOS support
    setupEventListeners() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        
        // iOS Audio Context Resume - Critical for mobile audio
        document.addEventListener('touchstart', async () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('iOS: Audio context resumed on touch');
            }
        }, { once: true, passive: true });
        
        // Additional iOS audio unlock attempts
        document.addEventListener('touchend', async () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
        }, { once: true, passive: true });
        
        // Also try on any click/tap
        document.addEventListener('click', async () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
        }, { once: true });
        
        // File handling
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
        
        // Looper toggle
        document.getElementById('looperToggle').addEventListener('click', () => {
            this.looperEnabled = !this.looperEnabled;
            document.getElementById('looperToggle').textContent = 
                `Looper: ${this.looperEnabled ? 'ON' : 'OFF'}`;
        });
        
        // Recording
        const recordButton = document.getElementById('recordButton');
        if (recordButton) {
            recordButton.addEventListener('click', async () => {
                await this.resumeAudioContext(); // Ensure audio context is ready
                this.toggleRecording();
            });
        }

        // Sequencer
        const sequencerStart = document.getElementById('sequencerStart');
        if (sequencerStart) {
            sequencerStart.addEventListener('click', () => {
                this.toggleSequencer();
            });
        }
    }
    
    setupKeyboardControls() {
        const chromaticKeys = {
            'q': -12, 'w': -11, 'e': -10, 'r': -9, 't': -8, 'y': -7, 'u': -6, 'i': -5, 'o': -4, 'p': -3,
            'a': -2, 's': -1, 'd': 0, 'f': 1, 'g': 2, 'h': 3, 'j': 4, 'k': 5, 'l': 6,
            'z': 7, 'x': 8, 'c': 9, 'v': 10, 'b': 11, 'n': 12, 'm': 13
        };
        
        document.addEventListener('keydown', async (e) => {
            const key = e.key.toLowerCase();
            
            // Resume audio context on any key press (iOS fix)
            await this.resumeAudioContext();
            
            // Spacebar - play/stop
            if (key === ' ') {
                e.preventDefault();
                this.togglePlayback();
                return;
            }
            
            // Arrow keys - micro-stepping navigation
            if (key === 'arrowright') {
                e.preventDefault();
                this.handleArrowNavigation('right');
                return;
            }
            if (key === 'arrowleft') {
                e.preventDefault();
                this.handleArrowNavigation('left');
                return;
            }
            
            // Number keys - major scan positions (0-9)
            if (key >= '0' && key <= '9') {
                e.preventDefault();
                this.currentMajorStep = key === '0' ? 0 : parseInt(key);
                this.microStep = 0; // Reset micro step
                const position = this.currentMajorStep / 9;
                this.setScanPosition(position);
                this.updateNavigationDisplay();
                return;
            }
            
            // Chromatic keys - pitch
            if (chromaticKeys.hasOwnProperty(key)) {
                e.preventDefault();
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
    
    // Enhanced slider controls with new parameters
    setupSliderControls() {
        const sliders = {
            grainSize: (val) => { 
                this.grainSize = parseInt(val); 
                document.getElementById('grainSizeValue').textContent = val + 'ms'; 
            },
            density: (val) => { 
                this.density = parseInt(val); 
                document.getElementById('densityValue').textContent = val; 
            },
            windowScan: (val) => { 
                this.windowScan = parseInt(val); 
                document.getElementById('windowScanValue').textContent = val + '%'; 
            },
            
            // New: Independent time stretching
            timeStretch: (val) => { 
                this.independentTimeStretch = parseFloat(val);
                document.getElementById('timeStretchValue').textContent = val + 'x';
            },
            
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
            
            // Enhanced formant controls with mix
            formant1: (val) => { 
                this.updateFormantFilter(0, parseInt(val)); 
                document.getElementById('formant1Value').textContent = val + 'Hz';
            },
            formant2: (val) => { 
                this.updateFormantFilter(1, parseInt(val)); 
                document.getElementById('formant2Value').textContent = val + 'Hz';
            },
            formant3: (val) => { 
                this.updateFormantFilter(2, parseInt(val)); 
                document.getElementById('formant3Value').textContent = val + 'Hz';
            },
            formant4: (val) => { 
                this.updateFormantFilter(3, parseInt(val)); 
                document.getElementById('formant4Value').textContent = val + 'Hz';
            },
            formant5: (val) => { 
                this.updateFormantFilter(4, parseInt(val)); 
                document.getElementById('formant5Value').textContent = val + 'Hz';
            },
            
            // New: Formant dry/wet mix
            formantMix: (val) => { 
                this.updateFormantMix(parseInt(val)); 
                document.getElementById('formantMixValue').textContent = val + '%';
            },
            
            // Enhanced wavefolder
            foldAmount: (val) => { 
                this.updateWavefolder(parseInt(val)); 
                document.getElementById('foldAmountValue').textContent = val + '%';
            },
            
            ringModMix: (val) => { 
                this.updateRingMod(parseInt(val)); 
                document.getElementById('ringModMixValue').textContent = val + '%';
            },
            
            volume: (val) => { 
                this.volume = parseFloat(val); 
                this.masterGainNode.gain.value = this.volume;
                document.getElementById('volumeValue').textContent = Math.round(val * 100) + '%';
            },
            
            // Multi-tap delay controls
            delayTime: (val) => { 
                this.updateMultiTapDelayTime(parseFloat(val)); 
                document.getElementById('delayTimeValue').textContent = Math.round(val * 1000) + 'ms';
            },
            delayFeedback: (val) => { 
                this.updateMultiTapDelayFeedback(parseFloat(val)); 
                document.getElementById('delayFeedbackValue').textContent = Math.round(val * 100) + '%';
            },
            delayMix: (val) => { 
                this.updateMultiTapDelayMix(parseFloat(val)); 
                document.getElementById('delayMixValue').textContent = Math.round(val * 100) + '%';
            },
            
            envelopeTime: (val) => { 
                this.envelopeTime = parseInt(val); 
                document.getElementById('envelopeTimeValue').textContent = val + '%';
            },
            
            // Reverb controls
            reverbSize: (val) => { 
                this.updateReverbSize(parseInt(val)); 
                document.getElementById('reverbSizeValue').textContent = val + '%';
            },
            reverbDecay: (val) => { 
                this.updateReverbDecay(parseInt(val)); 
                document.getElementById('reverbDecayValue').textContent = val + '%';
            },
            reverbPreDelay: (val) => { 
                this.updateReverbPreDelay(parseInt(val)); 
                document.getElementById('reverbPreDelayValue').textContent = val + 'ms';
            },
            reverbMix: (val) => { 
                this.updateReverbMix(parseInt(val)); 
                document.getElementById('reverbMixValue').textContent = val + '%';
            },
            
            // LFO controls
            lfoSpeed: (val) => { 
                this.updateLFOSpeed(parseFloat(val)); 
                document.getElementById('lfoSpeedValue').textContent = val + 'Hz';
            },
            lfoDepth: (val) => { 
                this.updateLFODepth(parseInt(val)); 
                document.getElementById('lfoDepthValue').textContent = val + '%';
            },
            
            // Sequencer controls
            sequencerTempo: (val) => { 
                this.updateSequencerTempo(parseInt(val)); 
                document.getElementById('sequencerTempoValue').textContent = val + ' BPM';
            },
            sequencerStep0: (val) => { 
                this.updateSequencerStep(0, parseInt(val)); 
                document.getElementById('sequencerStep0Value').textContent = val;
            },
            sequencerStep1: (val) => { 
                this.updateSequencerStep(1, parseInt(val)); 
                document.getElementById('sequencerStep1Value').textContent = val;
            },
            sequencerStep2: (val) => { 
                this.updateSequencerStep(2, parseInt(val)); 
                document.getElementById('sequencerStep2Value').textContent = val;
            },
            sequencerStep3: (val) => { 
                this.updateSequencerStep(3, parseInt(val)); 
                document.getElementById('sequencerStep3Value').textContent = val;
            },
            sequencerStep4: (val) => { 
                this.updateSequencerStep(4, parseInt(val)); 
                document.getElementById('sequencerStep4Value').textContent = val;
            }
        };

        // LFO Shape dropdown
        const lfoShapeSelect = document.getElementById('lfoShape');
        if (lfoShapeSelect) {
            lfoShapeSelect.addEventListener('change', (e) => {
                this.updateLFOShape(e.target.value);
            });
        }
        
        // Setup all slider event listeners
        Object.keys(sliders).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => {
                    sliders[id](e.target.value);
                });
            }
        });
    }
    
    // Enhanced audio processing methods
    updateFormantMix(mix) {
        this.formantMix = mix;
        const wetAmount = mix / 100;
        const dryAmount = 1 - wetAmount;
        
        this.formantWetGain.gain.value = wetAmount;
        this.formantDryGain.gain.value = dryAmount;
    }
    
    updateMultiTapDelayTime(time) {
        this.delayTime = time;
        const baseTimes = [0.125, 0.25, 0.375, 0.5];
        
        for (let i = 0; i < this.multiTapDelays.length; i++) {
            this.multiTapDelays[i].delayTime.value = baseTimes[i] * time;
        }
    }
    
    updateMultiTapDelayFeedback(feedback) {
        this.delayFeedback = feedback;
        for (let i = 0; i < this.multiTapFeedbacks.length; i++) {
            this.multiTapFeedbacks[i].gain.value = feedback * 0.7;
        }
    }
    
    updateMultiTapDelayMix(mix) {
        this.delayMix = mix;
        this.delayDryGain.gain.value = 1 - mix;
        this.delayWetGain.gain.value = mix;
    }
    
    createEnhancedFoldCurve(amount) {
        const samples = 4096; // Higher resolution
        const curve = new Float32Array(samples);
        const foldFactor = 1 + (amount / 100) * 8; // More aggressive folding
        
        for (let i = 0; i < samples; i++) {
            const x = (i / samples) * 2 - 1;
            let folded = x * foldFactor;
            
            // Enhanced wavefold algorithm with multiple folds
            let foldCount = 0;
            while (Math.abs(folded) > 1 && foldCount < 8) {
                if (folded > 1) {
                    folded = 2 - folded;
                } else if (folded < -1) {
                    folded = -2 - folded;
                }
                foldCount++;
            }
            
            // Add some saturation for more character
            folded = Math.tanh(folded * 0.8);
            curve[i] = folded;
        }
        
        return curve;
    }
    
    updateWavefolder(amount) {
        this.foldAmount = amount;
        this.wavefolder.curve = this.createEnhancedFoldCurve(amount);
        
        // Adjust post-fold filtering based on fold amount
        const cutoffFreq = 8000 - (amount / 100) * 3000; // More folding = lower cutoff
        this.foldFilter.frequency.value = Math.max(cutoffFreq, 2000);
    }
    
    // Mobile keyboard enhancements
    setupMobileKeyboard() {
        const keyButtons = document.querySelectorAll('.key-btn');
        
        keyButtons.forEach(btn => {
            const key = btn.dataset.key;
            
            // Enhanced touch events with iOS audio context resume
            btn.addEventListener('touchstart', async (e) => {
                e.preventDefault();
                await this.resumeAudioContext(); // Critical for iOS
                this.handleKeyDown(key);
                btn.classList.add('active');
            }, { passive: false });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleKeyUp(key);
                btn.classList.remove('active');
            }, { passive: false });
            
            // Mouse events for desktop
            btn.addEventListener('mousedown', async (e) => {
                e.preventDefault();
                await this.resumeAudioContext();
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
            this.currentMajorStep = key === '0' ? 0 : parseInt(key);
            this.microStep = 0;
            const position = this.currentMajorStep / 9;
            this.setScanPosition(position);
            this.updateNavigationDisplay();
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
               ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) ||
               (navigator.msMaxTouchPoints > 0);
    }
    
    // All the existing methods from your original code continue here...
    // (I'll include the rest in the next update to stay within limits)
    
    // Existing methods for granular reverb, LFO, sequencer, etc.
    updateSequencerInterval() {
        this.sequencer.stepInterval = (60 / this.sequencer.tempo) * 1000;
    }
    
    createFilterLFO() {
        this.lfoOscillator = this.audioContext.createOscillator();
        this.lfoOscillator.type = 'sine';
        this.lfoOscillator.frequency.value = this.lfoSpeed;
        
        this.lfoGain = this.audioContext.createGain();
        this.lfoGain.gain.value = 0;
        
        this.lfoShaper = this.audioContext.createWaveShaper();
        this.lfoShaper.curve = this.createLFOShapeCurve(this.lfoShape);
        this.lfoShaper.oversample = 'none';
        
        this.lfoOscillator.connect(this.lfoShaper);
        this.lfoShaper.connect(this.lfoGain);
        this.lfoGain.connect(this.filterNode.frequency);
        
        this.lfoOscillator.start();
    }
    
    createLFOShapeCurve(shape) {
        const samples = 2048;
        const curve = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const x = (i / samples) * 2 - 1;
            let output;
            
            switch (shape) {
                case 'sine':
                    output = x;
                    break;
                case 'triangle':
                    output = Math.asin(x) / (Math.PI / 2);
                    break;
                case 'sawtooth':
                    output = Math.atan(x * 5) / Math.atan(5);
                    break;
                case 'square':
                    output = x > 0 ? 1 : -1;
                    break;
                default:
                    output = x;
            }
            
            curve[i] = output;
        }
        
        return curve;
    }
    
    updateLFOSpeed(speed) {
        this.lfoSpeed = speed;
        this.lfoOscillator.frequency.value = speed;
    }
    
    updateLFODepth(depth) {
        this.lfoDepth = depth;
        const modulationRange = (depth / 100) * 2000;
        this.lfoGain.gain.value = modulationRange;
    }
    
    updateLFOShape(shape) {
        this.lfoShape = shape;
        this.lfoShaper.curve = this.createLFOShapeCurve(shape);
    }
    
    createGranularReverb() {
        this.reverbPreDelay = this.audioContext.createDelay(0.2);
        this.reverbPreDelay.delayTime.value = 0;
        
        this.reverbDryGain = this.audioContext.createGain();
        this.reverbWetGain = this.audioContext.createGain();
        this.reverbDryGain.gain.value = 1;
        this.reverbWetGain.gain.value = 0;
        
        const delayTimes = [0.023, 0.031, 0.037, 0.041, 0.043, 0.047, 0.053, 0.059];
        const feedbacks = [0.3, 0.35, 0.4, 0.45, 0.38, 0.42, 0.33, 0.36];
        
        for (let i = 0; i < delayTimes.length; i++) {
            const delay = this.audioContext.createDelay(0.2);
            delay.delayTime.value = delayTimes[i];
            
            const feedback = this.audioContext.createGain();
            feedback.gain.value = feedbacks[i];
            
            const damping = this.audioContext.createBiquadFilter();
            damping.type = 'lowpass';
            damping.frequency.value = 3000;
            damping.Q.value = 0.5;
            
            const output = this.audioContext.createGain();
            output.gain.value = 0.125;
            
            delay.connect(damping);
            damping.connect(feedback);
            damping.connect(output);
            feedback.connect(delay);
            output.connect(this.reverbWetGain);
            
            this.reverbDelays.push(delay);
            this.reverbGains.push(feedback);
            this.reverbFilters.push(damping);
            
            this.reverbPreDelay.connect(delay);
        }
        
        // Cross-coupling
        for (let i = 0; i < this.reverbDelays.length; i++) {
            const nextDelay = this.reverbDelays[(i + 1) % this.reverbDelays.length];
            const coupling = this.audioContext.createGain();
            coupling.gain.value = 0.1;
            
            this.reverbFilters[i].connect(coupling);
            coupling.connect(nextDelay);
        }
    }
    
    updateReverbSize(size) {
        this.reverbSize = size;
        const sizeMultiplier = 0.5 + (size / 100) * 1.5;
        const baseTimes = [0.023, 0.031, 0.037, 0.041, 0.043, 0.047, 0.053, 0.059];
        
        for (let i = 0; i < this.reverbDelays.length; i++) {
            this.reverbDelays[i].delayTime.value = baseTimes[i] * sizeMultiplier;
        }
    }
    
    updateReverbDecay(decay) {
        this.reverbDecay = decay;
        const feedbackAmount = 0.1 + (decay / 100) * 0.6;
        
        for (let i = 0; i < this.reverbGains.length; i++) {
            const variation = 1 + (Math.random() - 0.5) * 0.2;
            this.reverbGains[i].gain.value = feedbackAmount * variation;
        }
        
        const dampingFreq = 1000 + (decay / 100) * 4000;
        for (let i = 0; i < this.reverbFilters.length; i++) {
            this.reverbFilters[i].frequency.value = dampingFreq;
        }
    }
    
    updateReverbPreDelay(preDelay) {
        this.reverbPreDelayTime = preDelay;
        this.reverbPreDelay.delayTime.value = preDelay / 1000;
    }
    
    updateReverbMix(mix) {
        this.reverbMix = mix;
        const wetAmount = mix / 100;
        const dryAmount = 1 - wetAmount;
        
        this.reverbDryGain.gain.value = dryAmount;
        this.reverbWetGain.gain.value = wetAmount;
    }
    
    createNoiseBuffer() {
        const length = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2) - 1;
        }
        
        return buffer;
    }
    
    updateFormantFilter(index, frequency) {
        if (index >= 0 && index < this.formantFilters.length) {
            this.formantFilters[index].frequency.value = frequency;
            this.formantFreqs[index] = frequency;
        }
    }
    
    updateRingMod(mix) {
        this.ringModMix = mix;
        this.ringModGain.gain.value = mix / 100;
        
        // Also modulate the noise filter frequency for variety
        this.noiseFilter.frequency.value = 500 + (mix / 100) * 2000;
    }
    
    // Sequencer methods
    startSequencer() {
        if (this.sequencer.isRunning) return;
        
        this.sequencer.isRunning = true;
        this.sequencer.currentStep = 0;
        
        const startButton = document.getElementById('sequencerStart');
        startButton.textContent = 'STOP SEQ';
        startButton.classList.add('running');
        
        this.applySequencerStep();
        
        this.sequencer.intervalId = setInterval(() => {
            this.sequencerStep();
        }, this.sequencer.stepInterval);
        
        console.log('Sequencer started at', this.sequencer.tempo, 'BPM');
    }
    
    stopSequencer() {
        if (!this.sequencer.isRunning) return;
        
        this.sequencer.isRunning = false;
        
        if (this.sequencer.intervalId) {
            clearInterval(this.sequencer.intervalId);
            this.sequencer.intervalId = null;
        }
        
        const startButton = document.getElementById('sequencerStart');
        startButton.textContent = 'START SEQ';
        startButton.classList.remove('running');
        
        this.updateStepIndicators(-1);
        console.log('Sequencer stopped');
    }
    
    sequencerStep() {
        this.sequencer.currentStep = (this.sequencer.currentStep + 1) % 5;
        this.applySequencerStep();
    }
    
    applySequencerStep() {
        const currentStepValue = this.sequencer.steps[this.sequencer.currentStep];
        const gainValue = (currentStepValue / 127) * 2;
        
        for (let i = 0; i < this.formantGains.length; i++) {
            const now = this.audioContext.currentTime;
            this.formantGains[i].gain.cancelScheduledValues(now);
            this.formantGains[i].gain.setValueAtTime(this.formantGains[i].gain.value, now);
            this.formantGains[i].gain.linearRampToValueAtTime(gainValue, now + 0.01);
        }
        
        this.updateStepIndicators(this.sequencer.currentStep);
        console.log(`Step ${this.sequencer.currentStep + 1}: ${currentStepValue} (${gainValue.toFixed(2)}x gain)`);
    }
    
    updateStepIndicators(activeStep) {
        for (let i = 0; i < 5; i++) {
            const stepElement = document.getElementById(`sequencerStep${i}`);
            if (stepElement) {
                if (i === activeStep) {
                    stepElement.classList.add('active-step');
                } else {
                    stepElement.classList.remove('active-step');
                }
            }
        }
    }
    
    toggleSequencer() {
        if (this.sequencer.isRunning) {
            this.stopSequencer();
        } else {
            this.startSequencer();
        }
    }
    
    updateSequencerTempo(tempo) {
        this.sequencer.tempo = tempo;
        this.updateSequencerInterval();
        
        if (this.sequencer.isRunning) {
            clearInterval(this.sequencer.intervalId);
            this.sequencer.intervalId = setInterval(() => {
                this.sequencerStep();
            }, this.sequencer.stepInterval);
        }
    }
    
    updateSequencerStep(stepIndex, value) {
        if (stepIndex >= 0 && stepIndex < 5) {
            this.sequencer.steps[stepIndex] = value;
            
            if (this.sequencer.isRunning && this.sequencer.currentStep === stepIndex) {
                this.applySequencerStep();
            }
        }
    }
    
    // Recording methods
    startRecording() {
        if (!this.recordingStream || this.isRecording) return;
        
        this.recordedChunks = [];
        
        try {
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/mp4';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = '';
                    }
                }
            }
            
            this.mediaRecorder = new MediaRecorder(this.recordingStream, 
                mimeType ? { mimeType } : {}
            );
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.saveRecording();
            };
            
            this.mediaRecorder.start(100);
            this.isRecording = true;
            
            const recordButton = document.getElementById('recordButton');
            recordButton.textContent = '⏹️ STOP';
            recordButton.classList.add('recording');
            
            console.log('Recording started with MIME type:', mimeType);
            
        } catch (error) {
            console.error('Recording failed:', error);
            alert('Recording not supported in this browser. Try Chrome or Firefox.');
        }
    }
    
    stopRecording() {
        if (!this.mediaRecorder || !this.isRecording) return;
        
        this.mediaRecorder.stop();
        this.isRecording = false;
        
        const recordButton = document.getElementById('recordButton');
        recordButton.textContent = '🔴 REC';
        recordButton.classList.remove('recording');
        
        console.log('Recording stopped');
    }
    
    saveRecording() {
        if (this.recordedChunks.length === 0) {
            console.log('No recorded data to save');
            return;
        }
        
        const firstChunk = this.recordedChunks[0];
        let extension = 'webm';
        let mimeType = 'audio/webm';
        
        if (firstChunk.type.includes('mp4')) {
            extension = 'mp4';
            mimeType = 'audio/mp4';
        } else if (firstChunk.type.includes('wav')) {
            extension = 'wav';
            mimeType = 'audio/wav';
        }
        
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().slice(0,19).replace(/:/g,'-');
        const filename = `grains_${timestamp}.${extension}`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        this.recordedChunks = [];
        
        console.log('Recording saved as:', filename);
        
        const recordButton = document.getElementById('recordButton');
        const originalText = recordButton.textContent;
        recordButton.textContent = '✅ SAVED';
        setTimeout(() => {
            recordButton.textContent = '🔴 REC';
        }, 2000);
    }
    
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    // Waveform and playback methods
    setScanPosition(position) {
        if (!this.audioBuffer) return;
        
        this.scanPosition = position;
        this.loopPosition = position * this.audioBuffer.duration;
        
        const playhead = document.getElementById('playhead');
        playhead.style.left = (position * 100) + '%';
        
        document.getElementById('loopPos').textContent = this.loopPosition.toFixed(2) + 's';
    }
    
    stopPlayback() {
        this.isPlaying = false;
        document.getElementById('playingStatus').textContent = 'Stopped';
        
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
        
        for (let i = 0; i < this.density; i++) {
            const delay = (i / this.density) * (this.grainSize / 1000);
            setTimeout(() => {
                if (this.isPlaying) this.createGrain();
            }, delay * 1000);
        }
        
        setTimeout(() => {
            if (this.isPlaying) this.scheduleGrains();
        }, this.grainSize);
    }
    
    drawWaveform() {
        const canvas = document.getElementById('waveform');
        const ctx = canvas.getContext('2d');
        
        if (!this.audioBuffer || !canvas) {
            console.log('No audio buffer or canvas found');
            return;
        }
        
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.log('Canvas not ready, retrying...');
            setTimeout(() => this.drawWaveform(), 100);
            return;
        }
        
        const displayWidth = Math.floor(rect.width);
        const displayHeight = Math.floor(rect.height);
        
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        
        console.log('Drawing waveform:', {
            bufferLength: this.audioBuffer.length,
            canvasWidth: displayWidth,
            canvasHeight: displayHeight,
            duration: this.audioBuffer.duration.toFixed(2) + 's'
        });
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        
        const data = this.audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / displayWidth);
        
        if (step <= 0 || data.length === 0) {
            console.warn('Invalid audio data for waveform');
            return;
        }
        
        ctx.strokeStyle = '#00cc44';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        let hasDrawn = false;
        
        for (let i = 0; i < displayWidth; i++) {
            let min = 1.0;
            let max = -1.0;
            
            const startIdx = i * step;
            const endIdx = Math.min(startIdx + step, data.length);
            
            for (let j = startIdx; j < endIdx; j++) {
                const sample = data[j] || 0;
                if (sample < min) min = sample;
                if (sample > max) max = sample;
            }
            
            const y1 = Math.floor(((min + 1) * displayHeight) / 2);
            const y2 = Math.floor(((max + 1) * displayHeight) / 2);
            
            if (!hasDrawn) {
                ctx.moveTo(i, y1);
                hasDrawn = true;
            }
            
            ctx.moveTo(i, y1);
            ctx.lineTo(i, y2);
        }
        
        ctx.stroke();
        console.log('Waveform drawn successfully');
        
        canvas.style.opacity = '0.99';
        setTimeout(() => {
            canvas.style.opacity = '1';
        }, 10);
    }
    
    drawFilterEnvelope() {
        const canvas = document.getElementById('filterEnvelope');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#00cc44';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
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
    
    // Add navigation instructions to the page
    const instructions = document.querySelector('.instructions');
    if (instructions) {
        const keyMap = instructions.querySelector('.key-map');
        if (keyMap && keyMap.children.length >= 2) {
            // Add micro-stepping instructions to the second column
            const secondColumn = keyMap.children[1];
            secondColumn.innerHTML += `<br><br><strong>Micro-Navigation:</strong><br>• ← → Arrow Keys - Fine position control<br>• 90 total positions (9 major × 10 micro)`;
        }
    }
});

// Add resize listener for waveform and visualization
window.addEventListener('resize', () => {
    if (window.granularSampler && window.granularSampler.audioBuffer) {
        window.granularSampler.drawWaveform();
    }
});

// Additional iOS audio unlock attempts on page focus/visibility change 
document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && window.granularSampler && window.granularSampler.audioContext) {
        if (window.granularSampler.audioContext.state === 'suspended') {
            await window.granularSampler.resumeAudioContext();
        }
    }
});

// Force audio context resume on window focus (Mobile/iOS Safari specific fix)
window.addEventListener('focus', async () => {
    if (window.granularSampler && window.granularSampler.audioContext) {
        if (window.granularSampler.audioContext.state === 'suspended') {
            await window.granularSampler.resumeAudioContext();
        }
    }
});