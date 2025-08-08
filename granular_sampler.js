// Console welcome message
console.log(`
░░░░░██████╗░██████╗░░█████╗░██╗███╗░░██╗░██████╗░░░
░░░░██╔════╝░██╔══██╗██╔══██╗██║████╗░██║██╔════╝░░░
░░░░██║░░██╗░██████╔╝███████║██║██╔██╗██║╚█████╗░░░░
░░░░██║░░╚██╗██╔══██╗██╔══██║██║██║╚████║░╚═══██╗░░░
░░░░╚██████╔╝██║░░██║██║░░██║██║██║░╚███║██████╔╝░░░
░░░░░╚═════╝░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝╚═╝░░╚══╝╚═════╝░░░░
                    v.19
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
        this.wrapEnabled = false;
        this.scanPosition = 1/9; // Start at position "1" instead of "0"
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
        this.timeStretch = 1.0;
        
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
        this.combSeqLfos = new Map();
        this.combSeqIndicators = new Map();
        
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
        this.ringModSourceType = 'grains';
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
        
        // WARP Module with NEW LFOs
        this.warpNode = null;
        this.wrapDelayNode = null;
        this.warpRate = 20;
        this.warpStart = 0;
        this.warpLength = 20;
        this.warpBuffer = null;
        // NEW: WARP LFOs
        this.warpStartLfo = null;
        this.warpStartLfoGain = null;
        this.warpStartLfoSpeed = 1;
        this.warpStartLfoDepth = 0;
        this.warpLengthLfo = null;
        this.warpLengthLfoGain = null;
        this.warpLengthLfoSpeed = 1;
        this.warpLengthLfoDepth = 0;
        
      
        
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
        
        // PT2399 Analog Delay Emulation with NEW soft clipping
        this.pt2399DelayNode = null;
        this.pt2399FeedbackNode = null;
        this.pt2399FilterNode = null;
        this.pt2399WowLfo = null;
        this.pt2399WowGain = null;
        this.pt2399BitCrusher = null;
        this.pt2399NoiseSource = null;
        this.pt2399NoiseGain = null;
        this.pt2399WetNode = null;
        this.pt2399DryNode = null;
        this.pt2399Time = 200;
        this.pt2399Feedback = 30;
        this.pt2399Wow = 0;
        this.pt2399LoFi = 50;
        this.pt2399Mix = 0;
        // NEW: PT2399 Soft Clipping
        this.pt2399SoftClipNode = null;
        this.pt2399SoftClip = 0;
        this.pt2399SoftClipGain = null;

        // RENAMED: Ping Resonator (was T-Resonator Matrix)
        this.pingResonatorEnabled = false;
        this.pingResonatorPathA = {
            filter: null,
            delay: null,
            feedback: null,
            phaser: [],
            chorus: null,
            output: null
        };
        this.pingResonatorPathB = {
            filter: null,
            delay: null,
            feedback: null,
            phaser: [],
            chorus: null,
            output: null
        };
        this.pingResonatorFilterA = 1000;
        this.pingResonatorFilterB = 2000;
        this.pingResonatorFeedback = 0;
        this.pingResonatorDelayFeedback = 30;
        this.pingResonatorFM = 0;
        this.pingResonatorCrossfade = 50;
        // NEW: Input gain and wet mix for Ping Resonator
        this.pingResonatorInputGain = 1;
        this.pingResonatorWetMix = 0;
        this.pingResonatorInputGainNode = null;
        this.pingResonatorWetMixNode = null;
        this.pingResonatorDryMixNode = null;

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
        
        // Chromatic Envelope
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
        
        // 3-Band Frequency Isolator
        this.isolatorNodes = {
            lo: { filter: null, gain: null },
            mid: { filter: null, gain: null },
            hi: { filter: null, gain: null }
        };
        this.isolatorLo = 1;
        this.isolatorMid = 1;
        this.isolatorHi = 1;

        // Liquefier Filter (SIMPLIFIED - no display)
        this.liquefierEnabled = true;
        this.liquefierFilter = null;
        this.liquefierRandomLfo = null;
        this.liquefierLfoGain = null;
        this.liquefierFreq = 2000;
        this.liquefierResonance = 0.5;
        this.liquefierDepth = 0;
        this.liquefierRate = 1;
        this.liquefierSmooth = true;
        this.liquefierMix = 0;
        this.liquefierWetNode = null;
        this.liquefierDryNode = null;

// NEW: Notch Filter properties
        this.notchFilterNode = null;
        this.notchFilterLfo = null;
        this.notchFilterLfoGain = null;
        this.notchFilterFreq = 1000;
        this.notchFilterBandwidth = 5;
        this.notchFilterWetMix = 0;
        this.notchFilterLfoRate = 1;
        this.notchFilterLfoDepth = 0;
        this.notchFilterWetNode = null;
        this.notchFilterDryNode = null;
        
        // NEW: Phaser wet mix
        this.phaserWetMix = 50;


        // Enhanced Grain animation
        this.grainCanvas = null;
        this.grainCtx = null;
        this.grainParticles = [];
        
        // Visual effects
        this.logoParticles = [];
        this.fallingDust = [];
        this.glassEffects = [];
        
// Arpeggiator
this.arpeggiatorEnabled = false;
this.arpLfo = null;
this.arpRate = 4;
this.arpSqueeze = 0;
this.arpScale = 'chromatic';
this.arpPattern = [true, false, false, false, false, false, false, false, false]; // 3x3 grid
this.arpCurrentStep = 0;
this.arpBaseNote = 0; // Semitones from root
this.arpIsPlaying = false;
this.arpStepTimer = null;

// Scale definitions (intervals in semitones)
this.scales = {
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    mixolydian: [0, 2, 4, 5, 7, 9, 10]
};


        // Store default values for reset function
this.defaultValues = {};

// Speed controllers
this.grainSpeed = 1.0;
this.loopSpeed = 1.0;
this.grainSpeedActive = false;
this.loopSpeedActive = false;

this.initAudio();
        this.setupEventListeners();
        this.setupKeyboardControls();
        this.setupMobileKeyboard();
        this.setupGrainAnimation();
        this.setupVisualEffects();
        this.storeDefaultValues();
        this.setupPresets();
    }

    // Mobile device detection
isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
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
            warpStartLfoSpeed: 1,
            warpStartLfoDepth: 0,
            warpLengthLfoSpeed: 1,
            warpLengthLfoDepth: 0,
            pannerXDepth: 0,
            pannerYRange: 0,
            pannerSpeed: 0.5,
            freqShifterAmount: 0,
            freqShifterMix: 0,
            volume: 0.7,
            pt2399Time: 200,
            pt2399Feedback: 30,
            pt2399Wow: 0,
            pt2399LoFi: 50,
            pt2399Mix: 0,
            pt2399SoftClip: 0,
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
            liquefierFreq: 2000,
            liquefierResonance: 0.5,
            liquefierDepth: 0,
            liquefierRate: 1,
            liquefierMix: 0,
            liquefierSmooth: true,
            wrapEnabled: false,
            pingResonatorInputGain: 1,
            pingResonatorWetMix: 0,
            notchFilterFreq: 1000,
notchFilterBandwidth: 5,
notchFilterWetMix: 0,
notchFilterLfoRate: 1,
notchFilterLfoDepth: 0,
phaserWetMix: 50,
arpRate: 4,
arpSqueeze: 0,
arpScale: 'chromatic',
        };
    }

    // Setup preset management
    setupPresets() {
        this.presets = new Map();
        this.loadPresetsFromStorage();
        this.updatePresetSelect();
    }
    // FIXED: Setup visual effects with proper continuous motion
    setupVisualEffects() {
        this.setupLogoParticles();
        this.setupFallingDust();
        this.setupGlassEffects();
        this.animateVisualEffects();
    }

    // FIXED: Logo particles with continuous randomized motion
    setupLogoParticles() {
        const logoContainer = document.getElementById('logoParticles');
        if (!logoContainer) return;
        
        // Clear existing particles
        logoContainer.innerHTML = '';
        
        // Create 8 particles for better visibility
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.animationDelay = (i * 0.5) + 's';
            particle.style.animationDuration = (6 + Math.random() * 4) + 's';
            logoContainer.appendChild(particle);
        }

        // Continuously add new particles
        setInterval(() => {
            if (logoContainer.children.length < 10) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.top = (10 + Math.random() * 80) + '%';
                particle.style.left = (10 + Math.random() * 80) + '%';
                particle.style.animationDelay = '0s';
                particle.style.animationDuration = (6 + Math.random() * 4) + 's';
                logoContainer.appendChild(particle);
                
                // Remove after animation completes
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 10000);
            }
        }, 1500); // Add new particle every 1.5 seconds
    }

    // FIXED: Falling dust with increased lifetime and robust motion
    setupFallingDust() {
        const dustContainer = document.getElementById('fallingDust');
        if (!dustContainer) return;
        
        // Clear existing dust
        dustContainer.innerHTML = '';
        
        setInterval(() => {
            if (dustContainer.children.length < 25) {
                const dust = document.createElement('div');
                dust.className = 'dust-particle';
                dust.style.left = Math.random() * 100 + '%';
                dust.style.animationDelay = Math.random() * 2 + 's';
                dust.style.animationDuration = (3 + Math.random() * 2) + 's';
                dustContainer.appendChild(dust);
                
                // Increased lifetime
                setTimeout(() => {
                    if (dust.parentNode) {
                        dust.parentNode.removeChild(dust);
                    }
                }, 6000); // Increased from 4000
            }
        }, 300); // More frequent particle generation
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
        
        // Initialize Comb Seq LFO system
        this.initCombSeqLFOSystem();
        
        // Create 8-band vocoder
        await this.initVocoder();
        
        // Create waveshaper
        this.waveShaperNode = this.audioContext.createWaveShaper();
        this.waveShaperNode.curve = this.makeWavefolderCurve(0);
        this.waveShaperNode.oversample = '4x';
        
        await this.initRingModulator();
        await this.initSpectralFreezeAndPhaser();
        await this.initWarpModule();
        await this.init3DPannerAndFreqShifter();
        await this.initPT2399Delay();
        await this.initReverb();
        await this.initCombSequencer();
        await this.initChromaticEnvelope();
        await this.initFrequencyIsolator();
        await this.initPingResonator(); // RENAMED from initTResonator
        await this.initLiquefierFilter();
        await this.initNotchFilter();
        await this.initArpeggiator();
        // Connect signal path
        this.connectAudioNodes();
    }

    // Initialize Comb Seq LFO System
    initCombSeqLFOSystem() {
        const modulatableParams = [
            'grainSize', 'density', 'windowScan', 'timeStretch',
            'filterFreq', 'filterQ',
            'vocoder1', 'vocoder2', 'vocoder3', 'vocoder4', 'vocoder5', 'vocoder6', 'vocoder7', 'vocoder8', 'vocoderMix',
            'wavefold', 'ringModMix', 'ringModFreq',
            'spectralFreeze', 'spectralResonance', 'phaserRate', 'phaserDepth', 'phaserFeedback', 'phaserGain',
            'warpRate', 'warpStart', 'warpLength', 'warpStartLfoSpeed', 'warpStartLfoDepth', 'warpLengthLfoSpeed', 'warpLengthLfoDepth',
            'pannerXDepth', 'pannerYRange', 'pannerSpeed',
            'freqShifterAmount', 'freqShifterMix',
            'pt2399Time', 'pt2399Feedback', 'pt2399Wow', 'pt2399LoFi', 'pt2399Mix', 'pt2399SoftClip',
            'reverbSize', 'reverbDecay', 'reverbPreDelay', 'reverbWetGain', 'reverbMix',
            'stringSeqSpeed', 'stringSeqDepth', 'stringSeqWetMix', 'stringSeqSqueeze', 'combSeqSoftClip',
            'stringSeqStep1', 'stringSeqStep2', 'stringSeqStep3', 'stringSeqStep4', 'stringSeqStep5',
            'envelopeRate', 'envelopeDepth',
            'isolatorLo', 'isolatorMid', 'isolatorHi',
            'liquefierFreq', 'liquefierResonance', 'liquefierDepth', 'liquefierRate', 'liquefierMix',
            'pingResonatorInputGain', 'pingResonatorWetMix'
        ];
        
        modulatableParams.forEach(paramName => {
            const lfo = this.audioContext.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.1;
            
            const lfoGain = this.audioContext.createGain();
            lfoGain.gain.value = 0;
            
            lfo.connect(lfoGain);
            lfo.start();
            
            this.combSeqLfos.set(paramName, {
                oscillator: lfo,
                gainNode: lfoGain,
                depth: 0,
                active: false
            });
            
            const indicator = document.getElementById(paramName + 'LfoIndicator');
            if (indicator) {
                this.combSeqIndicators.set(paramName, indicator);
            }
        });
    }

    updateCombSeqLFO(paramName, depth = 0) {
        const lfoData = this.combSeqLfos.get(paramName);
        const indicator = this.combSeqIndicators.get(paramName);
        
        if (!lfoData) return;
        
        const isActive = this.combSeqEnabled && depth > 0;
        lfoData.active = isActive;
        lfoData.depth = depth;
        
        lfoData.oscillator.frequency.value = this.combSeqSpeed;
        lfoData.gainNode.gain.value = isActive ? (depth / 100) * 50 : 0;
        
        if (indicator) {
            indicator.classList.toggle('active', isActive);
        }
        
        if (isActive) {
            this.connectLFOToParameter(paramName, lfoData);
        } else {
            this.disconnectLFOFromParameter(paramName, lfoData);
        }
    }

    connectLFOToParameter(paramName, lfoData) {
        try {
            this.disconnectLFOFromParameter(paramName, lfoData);
            
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
                case 'pt2399Time':
                    if (this.pt2399DelayNode) {
                        lfoData.gainNode.connect(this.pt2399DelayNode.delayTime);
                    }
                    break;
                case 'pt2399Feedback':
                    if (this.pt2399FeedbackNode) {
                        lfoData.gainNode.connect(this.pt2399FeedbackNode.gain);
                    }
                    break;
            }
        } catch (error) {
            console.warn(`Could not connect LFO to ${paramName}:`, error);
        }
    }

    disconnectLFOFromParameter(paramName, lfoData) {
        try {
            lfoData.gainNode.disconnect();
        } catch (error) {
            // Ignore disconnect errors
        }
    }

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

    async initRingModulator() {
        this.ringModNode = this.audioContext.createGain();
        this.ringModNode.gain.value = 0;
        
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        
        this.ringModNoiseSource = this.audioContext.createBufferSource();
        this.ringModNoiseSource.buffer = noiseBuffer;
        this.ringModNoiseSource.loop = true;
        this.ringModNoiseSource.start();
        
        this.ringModOscSource = this.audioContext.createOscillator();
        this.ringModOscSource.type = 'sine';
        this.ringModOscSource.frequency.value = this.ringModFreq;
        this.ringModOscSource.start();
        
        this.ringModGrainSource = this.audioContext.createGain();
        this.ringModGrainSource.gain.value = 1;
        
        this.ringModSource = this.ringModGrainSource;
        this.ringModSource.connect(this.ringModNode.gain);
        
        this.ringModMixNode = this.audioContext.createGain();
        this.ringModDryNode = this.audioContext.createGain();
        this.ringModMixNode.gain.value = 0;
        this.ringModDryNode.gain.value = 1;
    }

    async initSpectralFreezeAndPhaser() {
        this.spectralFreezeNode = this.audioContext.createDelay(0.1);
        this.spectralFreezeNode.delayTime.value = 0.05;
        
        this.spectralFilterNode = this.audioContext.createBiquadFilter();
        this.spectralFilterNode.type = 'peaking';
        this.spectralFilterNode.frequency.value = 1000;
        this.spectralFilterNode.Q.value = 5;
        this.spectralFilterNode.gain.value = 0;
        
        this.spectralFeedbackNode = this.audioContext.createGain();
        this.spectralFeedbackNode.gain.value = 0;
        
        this.spectralFreezeNode.connect(this.spectralFilterNode);
        this.spectralFilterNode.connect(this.spectralFeedbackNode);
        this.spectralFeedbackNode.connect(this.spectralFreezeNode);
        
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

    // UPDATED: WARP Module with NEW LFOs for Start Point and Loop Length
    async initWarpModule() {
        this.wrapDelayNode = this.audioContext.createDelay(0.02);
        this.wrapDelayNode.delayTime.value = this.warpLength / 1000;
        
        this.warpFeedbackNode = this.audioContext.createGain();
        this.warpFeedbackNode.gain.value = 0;
        
        this.warpWetNode = this.audioContext.createGain();
        this.warpDryNode = this.audioContext.createGain();
        this.warpWetNode.gain.value = 0;
        this.warpDryNode.gain.value = 1;
        
        this.warpRateOsc = this.audioContext.createOscillator();
        this.warpRateOsc.type = 'triangle';
        this.warpRateOsc.frequency.value = this.warpRate;

        this.warpRateGain = this.audioContext.createGain();
        this.warpRateGain.gain.value = 0;

        this.warpRateOsc.connect(this.warpRateGain);
        this.warpRateOsc.start();
        
        // NEW: Start Point LFO
        this.warpStartLfo = this.audioContext.createOscillator();
        this.warpStartLfo.type = 'sine';
        this.warpStartLfo.frequency.value = this.warpStartLfoSpeed;
        
        this.warpStartLfoGain = this.audioContext.createGain();
        this.warpStartLfoGain.gain.value = 0;
        
        this.warpStartLfo.connect(this.warpStartLfoGain);
        this.warpStartLfo.start();
        
        // NEW: Loop Length LFO
        this.warpLengthLfo = this.audioContext.createOscillator();
        this.warpLengthLfo.type = 'sine';
        this.warpLengthLfo.frequency.value = this.warpLengthLfoSpeed;
        
        this.warpLengthLfoGain = this.audioContext.createGain();
        this.warpLengthLfoGain.gain.value = 0;
        
        this.warpLengthLfo.connect(this.warpLengthLfoGain);
        this.warpLengthLfo.start();
        
        this.wrapDelayNode.connect(this.warpFeedbackNode);
        this.warpFeedbackNode.connect(this.wrapDelayNode);
        this.wrapDelayNode.connect(this.warpWetNode);
        
        this.setupWarpVisualization();
    }

   

    async init3DPannerAndFreqShifter() {
        this.pannerNode = this.audioContext.createPanner();
        this.pannerNode.panningModel = 'HRTF';
        this.pannerNode.distanceModel = 'inverse';
        this.pannerNode.refDistance = 1;
        this.pannerNode.maxDistance = 10000;
        this.pannerNode.rolloffFactor = 1;
        this.pannerNode.coneInnerAngle = 360;
        this.pannerNode.coneOuterAngle = 0;
        this.pannerNode.coneOuterGain = 0;
        
        if (this.audioContext.listener.positionX) {
            this.audioContext.listener.positionX.value = 0;
            this.audioContext.listener.positionY.value = 0;
            this.audioContext.listener.positionZ.value = 1;
        } else {
            this.audioContext.listener.setPosition(0, 0, 1);
        }
        
        this.pannerLfoX = this.audioContext.createOscillator();
        this.pannerLfoX.type = 'sine';
        this.pannerLfoX.frequency.value = this.pannerSpeed;
        
        this.pannerLfoY = this.audioContext.createOscillator();
        this.pannerLfoY.type = 'sine';
        this.pannerLfoY.frequency.value = this.pannerSpeed * 0.7;
        
        this.pannerXGain = this.audioContext.createGain();
        this.pannerYGain = this.audioContext.createGain();
        this.pannerXGain.gain.value = 0;
        this.pannerYGain.gain.value = 0;
        
        this.pannerLfoX.connect(this.pannerXGain);
        this.pannerLfoY.connect(this.pannerYGain);
        
        if (this.pannerNode.positionX) {
            this.pannerXGain.connect(this.pannerNode.positionX);
            this.pannerYGain.connect(this.pannerNode.positionY);
        }
        
        this.pannerLfoX.start();
        this.pannerLfoY.start();
        
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

    // UPDATED: PT2399 Analog Delay with NEW Soft Clipping
    async initPT2399Delay() {
        this.pt2399DelayNode = this.audioContext.createDelay(0.6);
        this.pt2399DelayNode.delayTime.value = this.pt2399Time / 1000;
        
        this.pt2399FeedbackNode = this.audioContext.createGain();
        this.pt2399FeedbackNode.gain.value = this.pt2399Feedback / 100;
        
        this.pt2399FilterNode = this.audioContext.createBiquadFilter();
        this.pt2399FilterNode.type = 'lowpass';
        this.pt2399FilterNode.frequency.value = 8000 - (this.pt2399LoFi / 100 * 6000);
        this.pt2399FilterNode.Q.value = 0.7;
        
        this.pt2399WowLfo = this.audioContext.createOscillator();
        this.pt2399WowLfo.type = 'sine';
        this.pt2399WowLfo.frequency.value = 0.5 + Math.random();
        
        this.pt2399WowGain = this.audioContext.createGain();
        this.pt2399WowGain.gain.value = 0;
        
        this.pt2399WowLfo.connect(this.pt2399WowGain);
        this.pt2399WowGain.connect(this.pt2399DelayNode.delayTime);
        this.pt2399WowLfo.start();
        
        this.pt2399BitCrusher = this.audioContext.createWaveShaper();
        this.pt2399BitCrusher.curve = this.makeBitCrushCurve(12);
        this.pt2399BitCrusher.oversample = 'none';
        
        // NEW: Soft Clipping Saturation
        this.pt2399SoftClipNode = this.audioContext.createWaveShaper();
        this.pt2399SoftClipNode.curve = this.makeSoftClipCurve(0);
        this.pt2399SoftClipNode.oversample = '2x';
        
        this.pt2399SoftClipGain = this.audioContext.createGain();
        this.pt2399SoftClipGain.gain.value = 1;
        
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate, this.audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * 0.1;
        }
        
        this.pt2399NoiseSource = this.audioContext.createBufferSource();
        this.pt2399NoiseSource.buffer = noiseBuffer;
        this.pt2399NoiseSource.loop = true;
        this.pt2399NoiseSource.start();
        
        this.pt2399NoiseGain = this.audioContext.createGain();
        this.pt2399NoiseGain.gain.value = 0;
        
        this.pt2399NoiseSource.connect(this.pt2399NoiseGain);
        
        this.pt2399WetNode = this.audioContext.createGain();
        this.pt2399DryNode = this.audioContext.createGain();
        this.pt2399WetNode.gain.value = 0;
        this.pt2399DryNode.gain.value = 1;
        
        // Connect PT2399 chain with NEW soft clipping
        this.pt2399DelayNode.connect(this.pt2399FilterNode);
        this.pt2399FilterNode.connect(this.pt2399BitCrusher);
        this.pt2399BitCrusher.connect(this.pt2399SoftClipGain);
        this.pt2399SoftClipGain.connect(this.pt2399SoftClipNode);
        this.pt2399SoftClipNode.connect(this.pt2399FeedbackNode);
        this.pt2399FeedbackNode.connect(this.pt2399DelayNode);
        this.pt2399SoftClipNode.connect(this.pt2399WetNode);
        this.pt2399NoiseGain.connect(this.pt2399WetNode);
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

    async initChromaticEnvelope() {
        this.chromaticEnvelope = this.audioContext.createOscillator();
        this.chromaticEnvelope.type = 'sine';
        this.chromaticEnvelope.frequency.value = this.envelopeRate;
        
        this.envelopeGainNode = this.audioContext.createGain();
        this.envelopeGainNode.gain.value = 0;
        
        this.chromaticEnvelope.connect(this.envelopeGainNode);
        this.chromaticEnvelope.start();
        
        this.setupEnvelopeCanvas();
    }

    setupEnvelopeCanvas() {
        this.envelopeCanvas = document.getElementById('envelopeCanvas');
        if (!this.envelopeCanvas) return;
        
        this.envelopeCtx = this.envelopeCanvas.getContext('2d');
        
        this.envelopeCanvas.addEventListener('mousedown', (e) => this.startEnvelopeDrag(e));
        this.envelopeCanvas.addEventListener('mousemove', (e) => this.dragEnvelope(e));
        this.envelopeCanvas.addEventListener('mouseup', () => this.endEnvelopeDrag());
        this.envelopeCanvas.addEventListener('mouseleave', () => this.endEnvelopeDrag());
        
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

    async initFrequencyIsolator() {
        this.isolatorNodes.lo.filter = this.audioContext.createBiquadFilter();
        this.isolatorNodes.lo.filter.type = 'lowpass';
        this.isolatorNodes.lo.filter.frequency.value = 250;
        this.isolatorNodes.lo.filter.Q.value = 0.7;
        
        this.isolatorNodes.lo.gain = this.audioContext.createGain();
        this.isolatorNodes.lo.gain.gain.value = this.isolatorLo;
        
        this.isolatorNodes.mid.filter = this.audioContext.createBiquadFilter();
        this.isolatorNodes.mid.filter.type = 'bandpass';
        this.isolatorNodes.mid.filter.frequency.value = 1000;
        this.isolatorNodes.mid.filter.Q.value = 0.5;
        
        this.isolatorNodes.mid.gain = this.audioContext.createGain();
        this.isolatorNodes.mid.gain.gain.value = this.isolatorMid;
        
        this.isolatorNodes.hi.filter = this.audioContext.createBiquadFilter();
        this.isolatorNodes.hi.filter.type = 'highpass';
        this.isolatorNodes.hi.filter.frequency.value = 4000;
        this.isolatorNodes.hi.filter.Q.value = 0.7;
        
        this.isolatorNodes.hi.gain = this.audioContext.createGain();
        this.isolatorNodes.hi.gain.gain.value = this.isolatorHi;
        
        this.isolatorNodes.lo.filter.connect(this.isolatorNodes.lo.gain);
        this.isolatorNodes.mid.filter.connect(this.isolatorNodes.mid.gain);
        this.isolatorNodes.hi.filter.connect(this.isolatorNodes.hi.gain);
        
        this.isolatorOutputNode = this.audioContext.createGain();
        this.isolatorOutputNode.gain.value = 1;
        
        this.isolatorNodes.lo.gain.connect(this.isolatorOutputNode);
        this.isolatorNodes.mid.gain.connect(this.isolatorOutputNode);
        this.isolatorNodes.hi.gain.connect(this.isolatorOutputNode);
    }

    // RENAMED: Initialize Ping Resonator (was T-Resonator) with NEW input gain and wet mix
    async initPingResonator() {
        // NEW: Input gain node
        this.pingResonatorInputGainNode = this.audioContext.createGain();
        this.pingResonatorInputGainNode.gain.value = this.pingResonatorInputGain;
        
        // Path A (Left)
        this.pingResonatorPathA.filter = this.audioContext.createBiquadFilter();
        this.pingResonatorPathA.filter.type = 'lowpass'; 
        this.pingResonatorPathA.filter.frequency.value = this.pingResonatorFilterA;
        this.pingResonatorPathA.filter.Q.value = 15;
        
        this.pingResonatorPathA.delay = this.audioContext.createDelay(0.05);
        this.pingResonatorPathA.delay.delayTime.value = 0.01;
        
        this.pingResonatorPathA.feedback = this.audioContext.createGain();
        this.pingResonatorPathA.feedback.gain.value = 0;
        
        this.pingResonatorPathA.phaser = [];
        for (let i = 0; i < 2; i++) {
            const phaser = this.audioContext.createBiquadFilter();
            phaser.type = 'allpass';
            phaser.frequency.value = 800 + i * 400;
            phaser.Q.value = 1;
            this.pingResonatorPathA.phaser.push(phaser);
            
            if (i > 0) {
                this.pingResonatorPathA.phaser[i-1].connect(phaser);
            }
        }
        
        this.pingResonatorPathA.chorus = this.audioContext.createDelay(0.02);
        this.pingResonatorPathA.chorus.delayTime.value = 0.005;
        
        this.pingResonatorPathA.output = this.audioContext.createGain();
        this.pingResonatorPathA.output.gain.value = 0.5;

        // Path B (Right)
        this.pingResonatorPathB.filter = this.audioContext.createBiquadFilter();
        this.pingResonatorPathB.filter.type = 'lowpass';
        this.pingResonatorPathB.filter.frequency.value = this.pingResonatorFilterB;
        this.pingResonatorPathB.filter.Q.value = 15;
        
        this.pingResonatorPathB.delay = this.audioContext.createDelay(0.05);
        this.pingResonatorPathB.delay.delayTime.value = 0.015;
        
        this.pingResonatorPathB.feedback = this.audioContext.createGain();
        this.pingResonatorPathB.feedback.gain.value = 0;
        
        this.pingResonatorPathB.phaser = [];
        for (let i = 0; i < 2; i++) {
            const phaser = this.audioContext.createBiquadFilter();
            phaser.type = 'allpass';
            phaser.frequency.value = 1200 + i * 600;
            phaser.Q.value = 1;
            this.pingResonatorPathB.phaser.push(phaser);
            
            if (i > 0) {
                this.pingResonatorPathB.phaser[i-1].connect(phaser);
            }
        }
        
        this.pingResonatorPathB.chorus = this.audioContext.createDelay(0.02);
        this.pingResonatorPathB.chorus.delayTime.value = 0.008;
        
        this.pingResonatorPathB.output = this.audioContext.createGain();
        this.pingResonatorPathB.output.gain.value = 0.5;

        // Crossfade between paths A and B
        this.pingResonatorCrossfadeA = this.audioContext.createGain();
        this.pingResonatorCrossfadeB = this.audioContext.createGain();
        this.pingResonatorCrossfadeA.gain.value = 0.5;
        this.pingResonatorCrossfadeB.gain.value = 0.5;
        
        this.pingResonatorOutputNode = this.audioContext.createGain();
        this.pingResonatorOutputNode.gain.value = 0.5;
        
        // NEW: Wet/dry mix nodes
        this.pingResonatorWetMixNode = this.audioContext.createGain();
        this.pingResonatorDryMixNode = this.audioContext.createGain();
        this.pingResonatorWetMixNode.gain.value = this.pingResonatorWetMix / 100;
        this.pingResonatorDryMixNode.gain.value = 1 - (this.pingResonatorWetMix / 100);

        this.connectPingResonatorChains();
    }

    // RENAMED: Connect Ping Resonator chains
    connectPingResonatorChains() {
        // Input gain to both paths
        this.pingResonatorInputGainNode.connect(this.pingResonatorPathA.filter);
        this.pingResonatorInputGainNode.connect(this.pingResonatorPathB.filter);
        
        // Path A connection
        if (this.pingResonatorPathA.phaser.length > 0) {
            this.pingResonatorPathA.filter.connect(this.pingResonatorPathA.phaser[0]);
            this.pingResonatorPathA.phaser[this.pingResonatorPathA.phaser.length - 1].connect(this.pingResonatorPathA.chorus);
        } else {
            this.pingResonatorPathA.filter.connect(this.pingResonatorPathA.chorus);
        }
        
        this.pingResonatorPathA.chorus.connect(this.pingResonatorPathA.delay);
        this.pingResonatorPathA.delay.connect(this.pingResonatorPathA.feedback);
        this.pingResonatorPathA.feedback.connect(this.pingResonatorPathA.delay);
        this.pingResonatorPathA.delay.connect(this.pingResonatorPathA.output);
        this.pingResonatorPathA.output.connect(this.pingResonatorCrossfadeA);

        // Path B connection
        if (this.pingResonatorPathB.phaser.length > 0) {
            this.pingResonatorPathB.filter.connect(this.pingResonatorPathB.phaser[0]);
            this.pingResonatorPathB.phaser[this.pingResonatorPathB.phaser.length - 1].connect(this.pingResonatorPathB.chorus);
        } else {
            this.pingResonatorPathB.filter.connect(this.pingResonatorPathB.chorus);
        }
        
        this.pingResonatorPathB.chorus.connect(this.pingResonatorPathB.delay);
        this.pingResonatorPathB.delay.connect(this.pingResonatorPathB.feedback);
        this.pingResonatorPathB.feedback.connect(this.pingResonatorPathB.delay);
        this.pingResonatorPathB.delay.connect(this.pingResonatorPathB.output);
        this.pingResonatorPathB.output.connect(this.pingResonatorCrossfadeB);

        // Final crossfade and output
        this.pingResonatorCrossfadeA.connect(this.pingResonatorOutputNode);
        this.pingResonatorCrossfadeB.connect(this.pingResonatorOutputNode);
        this.pingResonatorOutputNode.connect(this.pingResonatorWetMixNode);
    }

    // SIMPLIFIED: Initialize Liquefier Filter (no display canvas)
    async initLiquefierFilter() {
        this.liquefierFilter = this.audioContext.createBiquadFilter();
        this.liquefierFilter.type = 'lowpass';
        this.liquefierFilter.frequency.value = this.liquefierFreq;
        this.liquefierFilter.Q.value = this.liquefierResonance * 20;
        
        this.liquefierRandomLfo = this.audioContext.createOscillator();
        this.liquefierRandomLfo.type = 'sawtooth';
        this.liquefierRandomLfo.frequency.value = this.liquefierRate;
        
        this.liquefierLfoGain = this.audioContext.createGain();
        this.liquefierLfoGain.gain.value = 0;
        
        this.liquefierRandomLfo.connect(this.liquefierLfoGain);
        this.liquefierLfoGain.connect(this.liquefierFilter.frequency);
        this.liquefierRandomLfo.start();
        
        this.liquefierWetNode = this.audioContext.createGain();
        this.liquefierDryNode = this.audioContext.createGain();
        this.liquefierWetNode.gain.value = 0;
        this.liquefierDryNode.gain.value = 1;
        
        this.liquefierFilter.connect(this.liquefierWetNode);
        
        this.generateRandomLFO();
    }

    // UPDATED: Connect audio nodes with new signal path (removed additive, simplified)
    connectAudioNodes() {
    // UPDATED Signal path v.17:
    // Grains → Filter → Notch Filter → Vocoder → Wavefolder → Ring Mod → Spectral Freeze → Phaser → WARP → 3D Panner → Freq Shifter → PT2399 → Reverb → Comb Seq → Envelope → Isolator → Liquefier → Output
    
    // Filter to notch filter
    this.filterNode.connect(this.notchFilterDryNode);
    this.filterNode.connect(this.notchFilterNode);
    
    // Notch filter to vocoder routing
    this.notchFilterDryNode.connect(this.vocoderDryNode);
    this.notchFilterWetNode.connect(this.vocoderDryNode);
    
    for (let i = 0; i < 8; i++) {
        this.notchFilterDryNode.connect(this.vocoderBands[i].carrierFilter);
        this.notchFilterWetNode.connect(this.vocoderBands[i].carrierFilter);
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
    
    // Phaser to WARP
    this.phaserDryNode.connect(this.warpDryNode);
    this.phaserMixNode.connect(this.warpDryNode);
    this.phaserDryNode.connect(this.wrapDelayNode);
    this.phaserMixNode.connect(this.wrapDelayNode);

    // WARP to 3D panner
    this.warpDryNode.connect(this.pannerNode);
    this.warpWetNode.connect(this.pannerNode);
    
    // 3D panner to frequency shifter
    this.pannerNode.connect(this.freqShifterDryNode);
    this.pannerNode.connect(this.freqShifterNode);
    this.freqShifterNode.connect(this.freqShifterGainBoost);
    this.freqShifterGainBoost.connect(this.freqShifterWetNode);
    
    // Frequency shifter to PT2399 delay
    this.freqShifterDryNode.connect(this.pt2399DryNode);
    this.freqShifterWetNode.connect(this.pt2399DryNode);
    this.freqShifterDryNode.connect(this.pt2399DelayNode);
    this.freqShifterWetNode.connect(this.pt2399DelayNode);
    
    // PT2399 to reverb
    this.pt2399DryNode.connect(this.reverbDryNode);
    this.pt2399DryNode.connect(this.reverbPreDelayNode);
    this.pt2399WetNode.connect(this.reverbDryNode);
    this.pt2399WetNode.connect(this.reverbPreDelayNode);
    
    // Reverb chain
    this.reverbPreDelayNode.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbWetGainNode);
    this.reverbWetGainNode.connect(this.reverbWetNode);
    
    // Reverb to comb sequencer
    this.reverbDryNode.connect(this.combSeqDryGainNode);
    this.reverbWetNode.connect(this.combSeqDryGainNode);
    
    if (this.combSeqStreams.length > 0) {
        this.combSeqStreams.forEach(stream => {
            this.reverbDryNode.connect(stream.delayNode);
            this.reverbWetNode.connect(stream.delayNode);
        });
    }
    
    // Comb seq to isolator
    this.combSeqDryGainNode.connect(this.isolatorNodes.lo.filter);
    this.combSeqDryGainNode.connect(this.isolatorNodes.mid.filter);
    this.combSeqDryGainNode.connect(this.isolatorNodes.hi.filter);
    this.combSeqWetGainNode.connect(this.isolatorNodes.lo.filter);
    this.combSeqWetGainNode.connect(this.isolatorNodes.mid.filter);
    this.combSeqWetGainNode.connect(this.isolatorNodes.hi.filter);
    
    // Isolator to Liquefier
    this.isolatorOutputNode.connect(this.liquefierDryNode);
    this.isolatorOutputNode.connect(this.liquefierFilter);
    
    // Final Liquefier output to mute control
    this.liquefierDryNode.connect(this.muteGainNode);
    this.liquefierWetNode.connect(this.muteGainNode);
}

  
    // Helper functions for creating curves
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
            // More subtle tape-like saturation
            const drive = 1 + amount * 3; // Reduced from 10 to 3
            curve[i] = Math.tanh(x * drive) * (0.7 + amount * 0.2); // Gentler output scaling
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

    makeBitCrushCurve(bits) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const steps = Math.pow(2, bits);
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = Math.round(x * steps) / steps;
        }
        
        return curve;
    }

    // UPDATED: WARP visualization setup
    setupWarpVisualization() {
        this.warpCanvas = document.getElementById('warpCanvas');
        if (this.warpCanvas) {
            this.warpCtx = this.warpCanvas.getContext('2d');
            this.animateWarpDisplay();
        }
    }

    // UPDATED: Animate WARP display
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
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.wrapEnabled) {
            const time = this.audioContext.currentTime;
            
            // Apply LFO modulations to start and length
            let currentStart = this.warpStart;
            let currentLength = this.warpLength;
            
            if (this.warpStartLfoDepth > 0) {
                const startLfoValue = Math.sin(time * this.warpStartLfoSpeed * Math.PI * 2);
                currentStart += startLfoValue * (this.warpStartLfoDepth / 100) * 5; // Max 5ms modulation
            }
            
            if (this.warpLengthLfoDepth > 0) {
                const lengthLfoValue = Math.sin(time * this.warpLengthLfoSpeed * Math.PI * 2);
                currentLength += lengthLfoValue * (this.warpLengthLfoDepth / 100) * 10; // Max 10ms modulation
            }
            
            ctx.strokeStyle = '#008080';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                const t = (angle / (Math.PI * 2)) * currentLength + time * this.warpRate;
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
            
            ctx.shadowColor = '#008080';
            ctx.shadowBlur = 4;
            ctx.stroke();
            
            // Draw start point indicator
            const maxLength = 20;
            const startAngle = (currentStart / maxLength) * Math.PI * 2;
            const startX = centerX + Math.cos(startAngle) * radius;
            const startY = centerY + Math.sin(startAngle) * radius;

            ctx.fillStyle = '#ff4444';
            ctx.shadowColor = '#ff4444';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(startX, startY, 4, 0, Math.PI * 2);
            ctx.fill();

            // Draw length arc
            const lengthAngle = (currentLength / maxLength) * Math.PI * 2;
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius - 10, startAngle, startAngle + lengthAngle);
            ctx.stroke();
        }
        
        requestAnimationFrame(() => this.animateWarpDisplay());
    }

    // UPDATED: Update WARP module with NEW LFOs
    updateWarp() {
        if (this.wrapEnabled) {
            this.warpWetNode.gain.value = 1;
            this.warpDryNode.gain.value = 0;
            this.warpFeedbackNode.gain.value = 0.85;
            
            const baseDelayTime = (this.warpStart + this.warpLength) / 1000;
            this.wrapDelayNode.delayTime.value = baseDelayTime;
            
            this.warpRateOsc.frequency.value = this.warpRate;
            this.warpRateGain.gain.value = (this.warpLength / 1000) * 0.1;
            
            // NEW: Update Start Point LFO
            this.warpStartLfo.frequency.value = this.warpStartLfoSpeed;
            this.warpStartLfoGain.gain.value = (this.warpStartLfoDepth / 100) * 0.005; // 5ms max modulation
            
            // NEW: Update Loop Length LFO
            this.warpLengthLfo.frequency.value = this.warpLengthLfoSpeed;
            this.warpLengthLfoGain.gain.value = (this.warpLengthLfoDepth / 100) * 0.01; // 10ms max modulation
            
            // Connect LFOs if they have depth
            if (this.warpStartLfoDepth > 0) {
                try {
                    this.warpStartLfoGain.connect(this.wrapDelayNode.delayTime);
                } catch (e) {
                    // Already connected
                }
            } else {
                try {
                    this.warpStartLfoGain.disconnect(this.wrapDelayNode.delayTime);
                } catch (e) {
                    // Not connected
                }
            }
            
            if (this.warpLengthLfoDepth > 0) {
                try {
                    this.warpLengthLfoGain.connect(this.wrapDelayNode.delayTime);
                } catch (e) {
                    // Already connected
                }
            } else {
                try {
                    this.warpLengthLfoGain.disconnect(this.wrapDelayNode.delayTime);
                } catch (e) {
                    // Not connected
                }
            }
            
            try {
                this.warpRateGain.connect(this.wrapDelayNode.delayTime);
            } catch (e) {
                // Already connected
            }
        } else {
            this.warpWetNode.gain.value = 0;
            this.warpDryNode.gain.value = 1;
            this.warpFeedbackNode.gain.value = 0;
            
            // Disconnect all LFOs
            try {
                this.warpRateGain.disconnect(this.wrapDelayNode.delayTime);
                this.warpStartLfoGain.disconnect(this.wrapDelayNode.delayTime);
                this.warpLengthLfoGain.disconnect(this.wrapDelayNode.delayTime);
            } catch (e) {
                // Not connected
            }
            this.warpRateGain.gain.value = 0;
            this.warpStartLfoGain.gain.value = 0;
            this.warpLengthLfoGain.gain.value = 0;
        }
    }

    

   
    

    // UPDATED: Update PT2399 Delay with NEW soft clipping
    updatePT2399Delay() {
    this.pt2399DelayNode.delayTime.value = this.pt2399Time / 1000;
    this.pt2399FeedbackNode.gain.value = this.pt2399Feedback / 100;
    
    const cutoffFreq = 8000 - (this.pt2399LoFi / 100 * 6000);
    this.pt2399FilterNode.frequency.value = Math.max(cutoffFreq, 1000);
    
    const wowAmount = this.pt2399Wow / 100;
    this.pt2399WowGain.gain.value = wowAmount * 0.005;
    
    this.pt2399NoiseGain.gain.value = (this.pt2399LoFi / 100) * 0.02;
    
    // FIXED: Update soft clipping properly
    const softClipAmount = this.pt2399SoftClip / 100;
    if (this.pt2399SoftClipNode) {
        this.pt2399SoftClipNode.curve = this.makeSoftClipCurve(softClipAmount);
    }
    if (this.pt2399SoftClipGain) {
        this.pt2399SoftClipGain.gain.value = 1 + (softClipAmount * 2);
    }
    
    const mix = this.pt2399Mix / 100;
    this.pt2399WetNode.gain.value = mix;
    this.pt2399DryNode.gain.value = 1 - mix;
    
    const indicator = document.getElementById('pt2399WowIndicator');
    if (indicator) {
        indicator.classList.toggle('active', wowAmount > 0);
    }
}

    // RENAMED: Update Ping Resonator (was T-Resonator) with NEW controls
    updatePingResonator() {
        // Update input gain
        this.pingResonatorInputGainNode.gain.value = this.pingResonatorInputGain;
        
        // Update filter frequencies
        this.pingResonatorPathA.filter.frequency.value = this.pingResonatorFilterA;
        this.pingResonatorPathB.filter.frequency.value = this.pingResonatorFilterB;
        
        // Update feedback
        const feedback = this.pingResonatorFeedback / 100 * 0.95;
        this.pingResonatorPathA.feedback.gain.value = feedback;
        this.pingResonatorPathB.feedback.gain.value = feedback;
        
        // Update crossfade
        const crossfade = this.pingResonatorCrossfade / 100;
        this.pingResonatorCrossfadeA.gain.value = 1 - crossfade;
        this.pingResonatorCrossfadeB.gain.value = crossfade;
        
        // NEW: Update wet/dry mix
        const wetMix = this.pingResonatorWetMix / 100;
        this.pingResonatorWetMixNode.gain.value = wetMix;
        this.pingResonatorDryMixNode.gain.value = 1 - wetMix;
    }

    // SIMPLIFIED: Update Liquefier Filter (no display)
    updateLiquefierFilter() {
        this.liquefierFilter.frequency.value = this.liquefierFreq;
        this.liquefierFilter.Q.value = this.liquefierResonance * 20;
        
        this.liquefierRandomLfo.frequency.value = this.liquefierRate;
        const depthAmount = (this.liquefierDepth / 100) * 2000;
        this.liquefierLfoGain.gain.value = depthAmount;
        
        const mix = this.liquefierMix / 100;
        this.liquefierWetNode.gain.value = mix;
        this.liquefierDryNode.gain.value = 1 - mix;
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
        const shiftAmount = this.freqShifterAmount;
        
        this.freqShifterOsc.frequency.value = Math.abs(shiftAmount);
        
        if (shiftAmount !== 0) {
            this.freqShifterNode.gain.value = 1;
            this.freqShifterGainBoost.gain.value = shiftAmount < 0 ? -2.0 : 2.0;
        } else {
            this.freqShifterNode.gain.value = 0;
            this.freqShifterGainBoost.gain.value = 1.0;
        }
        
        const mix = this.freqShifterMix / 100;
        this.freqShifterWetNode.gain.value = mix;
        this.freqShifterDryNode.gain.value = 1 - mix;
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
        
        const resonanceGain = (this.spectralResonance / 100) * 12;
        this.spectralFilterNode.gain.value = resonanceGain;
        
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
    
    // NEW: Use wet mix control instead of automatic calculation
    const wetAmount = this.phaserWetMix / 100;
    this.phaserMixNode.gain.value = wetAmount;
    this.phaserDryNode.gain.value = 1 - wetAmount;
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
    
    updateChromaticEnvelope() {
        this.chromaticEnvelope.frequency.value = this.envelopeRate;
        
        const depth = this.envelopeDepth / 100;
        this.envelopeGainNode.gain.value = depth;
        
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

    toggleEnvelopeLoop() {
        this.envelopeLoopEnabled = !this.envelopeLoopEnabled;
        const button = document.getElementById('envelopeLoopToggle');
        if (button) {
            button.textContent = this.envelopeLoopEnabled ? 'Loop ON' : 'Loop OFF';
            button.classList.toggle('active', this.envelopeLoopEnabled);
        }
        this.updateChromaticEnvelope();
    }

    resetEnvelopeShape() {
        this.envelopePoints = [
            {x: 0, y: 0.5},
            {x: 0.2, y: 0.8},
            {x: 0.4, y: 0.6},
            {x: 0.7, y: 0.9},
            {x: 1.0, y: 0.3}
        ];
    }

    updateFrequencyIsolator() {
        this.isolatorNodes.lo.gain.gain.value = this.isolatorLo;
        this.isolatorNodes.mid.gain.gain.value = this.isolatorMid;
        this.isolatorNodes.hi.gain.gain.value = this.isolatorHi;
    }
    
    updateReverbMix() {
        const mix = this.reverbMix / 100;
        this.reverbWetNode.gain.value = mix;
        this.reverbDryNode.gain.value = 1 - mix;
    }
    
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

    // Generate random LFO waveform for Liquefier
    generateRandomLFO() {
        if (!this.liquefierEnabled) return;
        
        const updateRate = this.liquefierSmooth ? 100 : 500;
        
        setInterval(() => {
            if (this.liquefierDepth > 0) {
                const randomValue = (Math.random() - 0.5) * 2;
                const depthAmount = (this.liquefierDepth / 100) * 2000;
                const targetFreq = this.liquefierFreq + (randomValue * depthAmount);
                
                if (this.liqueFierSmooth) {
                    this.liquefierFilter.frequency.exponentialRampToValueAtTime(
                        Math.max(100, Math.min(8000, targetFreq)),
                        this.audioContext.currentTime + 0.1
                    );
                } else {
                    this.liquefierFilter.frequency.setValueAtTime(
                        Math.max(100, Math.min(8000, targetFreq)),
                        this.audioContext.currentTime
                    );
                }
            }
        }, updateRate);
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
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.muteGainNode.gain.value = this.isMuted ? 0 : 1;
        
        const muteButton = document.getElementById('muteButton');
        muteButton.classList.toggle('active', this.isMuted);
        muteButton.textContent = this.isMuted ? '🔇 MUTED' : '🔊 MUTE';
    }
   resetAllParameters() {
    // First, reset all the slider values
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
    this.liquefierSmooth = true;
    
    // Reset envelope points to default
    this.envelopePoints = [
        {x: 0, y: 0.5},
        {x: 0.2, y: 0.8},
        {x: 0.4, y: 0.6},
        {x: 0.7, y: 0.9},
        {x: 1.0, y: 0.3}
    ];
    
    // Reset combo seq frequencies to defaults
    this.combSeqFrequencies = [440, 660, 880, 1100, 1320];
    
    // Reset vocoder band gains to defaults
    this.vocoderBandGains = [1, 1, 1, 1, 1, 1, 1, 1];
    
    // Update UI elements
    document.querySelectorAll('.grain-shape-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.shape === 'blackman') {
            btn.classList.add('active');
        }
    });
    
    document.getElementById('ringModGrains').classList.add('active');
    document.getElementById('ringModOsc').classList.remove('active');
    document.getElementById('ringModNoise').classList.remove('active');
    
    document.getElementById('lfoShape').value = 'sine';
    document.getElementById('muteButton').classList.remove('active');
    document.getElementById('stringSeqToggle').classList.remove('active');
    document.getElementById('warpToggle').classList.remove('active');
    document.getElementById('envelopeLoopToggle').classList.remove('active');
    document.getElementById('envelopeLoopToggle').textContent = 'Loop OFF';
    document.getElementById('liquefierSmoothBtn').classList.add('active');
    document.getElementById('liquefierSteppedBtn').classList.remove('active');
    
    // IMPORTANT: Clear all indicator lights AFTER values are reset
    setTimeout(() => {
        // Clear vocoder indicators
        for (let i = 1; i <= 8; i++) {
            this.markSliderAsChanged(`vocoder${i}`, 1.0, 1.0);
        }
        
        // Clear isolator indicators  
        this.markSliderAsChanged('isolatorLo', 1.0, 1.0);
        this.markSliderAsChanged('isolatorMid', 1.0, 1.0);
        this.markSliderAsChanged('isolatorHi', 1.0, 1.0);
        
        // Clear sequencer step indicators with correct default values
        const defaultStepValues = [440, 660, 880, 1100, 1320];
        for (let i = 1; i <= 5; i++) {
            this.markSliderAsChanged(`stringSeqStep${i}`, defaultStepValues[i-1], defaultStepValues[i-1]);
        }
        
        // Force remove any remaining changed classes
        document.querySelectorAll('.vocoder-band.changed, .seq-step.changed, .isolator-band.changed').forEach(element => {
            element.classList.remove('changed');
        });
    }, 100); // Small delay to ensure all values are set first
    
    // Reset other functionality
    this.switchRingModSource('grains');
    this.updateVolumeBoost();
    this.updateCombSequencer();
    this.updateCombSeqButton();
    this.updateWarp();
    this.updatePingResonator();
    this.updateLiquefierFilter();
    
    // Reset all comb seq LFOs
    this.combSeqLfos.forEach((lfoData, paramName) => {
        this.updateCombSeqLFO(paramName, 0);
    });
    
    // Reset speed controllers
    this.grainSpeed = 1.0;
    this.loopSpeed = 1.0;
    this.grainSpeedActive = false;
    this.loopSpeedActive = false;
    
    const grainSpeedCircle = document.getElementById('grainSpeedCircle');
    const loopSpeedCircle = document.getElementById('loopSpeedCircle');
    const grainSpeedGlow = document.getElementById('grainSpeedGlow');
    const loopSpeedGlow = document.getElementById('loopSpeedGlow');
    const grainSpeedValue = document.getElementById('grainSpeedValue');
    const loopSpeedValue = document.getElementById('loopSpeedValue');
    
    if (grainSpeedCircle) {
        grainSpeedCircle.classList.remove('active');
        grainSpeedGlow.style.width = '0%';
        grainSpeedGlow.style.height = '0%';
        grainSpeedGlow.style.opacity = '0';
        grainSpeedValue.textContent = '1.0x';
    }
    
    if (loopSpeedCircle) {
        loopSpeedCircle.classList.remove('active');
        loopSpeedGlow.style.width = '0%';
        loopSpeedGlow.style.height = '0%';
        loopSpeedGlow.style.opacity = '0';
        loopSpeedValue.textContent = '1.0x';
    }
    
    console.log('All parameters reset to defaults');
}
    // Preset Management Functions
  savePreset(name) {
    if (!name) return false;
    
    // Don't interrupt audio during save
    const wasPlaying = this.isPlaying;
    
    const preset = {
        name: name,
        timestamp: Date.now(),
        parameters: {}
    };
    
    // Only save slider and select values, avoid problematic elements
    const parameterElements = document.querySelectorAll('input[type="range"], select');
    parameterElements.forEach(element => {
        if (element.id && !element.id.startsWith('arp')) { // Exclude arpeggiator
            preset.parameters[element.id] = element.value;
        }
    });
    
    // Save button states (excluding arpeggiator and problematic ones)
    const buttonElements = document.querySelectorAll('button.active');
    preset.buttonStates = Array.from(buttonElements)
        .map(btn => btn.id)
        .filter(id => id && !id.startsWith('arp') && id !== 'playButton'); // Exclude play button
    
    // Save grain shape
    const activeShapeBtn = document.querySelector('.grain-shape-btn.active');
    if (activeShapeBtn) {
        preset.grainShape = activeShapeBtn.dataset.shape;
    }
    
    // Save envelope points
    preset.envelopePoints = [...this.envelopePoints];
    
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
        
        Object.entries(preset.parameters).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
                element.dispatchEvent(new Event('input'));
            }
        });
        
        document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
        if (preset.buttonStates) {
            preset.buttonStates.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) btn.classList.add('active');
            });
        }
        
        if (preset.grainShape) {
            document.querySelectorAll('.grain-shape-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.shape === preset.grainShape) {
                    btn.classList.add('active');
                }
            });
            this.grainShape = preset.grainShape;
        }
        
        if (preset.envelopePoints) {
            this.envelopePoints = [...preset.envelopePoints];
        }
        
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
        
        // Ring mod source buttons
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
        
        // WARP button
        document.getElementById('warpToggle').addEventListener('click', () => {
            this.wrapEnabled = !this.wrapEnabled;
            document.getElementById('warpToggle').classList.toggle('active', this.wrapEnabled);
            this.updateWarp();
        });

        // Arpeggiator controls
document.getElementById('arpToggle').addEventListener('click', () => {
    this.toggleArpeggiator();
});

// Second loop button sync
document.getElementById('looperToggle2').addEventListener('click', () => {
    this.looperEnabled = !this.looperEnabled;
    document.getElementById('looperToggle').classList.toggle('active', this.looperEnabled);
    document.getElementById('looperToggle2').classList.toggle('active', this.looperEnabled);
});

// Sync main loop button with second one
const originalLooperToggle = document.getElementById('looperToggle');
originalLooperToggle.addEventListener('click', () => {
    document.getElementById('looperToggle2').classList.toggle('active', this.looperEnabled);
});

// Arpeggiator grid
this.setupArpeggiatorGrid();
        
        // Chromatic Envelope controls
        document.getElementById('envelopeLoopToggle').addEventListener('click', () => {
            this.toggleEnvelopeLoop();
        });
        
        document.getElementById('envelopeResetBtn').addEventListener('click', () => {
            this.resetEnvelopeShape();
        });

        // Liquefier mode buttons
        document.getElementById('liquefierSmoothBtn').addEventListener('click', () => {
            this.liquefierSmooth = true;
            document.getElementById('liquefierSmoothBtn').classList.add('active');
            document.getElementById('liquefierSteppedBtn').classList.remove('active');
            this.updateLiquefierFilter();
        });
        
        document.getElementById('liquefierSteppedBtn').addEventListener('click', () => {
            this.liquefierSmooth = false;
            document.getElementById('liquefierSteppedBtn').classList.add('active');
            document.getElementById('liquefierSmoothBtn').classList.remove('active');
            this.updateLiquefierFilter();
        });

        const grainsLogo = document.getElementById('grainsTextLogo');
if (grainsLogo) {
    grainsLogo.addEventListener('click', () => {
        location.reload();
    });
} 
        this.setupSliderControls();

        // TOP button
document.getElementById('topButton').addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});
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
        
       // Notch Filter (FIXED)
notchFreq: (val) => {
    this.notchFilterFreq = parseInt(val);
    this.updateNotchFilter();
    document.getElementById('notchFreqValue').textContent = val + 'Hz';
},
notchBandwidth: (val) => {
    this.notchFilterBandwidth = parseFloat(val);
    this.updateNotchFilter();
    document.getElementById('notchBandwidthValue').textContent = val;
},
notchMix: (val) => {
    this.notchFilterWetMix = parseInt(val);
    this.updateNotchFilter();
    document.getElementById('notchMixValue').textContent = val + '%';
},
notchLfoRate: (val) => {
    this.notchFilterLfoRate = parseFloat(val);
    this.updateNotchFilter();
    document.getElementById('notchLfoRateValue').textContent = val + 'Hz';
},
notchLfoDepth: (val) => {
    this.notchFilterLfoDepth = parseInt(val);
    this.updateNotchFilter();
    document.getElementById('notchLfoDepthValue').textContent = val + '%';
},
        
        // Vocoder (8 bands)
    vocoder1: (val) => { 
    this.updateVocoderBand(0, parseFloat(val));
    document.getElementById('vocoder1Value').textContent = val;
    this.markSliderAsChanged('vocoder1', val, 1.0);
},
vocoder2: (val) => { 
    this.updateVocoderBand(1, parseFloat(val)); // FIXED: band 1
    document.getElementById('vocoder2Value').textContent = val;
    this.markSliderAsChanged('vocoder2', val, 1.0);
},
vocoder3: (val) => { 
    this.updateVocoderBand(2, parseFloat(val)); // FIXED: band 2
    document.getElementById('vocoder3Value').textContent = val;
    this.markSliderAsChanged('vocoder3', val, 1.0);
},
vocoder4: (val) => { 
    this.updateVocoderBand(3, parseFloat(val)); // FIXED: band 3
    document.getElementById('vocoder4Value').textContent = val;
    this.markSliderAsChanged('vocoder4', val, 1.0);
},
vocoder5: (val) => { 
    this.updateVocoderBand(4, parseFloat(val)); // FIXED: band 4
    document.getElementById('vocoder5Value').textContent = val;
    this.markSliderAsChanged('vocoder5', val, 1.0);
},
vocoder6: (val) => { 
    this.updateVocoderBand(5, parseFloat(val)); // FIXED: band 5
    document.getElementById('vocoder6Value').textContent = val;
    this.markSliderAsChanged('vocoder6', val, 1.0);
},
vocoder7: (val) => { 
    this.updateVocoderBand(6, parseFloat(val)); // FIXED: band 6
    document.getElementById('vocoder7Value').textContent = val;
    this.markSliderAsChanged('vocoder7', val, 1.0);
},
vocoder8: (val) => { 
    this.updateVocoderBand(7, parseFloat(val)); // FIXED: band 7
    document.getElementById('vocoder8Value').textContent = val;
    this.markSliderAsChanged('vocoder8', val, 1.0);
},
        vocoderMix: (val) => { 
            this.vocoderMix = parseInt(val);
            this.updateVocoderMix();
            document.getElementById('vocoderMixValue').textContent = val + '%';
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
        ringModFreq: (val) => { 
            this.ringModFreq = parseFloat(val);
            this.ringModOscSource.frequency.value = val;
            document.getElementById('ringModFreqValue').textContent = val + 'Hz';
        },
        
        // Spectral Freeze & Phaser
        spectralFreeze: (val) => { 
            this.spectralFreeze = parseInt(val);
            this.updateSpectralFreeze();
            document.getElementById('spectralFreezeValue').textContent = val + '%';
        },
        spectralResonance: (val) => { 
            this.spectralResonance = parseInt(val);
            this.updateSpectralFreeze();
            document.getElementById('spectralResonanceValue').textContent = val + '%';
        },
        phaserRate: (val) => { 
            this.phaserRate = parseFloat(val);
            this.updatePhaser();
            document.getElementById('phaserRateValue').textContent = val + 'Hz';
        },
        phaserDepth: (val) => { 
            this.phaserDepth = parseInt(val);
            this.updatePhaser();
            document.getElementById('phaserDepthValue').textContent = val + '%';
        },
        phaserFeedback: (val) => { 
            this.phaserFeedback = parseInt(val);
            this.updatePhaser();
            document.getElementById('phaserFeedbackValue').textContent = val + '%';
        },
        phaserGain: (val) => { 
            this.phaserGain = parseFloat(val);
            this.updatePhaser();
            document.getElementById('phaserGainValue').textContent = val;
        },
        phaserWetMix: (val) => { 
            this.phaserWetMix = parseInt(val);
            this.updatePhaser();
            document.getElementById('phaserWetMixValue').textContent = val + '%';
        },
        
        // WARP Controls
        warpRate: (val) => { 
            this.warpRate = parseFloat(val);
            this.updateWarp();
            document.getElementById('warpRateValue').textContent = val + 'Hz';
        },
        warpStart: (val) => { 
            this.warpStart = parseFloat(val);
            this.updateWarp();
            document.getElementById('warpStartValue').textContent = val + 'ms';
        },
        warpLength: (val) => { 
            this.warpLength = parseFloat(val);
            this.updateWarp();
            document.getElementById('warpLengthValue').textContent = val + 'ms';
        },
        warpStartLfoSpeed: (val) => {
            this.warpStartLfoSpeed = parseFloat(val);
            this.updateWarp();
            document.getElementById('warpStartLfoSpeedValue').textContent = val + 'Hz';
        },
        warpStartLfoDepth: (val) => {
            this.warpStartLfoDepth = parseInt(val);
            this.updateWarp();
            document.getElementById('warpStartLfoDepthValue').textContent = val + '%';
        },
        warpLengthLfoSpeed: (val) => {
            this.warpLengthLfoSpeed = parseFloat(val);
            this.updateWarp();
            document.getElementById('warpLengthLfoSpeedValue').textContent = val + 'Hz';
        },
        warpLengthLfoDepth: (val) => {
            this.warpLengthLfoDepth = parseInt(val);
            this.updateWarp();
            document.getElementById('warpLengthLfoDepthValue').textContent = val + '%';
        },
        
        // 3D Panner & Frequency Shifter
        pannerXDepth: (val) => { 
            this.pannerXDepth = parseInt(val);
            this.update3DPanner();
            document.getElementById('pannerXDepthValue').textContent = val + '%';
        },
        pannerYRange: (val) => { 
            this.pannerYRange = parseInt(val);
            this.update3DPanner();
            document.getElementById('pannerYRangeValue').textContent = val + '%';
        },
        pannerSpeed: (val) => { 
            this.pannerSpeed = parseFloat(val);
            this.update3DPanner();
            document.getElementById('pannerSpeedValue').textContent = val + 'Hz';
        },
        freqShifterAmount: (val) => { 
            this.freqShifterAmount = parseFloat(val);
            this.updateFreqShifter();
            document.getElementById('freqShifterAmountValue').textContent = val + 'Hz';
        },
        freqShifterMix: (val) => { 
            this.freqShifterMix = parseInt(val);
            this.updateFreqShifter();
            document.getElementById('freqShifterMixValue').textContent = val + '%';
        },
        
        // Volume
        volume: (val) => { 
            this.volume = parseFloat(val); 
            this.masterGainNode.gain.value = this.volume;
            this.updateVolumeBoost();
            document.getElementById('volumeValue').textContent = Math.round(val * 100) + '%';
        },
        
        // PT2399 Analog Delay (FIXED)
        pt2399Time: (val) => { 
            this.pt2399Time = parseInt(val); 
            this.updatePT2399Delay();
            document.getElementById('pt2399TimeValue').textContent = val + 'ms';
        },
        pt2399Feedback: (val) => { 
            this.pt2399Feedback = parseInt(val); 
            this.updatePT2399Delay();
            document.getElementById('pt2399FeedbackValue').textContent = val + '%';
        },
        pt2399Wow: (val) => { 
            this.pt2399Wow = parseInt(val);
            this.updatePT2399Delay();
            document.getElementById('pt2399WowValue').textContent = val + '%';
        },
        pt2399LoFi: (val) => { 
            this.pt2399LoFi = parseInt(val);
            this.updatePT2399Delay();
            document.getElementById('pt2399LoFiValue').textContent = val + '%';
        },
        pt2399Mix: (val) => { 
            this.pt2399Mix = parseInt(val);
            this.updatePT2399Delay();
            document.getElementById('pt2399MixValue').textContent = val + '%';
        },
        // FIXED: PT2399 Soft Clipping
        pt2399SoftClip: (val) => {
            this.pt2399SoftClip = parseInt(val);
            this.updatePT2399Delay();
            document.getElementById('pt2399SoftClipValue').textContent = val + '%';
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
            document.getElementById('reverbPreDelayValue').textContent = val + 'ms';
        },
        reverbWetGain: (val) => { 
            this.reverbWetGain = parseFloat(val);
            this.reverbWetGainNode.gain.value = val;
            document.getElementById('reverbWetGainValue').textContent = val;
        },
        reverbMix: (val) => { 
            this.reverbMix = parseInt(val);
            this.updateReverbMix();
            document.getElementById('reverbMixValue').textContent = val + '%';
        },
        
        // Comb Sequencer
        stringSeqSpeed: (val) => { 
            this.combSeqSpeed = parseFloat(val);
            this.updateCombSequencer();
            document.getElementById('stringSeqSpeedValue').textContent = val + 'Hz';
        },
        stringSeqDepth: (val) => { 
            this.combSeqDepth = parseInt(val);
            this.updateCombSequencer();
            document.getElementById('stringSeqDepthValue').textContent = val + '%';
        },
        stringSeqWetMix: (val) => { 
            this.combSeqWetMix = parseInt(val);
            this.updateCombSequencer();
            document.getElementById('stringSeqWetMixValue').textContent = val + '%';
        },
        stringSeqSqueeze: (val) => { 
            this.combSeqSqueeze = parseInt(val) / 100;
            document.getElementById('stringSeqSqueezeValue').textContent = val + '%';
        },
        combSeqSoftClip: (val) => { 
            this.combSeqSoftClip = parseInt(val);
            this.updateCombSequencer();
            document.getElementById('combSeqSoftClipValue').textContent = val + '%';
        },
        
        // Sequencer steps
       stringSeqStep1: (val) => { 
    this.combSeqFrequencies[0] = parseInt(val); // Correct - index 0
    document.getElementById('stringSeqStep1Value').textContent = val;
    this.updateCombSequencer();
    this.markSliderAsChanged('stringSeqStep1', val, 440);
},
stringSeqStep2: (val) => { 
    this.combSeqFrequencies[1] = parseInt(val); // FIXED: index 1
    document.getElementById('stringSeqStep2Value').textContent = val;
    this.updateCombSequencer();
    this.markSliderAsChanged('stringSeqStep2', val, 660);
},
stringSeqStep3: (val) => { 
    this.combSeqFrequencies[2] = parseInt(val); // FIXED: index 2
    document.getElementById('stringSeqStep3Value').textContent = val;
    this.updateCombSequencer();
    this.markSliderAsChanged('stringSeqStep3', val, 880);
},
stringSeqStep4: (val) => { 
    this.combSeqFrequencies[3] = parseInt(val); // FIXED: index 3
    document.getElementById('stringSeqStep4Value').textContent = val;
    this.updateCombSequencer();
    this.markSliderAsChanged('stringSeqStep4', val, 1100);
},
stringSeqStep5: (val) => { 
    this.combSeqFrequencies[4] = parseInt(val); // FIXED: index 4
    document.getElementById('stringSeqStep5Value').textContent = val;
    this.updateCombSequencer();
    this.markSliderAsChanged('stringSeqStep5', val, 1320);
},
        
        // Chromatic Envelope
        envelopeRate: (val) => { 
            this.envelopeRate = parseFloat(val);
            this.updateChromaticEnvelope();
            document.getElementById('envelopeRateValue').textContent = val + 'Hz';
        },
        envelopeDepth: (val) => { 
            this.envelopeDepth = parseInt(val);
            this.updateChromaticEnvelope();
            document.getElementById('envelopeDepthValue').textContent = val + '%';
        },
        
        // 3-Band Frequency Isolator
        isolatorLo: (val) => { 
    this.isolatorLo = parseFloat(val);
    this.updateFrequencyIsolator();
    document.getElementById('isolatorLoValue').textContent = Math.round(val * 100) + '%';
    this.markSliderAsChanged('isolatorLo', val, 1.0);
},
      isolatorMid: (val) => { 
    this.isolatorMid = parseFloat(val);
    this.updateFrequencyIsolator();
    document.getElementById('isolatorMidValue').textContent = Math.round(val * 100) + '%';
    this.markSliderAsChanged('isolatorMid', val, 1.0);
},
        isolatorHi: (val) => { 
    this.isolatorHi = parseFloat(val);
    this.updateFrequencyIsolator();
    document.getElementById('isolatorHiValue').textContent = Math.round(val * 100) + '%';
    this.markSliderAsChanged('isolatorHi', val, 1.0);
},

        // Liquefier Filter
        liquefierFreq: (val) => { 
            this.liquefierFreq = parseInt(val);
            this.updateLiquefierFilter();
            document.getElementById('liquefierFreqValue').textContent = val + 'Hz';
        },
        liquefierResonance: (val) => { 
            this.liquefierResonance = parseInt(val) / 100;
            this.updateLiquefierFilter();
            document.getElementById('liquefierResonanceValue').textContent = val + '%';
        },
        liquefierDepth: (val) => { 
            this.liquefierDepth = parseInt(val);
            this.updateLiquefierFilter();
            document.getElementById('liquefierDepthValue').textContent = val + '%';
        },
        liquefierRate: (val) => { 
            this.liquefierRate = parseFloat(val);
            this.updateLiquefierFilter();
            document.getElementById('liquefierRateValue').textContent = val + 'Hz';
        },
        liquefierMix: (val) => { 
            this.liquefierMix = parseInt(val);
            this.updateLiquefierFilter();
            document.getElementById('liquefierMixValue').textContent = val + '%';
        },

        // Speed controls (replacing circular controllers)
grainSpeed: (val) => {
    this.grainSpeed = parseFloat(val);
    document.getElementById('grainSpeedValue').textContent = val + 'x';
},
loopSpeed: (val) => {
    this.loopSpeed = parseFloat(val);
    document.getElementById('loopSpeedValue').textContent = val + 'x';
},

// Arpeggiator
arpRate: (val) => {
    this.arpRate = parseFloat(val);
    if (this.arpLfo) {
        this.arpLfo.frequency.value = this.arpRate;
    }
    document.getElementById('arpRateValue').textContent = val + 'Hz';
},
arpSqueeze: (val) => {
    this.arpSqueeze = parseInt(val);
    document.getElementById('arpSqueezeValue').textContent = val + '%';
},

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
    // Arpeggiator scale select
document.getElementById('arpScale').addEventListener('change', (e) => {
    this.arpScale = e.target.value;
});
}

// Mark sliders as changed with green glow
markSliderAsChanged(sliderId, currentValue, defaultValue) {
    const isChanged = parseFloat(currentValue) !== parseFloat(defaultValue);
    
    // Handle vocoder bands
    if (sliderId.startsWith('vocoder')) {
        const bandNumber = sliderId.replace('vocoder', '');
        const vocoderBand = document.querySelector(`.vocoder-band:nth-child(${bandNumber})`);
        if (vocoderBand) {
            vocoderBand.classList.toggle('changed', isChanged);
        }
    }
    
    // Handle isolator bands
    if (sliderId.startsWith('isolator')) {
        const bandType = sliderId.replace('isolator', '').toLowerCase();
        const isolatorBand = document.querySelector(`.isolator-band:has(#${sliderId})`);
        if (isolatorBand) {
            isolatorBand.classList.toggle('changed', isChanged);
        }
    }
    
    // Handle sequencer steps
    if (sliderId.startsWith('stringSeqStep')) {
        const stepNumber = sliderId.replace('stringSeqStep', '');
        const seqStep = document.querySelector(`.seq-step:nth-child(${stepNumber})`);
        if (seqStep) {
            seqStep.classList.toggle('changed', isChanged);
        }
    }
}

// NEW: Initialize Notch Filter
async initNotchFilter() {
    this.notchFilterNode = this.audioContext.createBiquadFilter();
    this.notchFilterNode.type = 'notch';
    this.notchFilterNode.frequency.value = this.notchFilterFreq;
    this.notchFilterNode.Q.value = this.notchFilterBandwidth;
    
    this.notchFilterLfo = this.audioContext.createOscillator();
    this.notchFilterLfo.type = 'sine';
    this.notchFilterLfo.frequency.value = this.notchFilterLfoRate;
    
    this.notchFilterLfoGain = this.audioContext.createGain();
    this.notchFilterLfoGain.gain.value = 0;
    
    this.notchFilterLfo.connect(this.notchFilterLfoGain);
    this.notchFilterLfoGain.connect(this.notchFilterNode.frequency);
    this.notchFilterLfo.start();
    
    this.notchFilterWetNode = this.audioContext.createGain();
    this.notchFilterDryNode = this.audioContext.createGain();
    this.notchFilterWetNode.gain.value = 0;
    this.notchFilterDryNode.gain.value = 1;
    
    this.notchFilterNode.connect(this.notchFilterWetNode);
}

// NEW: Update Notch Filter
updateNotchFilter() {
    if (!this.notchFilterNode) return;
    
    this.notchFilterNode.frequency.value = this.notchFilterFreq;
    this.notchFilterNode.Q.value = this.notchFilterBandwidth;
    
    this.notchFilterLfo.frequency.value = this.notchFilterLfoRate;
    const depthAmount = (this.notchFilterLfoDepth / 100) * 1000;
    this.notchFilterLfoGain.gain.value = depthAmount;
    
    const mix = this.notchFilterWetMix / 100;
    this.notchFilterWetNode.gain.value = mix;
    this.notchFilterDryNode.gain.value = 1 - mix;
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
        // FIXED: Status should only show load messages, not errors
        document.getElementById('status').textContent = 'Loading audio file...';
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Create status message with mobile alert if needed
const statusElement = document.getElementById('status');
let statusHTML = `Loaded: ${file.name} (${this.audioBuffer.duration.toFixed(2)}s)`;

if (this.isMobileDevice()) {
    statusHTML += '<span class="mobile-alert"> • 📱 Turn off Silent Mode for audio playback</span>';
}

statusElement.innerHTML = statusHTML;
            
            this.drawWaveform();
            document.getElementById('waveformContainer').style.display = 'block';
            document.getElementById('controls').style.display = 'grid';
            document.getElementById('mobileKeyboard').style.display = 'block';
            
            this.resizeGrainCanvas();

            // Set initial playhead position to "1"
this.setScanPosition(1/9);
            
        } catch (error) {
            // FIXED: Keep load messages focused, don't show detailed errors
            document.getElementById('status').textContent = 'Could not load audio file - please try another file';
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
    
    const nextScheduleTime = (this.grainSize / this.timeStretch) / this.grainSpeed;
    setTimeout(() => {
        if (this.isPlaying) this.scheduleGrains();
    }, nextScheduleTime);
}
    
    createGrain() {
        if (!this.audioBuffer) return;
        
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

const grainAdvancement = ((this.grainSize / 1000) / this.timeStretch) * this.loopSpeed;
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
        
        source.connect(gainNode);
        gainNode.connect(this.filterNode);
        
        if (this.ringModSourceType === 'grains') {
            gainNode.connect(this.ringModGrainSource);
        }
        
        try {
            source.start(now, startTime, grainDuration);
            source.stop(now + grainDuration);
            
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

    // Envelope editing functions
    startEnvelopeDrag(e) {
        const rect = this.envelopeCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1 - (e.clientY - rect.top) / rect.height;
        
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
        
        if (this.dragPointIndex === 0 || this.dragPointIndex === this.envelopePoints.length - 1) {
            this.envelopePoints[this.dragPointIndex].y = y;
        } else {
            this.envelopePoints[this.dragPointIndex].x = x;
            this.envelopePoints[this.dragPointIndex].y = y;
            
            this.envelopePoints.sort((a, b) => a.x - b.x);
            
            this.dragPointIndex = this.envelopePoints.findIndex(point => 
                Math.abs(point.x - x) < 0.01 && Math.abs(point.y - y) < 0.01
            );
        }
    }

    endEnvelopeDrag() {
        this.isDraggingEnvelope = false;
        this.dragPointIndex = -1;
    }

    animateEnvelope() {
        if (!this.envelopeCtx) {
            requestAnimationFrame(() => this.animateEnvelope());
            return;
        }
        
        const canvas = this.envelopeCanvas;
        const ctx = this.envelopeCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
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
        
        ctx.fillStyle = '#ff4444';
        this.envelopePoints.forEach(point => {
            const x = point.x * width;
            const y = height - (point.y * height);
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
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

    interpolateEnvelope(t) {
        if (this.envelopePoints.length < 2) return 0.5;
        
        let leftPoint = this.envelopePoints[0];
        let rightPoint = this.envelopePoints[this.envelopePoints.length - 1];
        
        for (let i = 0; i < this.envelopePoints.length - 1; i++) {
            if (t >= this.envelopePoints[i].x && t <= this.envelopePoints[i + 1].x) {
                leftPoint = this.envelopePoints[i];
                rightPoint = this.envelopePoints[i + 1];
                break;
            }
        }
        
        if (leftPoint.x === rightPoint.x) return leftPoint.y;
        
        const ratio = (t - leftPoint.x) / (rightPoint.x - leftPoint.x);
        return leftPoint.y + (rightPoint.y - leftPoint.y) * ratio;
    }


// Arpeggiator Functions
setupArpeggiatorGrid() {
    const grid = document.getElementById('arpGrid');
    const steps = grid.querySelectorAll('.arp-step');
    
    steps.forEach((step, index) => {
        step.addEventListener('click', () => {
            this.toggleArpStep(index);
        });
        
        // Touch events for mobile
        step.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleArpStep(index);
        });
    });
}

toggleArpStep(index) {
    this.arpPattern[index] = !this.arpPattern[index];
    const step = document.querySelector(`.arp-step[data-step="${index}"]`);
    step.classList.toggle('active', this.arpPattern[index]);
}

toggleArpeggiator() {
    this.arpeggiatorEnabled = !this.arpeggiatorEnabled;
    const button = document.getElementById('arpToggle');
    
    if (this.arpeggiatorEnabled) {
        button.textContent = 'STOP';
        button.classList.add('active');
        this.startArpeggiator();
    } else {
        button.textContent = 'START';
        button.classList.remove('active');
        this.stopArpeggiator();
    }
}

async initArpeggiator() {
    this.arpLfo = this.audioContext.createOscillator();
    this.arpLfo.type = 'sine';
    this.arpLfo.frequency.value = this.arpRate;
    this.arpLfo.start();
}

startArpeggiator() {
    if (!this.arpLfo) {
        this.initArpeggiator();
    }
    
    this.arpCurrentStep = 0;
    this.arpIsPlaying = true;
    this.scheduleArpStep();
}

stopArpeggiator() {
    this.arpIsPlaying = false;
    if (this.arpStepTimer) {
        clearTimeout(this.arpStepTimer);
    }
    
    // Remove playing class from all steps
    document.querySelectorAll('.arp-step').forEach(step => {
        step.classList.remove('playing');
    });
}

scheduleArpStep() {
    if (!this.arpIsPlaying || !this.arpeggiatorEnabled) return;
    
    // Find next active step
    let foundActive = false;
    let searchStep = this.arpCurrentStep;
    
    for (let i = 0; i < 9; i++) {
        if (this.arpPattern[searchStep]) {
            foundActive = true;
            break;
        }
        searchStep = (searchStep + 1) % 9;
    }
    
    if (foundActive) {
        this.arpCurrentStep = searchStep;
        this.playArpStep(this.arpCurrentStep);
    }
    
    // Calculate next step time with squeeze
    let stepTime = 1000 / this.arpRate; // Base time in ms
    
    if (this.arpSqueeze > 0) {
        // Apply squeeze to make timing more staccato
        const squeeze = 1 + (this.arpSqueeze / 100) * 9;
        const phase = (Date.now() * this.arpRate / 1000) % 1;
        const squeezeWave = Math.tanh(Math.sin(phase * Math.PI * 2) * squeeze) / Math.tanh(squeeze);
        stepTime *= (0.5 + Math.abs(squeezeWave) * 0.5);
    }
    
    this.arpCurrentStep = (this.arpCurrentStep + 1) % 9;
    
    this.arpStepTimer = setTimeout(() => {
        this.scheduleArpStep();
    }, stepTime);
}

playArpStep(stepIndex) {
    // Remove playing class from all steps
    document.querySelectorAll('.arp-step').forEach(step => {
        step.classList.remove('playing');
    });
    
    // Add playing class to current step
    const currentStepElement = document.querySelector(`.arp-step[data-step="${stepIndex}"]`);
    if (currentStepElement) {
        currentStepElement.classList.add('playing');
    }
    
    // Calculate note based on scale and step position
    const scaleIntervals = this.scales[this.arpScale];
    const noteIndex = stepIndex % scaleIntervals.length;
    const octaveOffset = Math.floor(stepIndex / scaleIntervals.length) * 12;
    const finalNote = this.arpBaseNote + scaleIntervals[noteIndex] + octaveOffset;
    
    // Apply pitch change temporarily
    const previousPitch = this.currentPitch;
    this.currentPitch = Math.pow(2, finalNote / 12);
    
    // Reset pitch after a short time
    setTimeout(() => {
        this.currentPitch = previousPitch;
    }, 100);
}

// Override the updateCurrentPitch function to trigger arpeggiator
updateCurrentPitch() {
    if (this.activePitchKeys.size === 0) {
        this.currentPitch = 1.0;
        this.arpBaseNote = 0;
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
    
    this.arpBaseNote = highestSemitone;
    
    if (!this.arpeggiatorEnabled) {
        this.currentPitch = Math.pow(2, highestSemitone / 12);
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

// Enhanced initialization
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
    
    // Set default states
    const looperToggle = document.getElementById('looperToggle');
    if (looperToggle) {
        looperToggle.classList.remove('active');
        looperToggle.textContent = '↻ LOOP';
    }
    
    const combSeqToggle = document.getElementById('stringSeqToggle');
    if (combSeqToggle) {
        combSeqToggle.textContent = 'OFF';
    }
    
    const envelopeToggle = document.getElementById('envelopeLoopToggle');
    if (envelopeToggle) {
        envelopeToggle.textContent = 'Loop OFF';
    }

   
    
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
        // Don't show errors in status - keep it for load messages only
    });
    
    console.log('GRAINS Enhanced Granular Sampler v.18INITIALIZED!');
    console.log('- Updated signal path diagram');
    console.log('Signal Path: GRAINS → ARPEGGIATOR → BANDPASS FILTER → NOTCH FILTER → VOCODER → WAVEFOLDER → RING MOD → SPECTRAL FREEZE → PHASER → WARP → 3D PANNER → FREQ SHIFTER → PT2399 → REVERB → COMB SEQ → CHROMATIC ENVELOPE → 3-BAND ISOLATOR → LIQUEFIER → OUTPUT');

// Navigation dots functionality
const navDots = document.getElementById('navDots');
if (navDots) {
    const dots = navDots.querySelectorAll('.nav-dot');
    
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const section = parseInt(dot.dataset.section);
            const scrollTarget = (document.documentElement.scrollHeight - window.innerHeight) * (section / 100);
            
            window.scrollTo({
                top: scrollTarget,
                behavior: 'smooth'
            });
            
            // Update active state
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            
            // Remove active state after scroll completes
            setTimeout(() => {
                dot.classList.remove('active');
            }, 1000);
        });
    });
    
    // Update active dot based on scroll position
    window.addEventListener('scroll', () => {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        
        dots.forEach(d => d.classList.remove('active'));
        
        if (scrollPercent < 12.5) {
            dots[0].classList.add('active');
        } else if (scrollPercent < 37.5) {
            dots[1].classList.add('active');
        } else if (scrollPercent < 62.5) {
            dots[2].classList.add('active');
        } else {
            dots[3].classList.add('active');
        }
    });
}

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
    
    if (window.granularSampler && event.reason.name === 'InvalidStateError') {
        setTimeout(() => {
            window.granularSampler.initAudio().catch(console.error);
        }, 1000);
    }
});

console.log('GRAINS Enhanced Granular Sampler v.19 - All systems loaded');

