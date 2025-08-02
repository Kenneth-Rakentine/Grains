// Console welcome message
console.log(`
░░░░░██████╗░██████╗░░█████╗░██╗███╗░░██╗░██████╗░░░░░
░░░░██╔════╝░██╔══██╗██╔══██╗██║████╗░██║██╔════╝░░░░░
░░░░██║░░██╗░██████╔╝███████║██║██╔██╗██║╚█████╗░░░░░░
░░░░██║░░╚██╗██╔══██╗██╔══██║██║██║╚████║░╚═══██╗░░░░░
░░░░╚██████╔╝██║░░██║██║░░██║██║██║░╚███║██████╔╝░░░░░
░░░░░╚═════╝░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝╚═╝░░╚══╝╚═════╝░░░░░░
`);

class GranularSampler {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.grains = [];
        this.isPlaying = false;
        this.playheadPosition = 0;
        this.loopPosition = 0;
        this.looperEnabled = false;
        this.wrapEnabled = false; // CHANGED: Default to OFF
        this.scanPosition = 0;
        this.currentPitch = 1.0;
        this.activePitchKeys = new Set();
        
        // Recording
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingDestination = null;
        
        // Granular parameters with LFO mapping
        this.grainSize = 50;
        this.density = 4;
        this.windowScan = 0;
        this.grainShape = 'blackman';
        this.timeStretch = 1.0; // REVERTED: Back to original v11 range
        
        // Filter & LFO
        this.filterNode = null;
        this.filterFreq = 2281;
        this.filterQ = 0.1;
        this.lfoNode = null;
        this.lfoGainNode = null;
        this.lfoSpeed = 1;
        this.lfoDepth = 0;
        this.lfoShape = 'sine';
        
        // NEW: Comb Seq LFO system - Each parameter gets its own LFO
        this.combSeqEnabled = false;
        this.combSeqLfos = new Map(); // Map of parameter name to LFO data
        this.combSeqIndicators = new Map(); // Map of parameter name to indicator element
        
        // Vocoder (replacing formant filter bank)
        this.vocoderBands = [];
        this.vocoderCarrierGains = [];
        this.vocoderModulatorEnvelopes = [];
        this.vocoderGainNode = null;
        this.vocoderMixNode = null;
        this.vocoderDryNode = null;
        this.vocoderMix = 0;
        this.vocoderBandGains = [1, 1, 1, 1, 1, 1, 1, 1];
        this.vocoderFrequencies = [200, 400, 800, 1200, 1600, 2400, 3200, 4800];
        
        // Wavefolder
        this.waveShaperNode = null;
        this.wavefoldAmount = 0;
        
        // Enhanced Ring Modulator
        this.ringModNode = null;
        this.ringModSource = null;
        this.ringModGrainSource = null;
        this.ringModOscSource = null;
        this.ringModNoiseSource = null;
        this.ringModMixNode = null;
        this.ringModDryNode = null;
        this.ringModMix = 0;
        this.ringModSourceType = 'grains'; // 'grains', 'oscillator', 'noise'
        this.ringModFreq = 440;
        
        // Enhanced Spectral Freeze & Phaser
        this.spectralFreezeNode = null;
        this.spectralFreeze = 0;
        this.spectralResonance = 0;
        this.spectralFeedbackNode = null;
        this.spectralFilterNode = null;
        this.phaserNodes = [];
        this.phaserLfo = null;
        this.phaserRate = 0.5;
        this.phaserDepth = 50;
        this.phaserFeedback = 0;
        this.phaserGain = 2.0;
        this.phaserMixNode = null;
        this.phaserDryNode = null;
        this.phaserWetGainNode = null;
        
        // NEW: WARP Module
        this.warpNode = null;
        this.wrapDelayNode = null;
        this.warpRate = 20;
        this.warpStart = 0;
        this.warpLength = 20;
        this.warpBuffer = null;
        this.warpCanvas = null;
        this.warpCtx = null;
        
        // 3D Panner
        this.pannerNode = null;
        this.pannerLfoX = null;
        this.pannerLfoY = null;
        this.pannerXDepth = 0;
        this.pannerYRange = 0;
        this.pannerSpeed = 0.5;
        
        // Frequency Shifter (enhanced)
        this.freqShifterNode = null;
        this.freqShifterOsc = null;
        this.freqShifterAmount = 0;
        this.freqShifterMix = 0;
        this.freqShifterWetNode = null;
        this.freqShifterDryNode = null;
        this.freqShifterGainBoost = null;
        
        // Volume & Mute
        this.masterGainNode = null;
        this.muteGainNode = null;
        this.volume = 0.7;
        this.isMuted = false;
        this.volumeBooster = null;
        
        // Enhanced Multi-Tap Granular Delay
        this.delayNodes = [];
        this.delayFeedbackNodes = [];
        this.delaySoftClipNode = null;
        this.delayAgingNodes = [];
        this.delayFlutterNodes = [];
        this.delayTime = 0.2;
        this.delayFeedback = 0.3;
        this.delayTaps = 4;
        this.delaySpread = 50;
        this.delayDrift = 0;
        this.delayAging = 0;
        this.delayFlutter = 0;
        this.delaySoftClip = 0;
        this.delayMix = 0;
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
        
        // Comb Filter Sequencer
        this.combSeqStreams = [];
        this.combSeqFrequencies = [440, 660, 880, 1100, 1320];
        this.combSeqLfo = null;
        this.combSeqLfoGain = null;
        this.combSeqSpeed = 4;
        this.combSeqDepth = 0;
        this.combSeqWetMix = 0;
        this.combSeqSqueeze = 0;
        this.combSeqCurrentStep = 0;
        this.combSeqCanvas = null;
        this.combSeqCtx = null;
        this.combSeqGainBoost = null;
        this.combSeqWetGainNode = null;
        this.combSeqDryGainNode = null;
        this.combSeqSoftClip = 0;
        this.combSeqSoftClipNode = null;
        
        // NEW: Chromatic Envelope
        this.chromaticEnvelope = null;
        this.envelopePoints = [
            {x: 0, y: 0.5},
            {x: 0.2, y: 0.8},
            {x: 0.4, y: 0.6},
            {x: 0.7, y: 0.9},
            {x: 1.0, y: 0.3}
        ];
        this.envelopeRate = 1;
        this.envelopeDepth = 0;
        this.envelopeLoopEnabled = false;
        this.envelopeCanvas = null;
        this.envelopeCtx = null;
        this.isDraggingEnvelope = false;
        this.dragPointIndex = -1;
        
        // NEW: 3-Band Frequency Isolator
        this.isolatorNodes = {
            lo: { filter: null, gain: null },
            mid: { filter: null, gain: null },
            hi: { filter: null, gain: null }
        };
        this.isolatorLo = 1;
        this.isolatorMid = 1;
        this.isolatorHi = 1;
        
        // Enhanced Grain animation
        this.grainCanvas = null;
        this.grainCtx = null;
        this.grainParticles = [];
        
        // Visual effects
        this.logoParticles = [];
        this.fallingDust = [];
        this.glassEffects = [];
        
        // Store default values for reset function
        this.defaultValues = {};
        
        this.initAudio();
        this.setupEventListeners();
        this.setupKeyboardControls();
        this.setupMobileKeyboard();
        this.setupGrainAnimation();
        this.setupVisualEffects();
        this.storeDefaultValues();
        this.setupPresets();
    }

    storeDefaultValues() {
        this.defaultValues = {
            grainSize: 50,
            density: 4,
            windowScan: 0,
            grainShape: 'blackman',
            timeStretch: 1.0,
            filterFreq: 2281,
            filterQ: 0.1,
            lfoSpeed: 1,
            lfoDepth: 0,
            lfoShape: 'sine',
            vocoderMix: 0,
            vocoderBandGains: [1, 1, 1, 1, 1, 1, 1, 1],
            wavefoldAmount: 0,
            ringModMix: 0,
            ringModSourceType: 'grains',
            ringModFreq: 440,
            spectralFreeze: 0,
            spectralResonance: 0,
            phaserRate: 0.5,
            phaserDepth: 50,
            phaserFeedback: 0,
            phaserGain: 2.0,
            warpRate: 20,
            warpStart: 0,
            warpLength: 20,
            pannerXDepth: 0,
            pannerYRange: 0,
            pannerSpeed: 0.5,
            freqShifterAmount: 0,
            freqShifterMix: 0,
            volume: 0.7,
            delayTime: 0.2,
            delayFeedback: 0.3,
            delayTaps: 4,
            delaySpread: 50,
            delayDrift: 0,
            delayAging: 0,
            delayFlutter: 0,
            delaySoftClip: 0,
            delayMix: 0,
            reverbSize: 0.5,
            reverbDecay: 0.5,
            reverbPreDelay: 0.01,
            reverbWetGain: 1.0,
            reverbMix: 0,
            combSeqEnabled: false,
            combSeqSpeed: 4,
            combSeqDepth: 0,
            combSeqWetMix: 0,
            combSeqSqueeze: 0,
            combSeqSoftClip: 0,
            combSeqFrequencies: [440, 660, 880, 1100, 1320],
            envelopeRate: 1,
            envelopeDepth: 0,
            envelopeLoopEnabled: false,
            isolatorLo: 1,
            isolatorMid: 1,
            isolatorHi: 1,
            wrapEnabled: false // CHANGED: Default to OFF
        };
    }

    // Setup preset management
    setupPresets() {
        this.presets = new Map();
        this.loadPresetsFromStorage();
        this.updatePresetSelect();
    }

    // Setup visual effects
    setupVisualEffects() {
        this.setupLogoParticles();
        this.setupFallingDust();
        this.setupGlassEffects();
        this.animateVisualEffects();
    }

    setupLogoParticles() {
        const logoContainer = document.getElementById('logoParticles');
        if (!logoContainer) return;
        
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            logoContainer.appendChild(particle);
        }
    }

    setupFallingDust() {
        const dustContainer = document.getElementById('fallingDust');
        if (!dustContainer) return;
        
        setInterval(() => {
            if (dustContainer.children.length < 20) {
                const dust = document.createElement('div');
                dust.className = 'dust-particle';
                dust.style.left = Math.random() * 100 + '%';
                dust.style.animationDelay = Math.random() * 2 + 's';
                dustContainer.appendChild(dust);
                
                setTimeout(() => {
                    if (dust.parentNode) {
                        dust.parentNode.removeChild(dust);
                    }
                }, 4000);
            }
        }, 500);
    }

    setupGlassEffects() {
        const glassContainer = document.getElementById('scopeGlassEffects');
        if (!glassContainer) return;
        
        const shine = document.createElement('div');
        shine.className = 'glass-shine';
        glassContainer.appendChild(shine);
        
        setInterval(() => {
            if (Math.random() < 0.1 && glassContainer.children.length < 5) {
                const droplet = document.createElement('div');
                droplet.className = 'droplet';
                droplet.style.left = Math.random() * 90 + 5 + '%';
                droplet.style.animationDelay = Math.random() * 2 + 's';
                glassContainer.appendChild(droplet);
                
                setTimeout(() => {
                    if (droplet.parentNode) {
                        droplet.parentNode.removeChild(droplet);
                    }
                }, 5000);
            }
        }, 2000);
    }

    animateVisualEffects() {
        requestAnimationFrame(() => this.animateVisualEffects());
    }
    async initAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create mute control
        this.muteGainNode = this.audioContext.createGain();
        this.muteGainNode.gain.value = 1;
        
        // Create volume booster
        this.volumeBooster = this.audioContext.createDynamicsCompressor();
        this.volumeBooster.threshold.value = -12;
        this.volumeBooster.knee.value = 30;
        this.volumeBooster.ratio.value = 12;
        this.volumeBooster.attack.value = 0.003;
        this.volumeBooster.release.value = 0.25;
        
        // Create master volume control
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.gain.value = this.volume;
        
        // Connect volume chain
        this.muteGainNode.connect(this.masterGainNode);
        this.masterGainNode.connect(this.volumeBooster);
        this.volumeBooster.connect(this.audioContext.destination);
        
        // Create recording destination
        this.recordingDestination = this.audioContext.createMediaStreamDestination();
        this.volumeBooster.connect(this.recordingDestination);
        
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
        
        // NEW: Initialize Comb Seq LFO system
        this.initCombSeqLFOSystem();
        
        // Create 8-band vocoder
        await this.initVocoder();
        
        // Create waveshaper
        this.waveShaperNode = this.audioContext.createWaveShaper();
        this.waveShaperNode.curve = this.makeWavefolderCurve(0);
        this.waveShaperNode.oversample = '4x';
        
        await this.initRingModulator();
        await this.initSpectralFreezeAndPhaser();
        await this.initWarpModule(); // NEW
        await this.init3DPannerAndFreqShifter();
        await this.initEnhancedDelay(); // Enhanced multi-tap delay
        await this.initReverb();
        await this.initCombSequencer();
        await this.initChromaticEnvelope(); // NEW
        await this.initFrequencyIsolator(); // NEW
        
        // Connect signal path
        this.connectAudioNodes();
    }

    // NEW: Initialize Comb Seq LFO System - Each parameter gets its own LFO
    initCombSeqLFOSystem() {
        // Define which parameters can be modulated by comb seq
        const modulatableParams = [
            'grainSize', 'density', 'windowScan', 'timeStretch',
            'filterFreq', 'filterQ',
            'vocoder1', 'vocoder2', 'vocoder3', 'vocoder4', 'vocoder5', 'vocoder6', 'vocoder7', 'vocoder8', 'vocoderMix',
            'wavefold', 'ringModMix', 'ringModFreq',
            'spectralFreeze', 'spectralResonance', 'phaserRate', 'phaserDepth', 'phaserFeedback', 'phaserGain',
            'warpRate', 'warpStart', 'warpLength',
            'pannerXDepth', 'pannerYRange', 'pannerSpeed',
            'freqShifterAmount', 'freqShifterMix',
            'delayTime', 'delayFeedback', 'delayTaps', 'delaySpread', 'delayDrift', 'delayAging', 'delayFlutter', 'delaySoftClip', 'delayMix',
            'reverbSize', 'reverbDecay', 'reverbPreDelay', 'reverbWetGain', 'reverbMix',
            'stringSeqSpeed', 'stringSeqDepth', 'stringSeqWetMix', 'stringSeqSqueeze', 'combSeqSoftClip',
            'stringSeqStep1', 'stringSeqStep2', 'stringSeqStep3', 'stringSeqStep4', 'stringSeqStep5',
            'envelopeRate', 'envelopeDepth',
            'isolatorLo', 'isolatorMid', 'isolatorHi'
        ];
        
        // Create LFO for each parameter
        modulatableParams.forEach(paramName => {
            const lfo = this.audioContext.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.1; // Slow default
            
            const lfoGain = this.audioContext.createGain();
            lfoGain.gain.value = 0; // Start inactive
            
            lfo.connect(lfoGain);
            lfo.start();
            
            this.combSeqLfos.set(paramName, {
                oscillator: lfo,
                gainNode: lfoGain,
                depth: 0,
                active: false
            });
            
            // Store indicator reference
            const indicator = document.getElementById(paramName + 'LfoIndicator');
            if (indicator) {
                this.combSeqIndicators.set(paramName, indicator);
            }
        });
    }

    // NEW: Update Comb Seq LFO for a specific parameter
    updateCombSeqLFO(paramName, depth = 0) {
        const lfoData = this.combSeqLfos.get(paramName);
        const indicator = this.combSeqIndicators.get(paramName);
        
        if (!lfoData) return;
        
        const isActive = this.combSeqEnabled && depth > 0;
        lfoData.active = isActive;
        lfoData.depth = depth;
        
        // Update LFO frequency based on comb seq speed
        lfoData.oscillator.frequency.value = this.combSeqSpeed;
        
        // Update LFO depth
        lfoData.gainNode.gain.value = isActive ? (depth / 100) * 50 : 0; // Scale depth
        
        // Update visual indicator
        if (indicator) {
            indicator.classList.toggle('active', isActive);
        }
        
        // Connect LFO to the actual parameter if active
        if (isActive) {
            this.connectLFOToParameter(paramName, lfoData);
        } else {
            this.disconnectLFOFromParameter(paramName, lfoData);
        }
    }

    // NEW: Connect LFO to actual audio parameter
    connectLFOToParameter(paramName, lfoData) {
        try {
            // Disconnect any existing connections
            this.disconnectLFOFromParameter(paramName, lfoData);
            
            // Connect based on parameter type
            switch (paramName) {
                case 'filterFreq':
                    if (this.filterNode) {
                        lfoData.gainNode.connect(this.filterNode.frequency);
                    }
                    break;
                case 'filterQ':
                    if (this.filterNode) {
                        lfoData.gainNode.connect(this.filterNode.Q);
                    }
                    break;
                case 'delayTime':
                    this.delayNodes.forEach(delay => {
                        if (delay) lfoData.gainNode.connect(delay.delayTime);
                    });
                    break;
                case 'delayFeedback':
                    this.delayFeedbackNodes.forEach(feedback => {
                        if (feedback) lfoData.gainNode.connect(feedback.gain);
                    });
                    break;
                // Add more parameter connections as needed
            }
        } catch (error) {
            console.warn(`Could not connect LFO to ${paramName}:`, error);
        }
    }

    // NEW: Disconnect LFO from parameter
    disconnectLFOFromParameter(paramName, lfoData) {
        try {
            // Safely disconnect from all possible targets
            lfoData.gainNode.disconnect();
        } catch (error) {
            // Ignore disconnect errors
        }
    }

    // NEW: Toggle Comb Seq button text
    updateCombSeqButton() {
        const button = document.getElementById('stringSeqToggle');
        if (button) {
            button.textContent = this.combSeqEnabled ? 'ON' : 'OFF';
            button.classList.toggle('active', this.combSeqEnabled);
        }
    }

    async initVocoder() {
        this.vocoderGainNode = this.audioContext.createGain();
        this.vocoderGainNode.gain.value = 4.0;
        
        this.vocoderBands = [];
        this.vocoderCarrierGains = [];
        this.vocoderModulatorEnvelopes = [];
        
        for (let i = 0; i < 8; i++) {
            const carrierFilter = this.audioContext.createBiquadFilter();
            carrierFilter.type = 'bandpass';
            carrierFilter.frequency.value = this.vocoderFrequencies[i];
            carrierFilter.Q.value = 8;
            
            const modulatorFilter = this.audioContext.createBiquadFilter();
            modulatorFilter.type = 'bandpass';
            modulatorFilter.frequency.value = this.vocoderFrequencies[i];
            modulatorFilter.Q.value = 8;
            
            const envelopeFollower = this.audioContext.createGain();
            envelopeFollower.gain.value = 0;
            
            const carrierGain = this.audioContext.createGain();
            carrierGain.gain.value = this.vocoderBandGains[i];
            
            const bandGain = this.audioContext.createGain();
            bandGain.gain.value = 1;
            
            carrierFilter.connect(carrierGain);
            carrierGain.connect(bandGain);
            bandGain.connect(this.vocoderGainNode);
            
            this.vocoderBands.push({
                carrierFilter,
                modulatorFilter,
                envelopeFollower,
                carrierGain,
                bandGain
            });
            this.vocoderCarrierGains.push(carrierGain);
            this.vocoderModulatorEnvelopes.push(envelopeFollower);
        }
        
        this.vocoderMixNode = this.audioContext.createGain();
        this.vocoderDryNode = this.audioContext.createGain();
        this.vocoderMixNode.gain.value = 0;
        this.vocoderDryNode.gain.value = 1;
        
        this.vocoderGainNode.connect(this.vocoderMixNode);
    }

    // Enhanced Ring Modulator with three sources
    async initRingModulator() {
        this.ringModNode = this.audioContext.createGain();
        this.ringModNode.gain.value = 0;
        
        // Create noise source
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        
        this.ringModNoiseSource = this.audioContext.createBufferSource();
        this.ringModNoiseSource.buffer = noiseBuffer;
        this.ringModNoiseSource.loop = true;
        this.ringModNoiseSource.start();
        
        // Create oscillator source
        this.ringModOscSource = this.audioContext.createOscillator();
        this.ringModOscSource.type = 'sine';
        this.ringModOscSource.frequency.value = this.ringModFreq;
        this.ringModOscSource.start();
        
        // Grain source will be connected dynamically during grain creation
        this.ringModGrainSource = this.audioContext.createGain();
        this.ringModGrainSource.gain.value = 1;
        
        // Initialize with grain source
        this.ringModSource = this.ringModGrainSource;
        this.ringModSource.connect(this.ringModNode.gain);
        
        this.ringModMixNode = this.audioContext.createGain();
        this.ringModDryNode = this.audioContext.createGain();
        this.ringModMixNode.gain.value = 0;
        this.ringModDryNode.gain.value = 1;
    }

    // Enhanced Spectral Freeze with resonance and improved phaser
    async initSpectralFreezeAndPhaser() {
        // Enhanced Spectral Freeze with resonance
        this.spectralFreezeNode = this.audioContext.createDelay(0.1);
        this.spectralFreezeNode.delayTime.value = 0.05;
        
        // Add resonant filter for spectral coloration
        this.spectralFilterNode = this.audioContext.createBiquadFilter();
        this.spectralFilterNode.type = 'peaking';
        this.spectralFilterNode.frequency.value = 1000;
        this.spectralFilterNode.Q.value = 5;
        this.spectralFilterNode.gain.value = 0;
        
        // Create feedback loop
        this.spectralFeedbackNode = this.audioContext.createGain();
        this.spectralFeedbackNode.gain.value = 0;
        
        // Connect spectral freeze chain
        this.spectralFreezeNode.connect(this.spectralFilterNode);
        this.spectralFilterNode.connect(this.spectralFeedbackNode);
        this.spectralFeedbackNode.connect(this.spectralFreezeNode);
        
        // Create 12-stage phaser
        this.phaserNodes = [];
        for (let i = 0; i < 12; i++) {
            const allpass = this.audioContext.createBiquadFilter();
            allpass.type = 'allpass';
            allpass.frequency.value = 500 + i * 200;
            allpass.Q.value = 8;
            this.phaserNodes.push(allpass);
            
            if (i > 0) {
                this.phaserNodes[i - 1].connect(allpass);
            }
        }
        
        // Phaser LFO
        this.phaserLfo = this.audioContext.createOscillator();
        this.phaserLfo.type = 'sine';
        this.phaserLfo.frequency.value = this.phaserRate;
        
        const phaserLfoGain = this.audioContext.createGain();
        phaserLfoGain.gain.value = 0;
        this.phaserLfo.connect(phaserLfoGain);
        
        this.phaserNodes.forEach(node => {
            phaserLfoGain.connect(node.frequency);
        });
        
        this.phaserLfo.start();
        
        // Phaser mix and feedback
        this.phaserMixNode = this.audioContext.createGain();
        this.phaserDryNode = this.audioContext.createGain();
        this.phaserWetGainNode = this.audioContext.createGain();
        this.phaserMixNode.gain.value = 0;
        this.phaserDryNode.gain.value = 1;
        this.phaserWetGainNode.gain.value = 1;
        
        this.phaserGainNode = this.audioContext.createGain();
        this.phaserGainNode.gain.value = this.phaserGain;
        
        this.phaserSaturation = this.audioContext.createWaveShaper();
        this.phaserSaturation.curve = this.makeHarmonicSaturationCurve();
        this.phaserSaturation.oversample = '2x';
        
        if (this.phaserNodes.length > 0) {
            this.phaserNodes[this.phaserNodes.length - 1].connect(this.phaserWetGainNode);
            this.phaserWetGainNode.connect(this.phaserGainNode);
            this.phaserGainNode.connect(this.phaserSaturation);
            this.phaserSaturation.connect(this.phaserMixNode);
        }
    }

    // NEW: Initialize WARP Module
   async initWarpModule() {
    // Create delay node for micro-loop
    this.wrapDelayNode = this.audioContext.createDelay(0.02);
    this.wrapDelayNode.delayTime.value = this.warpLength / 1000;
    
    // Create feedback for ping-pong effect
    this.warpFeedbackNode = this.audioContext.createGain();
    this.warpFeedbackNode.gain.value = 0; // Start with no feedback
    
    // Create wet/dry mix nodes for proper bypass
    this.warpWetNode = this.audioContext.createGain();
    this.warpDryNode = this.audioContext.createGain();
    this.warpWetNode.gain.value = 0; // Start dry
    this.warpDryNode.gain.value = 1; // Start dry
    
    // Create rate control using oscillator
    this.warpRateOsc = this.audioContext.createOscillator();
    this.warpRateOsc.type = 'triangle'; // Smoother modulation
    this.warpRateOsc.frequency.value = this.warpRate;

    this.warpRateGain = this.audioContext.createGain();
    this.warpRateGain.gain.value = 0; // Start disconnected

    this.warpRateOsc.connect(this.warpRateGain);
    this.warpRateOsc.start();
    
    // Connect warp chain
    this.wrapDelayNode.connect(this.warpFeedbackNode);
    this.warpFeedbackNode.connect(this.wrapDelayNode); // Feedback loop
    this.wrapDelayNode.connect(this.warpWetNode);
    
    // Setup canvas for visualization
    this.setupWarpVisualization();
}

    // NEW: Setup WARP visualization
    setupWarpVisualization() {
        this.warpCanvas = document.getElementById('warpCanvas');
        if (this.warpCanvas) {
            this.warpCtx = this.warpCanvas.getContext('2d');
            this.animateWarpDisplay();
        }
    }

    // NEW: Animate WARP display
animateWarpDisplay() {
    if (!this.warpCtx) {
        requestAnimationFrame(() => this.animateWarpDisplay());
        return;
    }
    
    const canvas = this.warpCanvas;
    const ctx = this.warpCtx;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 45;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (this.wrapEnabled) { // CHANGED: Removed loop dependency
        const time = this.audioContext.currentTime;
        
        // Draw loop visualization
        ctx.strokeStyle = '#008080';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Draw waveform around circle
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
            const t = (angle / (Math.PI * 2)) * this.warpLength + time * this.warpRate;
            const wave = Math.sin(t * 10) * 0.3;
            const x = centerX + Math.cos(angle) * (radius + wave * 10);
            const y = centerY + Math.sin(angle) * (radius + wave * 10);
            
            if (angle === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.stroke();
        
        // Add glow effect
        ctx.shadowColor = '#008080';
        ctx.shadowBlur = 4;
        ctx.stroke();
        
        // Draw start point indicator
        const maxLength = 20; // Max warp length
        const startAngle = (this.warpStart / maxLength) * Math.PI * 2;
        const startX = centerX + Math.cos(startAngle) * radius;
        const startY = centerY + Math.sin(startAngle) * radius;

        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(startX, startY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw length arc
        const lengthAngle = (this.warpLength / maxLength) * Math.PI * 2;
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 10, startAngle, startAngle + lengthAngle);
        ctx.stroke();
    }
    
    requestAnimationFrame(() => this.animateWarpDisplay());
}
    async init3DPannerAndFreqShifter() {
        // Create 3D panner node
        this.pannerNode = this.audioContext.createPanner();
        this.pannerNode.panningModel = 'HRTF';
        this.pannerNode.distanceModel = 'inverse';
        this.pannerNode.refDistance = 1;
        this.pannerNode.maxDistance = 10000;
        this.pannerNode.rolloffFactor = 1;
        this.pannerNode.coneInnerAngle = 360;
        this.pannerNode.coneOuterAngle = 0;
        this.pannerNode.coneOuterGain = 0;
        
        // Set listener position
        if (this.audioContext.listener.positionX) {
            this.audioContext.listener.positionX.value = 0;
            this.audioContext.listener.positionY.value = 0;
            this.audioContext.listener.positionZ.value = 1;
        } else {
            this.audioContext.listener.setPosition(0, 0, 1);
        }
        
        // Create LFOs for X and Y axis movement
        this.pannerLfoX = this.audioContext.createOscillator();
        this.pannerLfoX.type = 'sine';
        this.pannerLfoX.frequency.value = this.pannerSpeed;
        
        this.pannerLfoY = this.audioContext.createOscillator();
        this.pannerLfoY.type = 'sine';
        this.pannerLfoY.frequency.value = this.pannerSpeed * 0.7;
        
        // Gain nodes for depth control
        this.pannerXGain = this.audioContext.createGain();
        this.pannerYGain = this.audioContext.createGain();
        this.pannerXGain.gain.value = 0;
        this.pannerYGain.gain.value = 0;
        
        // Connect LFOs to panner position
        this.pannerLfoX.connect(this.pannerXGain);
        this.pannerLfoY.connect(this.pannerYGain);
        
        if (this.pannerNode.positionX) {
            this.pannerXGain.connect(this.pannerNode.positionX);
            this.pannerYGain.connect(this.pannerNode.positionY);
        }
        
        this.pannerLfoX.start();
        this.pannerLfoY.start();
        
        // Create Enhanced Frequency Shifter
        this.freqShifterOsc = this.audioContext.createOscillator();
        this.freqShifterOsc.type = 'sine';
        this.freqShifterOsc.frequency.value = 0;
        this.freqShifterOsc.start();
        
        this.freqShifterNode = this.audioContext.createGain();
        this.freqShifterNode.gain.value = 0;
        
        this.freqShifterGainBoost = this.audioContext.createGain();
        this.freqShifterGainBoost.gain.value = 3.0;
        
        this.freqShifterOsc.connect(this.freqShifterNode.gain);
        
        this.freqShifterWetNode = this.audioContext.createGain();
        this.freqShifterDryNode = this.audioContext.createGain();
        this.freqShifterWetNode.gain.value = 0;
        this.freqShifterDryNode.gain.value = 1;
    }

    // NEW: Enhanced Multi-Tap Granular Delay
    async initEnhancedDelay() {
        this.delayNodes = [];
        this.delayFeedbackNodes = [];
        this.delayAgingNodes = [];
        this.delayFlutterNodes = [];
        
        // Create multiple delay taps
        for (let i = 0; i < 8; i++) {
            // Delay node
            const delayNode = this.audioContext.createDelay(5.0);
            delayNode.delayTime.value = this.delayTime * (i + 1) / 8;
            
            // Feedback node
            const feedbackNode = this.audioContext.createGain();
            feedbackNode.gain.value = this.delayFeedback * (0.8 - i * 0.1); // Decreasing feedback
            
            // Aging filter (bit reduction simulation)
            const agingFilter = this.audioContext.createBiquadFilter();
            agingFilter.type = 'lowpass';
            agingFilter.frequency.value = 20000; // Start with full bandwidth
            agingFilter.Q.value = 0.7;
            
            // Flutter (wow and flutter simulation)
            const flutterLfo = this.audioContext.createOscillator();
            flutterLfo.type = 'sine';
            flutterLfo.frequency.value = 0.5 + Math.random() * 2; // Random flutter rate
            
            const flutterGain = this.audioContext.createGain();
            flutterGain.gain.value = 0;
            
            flutterLfo.connect(flutterGain);
            flutterGain.connect(delayNode.delayTime);
            flutterLfo.start();
            
            // Connect delay chain
            delayNode.connect(agingFilter);
            agingFilter.connect(feedbackNode);
            feedbackNode.connect(delayNode); // Feedback loop
            
            this.delayNodes.push(delayNode);
            this.delayFeedbackNodes.push(feedbackNode);
            this.delayAgingNodes.push(agingFilter);
            this.delayFlutterNodes.push({
                lfo: flutterLfo,
                gain: flutterGain
            });
        }
        
        // Soft clipper for delay
        this.delaySoftClipNode = this.audioContext.createWaveShaper();
        this.delaySoftClipNode.curve = this.makeSoftClipCurve(0);
        this.delaySoftClipNode.oversample = '2x';
        
        // Delay mix controls
        this.delayWetNode = this.audioContext.createGain();
        this.delayWetNode.gain.value = this.delayMix;
        
        this.delayDryNode = this.audioContext.createGain();
        this.delayDryNode.gain.value = 1 - this.delayMix;
        
        // Connect all delay taps to wet output
        this.delayNodes.forEach(delayNode => {
            delayNode.connect(this.delaySoftClipNode);
        });
        this.delaySoftClipNode.connect(this.delayWetNode);
    }

    // NEW: Update enhanced delay parameters
    updateEnhancedDelay() {
        // Update delay times with spread and drift
        this.delayNodes.forEach((delayNode, i) => {
            let baseTime = this.delayTime * (i + 1) / this.delayTaps;
            
            // Apply spread
            const spreadMultiplier = 1 + (this.delaySpread / 100) * (i / this.delayTaps);
            baseTime *= spreadMultiplier;
            
            // Apply drift (random variation)
            if (this.delayDrift > 0) {
                const driftAmount = (this.delayDrift / 100) * 0.1; // Max 10% drift
                const drift = (Math.random() - 0.5) * driftAmount;
                baseTime *= (1 + drift);
            }
            
            delayNode.delayTime.value = Math.min(baseTime, 5.0);
        });
        
        // Update feedback
        this.delayFeedbackNodes.forEach((feedbackNode, i) => {
            feedbackNode.gain.value = this.delayFeedback * (0.9 - i * 0.1);
        });
        
        // Update aging (tape degradation)
        this.delayAgingNodes.forEach((agingFilter, i) => {
            const agingAmount = this.delayAging / 100;
            // Reduce frequency and sample rate simulation
            const maxFreq = 20000 * (1 - agingAmount * 0.8);
            agingFilter.frequency.value = Math.max(maxFreq, 1000);
        });
        
        // Update flutter
        this.delayFlutterNodes.forEach((flutter, i) => {
            const flutterAmount = this.delayFlutter / 100;
            flutter.gain.gain.value = flutterAmount * 0.002; // Subtle flutter
        });
        
        // Update soft clip
        this.delaySoftClipNode.curve = this.makeSoftClipCurve(this.delaySoftClip / 100);
        
        // Update mix
        this.delayWetNode.gain.value = this.delayMix;
        this.delayDryNode.gain.value = 1 - this.delayMix;
    }

    async initReverb() {
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
    }

    async initCombSequencer() {
        this.combSeqLfo = this.audioContext.createOscillator();
        this.combSeqLfo.type = 'sine';
        this.combSeqLfo.frequency.value = this.combSeqSpeed;
        
        this.combSeqLfoGain = this.audioContext.createGain();
        this.combSeqLfoGain.gain.value = 0;
        
        this.combSeqGainBoost = this.audioContext.createGain();
        this.combSeqGainBoost.gain.value = 3.0;
        
        this.combSeqSoftClipNode = this.audioContext.createWaveShaper();
        this.combSeqSoftClipNode.curve = this.makeSoftClipCurve(0);
        this.combSeqSoftClipNode.oversample = '2x';
        
        this.combSeqWetGainNode = this.audioContext.createGain();
        this.combSeqDryGainNode = this.audioContext.createGain();
        this.combSeqWetGainNode.gain.value = 0;
        this.combSeqDryGainNode.gain.value = 1;
        
        this.combSeqLfo.connect(this.combSeqLfoGain);
        this.combSeqLfo.start();
        
        this.combSeqStreams = [];
        for (let i = 0; i < 5; i++) {
            const stream = {
                delayNode: this.audioContext.createDelay(0.1),
                feedbackGain: this.audioContext.createGain(),
                outputGain: this.audioContext.createGain(),
                mixGain: this.audioContext.createGain(),
                currentStep: i,
                lastTriggerTime: 0,
                frequency: this.combSeqFrequencies[i]
            };
            
            const delayTime = 1 / stream.frequency;
            stream.delayNode.delayTime.value = Math.min(delayTime, 0.1);
            stream.feedbackGain.gain.value = 0.7;
            stream.outputGain.gain.value = 0.3;
            stream.mixGain.gain.value = 0;
            
            stream.delayNode.connect(stream.feedbackGain);
            stream.feedbackGain.connect(stream.delayNode);
            stream.delayNode.connect(stream.outputGain);
            stream.outputGain.connect(stream.mixGain);
            stream.mixGain.connect(this.combSeqGainBoost);
            
            this.combSeqStreams.push(stream);
        }
        
        this.combSeqGainBoost.connect(this.combSeqSoftClipNode);
        this.combSeqSoftClipNode.connect(this.combSeqWetGainNode);
        
        this.setupCombSeqVisualization();
    }

    setupCombSeqVisualization() {
        this.combSeqCanvas = document.getElementById('stringSeqWave');
        if (this.combSeqCanvas) {
            this.combSeqCtx = this.combSeqCanvas.getContext('2d');
            this.animateCombSeqWave();
        }
    }

    animateCombSeqWave() {
        if (!this.combSeqCtx || !this.combSeqEnabled) {
            requestAnimationFrame(() => this.animateCombSeqWave());
            return;
        }
        
        const canvas = this.combSeqCanvas;
        const ctx = this.combSeqCtx;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.combSeqDepth > 0) {
            const time = this.audioContext.currentTime;
            const width = canvas.width;
            const height = canvas.height;
            const centerY = height / 2;
            
            ctx.strokeStyle = '#008080';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let x = 0; x < width; x++) {
                const t = (x / width) * 4 + time * this.combSeqSpeed;
                let wave = 0;
                
                for (let i = 0; i < 5; i++) {
                    const freq = this.combSeqFrequencies[i];
                    const amplitude = this.combSeqDepth / 100 / 5;
                    wave += Math.sin(t * freq * Math.PI * 2 / 1000) * amplitude;
                }
                
                if (this.combSeqSqueeze > 0) {
                    const squeeze = 1 + this.combSeqSqueeze * 9;
                    wave = Math.tanh(wave * squeeze) / Math.tanh(squeeze);
                }
                
                const y = centerY + wave * (height * 0.3);
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
            
            ctx.shadowColor = '#008080';
            ctx.shadowBlur = 4;
            ctx.stroke();
        }
        
        requestAnimationFrame(() => this.animateCombSeqWave());
    }

    // NEW: Initialize Chromatic Envelope
    async initChromaticEnvelope() {
        // Create envelope follower oscillator
        this.chromaticEnvelope = this.audioContext.createOscillator();
        this.chromaticEnvelope.type = 'sine';
        this.chromaticEnvelope.frequency.value = this.envelopeRate;
        
        this.envelopeGainNode = this.audioContext.createGain();
        this.envelopeGainNode.gain.value = 0;
        
        this.chromaticEnvelope.connect(this.envelopeGainNode);
        this.chromaticEnvelope.start();
        
        // Setup canvas for envelope editing
        this.setupEnvelopeCanvas();
    }

    // NEW: Setup Envelope Canvas
    setupEnvelopeCanvas() {
        this.envelopeCanvas = document.getElementById('envelopeCanvas');
        if (!this.envelopeCanvas) return;
        
        this.envelopeCtx = this.envelopeCanvas.getContext('2d');
        
        // Add mouse event listeners for envelope editing
        this.envelopeCanvas.addEventListener('mousedown', (e) => this.startEnvelopeDrag(e));
        this.envelopeCanvas.addEventListener('mousemove', (e) => this.dragEnvelope(e));
        this.envelopeCanvas.addEventListener('mouseup', () => this.endEnvelopeDrag());
        this.envelopeCanvas.addEventListener('mouseleave', () => this.endEnvelopeDrag());
        
        // Touch events for mobile
        this.envelopeCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.startEnvelopeDrag(mouseEvent);
        });
        
        this.envelopeCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.dragEnvelope(mouseEvent);
        });
        
        this.envelopeCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.endEnvelopeDrag();
        });
        
        this.animateEnvelope();
    }

    // NEW: Envelope editing functions
    startEnvelopeDrag(e) {
        const rect = this.envelopeCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1 - (e.clientY - rect.top) / rect.height;
        
        // Find closest point
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        this.envelopePoints.forEach((point, index) => {
            const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
            if (distance < closestDistance && distance < 0.1) {
                closestDistance = distance;
                closestIndex = index;
            }
        });
        
        if (closestDistance < 0.1) {
            this.isDraggingEnvelope = true;
            this.dragPointIndex = closestIndex;
        }
    }

    dragEnvelope(e) {
        if (!this.isDraggingEnvelope || this.dragPointIndex < 0) return;
        
        const rect = this.envelopeCanvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
        
        // Don't allow moving first and last points horizontally
        if (this.dragPointIndex === 0 || this.dragPointIndex === this.envelopePoints.length - 1) {
            this.envelopePoints[this.dragPointIndex].y = y;
        } else {
            this.envelopePoints[this.dragPointIndex].x = x;
            this.envelopePoints[this.dragPointIndex].y = y;
            
            // Keep points sorted by x
            this.envelopePoints.sort((a, b) => a.x - b.x);
            
            // Find new index after sorting
            this.dragPointIndex = this.envelopePoints.findIndex(point => 
                Math.abs(point.x - x) < 0.01 && Math.abs(point.y - y) < 0.01
            );
        }
    }

    endEnvelopeDrag() {
        this.isDraggingEnvelope = false;
        this.dragPointIndex = -1;
    }

    // NEW: Animate envelope display
    animateEnvelope() {
        if (!this.envelopeCtx) {
            requestAnimationFrame(() => this.animateEnvelope());
            return;
        }
        
        const canvas = this.envelopeCanvas;
        const ctx = this.envelopeCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(0, 128, 128, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * width;
            const y = (i / 10) * height;
            
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw envelope curve
        ctx.strokeStyle = '#008080';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = 0; x < width; x++) {
            const t = x / width;
            const y = this.interpolateEnvelope(t);
            const canvasY = height - (y * height);
            
            if (x === 0) {
                ctx.moveTo(x, canvasY);
            } else {
                ctx.lineTo(x, canvasY);
            }
        }
        
        ctx.stroke();
        
        // Draw control points
        ctx.fillStyle = '#ff4444';
        this.envelopePoints.forEach(point => {
            const x = point.x * width;
            const y = height - (point.y * height);
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Show current position if looping
        if (this.envelopeLoopEnabled && this.envelopeDepth > 0) {
            const time = this.audioContext.currentTime;
            const loopPos = (time * this.envelopeRate) % 1;
            const x = loopPos * width;
            
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        requestAnimationFrame(() => this.animateEnvelope());
    }

    // NEW: Interpolate envelope value at time t (0-1)
    interpolateEnvelope(t) {
        if (this.envelopePoints.length < 2) return 0.5;
        
        // Find surrounding points
        let leftPoint = this.envelopePoints[0];
        let rightPoint = this.envelopePoints[this.envelopePoints.length - 1];
        
        for (let i = 0; i < this.envelopePoints.length - 1; i++) {
            if (t >= this.envelopePoints[i].x && t <= this.envelopePoints[i + 1].x) {
                leftPoint = this.envelopePoints[i];
                rightPoint = this.envelopePoints[i + 1];
                break;
            }
        }
        
        // Linear interpolation
        if (leftPoint.x === rightPoint.x) return leftPoint.y;
        
        const ratio = (t - leftPoint.x) / (rightPoint.x - leftPoint.x);
        return leftPoint.y + (rightPoint.y - leftPoint.y) * ratio;
    }

    // NEW: Initialize 3-Band Frequency Isolator
    async initFrequencyIsolator() {
        // Low band (20Hz - 250Hz)
        this.isolatorNodes.lo.filter = this.audioContext.createBiquadFilter();
        this.isolatorNodes.lo.filter.type = 'lowpass';
        this.isolatorNodes.lo.filter.frequency.value = 250;
        this.isolatorNodes.lo.filter.Q.value = 0.7;
        
        this.isolatorNodes.lo.gain = this.audioContext.createGain();
        this.isolatorNodes.lo.gain.gain.value = this.isolatorLo;
        
        // Mid band (250Hz - 4kHz)
        this.isolatorNodes.mid.filter = this.audioContext.createBiquadFilter();
        this.isolatorNodes.mid.filter.type = 'bandpass';
        this.isolatorNodes.mid.filter.frequency.value = 1000;
        this.isolatorNodes.mid.filter.Q.value = 0.5;
        
        this.isolatorNodes.mid.gain = this.audioContext.createGain();
        this.isolatorNodes.mid.gain.gain.value = this.isolatorMid;
        
        // High band (4kHz+)
        this.isolatorNodes.hi.filter = this.audioContext.createBiquadFilter();
        this.isolatorNodes.hi.filter.type = 'highpass';
        this.isolatorNodes.hi.filter.frequency.value = 4000;
        this.isolatorNodes.hi.filter.Q.value = 0.7;
        
        this.isolatorNodes.hi.gain = this.audioContext.createGain();
        this.isolatorNodes.hi.gain.gain.value = this.isolatorHi;
        
        // Connect filter chains
        this.isolatorNodes.lo.filter.connect(this.isolatorNodes.lo.gain);
        this.isolatorNodes.mid.filter.connect(this.isolatorNodes.mid.gain);
        this.isolatorNodes.hi.filter.connect(this.isolatorNodes.hi.gain);
        
        // Create output summing node
        this.isolatorOutputNode = this.audioContext.createGain();
        this.isolatorOutputNode.gain.value = 1;
        
        this.isolatorNodes.lo.gain.connect(this.isolatorOutputNode);
        this.isolatorNodes.mid.gain.connect(this.isolatorOutputNode);
        this.isolatorNodes.hi.gain.connect(this.isolatorOutputNode);
    }
    connectAudioNodes() {
        // Enhanced signal path with new modules
        // Grains → Filter → Vocoder → Wavefolder → Ring Mod → Spectral Freeze → Phaser → WARP → 3D Panner → Freq Shifter → Delay → Reverb → Comb Seq → Envelope → Isolator → Output
        
        // Filter to vocoder routing
        this.filterNode.connect(this.vocoderDryNode);
        
        // Connect each vocoder band
        for (let i = 0; i < 8; i++) {
            this.filterNode.connect(this.vocoderBands[i].carrierFilter);
        }
        
        // Vocoder to wavefolder
        this.vocoderDryNode.connect(this.waveShaperNode);
        this.vocoderMixNode.connect(this.waveShaperNode);
        
        // Wavefolder to ring mod
        this.waveShaperNode.connect(this.ringModNode);
        this.waveShaperNode.connect(this.ringModDryNode);
        
        // Ring mod to spectral freeze
        this.ringModNode.connect(this.spectralFreezeNode);
        this.ringModDryNode.connect(this.spectralFreezeNode);
        
        // Spectral freeze to phaser
        this.spectralFreezeNode.connect(this.phaserDryNode);
        this.spectralFreezeNode.connect(this.phaserNodes[0]);
        
      // Phaser to WARP (NEW)
this.phaserDryNode.connect(this.warpDryNode);
this.phaserMixNode.connect(this.warpDryNode);
this.phaserDryNode.connect(this.wrapDelayNode);
this.phaserMixNode.connect(this.wrapDelayNode);

// WARP output to 3D panner
this.warpDryNode.connect(this.pannerNode);
this.warpWetNode.connect(this.pannerNode);
        
        // 3D panner to frequency shifter
        this.pannerNode.connect(this.freqShifterDryNode);
        this.pannerNode.connect(this.freqShifterNode);
        this.freqShifterNode.connect(this.freqShifterGainBoost);
        this.freqShifterGainBoost.connect(this.freqShifterWetNode);
        
        // Frequency shifter to enhanced delay
        this.freqShifterDryNode.connect(this.delayDryNode);
        this.freqShifterWetNode.connect(this.delayDryNode);
        
        // Connect to all delay taps
        this.delayNodes.forEach(delayNode => {
            this.freqShifterDryNode.connect(delayNode);
            this.freqShifterWetNode.connect(delayNode);
        });
        
        // Delay to reverb
        this.delayDryNode.connect(this.reverbDryNode);
        this.delayDryNode.connect(this.reverbPreDelayNode);
        this.delayWetNode.connect(this.reverbDryNode);
        this.delayWetNode.connect(this.reverbPreDelayNode);
        
        // Reverb chain
        this.reverbPreDelayNode.connect(this.reverbNode);
        this.reverbNode.connect(this.reverbWetGainNode);
        this.reverbWetGainNode.connect(this.reverbWetNode);
        
        // Reverb to comb sequencer
        this.reverbDryNode.connect(this.combSeqDryGainNode);
        this.reverbWetNode.connect(this.combSeqDryGainNode);
        
        // Connect comb filter inputs
        if (this.combSeqStreams.length > 0) {
            this.combSeqStreams.forEach(stream => {
                this.reverbDryNode.connect(stream.delayNode);
                this.reverbWetNode.connect(stream.delayNode);
            });
        }
        
        // Comb seq to isolator (NEW)
        this.combSeqDryGainNode.connect(this.isolatorNodes.lo.filter);
        this.combSeqDryGainNode.connect(this.isolatorNodes.mid.filter);
        this.combSeqDryGainNode.connect(this.isolatorNodes.hi.filter);
        this.combSeqWetGainNode.connect(this.isolatorNodes.lo.filter);
        this.combSeqWetGainNode.connect(this.isolatorNodes.mid.filter);
        this.combSeqWetGainNode.connect(this.isolatorNodes.hi.filter);
        
        // Final isolator output to mute control
        this.isolatorOutputNode.connect(this.muteGainNode);
    }

    makeWavefolderCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            if (amount === 0) {
                curve[i] = x;
            } else {
                const foldFactor = 1 + amount * 4;
                curve[i] = Math.tanh(x * foldFactor) / Math.tanh(foldFactor);
                
                const harmonics = Math.sin(x * foldFactor * 3) * 0.1 * amount;
                curve[i] += harmonics;
                
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

    makeHarmonicSaturationCurve() {
        const samples = 44100;
        const curve = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = Math.tanh(x * 2) * 0.8 + Math.sin(x * Math.PI) * 0.1;
            curve[i] = Math.max(-1, Math.min(1, curve[i]));
        }
        
        return curve;
    }

    getGrainEnvelope(shape, length) {
        const envelope = new Float32Array(length);
        
        switch (shape) {
            case 'blackman':
                for (let i = 0; i < length; i++) {
                    const n = i / (length - 1);
                    envelope[i] = 0.42 - 0.5 * Math.cos(2 * Math.PI * n) + 0.08 * Math.cos(4 * Math.PI * n);
                }
                break;
                
            case 'hanning':
                for (let i = 0; i < length; i++) {
                    const n = i / (length - 1);
                    envelope[i] = 0.5 * (1 - Math.cos(2 * Math.PI * n));
                }
                break;
                
            case 'down-ramp':
                for (let i = 0; i < length; i++) {
                    envelope[i] = 1 - (i / (length - 1));
                }
                break;
                
            case 'expodec':
                for (let i = 0; i < length; i++) {
                    const n = i / (length - 1);
                    envelope[i] = Math.exp(-5 * n);
                }
                break;
                
            case 'sine':
                for (let i = 0; i < length; i++) {
                    const n = i / (length - 1);
                    envelope[i] = Math.sin(Math.PI * n);
                }
                break;
                
            default:
                for (let i = 0; i < length; i++) {
                    const n = i / (length - 1);
                    envelope[i] = 0.42 - 0.5 * Math.cos(2 * Math.PI * n) + 0.08 * Math.cos(4 * Math.PI * n);
                }
        }
        
        return envelope;
    }

    generateReverbImpulse() {
        const length = this.audioContext.sampleRate * 2;
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            
            for (let i = 0; i < length; i++) {
                if (i < 1000) {
                    channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / 1000, 2);
                }
                
                const decay = Math.pow(1 - i / length, 1 + this.reverbDecay * 4);
                channelData[i] += (Math.random() * 2 - 1) * decay * 0.5;
                
                const bits = 12;
                const steps = Math.pow(2, bits);
                channelData[i] = Math.round(channelData[i] * steps) / steps;
                
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
    
    resetAllParameters() {
        Object.keys(this.defaultValues).forEach(param => {
            const element = document.getElementById(param);
            if (element) {
                element.value = this.defaultValues[param];
                element.dispatchEvent(new Event('input'));
            }
        });
        
        // Reset special cases
        this.grainShape = 'blackman';
        this.ringModSourceType = 'grains';
        this.lfoShape = 'sine';
        this.isMuted = false;
        this.combSeqEnabled = false;
        this.wrapEnabled = false;
        this.envelopeLoopEnabled = false;
        
        // Reset envelope points to default
        this.envelopePoints = [
            {x: 0, y: 0.5},
            {x: 0.2, y: 0.8},
            {x: 0.4, y: 0.6},
            {x: 0.7, y: 0.9},
            {x: 1.0, y: 0.3}
        ];
        
        // Update UI elements
        document.querySelectorAll('.grain-shape-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.shape === 'blackman') {
                btn.classList.add('active');
            }
        });
        
        // Set grains as default ring mod source
        document.getElementById('ringModGrains').classList.add('active');
        document.getElementById('ringModOsc').classList.remove('active');
        document.getElementById('ringModNoise').classList.remove('active');
        
        document.getElementById('lfoShape').value = 'sine';
        document.getElementById('muteButton').classList.remove('active');
        document.getElementById('stringSeqToggle').classList.remove('active');
        document.getElementById('warpToggle').classList.remove('active'); // CHANGED: Update warp button
        document.getElementById('envelopeLoopToggle').classList.remove('active');
        document.getElementById('envelopeLoopToggle').textContent = 'Loop OFF';
        
        // Reset ring mod to grains source
        this.switchRingModSource('grains');
        this.updateVolumeBoost();
        this.updateCombSequencer();
        this.updateCombSeqButton();
        this.updateWarp(); // NEW: Update warp
        
        // Reset all comb seq LFOs
        this.combSeqLfos.forEach((lfoData, paramName) => {
            this.updateCombSeqLFO(paramName, 0);
        });
        
        console.log('All parameters reset to defaults');
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.muteGainNode.gain.value = this.isMuted ? 0 : 1;
        
        const muteButton = document.getElementById('muteButton');
        muteButton.classList.toggle('active', this.isMuted);
        muteButton.textContent = this.isMuted ? '🔇 MUTED' : '🔊 MUTE';
    }
    
    updateVolumeBoost() {
        if (this.volume >= 1.9) {
            this.volumeBooster.threshold.value = -6;
            this.volumeBooster.ratio.value = 20;
            
            const volumeControl = document.querySelector('.master-volume-control');
            if (volumeControl) {
                volumeControl.classList.add('volume-boost-indicator', 'boosted');
            }
        } else {
            this.volumeBooster.threshold.value = -12;
            this.volumeBooster.ratio.value = 12;
            
            const volumeControl = document.querySelector('.master-volume-control');
            if (volumeControl) {
                volumeControl.classList.remove('boosted');
            }
        }
    }
    
    updateLFO() {
        this.lfoNode.frequency.value = this.lfoSpeed;
        this.lfoGainNode.gain.value = (this.lfoDepth / 100) * 2000;
        
        if (this.lfoShape === 'sawtooth' || this.lfoShape === 'square') {
            this.lfoNode.type = this.lfoShape;
        } else if (this.lfoShape === 'triangle') {
            this.lfoNode.type = 'triangle';
        } else {
            this.lfoNode.type = 'sine';
        }
    }
    
    updateVocoderMix() {
        const mix = this.vocoderMix / 100;
        this.vocoderMixNode.gain.value = mix;
        this.vocoderDryNode.gain.value = 1 - mix;
        
        if (mix > 0) {
            this.vocoderBands.forEach((band, i) => {
                const modulation = 0.5 + Math.sin(this.audioContext.currentTime * (i + 1)) * 0.3;
                band.carrierGain.gain.value = this.vocoderBandGains[i] * modulation;
            });
        }
    }
    
    updateVocoderBand(bandIndex, gain) {
        if (bandIndex >= 0 && bandIndex < 8) {
            this.vocoderBandGains[bandIndex] = gain;
            if (this.vocoderBands[bandIndex]) {
                this.vocoderBands[bandIndex].bandGain.gain.value = gain;
            }
        }
    }
    
    updateRingModMix() {
        const mix = this.ringModMix / 100;
        this.ringModMixNode.gain.value = mix;
        this.ringModDryNode.gain.value = 1 - mix;
    }

    updateSpectralFreeze() {
        const feedbackAmount = this.spectralFreeze / 100 * 0.95;
        this.spectralFeedbackNode.gain.value = feedbackAmount;
        
        // Update resonance
        const resonanceGain = (this.spectralResonance / 100) * 12; // Up to +12dB
        this.spectralFilterNode.gain.value = resonanceGain;
        
        // Modulate filter frequency based on resonance
        const freqMod = 1000 + (this.spectralResonance / 100) * 2000;
        this.spectralFilterNode.frequency.value = freqMod;
    }

    updatePhaser() {
        this.phaserLfo.frequency.value = this.phaserRate;
        
        const depthAmount = (this.phaserDepth / 100) * 1500;
        if (this.phaserLfoGain) {
            this.phaserLfoGain.gain.value = depthAmount;
        }
        
        this.phaserGainNode.gain.value = this.phaserGain;
        if (this.phaserGain > 1.5) {
            this.phaserSaturation.curve = this.makeHarmonicSaturationCurve();
        }
        
        const wetAmount = Math.min(this.phaserDepth / 100, 0.7);
        this.phaserMixNode.gain.value = wetAmount;
        this.phaserDryNode.gain.value = 1 - wetAmount * 0.5;
    }

    // NEW: Update WARP module - CHANGED: Remove loop dependency
  updateWarp() {
    if (this.wrapEnabled) {
        // Enable warp effect - wet path
        this.warpWetNode.gain.value = 1;
        this.warpDryNode.gain.value = 0;
        this.warpFeedbackNode.gain.value = 0.85;
        
        // Calculate base delay time with start offset
        const baseDelayTime = (this.warpStart + this.warpLength) / 1000;
        this.wrapDelayNode.delayTime.value = baseDelayTime;
        
        // Connect rate modulation
        this.warpRateOsc.frequency.value = this.warpRate;
        this.warpRateGain.gain.value = (this.warpLength / 1000) * 0.1; // 10% modulation depth
        
        // Connect rate LFO to delay time if not already connected
        try {
            this.warpRateGain.connect(this.wrapDelayNode.delayTime);
        } catch (e) {
            // Already connected, ignore
        }
    } else {
        // Disable warp effect - dry path only
        this.warpWetNode.gain.value = 0;
        this.warpDryNode.gain.value = 1;
        this.warpFeedbackNode.gain.value = 0;
        
        // Disconnect rate modulation
        try {
            this.warpRateGain.disconnect(this.wrapDelayNode.delayTime);
        } catch (e) {
            // Not connected, ignore
        }
        this.warpRateGain.gain.value = 0;
    }
}
    update3DPanner() {
        this.pannerLfoX.frequency.value = this.pannerSpeed;
        this.pannerLfoY.frequency.value = this.pannerSpeed * 0.7;
        
        const xDepth = (this.pannerXDepth / 100) * 5;
        const yRange = (this.pannerYRange / 100) * 5;
        
        this.pannerXGain.gain.value = xDepth;
        this.pannerYGain.gain.value = yRange;
    }
    
    updateFreqShifter() {
        this.freqShifterOsc.frequency.value = this.freqShifterAmount;
        
        const mix = this.freqShifterMix / 100;
        this.freqShifterWetNode.gain.value = mix;
        this.freqShifterDryNode.gain.value = 1 - mix;
    }
    updateCombSequencer() {
        if (!this.combSeqLfo) return;
        
        this.combSeqLfo.frequency.value = this.combSeqSpeed;
        this.combSeqLfoGain.gain.value = this.combSeqDepth / 100;
        
        const wetMix = this.combSeqWetMix / 100;
        this.combSeqWetGainNode.gain.value = wetMix;
        this.combSeqDryGainNode.gain.value = 1 - wetMix;
        
        if (this.combSeqSoftClipNode) {
            this.combSeqSoftClipNode.curve = this.makeSoftClipCurve(this.combSeqSoftClip / 100);
        }
        
        if (this.combSeqEnabled && this.combSeqDepth > 0) {
            const now = this.audioContext.currentTime;
            
            this.combSeqStreams.forEach((stream, streamIndex) => {
                const frequency = this.combSeqFrequencies[stream.currentStep];
                const delayTime = 1 / frequency;
                stream.delayNode.delayTime.setValueAtTime(
                    Math.min(delayTime, 0.1), 
                    now
                );
                
                const stepDuration = 1 / (this.combSeqSpeed * 5);
                const timeSinceLastTrigger = now - stream.lastTriggerTime;
                
                if (timeSinceLastTrigger >= stepDuration) {
                    let lfoValue = Math.sin(now * this.combSeqSpeed * Math.PI * 2);
                    if (this.combSeqSqueeze > 0) {
                        const squeeze = 1 + this.combSeqSqueeze * 9;
                        lfoValue = Math.tanh(lfoValue * squeeze) / Math.tanh(squeeze);
                    }
                    
                    const baseGain = 0.3 * (this.combSeqDepth / 100);
                    const modulatedGain = baseGain * (0.5 + Math.abs(lfoValue) * 0.5);
                    
                    stream.mixGain.gain.setValueAtTime(modulatedGain, now);
                    
                    stream.currentStep = (stream.currentStep + 1) % 5;
                    stream.lastTriggerTime = now;
                }
            });
        } else {
            this.combSeqStreams.forEach(stream => {
                stream.mixGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            });
        }
    }
    
    // NEW: Update Chromatic Envelope
    updateChromaticEnvelope() {
        this.chromaticEnvelope.frequency.value = this.envelopeRate;
        
        const depth = this.envelopeDepth / 100;
        this.envelopeGainNode.gain.value = depth;
        
        // Connect to master volume if envelope is active
        if (this.envelopeLoopEnabled && depth > 0) {
            try {
                this.envelopeGainNode.connect(this.masterGainNode.gain);
            } catch (e) {
                // Already connected or connection failed
            }
        } else {
            try {
                this.envelopeGainNode.disconnect();
            } catch (e) {
                // Not connected
            }
        }
    }

    // NEW: Toggle Chromatic Envelope Loop
    toggleEnvelopeLoop() {
        this.envelopeLoopEnabled = !this.envelopeLoopEnabled;
        const button = document.getElementById('envelopeLoopToggle');
        if (button) {
            button.textContent = this.envelopeLoopEnabled ? 'Loop ON' : 'Loop OFF';
            button.classList.toggle('active', this.envelopeLoopEnabled);
        }
        this.updateChromaticEnvelope();
    }

    // NEW: Reset Envelope Shape
    resetEnvelopeShape() {
        this.envelopePoints = [
            {x: 0, y: 0.5},
            {x: 0.2, y: 0.8},
            {x: 0.4, y: 0.6},
            {x: 0.7, y: 0.9},
            {x: 1.0, y: 0.3}
        ];
    }

    // NEW: Update Frequency Isolator
    updateFrequencyIsolator() {
        this.isolatorNodes.lo.gain.gain.value = this.isolatorLo;
        this.isolatorNodes.mid.gain.gain.value = this.isolatorMid;
        this.isolatorNodes.hi.gain.gain.value = this.isolatorHi;
    }
    
    updateDelayMix() {
        this.updateEnhancedDelay(); // Use enhanced delay update
    }
    
    updateReverbMix() {
        const mix = this.reverbMix / 100;
        this.reverbWetNode.gain.value = mix;
        this.reverbDryNode.gain.value = 1 - mix;
    }
    
    // Enhanced Ring Mod Source Switching
    switchRingModSource(type) {
        if (this.ringModSource) {
            this.ringModSource.disconnect(this.ringModNode.gain);
        }
        
        switch (type) {
            case 'grains':
                this.ringModSource = this.ringModGrainSource;
                this.ringModSourceType = 'grains';
                break;
            case 'oscillator':
                this.ringModSource = this.ringModOscSource;
                this.ringModSourceType = 'oscillator';
                break;
            case 'noise':
                this.ringModSource = this.ringModNoiseSource;
                this.ringModSourceType = 'noise';
                break;
        }
        
        this.ringModSource.connect(this.ringModNode.gain);
    }

    // Enhanced grain animation setup
    setupGrainAnimation() {
        this.grainCanvas = document.getElementById('grainCanvas');
        if (this.grainCanvas) {
            this.grainCtx = this.grainCanvas.getContext('2d');
            this.grainParticles = [];
            this.animateGrains();
        }
    }

    addGrainParticle(x) {
        if (!this.grainCtx) return;
        
        const particle = {
            x: x,
            y: this.grainCanvas.height / 2 + (Math.random() - 0.5) * 20,
            size: 1 + Math.random() * 2,
            opacity: 1,
            vx: (Math.random() - 0.5) * 3,
            vy: -0.5 - Math.random() * 2,
            vz: Math.random() * 2 + 1,
            life: 1.0,
            decay: 0.015 + Math.random() * 0.01,
            color: `rgba(255, ${Math.floor(Math.random() * 50)}, 0, `,
            glowIntensity: 0.8 + Math.random() * 0.4
        };
        
        this.grainParticles.push(particle);
        
        if (this.grainParticles.length > 30) {
            this.grainParticles.shift();
        }
    }

    animateGrains() {
        if (!this.grainCtx) return;
        
        this.grainCtx.clearRect(0, 0, this.grainCanvas.width, this.grainCanvas.height);
        
        for (let i = this.grainParticles.length - 1; i >= 0; i--) {
            const particle = this.grainParticles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vz += 0.1;
            particle.life -= particle.decay;
            particle.opacity = particle.life * particle.glowIntensity;
            
            const scale = 1 + particle.vz * 0.1;
            const actualSize = particle.size * scale;
            
            if (particle.life <= 0 || actualSize > 6) {
                this.grainParticles.splice(i, 1);
                continue;
            }
            
            this.grainCtx.save();
            this.grainCtx.globalAlpha = particle.opacity;

            const color = particle.color + particle.opacity + ')';

            this.grainCtx.fillStyle = color;
            this.grainCtx.shadowColor = '#ff0000';
            this.grainCtx.shadowBlur = actualSize * 4;
            this.grainCtx.beginPath();
            this.grainCtx.arc(particle.x, particle.y, actualSize * 1.5, 0, Math.PI * 2);
            this.grainCtx.fill();

            this.grainCtx.shadowBlur = actualSize * 2;
            this.grainCtx.fillStyle = `rgba(255, 100, 100, ${particle.opacity})`;
            this.grainCtx.beginPath();
            this.grainCtx.arc(particle.x, particle.y, actualSize, 0, Math.PI * 2);
            this.grainCtx.fill();

            this.grainCtx.restore();
        }
        
        requestAnimationFrame(() => this.animateGrains());
    }

    // Preset Management Functions
    savePreset(name) {
        if (!name) return false;
        
        const preset = {
            name: name,
            timestamp: Date.now(),
            parameters: {}
        };
        
        const parameterElements = document.querySelectorAll('input[type="range"], select');
        parameterElements.forEach(element => {
            if (element.id) {
                preset.parameters[element.id] = element.value;
            }
        });
        
        const buttonElements = document.querySelectorAll('button.active');
        preset.buttonStates = Array.from(buttonElements).map(btn => btn.id);
        
        const activeShapeBtn = document.querySelector('.grain-shape-btn.active');
        if (activeShapeBtn) {
            preset.grainShape = activeShapeBtn.dataset.shape;
        }
        
        // Store envelope points
        preset.envelopePoints = [...this.envelopePoints];
        
        // Store comb seq LFO states
        preset.combSeqLfoStates = {};
        this.combSeqLfos.forEach((lfoData, paramName) => {
            preset.combSeqLfoStates[paramName] = {
                depth: lfoData.depth,
                active: lfoData.active
            };
        });
        
        this.presets.set(name, preset);
        this.savePresetsToStorage();
        this.updatePresetSelect();
        
        console.log(`Preset "${name}" saved`);
        return true;
    }

    loadPreset(name) {
        const preset = this.presets.get(name);
        if (!preset) {
            console.error(`Preset "${name}" not found`);
            return false;
        }
        
        // Apply parameters
        Object.entries(preset.parameters).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
                element.dispatchEvent(new Event('input'));
            }
        });
        
        // Apply button states
        document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
        if (preset.buttonStates) {
            preset.buttonStates.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) btn.classList.add('active');
            });
        }
        
        // Apply grain shape
        if (preset.grainShape) {
            document.querySelectorAll('.grain-shape-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.shape === preset.grainShape) {
                    btn.classList.add('active');
                }
            });
            this.grainShape = preset.grainShape;
        }
        
        // Load envelope points
        if (preset.envelopePoints) {
            this.envelopePoints = [...preset.envelopePoints];
        }
        
        // Load comb seq LFO states
        if (preset.combSeqLfoStates) {
            Object.entries(preset.combSeqLfoStates).forEach(([paramName, state]) => {
                this.updateCombSeqLFO(paramName, state.depth);
            });
        }
        
        console.log(`Preset "${name}" loaded`);
        return true;
    }

    deletePreset(name) {
        if (this.presets.delete(name)) {
            this.savePresetsToStorage();
            this.updatePresetSelect();
            console.log(`Preset "${name}" deleted`);
            return true;
        }
        return false;
    }

    updatePresetSelect() {
        const select = document.getElementById('presetSelect');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select Preset...</option>';
        this.presets.forEach((preset, name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    }

    savePresetsToStorage() {
        try {
            const presetsObj = Object.fromEntries(this.presets);
            localStorage.setItem('grains_presets', JSON.stringify(presetsObj));
        } catch (error) {
            console.warn('Failed to save presets to localStorage:', error);
        }
    }

    loadPresetsFromStorage() {
        try {
            const presetsData = localStorage.getItem('grains_presets');
            if (presetsData) {
                const presetsObj = JSON.parse(presetsData);
                this.presets = new Map(Object.entries(presetsObj));
                console.log(`Loaded ${this.presets.size} presets from localStorage`);
            }
        } catch (error) {
            console.warn('Failed to load presets from localStorage:', error);
        }
    }

    setupEventListeners() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        
        fileInput.accept = '.mp3,.wav,.m4a,.ogg';
        
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

        // CHANGED: WARP button moved to WARP module, no longer here
        
        document.getElementById('resetButton').addEventListener('click', () => {
            this.resetAllParameters();
        });
        
        document.getElementById('muteButton').addEventListener('click', () => {
            this.toggleMute();
        });
        
        // Preset controls
        document.getElementById('savePresetBtn').addEventListener('click', () => {
            const name = prompt('Enter preset name:');
            if (name) {
                this.savePreset(name);
                const select = document.getElementById('presetSelect');
                if (select) select.value = name;
            }
        });
        
        document.getElementById('loadPresetBtn').addEventListener('click', () => {
            const select = document.getElementById('presetSelect');
            if (select && select.value) {
                this.loadPreset(select.value);
            }
        });
        
        // Enhanced Ring mod source buttons
        document.getElementById('ringModNoise').addEventListener('click', () => {
            this.switchRingModSource('noise');
            document.getElementById('ringModNoise').classList.add('active');
            document.getElementById('ringModOsc').classList.remove('active');
            document.getElementById('ringModGrains').classList.remove('active');
        });
        
        document.getElementById('ringModOsc').addEventListener('click', () => {
            this.switchRingModSource('oscillator');
            document.getElementById('ringModOsc').classList.add('active');
            document.getElementById('ringModNoise').classList.remove('active');
            document.getElementById('ringModGrains').classList.remove('active');
        });
        
        document.getElementById('ringModGrains').addEventListener('click', () => {
            this.switchRingModSource('grains');
            document.getElementById('ringModGrains').classList.add('active');
            document.getElementById('ringModNoise').classList.remove('active');
            document.getElementById('ringModOsc').classList.remove('active');
        });
        
        // Grain shape buttons
        const grainShapeButtons = document.querySelectorAll('.grain-shape-btn');
        grainShapeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                grainShapeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.grainShape = btn.dataset.shape;
            });
        });
        
        // Comb sequencer toggle
        document.getElementById('stringSeqToggle').addEventListener('click', () => {
            this.combSeqEnabled = !this.combSeqEnabled;
            this.updateCombSeqButton();
            
            if (this.combSeqEnabled) {
                this.initCombSequencer();
                this.connectAudioNodes();
            }
        });
        
        // NEW: WARP button (moved to WARP module)
        document.getElementById('warpToggle').addEventListener('click', () => {
            this.wrapEnabled = !this.wrapEnabled;
            document.getElementById('warpToggle').classList.toggle('active', this.wrapEnabled);
            this.updateWarp();
        });
        
        // NEW: Chromatic Envelope controls
        document.getElementById('envelopeLoopToggle').addEventListener('click', () => {
            this.toggleEnvelopeLoop();
        });
        
        document.getElementById('envelopeResetBtn').addEventListener('click', () => {
            this.resetEnvelopeShape();
        });
        
        this.setupSliderControls();
    }
    setupSliderControls() {
        const sliders = {
            // Granular
            grainSize: (val) => { 
                this.grainSize = parseInt(val); 
                document.getElementById('grainSizeValue').textContent = val + 'ms';
                this.updateCombSeqLFO('grainSize', this.combSeqEnabled ? 50 : 0);
            },
            density: (val) => { 
                this.density = parseInt(val); 
                document.getElementById('densityValue').textContent = val;
                this.updateCombSeqLFO('density', this.combSeqEnabled ? 30 : 0);
            },
            windowScan: (val) => { 
                this.windowScan = parseInt(val); 
                document.getElementById('windowScanValue').textContent = val + '%';
                this.updateCombSeqLFO('windowScan', this.combSeqEnabled ? 40 : 0);
            },
            timeStretch: (val) => { 
                this.timeStretch = parseFloat(val); 
                document.getElementById('timeStretchValue').textContent = val + 'x';
                this.updateCombSeqLFO('timeStretch', this.combSeqEnabled ? 25 : 0);
            },
            
            // Filter & LFO
            filterFreq: (val) => { 
                this.filterFreq = parseInt(val); 
                this.filterNode.frequency.value = this.filterFreq;
                document.getElementById('filterFreqValue').textContent = val + 'Hz';
                this.updateCombSeqLFO('filterFreq', this.combSeqEnabled ? 60 : 0);
            },
            filterQ: (val) => { 
                this.filterQ = parseFloat(val); 
                this.filterNode.Q.value = this.filterQ;
                document.getElementById('filterQValue').textContent = val;
                this.updateCombSeqLFO('filterQ', this.combSeqEnabled ? 35 : 0);
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
            
            // Vocoder (8 bands)
            vocoder1: (val) => { 
                this.updateVocoderBand(0, parseFloat(val));
                document.getElementById('vocoder1Value').textContent = val;
                this.updateCombSeqLFO('vocoder1', this.combSeqEnabled ? 20 : 0);
            },
            vocoder2: (val) => { 
                this.updateVocoderBand(1, parseFloat(val));
                document.getElementById('vocoder2Value').textContent = val;
                this.updateCombSeqLFO('vocoder2', this.combSeqEnabled ? 20 : 0);
            },
            vocoder3: (val) => { 
                this.updateVocoderBand(2, parseFloat(val));
                document.getElementById('vocoder3Value').textContent = val;
                this.updateCombSeqLFO('vocoder3', this.combSeqEnabled ? 20 : 0);
            },
            vocoder4: (val) => { 
                this.updateVocoderBand(3, parseFloat(val));
                document.getElementById('vocoder4Value').textContent = val;
                this.updateCombSeqLFO('vocoder4', this.combSeqEnabled ? 20 : 0);
            },
            vocoder5: (val) => { 
                this.updateVocoderBand(4, parseFloat(val));
                document.getElementById('vocoder5Value').textContent = val;
                this.updateCombSeqLFO('vocoder5', this.combSeqEnabled ? 20 : 0);
            },
            vocoder6: (val) => { 
                this.updateVocoderBand(5, parseFloat(val));
                document.getElementById('vocoder6Value').textContent = val;
                this.updateCombSeqLFO('vocoder6', this.combSeqEnabled ? 20 : 0);
            },
            vocoder7: (val) => { 
                this.updateVocoderBand(6, parseFloat(val));
                document.getElementById('vocoder7Value').textContent = val;
                this.updateCombSeqLFO('vocoder7', this.combSeqEnabled ? 20 : 0);
            },
            vocoder8: (val) => { 
                this.updateVocoderBand(7, parseFloat(val));
                document.getElementById('vocoder8Value').textContent = val;
                this.updateCombSeqLFO('vocoder8', this.combSeqEnabled ? 20 : 0);
            },
            vocoderMix: (val) => { 
                this.vocoderMix = parseInt(val);
                this.updateVocoderMix();
                document.getElementById('vocoderMixValue').textContent = val + '%';
                this.updateCombSeqLFO('vocoderMix', this.combSeqEnabled ? 45 : 0);
            },
            
            // Wavefolder & Ring Mod
            wavefold: (val) => { 
                this.wavefoldAmount = parseInt(val) / 100;
                this.waveShaperNode.curve = this.makeWavefolderCurve(this.wavefoldAmount);
                document.getElementById('wavefoldValue').textContent = val + '%';
                this.updateCombSeqLFO('wavefold', this.combSeqEnabled ? 40 : 0);
            },
            ringModMix: (val) => { 
                this.ringModMix = parseInt(val);
                this.updateRingModMix();
                document.getElementById('ringModMixValue').textContent = val + '%';
                this.updateCombSeqLFO('ringModMix', this.combSeqEnabled ? 35 : 0);
            },
            ringModFreq: (val) => { 
                this.ringModFreq = parseFloat(val);
                this.ringModOscSource.frequency.value = val;
                document.getElementById('ringModFreqValue').textContent = val + 'Hz';
                this.updateCombSeqLFO('ringModFreq', this.combSeqEnabled ? 50 : 0);
            },
            
            // Enhanced Spectral Freeze & Phaser
            spectralFreeze: (val) => { 
                this.spectralFreeze = parseInt(val);
                this.updateSpectralFreeze();
                document.getElementById('spectralFreezeValue').textContent = val + '%';
                this.updateCombSeqLFO('spectralFreeze', this.combSeqEnabled ? 30 : 0);
            },
            spectralResonance: (val) => { 
                this.spectralResonance = parseInt(val);
                this.updateSpectralFreeze();
                document.getElementById('spectralResonanceValue').textContent = val + '%';
                this.updateCombSeqLFO('spectralResonance', this.combSeqEnabled ? 40 : 0);
            },
            phaserRate: (val) => { 
                this.phaserRate = parseFloat(val);
                this.updatePhaser();
                document.getElementById('phaserRateValue').textContent = val + 'Hz';
                this.updateCombSeqLFO('phaserRate', this.combSeqEnabled ? 25 : 0);
            },
            phaserDepth: (val) => { 
                this.phaserDepth = parseInt(val);
                this.updatePhaser();
                document.getElementById('phaserDepthValue').textContent = val + '%';
                this.updateCombSeqLFO('phaserDepth', this.combSeqEnabled ? 45 : 0);
            },
            phaserFeedback: (val) => { 
                this.phaserFeedback = parseInt(val);
                this.updatePhaser();
                document.getElementById('phaserFeedbackValue').textContent = val + '%';
                this.updateCombSeqLFO('phaserFeedback', this.combSeqEnabled ? 30 : 0);
            },
            phaserGain: (val) => { 
                this.phaserGain = parseFloat(val);
                this.updatePhaser();
                document.getElementById('phaserGainValue').textContent = val;
                this.updateCombSeqLFO('phaserGain', this.combSeqEnabled ? 20 : 0);
            },
            
            // NEW: WARP Controls
            warpRate: (val) => { 
                this.warpRate = parseFloat(val);
                this.updateWarp();
                document.getElementById('warpRateValue').textContent = val + 'Hz';
                this.updateCombSeqLFO('warpRate', this.combSeqEnabled ? 35 : 0);
            },
            warpStart: (val) => { 
                this.warpStart = parseFloat(val);
                this.updateWarp();
                document.getElementById('warpStartValue').textContent = val + 'ms';
                this.updateCombSeqLFO('warpStart', this.combSeqEnabled ? 25 : 0);
            },
            warpLength: (val) => { 
                this.warpLength = parseFloat(val);
                this.updateWarp();
                document.getElementById('warpLengthValue').textContent = val + 'ms';
                this.updateCombSeqLFO('warpLength', this.combSeqEnabled ? 30 : 0);
            },
            
            // 3D Panner
            pannerXDepth: (val) => { 
                this.pannerXDepth = parseInt(val);
                this.update3DPanner();
                document.getElementById('pannerXDepthValue').textContent = val + '%';
                this.updateCombSeqLFO('pannerXDepth', this.combSeqEnabled ? 40 : 0);
            },
            pannerYRange: (val) => { 
                this.pannerYRange = parseInt(val);
                this.update3DPanner();
                document.getElementById('pannerYRangeValue').textContent = val + '%';
                this.updateCombSeqLFO('pannerYRange', this.combSeqEnabled ? 40 : 0);
            },
            pannerSpeed: (val) => { 
                this.pannerSpeed = parseFloat(val);
                this.update3DPanner();
                document.getElementById('pannerSpeedValue').textContent = val + 'Hz';
                this.updateCombSeqLFO('pannerSpeed', this.combSeqEnabled ? 25 : 0);
            },
            
            // Enhanced Frequency Shifter
            freqShifterAmount: (val) => { 
                this.freqShifterAmount = parseFloat(val);
                this.updateFreqShifter();
                document.getElementById('freqShifterAmountValue').textContent = val + 'Hz';
                this.updateCombSeqLFO('freqShifterAmount', this.combSeqEnabled ? 50 : 0);
            },
            freqShifterMix: (val) => { 
                this.freqShifterMix = parseInt(val);
                this.updateFreqShifter();
                document.getElementById('freqShifterMixValue').textContent = val + '%';
                this.updateCombSeqLFO('freqShifterMix', this.combSeqEnabled ? 35 : 0);
            },
            
            // Volume
            volume: (val) => { 
                this.volume = parseFloat(val); 
                this.masterGainNode.gain.value = this.volume;
                this.updateVolumeBoost();
                document.getElementById('volumeValue').textContent = Math.round(val * 100) + '%';
            },
            
            // Enhanced Multi-Tap Delay
            delayTime: (val) => { 
                this.delayTime = parseFloat(val); 
                this.updateEnhancedDelay();
                document.getElementById('delayTimeValue').textContent = Math.round(val * 1000) + 'ms';
                this.updateCombSeqLFO('delayTime', this.combSeqEnabled ? 40 : 0);
            },
            delayFeedback: (val) => { 
                this.delayFeedback = parseFloat(val); 
                this.updateEnhancedDelay();
                document.getElementById('delayFeedbackValue').textContent = Math.round(val * 100) + '%';
                this.updateCombSeqLFO('delayFeedback', this.combSeqEnabled ? 30 : 0);
            },
            delayTaps: (val) => { 
                this.delayTaps = parseInt(val);
                this.updateEnhancedDelay();
                document.getElementById('delayTapsValue').textContent = val;
                this.updateCombSeqLFO('delayTaps', this.combSeqEnabled ? 20 : 0);
            },
            delaySpread: (val) => { 
                this.delaySpread = parseInt(val);
                this.updateEnhancedDelay();
                document.getElementById('delaySpreadValue').textContent = val + '%';
                this.updateCombSeqLFO('delaySpread', this.combSeqEnabled ? 35 : 0);
            },
            delayDrift: (val) => { 
                this.delayDrift = parseInt(val);
                this.updateEnhancedDelay();
                document.getElementById('delayDriftValue').textContent = val + '%';
                this.updateCombSeqLFO('delayDrift', this.combSeqEnabled ? 40 : 0);
            },
            delayAging: (val) => { 
                this.delayAging = parseInt(val);
                this.updateEnhancedDelay();
                document.getElementById('delayAgingValue').textContent = val + '%';
                this.updateCombSeqLFO('delayAging', this.combSeqEnabled ? 25 : 0);
            },
            delayFlutter: (val) => { 
                this.delayFlutter = parseInt(val);
                this.updateEnhancedDelay();
                document.getElementById('delayFlutterValue').textContent = val + '%';
                this.updateCombSeqLFO('delayFlutter', this.combSeqEnabled ? 30 : 0);
            },
            delaySoftClip: (val) => { 
                this.delaySoftClip = parseInt(val) / 100;
                this.updateEnhancedDelay();
                document.getElementById('delaySoftClipValue').textContent = val + '%';
                this.updateCombSeqLFO('delaySoftClip', this.combSeqEnabled ? 35 : 0);
            },
            delayMix: (val) => { 
                this.delayMix = parseFloat(val); 
                this.updateDelayMix();
                document.getElementById('delayMixValue').textContent = Math.round(val * 100) + '%';
                this.updateCombSeqLFO('delayMix', this.combSeqEnabled ? 30 : 0);
            },
            
            // Reverb
            reverbSize: (val) => { 
                this.reverbSize = parseInt(val) / 100;
                this.generateReverbImpulse();
                document.getElementById('reverbSizeValue').textContent = val + '%';
                this.updateCombSeqLFO('reverbSize', this.combSeqEnabled ? 25 : 0);
            },
            reverbDecay: (val) => { 
                this.reverbDecay = parseInt(val) / 100;
                this.generateReverbImpulse();
                document.getElementById('reverbDecayValue').textContent = val + '%';
                this.updateCombSeqLFO('reverbDecay', this.combSeqEnabled ? 25 : 0);
            },
            reverbPreDelay: (val) => { 
                this.reverbPreDelay = parseInt(val) / 1000;
                this.reverbPreDelayNode.delayTime.value = this.reverbPreDelay;
                document.getElementById('reverbPreDelayValue').textContent = val + 'ms';
                this.updateCombSeqLFO('reverbPreDelay', this.combSeqEnabled ? 20 : 0);
            },
            reverbWetGain: (val) => { 
                this.reverbWetGain = parseFloat(val);
                this.reverbWetGainNode.gain.value = val;
                document.getElementById('reverbWetGainValue').textContent = val;
                this.updateCombSeqLFO('reverbWetGain', this.combSeqEnabled ? 30 : 0);
            },
            reverbMix: (val) => { 
                this.reverbMix = parseInt(val);
                this.updateReverbMix();
                document.getElementById('reverbMixValue').textContent = val + '%';
                this.updateCombSeqLFO('reverbMix', this.combSeqEnabled ? 35 : 0);
            },
            
            // Comb Sequencer
            stringSeqSpeed: (val) => { 
                this.combSeqSpeed = parseFloat(val);
                this.updateCombSequencer();
                document.getElementById('stringSeqSpeedValue').textContent = val + 'Hz';
                this.updateCombSeqLFO('stringSeqSpeed', this.combSeqEnabled ? 30 : 0);
            },
            stringSeqDepth: (val) => { 
                this.combSeqDepth = parseInt(val);
                this.updateCombSequencer();
                document.getElementById('stringSeqDepthValue').textContent = val + '%';
                this.updateCombSeqLFO('stringSeqDepth', this.combSeqEnabled ? 40 : 0);
            },
            stringSeqWetMix: (val) => { 
                this.combSeqWetMix = parseInt(val);
                this.updateCombSequencer();
                document.getElementById('stringSeqWetMixValue').textContent = val + '%';
                this.updateCombSeqLFO('stringSeqWetMix', this.combSeqEnabled ? 35 : 0);
            },
            stringSeqSqueeze: (val) => { 
                this.combSeqSqueeze = parseInt(val) / 100;
                document.getElementById('stringSeqSqueezeValue').textContent = val + '%';
                this.updateCombSeqLFO('stringSeqSqueeze', this.combSeqEnabled ? 30 : 0);
            },
            combSeqSoftClip: (val) => { 
                this.combSeqSoftClip = parseInt(val);
                this.updateCombSequencer();
                document.getElementById('combSeqSoftClipValue').textContent = val + '%';
                this.updateCombSeqLFO('combSeqSoftClip', this.combSeqEnabled ? 25 : 0);
            },
            
            // Comb Sequencer Frequency Steps
            stringSeqStep1: (val) => { 
                this.combSeqFrequencies[0] = parseInt(val);
                document.getElementById('stringSeqStep1Value').textContent = val;
                this.updateCombSequencer();
                this.updateCombSeqLFO('stringSeqStep1', this.combSeqEnabled ? 40 : 0);
            },
            stringSeqStep2: (val) => { 
                this.combSeqFrequencies[1] = parseInt(val);
                document.getElementById('stringSeqStep2Value').textContent = val;
                this.updateCombSequencer();
                this.updateCombSeqLFO('stringSeqStep2', this.combSeqEnabled ? 40 : 0);
            },
            stringSeqStep3: (val) => { 
                this.combSeqFrequencies[2] = parseInt(val);
                document.getElementById('stringSeqStep3Value').textContent = val;
                this.updateCombSequencer();
                this.updateCombSeqLFO('stringSeqStep3', this.combSeqEnabled ? 40 : 0);
            },
            stringSeqStep4: (val) => { 
                this.combSeqFrequencies[3] = parseInt(val);
                document.getElementById('stringSeqStep4Value').textContent = val;
                this.updateCombSequencer();
                this.updateCombSeqLFO('stringSeqStep4', this.combSeqEnabled ? 40 : 0);
            },
            stringSeqStep5: (val) => { 
                this.combSeqFrequencies[4] = parseInt(val);
                document.getElementById('stringSeqStep5Value').textContent = val;
                this.updateCombSequencer();
                this.updateCombSeqLFO('stringSeqStep5', this.combSeqEnabled ? 40 : 0);
            },
            
            // NEW: Chromatic Envelope
            envelopeRate: (val) => { 
                this.envelopeRate = parseFloat(val);
                this.updateChromaticEnvelope();
                document.getElementById('envelopeRateValue').textContent = val + 'Hz';
                this.updateCombSeqLFO('envelopeRate', this.combSeqEnabled ? 25 : 0);
            },
            envelopeDepth: (val) => { 
                this.envelopeDepth = parseInt(val);
                this.updateChromaticEnvelope();
                document.getElementById('envelopeDepthValue').textContent = val + '%';
                this.updateCombSeqLFO('envelopeDepth', this.combSeqEnabled ? 35 : 0);
            },
            
            // NEW: 3-Band Frequency Isolator
            isolatorLo: (val) => { 
                this.isolatorLo = parseFloat(val);
                this.updateFrequencyIsolator();
                document.getElementById('isolatorLoValue').textContent = Math.round(val * 100) + '%';
                this.updateCombSeqLFO('isolatorLo', this.combSeqEnabled ? 40 : 0);
            },
            isolatorMid: (val) => { 
                this.isolatorMid = parseFloat(val);
                this.updateFrequencyIsolator();
                document.getElementById('isolatorMidValue').textContent = Math.round(val * 100) + '%';
                this.updateCombSeqLFO('isolatorMid', this.combSeqEnabled ? 40 : 0);
            },
            isolatorHi: (val) => { 
                this.isolatorHi = parseFloat(val);
                this.updateFrequencyIsolator();
                document.getElementById('isolatorHiValue').textContent = Math.round(val * 100) + '%';
                this.updateCombSeqLFO('isolatorHi', this.combSeqEnabled ? 40 : 0);
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
        const chromaticKeys = {
            'q': -12, 'w': -11, 'e': -10, 'r': -9, 't': -8, 'y': -7, 'u': -6, 'i': -5, 'o': -4, 'p': -3,
            'a': -2, 's': -1, 'd': 0, 'f': 1, 'g': 2, 'h': 3, 'j': 4, 'k': 5, 'l': 6,
            'z': 7, 'x': 8, 'c': 9, 'v': 10, 'b': 11, 'n': 12, 'm': 13
        };
        
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            
            this.resumeAudioContext();
            
            if (key === ' ') {
                e.preventDefault();
                this.togglePlayback();
                return;
            }
            
            if (key >= '0' && key <= '9') {
                const position = key === '0' ? 0 : parseInt(key) / 9;
                this.setScanPosition(position);
                return;
            }
            
            if (key === 'arrowleft') {
                e.preventDefault();
                this.microScanBackward();
                return;
            }
            
            if (key === 'arrowright') {
                e.preventDefault();
                this.microScanForward();
                return;
            }
            
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
        if (key === ' ') {
            this.togglePlayback();
            return;
        }
        
        if (key >= '0' && key <= '9') {
            const position = key === '0' ? 0 : parseInt(key) / 9;
            this.setScanPosition(position);
            return;
        }
        
        if (key === 'ArrowLeft') {
            this.microScanBackward();
            return;
        }
        
        if (key === 'ArrowRight') {
            this.microScanForward();
            return;
        }
        
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
            
            this.resizeGrainCanvas();
            
        } catch (error) {
            document.getElementById('status').textContent = 'Error loading audio file: ' + error.message;
            console.error('Audio loading error:', error);
        }
    }

    resizeGrainCanvas() {
        if (this.grainCanvas) {
            const rect = document.getElementById('waveform').getBoundingClientRect();
            this.grainCanvas.width = rect.width;
            this.grainCanvas.height = rect.height;
        }
    }
    
    drawWaveform() {
        if (!this.audioBuffer) {
            console.error('No audio buffer to draw');
            return;
        }
        
        const canvas = document.getElementById('waveform');
        const ctx = canvas.getContext('2d');
        
        requestAnimationFrame(() => {
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            
            canvas.width = width;
            canvas.height = height;
            
            this.resizeGrainCanvas();
            
            ctx.fillStyle = 'transparent';
            ctx.fillRect(0, 0, width, height);
            
            const data = this.audioBuffer.getChannelData(0);
            const step = Math.ceil(data.length / width);
            
            console.log('Drawing waveform:', {
                bufferLength: data.length,
                canvasWidth: width,
                canvasHeight: height,
                step: step
            });
            
            ctx.strokeStyle = '#008080';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let i = 0; i < width; i++) {
                let min = 1.0;
                let max = -1.0;
                
                for (let j = 0; j < step; j++) {
                    const idx = (i * step) + j;
                    if (idx < data.length) {
                        const sample = data[idx];
                        if (sample < min) min = sample;
                        if (sample > max) max = sample;
                    }
                }
                
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
            
            ctx.shadowColor = '#006666';
            ctx.shadowBlur = 4;
            ctx.stroke();
            
            const glowDiv = document.createElement('div');
            glowDiv.className = 'waveform-glow';
            canvas.parentNode.appendChild(glowDiv);
            
            console.log('Waveform drawn successfully with deep teal theme');
        });
    }
    
    setScanPosition(position) {
        if (!this.audioBuffer) return;
        
        this.scanPosition = position;
        this.loopPosition = position * this.audioBuffer.duration;
        
        const playhead = document.getElementById('playhead');
        if (playhead) {
            playhead.style.left = (position * 100) + '%';
        }
        
        document.getElementById('loopPos').textContent = this.loopPosition.toFixed(2) + 's';
        document.getElementById('currentPos').textContent = this.loopPosition.toFixed(2) + 's';
    }

    microScanBackward() {
        if (!this.audioBuffer) return;
        
        const microIncrement = 0.01;
        const newPosition = Math.max(0, this.scanPosition - microIncrement);
        this.setScanPosition(newPosition);
    }

    microScanForward() {
        if (!this.audioBuffer) return;
        
        const microIncrement = 0.01;
        const newPosition = Math.min(1, this.scanPosition + microIncrement);
        this.setScanPosition(newPosition);
    }

    async togglePlayback() {
        if (!this.audioBuffer) return;
        
        await this.resumeAudioContext();
        
        if (this.isPlaying) {
            this.stopPlayback();
        } else {
            await this.startPlayback();
        }
    }
    
    async startPlayback() {
        if (!this.audioBuffer || this.isPlaying) return;
        
        await this.resumeAudioContext();
        
        console.log('Starting playback, audio context state:', this.audioContext.state);
        
        this.isPlaying = true;
        document.getElementById('playingStatus').textContent = 'Playing';
        document.getElementById('playButton').textContent = '⏸ STOP';
        document.getElementById('playButton').classList.add('playing');
        
        this.scheduleGrains();
    }
    
    stopPlayback() {
        this.isPlaying = false;
        document.getElementById('playingStatus').textContent = 'Stopped';
        document.getElementById('playButton').textContent = '▶ PLAY';
        document.getElementById('playButton').classList.remove('playing');
        
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
        
        const scanRange = (this.windowScan / 100) * this.audioBuffer.duration;
        const randomOffset = (Math.random() - 0.5) * scanRange;
        let startTime;

        if (this.wrapEnabled) {
            startTime = this.scanPosition * this.audioBuffer.duration;
            startTime += randomOffset * 0.1;
        } else if (this.looperEnabled) {
            startTime = this.loopPosition;
            startTime += randomOffset;
            
            const grainAdvancement = (this.grainSize / 1000) / this.timeStretch;
            this.loopPosition += grainAdvancement;
            
            if (this.loopPosition >= this.audioBuffer.duration) {
                this.loopPosition = 0;
            }
            
            this.scanPosition = this.loopPosition / this.audioBuffer.duration;
            
            const playhead = document.getElementById('playhead');
            if (playhead) {
                playhead.style.left = (this.scanPosition * 100) + '%';
            }
            
            document.getElementById('loopPos').textContent = this.loopPosition.toFixed(2) + 's';
            document.getElementById('currentPos').textContent = this.loopPosition.toFixed(2) + 's';
        } else {
            startTime = this.scanPosition * this.audioBuffer.duration;
            startTime += randomOffset;
        }

        startTime = Math.max(0, Math.min(startTime, this.audioBuffer.duration - (this.grainSize / 1000)));
        
        const grainDuration = this.grainSize / 1000;
        const now = this.audioContext.currentTime;
        
        this.applyGrainEnvelope(gainNode, now, grainDuration, this.grainShape);
        
        // Connect: source -> gain -> filter
        source.connect(gainNode);
        gainNode.connect(this.filterNode);
        
        // NEW: Connect grain to ring mod grain source if that's the selected source
        if (this.ringModSourceType === 'grains') {
            gainNode.connect(this.ringModGrainSource);
        }
        
        try {
            source.start(now, startTime, grainDuration);
            source.stop(now + grainDuration);
            console.log('Grain started successfully');
            
            if (this.audioBuffer) {
                const playheadPercent = (startTime / this.audioBuffer.duration);
                const waveformCanvas = document.getElementById('waveform');
                if (waveformCanvas) {
                    const x = playheadPercent * waveformCanvas.width;
                    this.addGrainParticle(x);
                }
            }
            
        } catch (error) {
            console.error('Error starting grain:', error);
        }
        
        const grain = { source, startTime: now, duration: grainDuration };
        this.grains.push(grain);
        
        source.onended = () => {
            const index = this.grains.indexOf(grain);
            if (index > -1) this.grains.splice(index, 1);
        };
        
        const activeGrainsElement = document.getElementById('activeGrains');
        activeGrainsElement.textContent = this.grains.length;
        activeGrainsElement.classList.add('pulsing');
        setTimeout(() => {
            activeGrainsElement.classList.remove('pulsing');
        }, 300);
    }

    applyGrainEnvelope(gainNode, startTime, duration, shape) {
        const sampleRate = this.audioContext.sampleRate;
        const samples = Math.floor(duration * sampleRate);
        const envelope = this.getGrainEnvelope(shape, samples);
        
        gainNode.gain.setValueAtTime(0, startTime);
        
        switch (shape) {
            case 'blackman':
            case 'hanning':
            case 'sine':
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + duration * 0.3);
                gainNode.gain.setValueAtTime(0.3, startTime + duration * 0.7);
                gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
                break;
            case 'down-ramp':
                gainNode.gain.setValueAtTime(0.3, startTime);
                gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
                break;
            case 'expodec':
                gainNode.gain.setValueAtTime(0.3, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                break;
            default:
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + duration * 0.3);
                gainNode.gain.setValueAtTime(0.3, startTime + duration * 0.7);
                gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        }
    }

    // Recording functions
    async startRecording() {
        try {
            const stream = this.recordingDestination.stream;
            const options = {
                mimeType: 'audio/webm;codecs=opus'
            };
            
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                if (MediaRecorder.isTypeSupported('audio/webm')) {
                    options.mimeType = 'audio/webm';
                } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    options.mimeType = 'audio/mp4';
                } else {
                    options.mimeType = '';
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
        
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
        a.download = `grains_${timestamp}.webm`;
        
        a.href = url;
        a.click();
        
        URL.revokeObjectURL(url);
        this.recordedChunks = [];
        
        const recordButton = document.getElementById('recordButton');
        recordButton.textContent = '✅ SAVED';
        recordButton.classList.add('success');
        setTimeout(() => {
            recordButton.textContent = '⬤ REC';
            recordButton.classList.remove('success');
        }, 2000);
        
        console.log('Recording saved');
    }
}

// Enhanced initialization with visual effects and better defaults
document.addEventListener('DOMContentLoaded', () => {
    // Add SVG filters to document if not present
    if (!document.querySelector('#noise-filter')) {
        const svgFilters = document.createElement('div');
        svgFilters.innerHTML = `
            <svg class="svg-filters-container" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="noise-filter" x="0%" y="0%" width="100%" height="100%">
                        <feTurbulence baseFrequency="0.5" numOctaves="1" result="noise"/>
                        <feColorMatrix in="noise" type="saturate" values="0"/>
                        <feComponentTransfer>
                            <feFuncA type="discrete" tableValues="0.02 0.02 0.02 0.02"/>
                        </feComponentTransfer>
                        <feComposite operator="over" in2="SourceGraphic"/>
                    </filter>
                    
                    <filter id="noise-filter-strong" x="0%" y="0%" width="100%" height="100%">
                        <feTurbulence baseFrequency="0.8" numOctaves="2" result="noise"/>
                        <feColorMatrix in="noise" type="saturate" values="0"/>
                        <feComponentTransfer>
                            <feFuncA type="discrete" tableValues="0.05 0.05 0.05 0.05"/>
                        </feComponentTransfer>
                        <feComposite operator="over" in2="SourceGraphic"/>
                    </filter>
                </defs>
            </svg>
        `;
        document.body.insertBefore(svgFilters, document.body.firstChild);
    }
    
    // Initialize the sampler
    window.granularSampler = new GranularSampler();
    
    // Set default states - LOOP and WRAP OFF
    const looperToggle = document.getElementById('looperToggle');
    if (looperToggle) {
        looperToggle.classList.remove('active');
        looperToggle.textContent = '↻ LOOP';
    }
    
    // Set default comb sequencer toggle text
    const combSeqToggle = document.getElementById('stringSeqToggle');
    if (combSeqToggle) {
        combSeqToggle.textContent = 'OFF';
    }
    
    // Set default envelope toggle text
    const envelopeToggle = document.getElementById('envelopeLoopToggle');
    if (envelopeToggle) {
        envelopeToggle.textContent = 'Loop OFF';
    }
    
    // Enhanced initialization effects
    setTimeout(() => {
        const header = document.querySelector('.main-header');
        if (header) {
            header.style.animation = 'none';
            header.offsetHeight;
            header.style.animation = 'fadeInScale 1s ease-out';
        }
        
        if (window.granularSampler) {
            window.granularSampler.setupVisualEffects();
        }
    }, 100);
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.granularSampler && window.granularSampler.grainCanvas) {
                window.granularSampler.resizeGrainCanvas();
                window.granularSampler.drawWaveform();
            }
        }, 250);
    });
    
    window.addEventListener('error', (e) => {
        console.error('Global error caught:', e.error);
        const status = document.getElementById('status');
        if (status) {
            status.textContent = 'Error: ' + e.error.message;
            status.classList.add('error');
            setTimeout(() => {
                status.classList.remove('error');
            }, 3000);
        }
    });

    // Add to your initialization code
function detectAndConfigurePerformance() {
    const userAgent = navigator.userAgent;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    let performanceMode = 'balanced';
    
    // Detect low-power devices
    if (/iPhone [1-6]|iPad [1-4]|Android [1-4]/.test(userAgent)) {
        performanceMode = 'performance';
    }
    
    // Check connection speed
    if (connection && connection.effectiveType === 'slow-2g') {
        performanceMode = 'performance';
    }
    
    // Check hardware concurrency
    if (navigator.hardwareConcurrency < 4) {
        performanceMode = 'performance';
    }
    
    // Apply performance mode
    if (window.optimizedAnimationManager) {
        window.optimizedAnimationManager.setPerformanceMode(performanceMode);
    }
    
    if (performanceMode === 'performance') {
        document.body.classList.add('performance-mode');
    }
    
    console.log('Auto-detected performance mode:', performanceMode);
}

// Call after initialization
setTimeout(detectAndConfigurePerformance, 1000);

// Add to your main app initialization
function initializePerformanceDisplay() {
    const indicator = document.getElementById('performanceIndicator');
    const fpsDisplay = document.getElementById('fpsDisplay');
    const gradeDisplay = document.getElementById('gradeDisplay');
    
    if (!window.performanceMonitor || !indicator) return;
    
    setInterval(() => {
        const fps = window.performanceMonitor.getAverageFPS();
        const grade = window.performanceMonitor.getPerformanceGrade();
        
        if (fpsDisplay) fpsDisplay.textContent = `FPS: ${fps.toFixed(0)}`;
        if (gradeDisplay) gradeDisplay.textContent = `Grade: ${grade.toUpperCase()}`;
        
        indicator.className = `performance-indicator visible ${grade}`;
        
        // Auto-hide if performance is excellent
        if (grade === 'excellent') {
            setTimeout(() => indicator.classList.remove('visible'), 3000);
        }
    }, 1000);
}

// Add this for debugging mobile audio
window.debugMobileAudio = function() {
    console.group('Mobile Audio Debug');
    console.log('User Agent:', navigator.userAgent);
    console.log('Audio Context State:', window.mobileAudioManager?.audioContext?.state);
    console.log('Is Unlocked:', window.mobileAudioManager?.isAudioUnlocked());
    console.log('Audio Context:', window.mobileAudioManager?.audioContext);
    console.groupEnd();
};

// Call in browser console: debugMobileAudio()


// Call after DOM is ready
document.addEventListener('DOMContentLoaded', initializePerformanceDisplay);
    
    console.log('GRAINS Enhanced Granular Sampler v.13 INTIALIZED!');
    console.log('New Features:');
    console.log('- WARP button moved to WARP module');
    console.log('- WARP works independently (no LOOP dependency)');
    console.log('- Button text changed from WRAP to WARP');
    console.log('- WARP defaults to OFF on startup');
    console.log('- Enhanced LFO system with parameter modulation');
    console.log('- Multi-tap granular delay with aging and flutter');
    console.log('- Chromatic envelope with 5-stage editing');
    console.log('- 3-band frequency isolator');
    console.log('- Version v.13 displayed on oscilloscope');
});

// Performance optimization: Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.granularSampler) {
        window.granularSampler.stopPlayback();
        
        if (window.granularSampler.audioContext) {
            window.granularSampler.audioContext.close();
        }
        
        clearInterval();
        clearTimeout();
    }
    
    console.log('GRAINS cleanup completed');
});

// Error boundary for graceful failure handling
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    const status = document.getElementById('status');
    if (status) {
        status.textContent = 'Error: ' + (event.reason.message || 'Unknown error occurred');
        status.classList.add('error');
    }
    
    if (window.granularSampler && event.reason.name === 'InvalidStateError') {
        setTimeout(() => {
            window.granularSampler.initAudio().catch(console.error);
        }, 1000);
    }
});

console.log('GRAINS Enhanced Granular Sampler v.13 - All systems loaded');

// === MOBILE AUDIO FIX ===
// Simple mobile audio unlock without context conflicts

let mobileAudioUnlocked = false;

function unlockMobileAudio() {
    if (mobileAudioUnlocked || !window.granularSampler?.audioContext) return;
    
    const audioContext = window.granularSampler.audioContext;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('Mobile audio context resumed successfully');
            mobileAudioUnlocked = true;
            
            // Update status
            const status = document.getElementById('status');
            if (status && status.textContent.includes('Mobile')) {
                status.textContent = 'Ready - Audio unlocked for mobile';
                status.style.color = '#4CAF50';
            }
        }).catch(err => {
            console.warn('Failed to resume audio context:', err);
        });
    } else {
        mobileAudioUnlocked = true;
    }
}

// Mobile detection
function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

// Enhanced play button handling for mobile
function enhancePlayButton() {
    const playButton = document.getElementById('playButton');
    if (!playButton) return;
    
    const originalPlay = playButton.onclick;
    
    playButton.onclick = function(e) {
        // First unlock mobile audio if needed
        unlockMobileAudio();
        
        // Small delay to ensure audio context is ready
        setTimeout(() => {
            if (originalPlay) {
                originalPlay.call(this, e);
            }
        }, 100);
    };
}

// Initialize mobile audio handling
function initMobileAudio() {
    if (!isMobileDevice()) return;
    
    console.log('Mobile device detected - Enhanced audio handling enabled');
    
    // Add mobile unlock events
    const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown'];
    
    function handleFirstInteraction() {
        unlockMobileAudio();
        
        // Remove listeners after first interaction
        unlockEvents.forEach(event => {
            document.removeEventListener(event, handleFirstInteraction, true);
        });
    }
    
    unlockEvents.forEach(event => {
        document.addEventListener(event, handleFirstInteraction, true);
    });
    
    // Show mobile-specific status
    const status = document.getElementById('status');
    if (status) {
        status.textContent = 'Mobile device - Tap play to enable audio';
        status.style.color = '#FF9800';
    }
    
    // Enhance the play button
    enhancePlayButton();
}

// === PERFORMANCE OPTIMIZATIONS ===
// Selective visual updates (only update when values change)

let lastUpdateValues = {};

function shouldUpdateVisual(elementId, newValue, threshold = 0.01) {
    const lastValue = lastUpdateValues[elementId];
    if (lastValue === undefined) {
        lastUpdateValues[elementId] = newValue;
        return true;
    }
    
    const diff = Math.abs(newValue - lastValue);
    if (diff > threshold) {
        lastUpdateValues[elementId] = newValue;
        return true;
    }
    
    return false;
}

// Enhanced requestAnimationFrame management
let animationFrameId = null;
let lastFrameTime = 0;
const targetFrameTime = 1000 / 60; // 60 FPS

function smartRequestAnimationFrame(callback) {
    const now = performance.now();
    const timeSinceLastFrame = now - lastFrameTime;
    
    if (timeSinceLastFrame >= targetFrameTime) {
        lastFrameTime = now;
        callback(now);
    } else {
        const timeToNextFrame = targetFrameTime - timeSinceLastFrame;
        setTimeout(() => {
            lastFrameTime = performance.now();
            callback(lastFrameTime);
        }, timeToNextFrame);
    }
}

// Performance monitoring
let performanceMetrics = {
    frameCount: 0,
    startTime: performance.now(),
    lastFPSUpdate: 0,
    currentFPS: 0
};

function updatePerformanceMetrics() {
    const now = performance.now();
    performanceMetrics.frameCount++;
    
    if (now - performanceMetrics.lastFPSUpdate >= 1000) {
        performanceMetrics.currentFPS = performanceMetrics.frameCount;
        performanceMetrics.frameCount = 0;
        performanceMetrics.lastFPSUpdate = now;
        
        // Auto-adjust performance if needed
        if (performanceMetrics.currentFPS < 30) {
            console.warn('Low FPS detected:', performanceMetrics.currentFPS);
        }
    }
}

// Global debug functions
window.debugMobileAudio = function() {
    const audioContext = window.granularSampler?.audioContext;
    console.log('Mobile Audio Debug:', {
        isMobile: isMobileDevice(),
        audioUnlocked: mobileAudioUnlocked,
        audioContextState: audioContext?.state,
        audioContextSampleRate: audioContext?.sampleRate
    });
};

window.debugPerformance = function() {
    console.log('Performance Debug:', {
        currentFPS: performanceMetrics.currentFPS,
        totalFrames: performanceMetrics.frameCount,
        uptime: (performance.now() - performanceMetrics.startTime) / 1000
    });
};

// Initialize everything when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileAudio);
} else {
    initMobileAudio();
}

console.log('Mobile audio enhancements loaded - Use debugMobileAudio() and debugPerformance() for diagnostics');