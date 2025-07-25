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
        
        // Recording
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingDestination = null;
        
        // Granular parameters
        this.grainSize = 50; // ms
        this.density = 4;
        this.windowScan = 0; // percentage
        this.envelopeTime = 0; // 0 = shortest, 100 = longest
        this.timeStretch = 1.0; // playback speed
        
        // Filter & LFO
        this.filterNode = null;
        this.filterFreq = 1000;
        this.filterQ = 1;
        this.lfoNode = null;
        this.lfoGainNode = null;
        this.lfoSpeed = 1;
        this.lfoDepth = 0;
        this.lfoShape = 'sine';
        
        // Formant Filter Bank
        this.formantFilters = [];
        this.formantFrequencies = [400, 800, 1200, 2400, 3200];
        this.formantGainNode = null;
        this.formantGain = 1.0;
        this.formantMixNode = null;
        this.formantDryNode = null;
        this.formantMix = 0;
        
        // Wavefolder
        this.waveShaperNode = null;
        this.wavefoldAmount = 0;
        
        // Ring Modulator
        this.ringModNode = null;
        this.ringModSource = null;
        this.ringModEnvNode = null;
        this.ringModMixNode = null;
        this.ringModDryNode = null;
        this.ringModMix = 0;
        this.ringModSourceType = 'noise'; // 'noise' or 'envelope'
        this.ringModEnvSpeed = 1;
        
        // T-Resonator
        this.tResonatorNode = null;
        this.tResonatorFeedback = null;
        this.tResonatorDamping = null;
        this.tResonatorMixNode = null;
        this.tResonatorDryNode = null;
        this.tResonance = 0;
        this.tDamping = 0.5;
        this.tMix = 0;
        
        // Volume
        this.masterGainNode = null;
        this.volume = 0.7; // Default to 70%
        
        // Delay effect
        this.delayNode = null;
        this.feedbackNode = null;
        this.delaySoftClipNode = null;
        this.delayTime = 0.2; // 200ms
        this.delayFeedback = 0.3; // 30%
        this.delaySoftClip = 0;
        this.delayStretch = 1.0;
        this.delayMix = 0; // 0% wet signal initially
        this.delayWetNode = null;
        this.delayDryNode = null;
        
        // Reverb
        this.reverbNode = null;
        this.reverbPreDelayNode = null;
        this.reverbWetGainNode = null;
        this.reverbDryNode = null;
        this.reverbWetNode = null;
        this.reverbSize = 0.5;
        this.reverbDecay = 0.5;
        this.reverbPreDelay = 0.01;
        this.reverbWetGain = 1.0;
        this.reverbMix = 0;
        this.reverbImpulse = null;
        
        this.initAudio();
        this.setupEventListeners();
        this.setupKeyboardControls();
        this.setupMobileKeyboard();
    }
    async initAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create master volume control
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.gain.value = this.volume;
        this.masterGainNode.connect(this.audioContext.destination);
        
        // Create recording destination
        this.recordingDestination = this.audioContext.createMediaStreamDestination();
        this.masterGainNode.connect(this.recordingDestination);
        
        // Create filter
        this.filterNode = this.audioContext.createBiquadFilter();
        this.filterNode.type = 'bandpass';
        this.filterNode.frequency.value = this.filterFreq;
        this.filterNode.Q.value = this.filterQ;
        
        // Create LFO for filter modulation
        this.lfoNode = this.audioContext.createOscillator();
        this.lfoNode.type = 'sine';
        this.lfoNode.frequency.value = this.lfoSpeed;
        this.lfoGainNode = this.audioContext.createGain();
        this.lfoGainNode.gain.value = 0;
        this.lfoNode.connect(this.lfoGainNode);
        this.lfoGainNode.connect(this.filterNode.frequency);
        this.lfoNode.start();
        
        // Create formant filter bank
        this.formantGainNode = this.audioContext.createGain();
        this.formantGainNode.gain.value = this.formantGain;
        
        for (let i = 0; i < 5; i++) {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = this.formantFrequencies[i];
            filter.Q.value = 10;
            this.formantFilters.push(filter);
            
            if (i > 0) {
                this.formantFilters[i - 1].connect(filter);
            }
        }
        
        // Formant mix control
        this.formantMixNode = this.audioContext.createGain();
        this.formantDryNode = this.audioContext.createGain();
        this.formantMixNode.gain.value = 0;
        this.formantDryNode.gain.value = 1;
        
        if (this.formantFilters.length > 0) {
            this.formantFilters[this.formantFilters.length - 1].connect(this.formantGainNode);
            this.formantGainNode.connect(this.formantMixNode);
        }
        
        // Create waveshaper
        this.waveShaperNode = this.audioContext.createWaveShaper();
        this.waveShaperNode.curve = this.makeWavefolderCurve(0);
        this.waveShaperNode.oversample = '4x';
        
        // Create ring modulator
        this.ringModNode = this.audioContext.createGain();
        this.ringModNode.gain.value = 0;
        
        // Create noise source for ring mod
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;
        noiseSource.start();
        
        // Create envelope source for ring mod
        this.ringModEnvNode = this.audioContext.createOscillator();
        this.ringModEnvNode.type = 'sine';
        this.ringModEnvNode.frequency.value = this.ringModEnvSpeed;
        this.ringModEnvNode.start();
        
        // Ring mod source switching
        this.ringModSource = noiseSource;
        this.ringModSource.connect(this.ringModNode.gain);
        
        // Ring mod mix control
        this.ringModMixNode = this.audioContext.createGain();
        this.ringModDryNode = this.audioContext.createGain();
        this.ringModMixNode.gain.value = 0;
        this.ringModDryNode.gain.value = 1;
        
        // Create T-Resonator
        this.tResonatorNode = this.audioContext.createDelay(0.1);
        this.tResonatorFeedback = this.audioContext.createGain();
        this.tResonatorDamping = this.audioContext.createBiquadFilter();
        this.tResonatorDamping.type = 'lowpass';
        this.tResonatorDamping.frequency.value = 5000;
        
        this.tResonatorMixNode = this.audioContext.createGain();
        this.tResonatorDryNode = this.audioContext.createGain();
        this.tResonatorMixNode.gain.value = 0;
        this.tResonatorDryNode.gain.value = 1;
        
        // T-Resonator connections
        this.tResonatorNode.connect(this.tResonatorDamping);
        this.tResonatorDamping.connect(this.tResonatorFeedback);
        this.tResonatorFeedback.connect(this.tResonatorNode);
        this.tResonatorNode.connect(this.tResonatorMixNode);
        
        // Create delay effect
        this.delayNode = this.audioContext.createDelay(5.0);
        this.delayNode.delayTime.value = this.delayTime;
        
        this.feedbackNode = this.audioContext.createGain();
        this.feedbackNode.gain.value = this.delayFeedback;
        
        // Soft clipper for delay
        this.delaySoftClipNode = this.audioContext.createWaveShaper();
        this.delaySoftClipNode.curve = this.makeSoftClipCurve(0);
        this.delaySoftClipNode.oversample = '2x';
        
        this.delayWetNode = this.audioContext.createGain();
        this.delayWetNode.gain.value = this.delayMix;
        
        this.delayDryNode = this.audioContext.createGain();
        this.delayDryNode.gain.value = 1 - this.delayMix;
        
        // Create reverb
        this.reverbNode = this.audioContext.createConvolver();
        this.reverbPreDelayNode = this.audioContext.createDelay(0.1);
        this.reverbPreDelayNode.delayTime.value = this.reverbPreDelay;
        
        this.reverbWetGainNode = this.audioContext.createGain();
        this.reverbWetGainNode.gain.value = this.reverbWetGain;
        
        this.reverbDryNode = this.audioContext.createGain();
        this.reverbWetNode = this.audioContext.createGain();
        this.reverbDryNode.gain.value = 1;
        this.reverbWetNode.gain.value = 0;
        
        this.generateReverbImpulse();
        
        // Connect signal path
        this.connectAudioNodes();
    }
    
    connectAudioNodes() {
        // Signal path: 
        // Grains → Filter → Formants → Wavefolder → Ring Mod → T-Resonator → Delay → Reverb → Master
        
        // Filter to formant routing
        this.filterNode.connect(this.formantDryNode);
        this.filterNode.connect(this.formantFilters[0]);
        
        // Formant to wavefolder
        this.formantDryNode.connect(this.waveShaperNode);
        this.formantMixNode.connect(this.waveShaperNode);
        
        // Wavefolder to ring mod
        this.waveShaperNode.connect(this.ringModNode);
        this.waveShaperNode.connect(this.ringModDryNode);
        
        // Ring mod to T-Resonator
        this.ringModNode.connect(this.tResonatorNode);
        this.ringModNode.connect(this.tResonatorDryNode);
        this.ringModDryNode.connect(this.tResonatorNode);
        this.ringModDryNode.connect(this.tResonatorDryNode);
        
        // T-Resonator to delay
        this.tResonatorDryNode.connect(this.delayDryNode);
        this.tResonatorDryNode.connect(this.delayNode);
        this.tResonatorMixNode.connect(this.delayDryNode);
        this.tResonatorMixNode.connect(this.delayNode);
        
        // Delay chain
        this.delayNode.connect(this.delaySoftClipNode);
        this.delaySoftClipNode.connect(this.delayWetNode);
        this.delaySoftClipNode.connect(this.feedbackNode);
        this.feedbackNode.connect(this.delayNode);
        
        // Delay to reverb
        this.delayDryNode.connect(this.reverbDryNode);
        this.delayDryNode.connect(this.reverbPreDelayNode);
        this.delayWetNode.connect(this.reverbDryNode);
        this.delayWetNode.connect(this.reverbPreDelayNode);
        
        // Reverb chain
        this.reverbPreDelayNode.connect(this.reverbNode);
        this.reverbNode.connect(this.reverbWetGainNode);
        this.reverbWetGainNode.connect(this.reverbWetNode);
        
        // Final mix
        this.reverbDryNode.connect(this.masterGainNode);
        this.reverbWetNode.connect(this.masterGainNode);
    }
    makeWavefolderCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            if (amount === 0) {
                curve[i] = x;
            } else {
                const foldFactor = 1 + amount * 4;
                curve[i] = Math.tanh(x * foldFactor) / Math.tanh(foldFactor);
                
                // Add harmonics
                const harmonics = Math.sin(x * foldFactor * 3) * 0.1 * amount;
                curve[i] += harmonics;
                
                // Normalize
                curve[i] = Math.max(-1, Math.min(1, curve[i]));
            }
        }
        
        return curve;
    }
    
    makeSoftClipCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            if (amount === 0) {
                curve[i] = x;
            } else {
                const drive = 1 + amount * 10;
                curve[i] = Math.tanh(x * drive) * 0.9;
            }
        }
        
        return curve;
    }
    
    generateReverbImpulse() {
        const length = this.audioContext.sampleRate * 2;
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            
            for (let i = 0; i < length; i++) {
                // Early reflections
                if (i < 1000) {
                    channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / 1000, 2);
                }
                
                // Decay
                const decay = Math.pow(1 - i / length, 1 + this.reverbDecay * 4);
                channelData[i] += (Math.random() * 2 - 1) * decay * 0.5;
                
                // 12-bit quantization for lo-fi character
                const bits = 12;
                const steps = Math.pow(2, bits);
                channelData[i] = Math.round(channelData[i] * steps) / steps;
                
                // Room size modulation
                if (i % Math.floor(100 + this.reverbSize * 400) === 0) {
                    channelData[i] += (Math.random() * 2 - 1) * decay * 0.3;
                }
            }
        }
        
        this.reverbNode.buffer = impulse;
    }
    
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            console.log('Resuming audio context...');
            await this.audioContext.resume();
            console.log('Audio context state:', this.audioContext.state);
        }
    }
    
    updateLFO() {
        this.lfoNode.frequency.value = this.lfoSpeed;
        this.lfoGainNode.gain.value = (this.lfoDepth / 100) * 2000;
        
        // Update waveform
        if (this.lfoShape === 'sawtooth' || this.lfoShape === 'square') {
            this.lfoNode.type = this.lfoShape;
        } else if (this.lfoShape === 'triangle') {
            this.lfoNode.type = 'triangle';
        } else {
            this.lfoNode.type = 'sine';
        }
    }
    
    updateFormantMix() {
        const mix = this.formantMix / 100;
        this.formantMixNode.gain.value = mix;
        this.formantDryNode.gain.value = 1 - mix;
    }
    
    updateRingModMix() {
        const mix = this.ringModMix / 100;
        this.ringModMixNode.gain.value = mix;
        this.ringModDryNode.gain.value = 1 - mix;
    }
    
    updateTResonatorMix() {
        const mix = this.tMix / 100;
        this.tResonatorMixNode.gain.value = mix;
        this.tResonatorDryNode.gain.value = 1 - mix;
        
        // Update resonance (feedback)
        this.tResonatorFeedback.gain.value = this.tResonance / 100 * 0.99;
        
        // Update damping
        const dampingFreq = 200 + (1 - this.tDamping / 100) * 7800;
        this.tResonatorDamping.frequency.value = dampingFreq;
    }
    
    updateDelayMix() {
        const mix = this.delayMix;
        this.delayWetNode.gain.value = mix;
        this.delayDryNode.gain.value = 1 - mix;
    }
    
    updateReverbMix() {
        const mix = this.reverbMix / 100;
        this.reverbWetNode.gain.value = mix;
        this.reverbDryNode.gain.value = 1 - mix;
    }
    
    switchRingModSource(type) {
        // Disconnect current source
        if (this.ringModSource) {
            this.ringModSource.disconnect(this.ringModNode.gain);
        }
        
        if (type === 'envelope') {
            this.ringModSource = this.ringModEnvNode;
            this.ringModSourceType = 'envelope';
        } else {
            // Recreate noise source
            const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseData.length; i++) {
                noiseData[i] = Math.random() * 2 - 1;
            }
            
            const noiseSource = this.audioContext.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;
            noiseSource.start();
            
            this.ringModSource = noiseSource;
            this.ringModSourceType = 'noise';
        }
        
        this.ringModSource.connect(this.ringModNode.gain);
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
        
        // Transport controls
        document.getElementById('playButton').addEventListener('click', () => {
            this.togglePlayback();
        });
        
        document.getElementById('recordButton').addEventListener('click', () => {
            this.toggleRecording();
        });
        
        document.getElementById('looperToggle').addEventListener('click', () => {
            this.looperEnabled = !this.looperEnabled;
            document.getElementById('looperToggle').classList.toggle('active', this.looperEnabled);
        });
        
        // Ring mod source buttons
        document.getElementById('ringModNoise').addEventListener('click', () => {
            this.switchRingModSource('noise');
            document.getElementById('ringModNoise').classList.add('active');
            document.getElementById('ringModEnv').classList.remove('active');
        });
        
        document.getElementById('ringModEnv').addEventListener('click', () => {
            this.switchRingModSource('envelope');
            document.getElementById('ringModEnv').classList.add('active');
            document.getElementById('ringModNoise').classList.remove('active');
        });
        
        // Controls
        this.setupSliderControls();
    }
    
    setupSliderControls() {
        const sliders = {
            // Granular
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
            envelopeTime: (val) => { 
                this.envelopeTime = parseInt(val); 
                document.getElementById('envelopeTimeValue').textContent = val + '%'; 
            },
            timeStretch: (val) => { 
                this.timeStretch = parseFloat(val); 
                document.getElementById('timeStretchValue').textContent = val + 'x'; 
            },
            
            // Filter & LFO
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
            lfoSpeed: (val) => { 
                this.lfoSpeed = parseFloat(val); 
                this.updateLFO();
                document.getElementById('lfoSpeedValue').textContent = val + 'Hz';
            },
            lfoDepth: (val) => { 
                this.lfoDepth = parseInt(val); 
                this.updateLFO();
                document.getElementById('lfoDepthValue').textContent = val + '%';
            },
            
            // Formants
            formant1: (val) => { 
                this.formantFrequencies[0] = parseInt(val);
                this.formantFilters[0].frequency.value = val;
                document.getElementById('formant1Value').textContent = val + 'Hz';
            },
            formant2: (val) => { 
                this.formantFrequencies[1] = parseInt(val);
                this.formantFilters[1].frequency.value = val;
                document.getElementById('formant2Value').textContent = val + 'Hz';
            },
            formant3: (val) => { 
                this.formantFrequencies[2] = parseInt(val);
                this.formantFilters[2].frequency.value = val;
                document.getElementById('formant3Value').textContent = val + 'Hz';
            },
            formant4: (val) => { 
                this.formantFrequencies[3] = parseInt(val);
                this.formantFilters[3].frequency.value = val;
                document.getElementById('formant4Value').textContent = val + 'Hz';
            },
            formant5: (val) => { 
                this.formantFrequencies[4] = parseInt(val);
                this.formantFilters[4].frequency.value = val;
                document.getElementById('formant5Value').textContent = val + 'Hz';
            },
            formantGain: (val) => { 
                this.formantGain = parseFloat(val);
                this.formantGainNode.gain.value = val;
                document.getElementById('formantGainValue').textContent = val;
            },
            formantMix: (val) => { 
                this.formantMix = parseInt(val);
                this.updateFormantMix();
                document.getElementById('formantMixValue').textContent = val + '%';
            },
            
            // Wavefolder & Ring Mod
            wavefold: (val) => { 
                this.wavefoldAmount = parseInt(val) / 100;
                this.waveShaperNode.curve = this.makeWavefolderCurve(this.wavefoldAmount);
                document.getElementById('wavefoldValue').textContent = val + '%';
            },
            ringModMix: (val) => { 
                this.ringModMix = parseInt(val);
                this.updateRingModMix();
                document.getElementById('ringModMixValue').textContent = val + '%';
            },
            ringModEnvSpeed: (val) => { 
                this.ringModEnvSpeed = parseFloat(val);
                this.ringModEnvNode.frequency.value = val;
                document.getElementById('ringModEnvSpeedValue').textContent = val + 'Hz';
            },
            
            // T-Resonator
            tResonance: (val) => { 
                this.tResonance = parseInt(val);
                this.updateTResonatorMix();
                document.getElementById('tResonanceValue').textContent = val + '%';
            },
            tDamping: (val) => { 
                this.tDamping = parseInt(val);
                this.updateTResonatorMix();
                document.getElementById('tDampingValue').textContent = val + '%';
            },
            tMix: (val) => { 
                this.tMix = parseInt(val);
                this.updateTResonatorMix();
                document.getElementById('tMixValue').textContent = val + '%';
            },
            
            // Volume
            volume: (val) => { 
                this.volume = parseFloat(val); 
                this.masterGainNode.gain.value = this.volume;
                document.getElementById('volumeValue').textContent = Math.round(val * 100) + '%';
            },
            
            // Delay
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
            delaySoftClip: (val) => { 
                this.delaySoftClip = parseInt(val) / 100;
                this.delaySoftClipNode.curve = this.makeSoftClipCurve(this.delaySoftClip);
                document.getElementById('delaySoftClipValue').textContent = val + '%';
            },
            delayStretch: (val) => { 
                this.delayStretch = parseFloat(val);
                document.getElementById('delayStretchValue').textContent = val + 'x';
            },
            delayMix: (val) => { 
                this.delayMix = parseFloat(val); 
                this.updateDelayMix();
                document.getElementById('delayMixValue').textContent = Math.round(val * 100) + '%';
            },
            
            // Reverb
            reverbSize: (val) => { 
                this.reverbSize = parseInt(val) / 100;
                this.generateReverbImpulse();
                document.getElementById('reverbSizeValue').textContent = val + '%';
            },
            reverbDecay: (val) => { 
                this.reverbDecay = parseInt(val) / 100;
                this.generateReverbImpulse();
                document.getElementById('reverbDecayValue').textContent = val + '%';
            },
            reverbPreDelay: (val) => { 
                this.reverbPreDelay = parseInt(val) / 1000;
                this.reverbPreDelayNode.delayTime.value = this.reverbPreDelay;
                document.getElementById('reverbPreDelayValue').textContent = val + '%';},
                reverbWetGain: (val) => { 
                    this.reverbWetGain = parseFloat(val);
                    this.reverbWetGainNode.gain.value = val;
                    document.getElementById('reverbWetGainValue').textContent = val;},
              
                reverbMix: (val) => { 
                    this.reverbMix = parseInt(val);
                    this.updateReverbMix();
                    document.getElementById('reverbMixValue').textContent = val + '%';
                }
            };
            
            // Add event listeners
            Object.keys(sliders).forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', (e) => {
                        sliders[id](e.target.value);
                    });
                }
            });
            
            // LFO shape select
            document.getElementById('lfoShape').addEventListener('change', (e) => {
                this.lfoShape = e.target.value;
                this.updateLFO();
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
            if (!this.audioBuffer) {
                console.error('No audio buffer to draw');
                return;
            }
            
            const canvas = document.getElementById('waveform');
            const ctx = canvas.getContext('2d');
            
            // Wait for next frame to ensure container is sized
            requestAnimationFrame(() => {
                const rect = canvas.getBoundingClientRect();
                const width = rect.width;
                const height = rect.height;
                
                // Set canvas size
                canvas.width = width;
                canvas.height = height;
                
                // Clear canvas
                ctx.fillStyle = 'transparent';
                ctx.fillRect(0, 0, width, height);
                
                // Get audio data
                const data = this.audioBuffer.getChannelData(0);
                const step = Math.ceil(data.length / width);
                
                console.log('Drawing waveform:', {
                    bufferLength: data.length,
                    canvasWidth: width,
                    canvasHeight: height,
                    step: step
                });
                
                // Draw waveform with phosphor green
                ctx.strokeStyle = '#00ff41';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                
                for (let i = 0; i < width; i++) {
                    let min = 1.0;
                    let max = -1.0;
                    
                    // Find min and max in this chunk
                    for (let j = 0; j < step; j++) {
                        const idx = (i * step) + j;
                        if (idx < data.length) {
                            const sample = data[idx];
                            if (sample < min) min = sample;
                            if (sample > max) max = sample;
                        }
                    }
                    
                    // Convert to canvas coordinates
                    const yMin = (1 + min) * height / 2;
                    const yMax = (1 + max) * height / 2;
                    
                    if (i === 0) {
                        ctx.moveTo(i, yMin);
                    } else {
                        ctx.lineTo(i, yMin);
                    }
                    ctx.lineTo(i, yMax);
                }
                
                ctx.stroke();
                
                // Add phosphor glow effect
                ctx.shadowColor = '#00ff41';
                ctx.shadowBlur = 3;
                ctx.stroke();
                
                console.log('Waveform drawn successfully');
            });
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
            document.getElementById('playButton').textContent = '⏸ STOP';
            document.getElementById('playButton').classList.add('playing');
            
            // Start grain generation
            this.scheduleGrains();
        }
        
        stopPlayback() {
            this.isPlaying = false;
            document.getElementById('playingStatus').textContent = 'Stopped';
            document.getElementById('playButton').textContent = '▶ PLAY';
            document.getElementById('playButton').classList.remove('playing');
            
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
            
            // Schedule next batch with time stretch
            const nextScheduleTime = this.grainSize / this.timeStretch;
            setTimeout(() => {
                if (this.isPlaying) this.scheduleGrains();
            }, nextScheduleTime);
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
            
            // Connect: source -> gain -> filter
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
                this.playheadPosition += (grainDuration / 4) * this.timeStretch;
                if (this.playheadPosition >= this.audioBuffer.duration) {
                    this.playheadPosition = 0;
                }
                document.getElementById('currentPos').textContent = this.playheadPosition.toFixed(2) + 's';
                
                // Update visual playhead
                const playheadPercent = (this.playheadPosition / this.audioBuffer.duration) * 100;
                document.getElementById('playhead').style.left = playheadPercent + '%';
            }
        }
        
        // Recording functions
        async startRecording() {
            try {
                const stream = this.recordingDestination.stream;
                const options = {
                    mimeType: 'audio/webm;codecs=opus'
                };
                
                // Check if the mimeType is supported
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    // Fallback options
                    if (MediaRecorder.isTypeSupported('audio/webm')) {
                        options.mimeType = 'audio/webm';
                    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                        options.mimeType = 'audio/mp4';
                    } else {
                        options.mimeType = ''; // Let browser choose
                    }
                }
                
                this.mediaRecorder = new MediaRecorder(stream, options);
                this.recordedChunks = [];
                
                this.mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        this.recordedChunks.push(event.data);
                    }
                };
                
                this.mediaRecorder.onstop = () => {
                    this.saveRecording();
                };
                
                this.mediaRecorder.start();
                this.isRecording = true;
                
                // Update UI
                const recordButton = document.getElementById('recordButton');
                recordButton.textContent = '⏹ STOP';
                recordButton.classList.add('recording');
                
                console.log('Recording started');
            } catch (error) {
                console.error('Error starting recording:', error);
                alert('Error starting recording: ' + error.message);
            }
        }
        
        stopRecording() {
            if (this.mediaRecorder && this.isRecording) {
                this.mediaRecorder.stop();
                this.isRecording = false;
                
                // Update UI
                const recordButton = document.getElementById('recordButton');
                recordButton.textContent = '⬤ REC';
                recordButton.classList.remove('recording');
                
                console.log('Recording stopped');
            }
        }
        
        toggleRecording() {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        }
        
        saveRecording() {
            const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            // Create filename with timestamp
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
            a.download = `grains_${timestamp}.webm`;
            
            a.href = url;
            a.click();
            
            // Clean up
            URL.revokeObjectURL(url);
            this.recordedChunks = [];
            
            // Visual feedback
            const recordButton = document.getElementById('recordButton');
            recordButton.textContent = '✅ SAVED';
            setTimeout(() => {
                recordButton.textContent = '⬤ REC';
            }, 2000);
            
            console.log('Recording saved');
        }
    }
    
    // Initialize the sampler when page loads
    document.addEventListener('DOMContentLoaded', () => {
        window.granularSampler = new GranularSampler();
    });