class GranularSampler {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.grains = [];
        this.isPlaying = false;
        this.playheadPosition = 0;
        this.loopPosition = 0;
        this.looperEnabled = false; // Initialize LOOP to OFF
        this.wrapEnabled = false; // Initialize WRAP to OFF
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
        this.grainShape = 'blackman'; // blackman, hanning, down-ramp, expodec, sine
        this.timeStretch = 1.0; // playback speed
        
        // Filter & LFO - ENHANCED: Extended LFO range to audio rates
        this.filterNode = null;
        this.filterFreq = 2281; // Initialize at 2281 Hz
        this.filterQ = 0.1; // Initialize at 0.1 (now called "Resonance")
        this.lfoNode = null;
        this.lfoGainNode = null;
        this.lfoSpeed = 1; // Can now go up to 1000Hz for FM-like effects
        this.lfoDepth = 0;
        this.lfoShape = 'sine';
        
        // Vocoder (replacing formant filter bank)
        this.vocoderBands = [];
        this.vocoderCarrierGains = [];
        this.vocoderModulatorEnvelopes = [];
        this.vocoderGainNode = null;
        this.vocoderMixNode = null;
        this.vocoderDryNode = null;
        this.vocoderMix = 0;
        this.vocoderBandGains = [1, 1, 1, 1, 1, 1, 1, 1]; // 8 bands
        this.vocoderFrequencies = [200, 400, 800, 1200, 1600, 2400, 3200, 4800];
        
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
        this.ringModSourceType = 'envelope'; // Initialize to envelope
        this.ringModEnvSpeed = 1;
        
        // Spectral Freeze & Phaser - ENHANCED: More audible phaser
        this.spectralFreezeNode = null;
        this.spectralFreeze = 0;
        this.phaserNodes = [];
        this.phaserLfo = null;
        this.phaserRate = 0.5;
        this.phaserDepth = 50;
        this.phaserFeedback = 0;
        this.phaserGain = 2.0; // Increased for better audibility
        this.phaserMixNode = null;
        this.phaserDryNode = null;
        this.phaserWetGainNode = null; // Separate wet gain for better control
        
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
        this.freqShifterAmount = 0; // -50 to +50 Hz
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
        
        // Delay effect
        this.delayNode = null;
        this.feedbackNode = null;
        this.delaySoftClipNode = null;
        this.delayTime = 0.2;
        this.delayFeedback = 0.3;
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
        
        // ENHANCED: Comb Filter Sequencer (was String Sequencer)
        this.combSeqEnabled = false;
        this.combSeqStreams = [];
        this.combSeqFrequencies = [440, 660, 880, 1100, 1320]; // Hz values instead of semitones
        this.combSeqLfo = null;
        this.combSeqLfoGain = null;
        this.combSeqSpeed = 4;
        this.combSeqDepth = 0;
        this.combSeqWetMix = 0; // NEW: Wet mix control
        this.combSeqSqueeze = 0;
        this.combSeqCurrentStep = 0;
        this.combSeqCanvas = null;
        this.combSeqCtx = null;
        this.combSeqGainBoost = null;
        this.combSeqWetGainNode = null; // NEW: Wet gain node
        this.combSeqDryGainNode = null; // NEW: Dry gain node
        this.combSeqSoftClip = 0; // NEW: Soft clip parameter
        this.combSeqSoftClipNode = null; // NEW: Soft clip node
        
        // Enhanced Grain animation - bigger, blood red particles
        this.grainCanvas = null;
        this.grainCtx = null;
        this.grainParticles = [];
        
        // Animated effects
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
        this.setupVisualEffects(); // NEW: Setup visual effects
        this.storeDefaultValues();
        this.setupPresets(); // NEW: Setup preset management
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
            ringModSourceType: 'envelope',
            ringModEnvSpeed: 1,
            spectralFreeze: 0,
            phaserRate: 0.5,
            phaserDepth: 50,
            phaserFeedback: 0,
            phaserGain: 2.0, // Updated default
            pannerXDepth: 0,
            pannerYRange: 0,
            pannerSpeed: 0.5,
            freqShifterAmount: 0,
            freqShifterMix: 0,
            volume: 0.7,
            delayTime: 0.2,
            delayFeedback: 0.3,
            delaySoftClip: 0,
            delayMix: 0,
            reverbSize: 0.5,
            reverbDecay: 0.5,
            reverbPreDelay: 0.01,
            reverbWetGain: 1.0,
            reverbMix: 0,
            combSeqEnabled: false, // Changed from stringSeq
            combSeqSpeed: 4,
            combSeqDepth: 0,
            combSeqWetMix: 0, // NEW
            combSeqSqueeze: 0,
            combSeqSoftClip: 0, // NEW
            combSeqFrequencies: [440, 660, 880, 1100, 1320], // Changed from semitones
            wrapEnabled: false
        };
    }

    // NEW: Setup preset management
    setupPresets() {
        this.presets = new Map();
        this.loadPresetsFromStorage();
        this.updatePresetSelect();
    }

    // NEW: Setup visual effects
    setupVisualEffects() {
        this.setupLogoParticles();
        this.setupFallingDust();
        this.setupGlassEffects();
        this.animateVisualEffects();
    }

    setupLogoParticles() {
        const logoContainer = document.getElementById('logoParticles');
        if (!logoContainer) return;
        
        // Create 5 swirling particles
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            logoContainer.appendChild(particle);
        }
    }

    setupFallingDust() {
        const dustContainer = document.getElementById('fallingDust');
        if (!dustContainer) return;
        
        // Create falling dust particles
        setInterval(() => {
            if (dustContainer.children.length < 20) {
                const dust = document.createElement('div');
                dust.className = 'dust-particle';
                dust.style.left = Math.random() * 100 + '%';
                dust.style.animationDelay = Math.random() * 2 + 's';
                dustContainer.appendChild(dust);
                
                // Remove after animation
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
        
        // Add shine effect
        const shine = document.createElement('div');
        shine.className = 'glass-shine';
        glassContainer.appendChild(shine);
        
        // Add droplets periodically
        setInterval(() => {
            if (Math.random() < 0.1 && glassContainer.children.length < 5) { // 10% chance
                const droplet = document.createElement('div');
                droplet.className = 'droplet';
                droplet.style.left = Math.random() * 90 + 5 + '%'; // 5-95%
                droplet.style.animationDelay = Math.random() * 2 + 's';
                glassContainer.appendChild(droplet);
                
                // Remove after animation
                setTimeout(() => {
                    if (droplet.parentNode) {
                        droplet.parentNode.removeChild(droplet);
                    }
                }, 5000);
            }
        }, 2000);
    }

    animateVisualEffects() {
        // This will be called in the main animation loop
        requestAnimationFrame(() => this.animateVisualEffects());
    }
    async initAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create mute control
        this.muteGainNode = this.audioContext.createGain();
        this.muteGainNode.gain.value = 1;
        
        // Create volume booster (compressor for 40% boost at max volume)
        this.volumeBooster = this.audioContext.createDynamicsCompressor();
        this.volumeBooster.threshold.value = -12;
        this.volumeBooster.knee.value = 30;
        this.volumeBooster.ratio.value = 12;
        this.volumeBooster.attack.value = 0.003;
        this.volumeBooster.release.value = 0.25;
        
        // Create master volume control
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.gain.value = this.volume;
        
        // Connect volume chain: mute -> volume -> booster -> destination
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
        
        // ENHANCED: Create LFO for filter modulation with extended range
        this.lfoNode = this.audioContext.createOscillator();
        this.lfoNode.type = 'sine';
        this.lfoNode.frequency.value = this.lfoSpeed;
        this.lfoGainNode = this.audioContext.createGain();
        this.lfoGainNode.gain.value = 0;
        this.lfoNode.connect(this.lfoGainNode);
        this.lfoGainNode.connect(this.filterNode.frequency);
        this.lfoNode.start();
        
        // Create 8-band vocoder
        await this.initVocoder();
        
        // Create waveshaper
        this.waveShaperNode = this.audioContext.createWaveShaper();
        this.waveShaperNode.curve = this.makeWavefolderCurve(0);
        this.waveShaperNode.oversample = '4x';
        
        await this.initRingModulator();
        await this.initSpectralFreezeAndPhaser();
        await this.init3DPannerAndFreqShifter();
        await this.initCombSequencer(); // CHANGED: from initStringSequencer
        await this.initDelay();
        await this.initReverb();
        
        // Connect signal path
        this.connectAudioNodes();
    }

    async initVocoder() {
        // Create 8-band vocoder to replace formant filter bank
        this.vocoderGainNode = this.audioContext.createGain();
        this.vocoderGainNode.gain.value = 4.0; // Significant gain boost
        
        // Create carrier and modulator paths
        this.vocoderBands = [];
        this.vocoderCarrierGains = [];
        this.vocoderModulatorEnvelopes = [];
        
        for (let i = 0; i < 8; i++) {
            // Carrier filter (processes the main signal)
            const carrierFilter = this.audioContext.createBiquadFilter();
            carrierFilter.type = 'bandpass';
            carrierFilter.frequency.value = this.vocoderFrequencies[i];
            carrierFilter.Q.value = 8;
            
            // Modulator filter (analyzes the modulator signal)
            const modulatorFilter = this.audioContext.createBiquadFilter();
            modulatorFilter.type = 'bandpass';
            modulatorFilter.frequency.value = this.vocoderFrequencies[i];
            modulatorFilter.Q.value = 8;
            
            // Envelope follower for modulator
            const envelopeFollower = this.audioContext.createGain();
            envelopeFollower.gain.value = 0;
            
            // Carrier gain controlled by envelope
            const carrierGain = this.audioContext.createGain();
            carrierGain.gain.value = this.vocoderBandGains[i];
            
            // Band-specific gain control
            const bandGain = this.audioContext.createGain();
            bandGain.gain.value = 1;
            
            // Connect carrier path
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
        
        // Vocoder mix control
        this.vocoderMixNode = this.audioContext.createGain();
        this.vocoderDryNode = this.audioContext.createGain();
        this.vocoderMixNode.gain.value = 0;
        this.vocoderDryNode.gain.value = 1;
        
        this.vocoderGainNode.connect(this.vocoderMixNode);
    }

    async initRingModulator() {
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
        
        // Initialize with envelope instead of noise
        this.ringModSource = this.ringModEnvNode;
        this.ringModSource.connect(this.ringModNode.gain);
        
        // Ring mod mix control
        this.ringModMixNode = this.audioContext.createGain();
        this.ringModDryNode = this.audioContext.createGain();
        this.ringModMixNode.gain.value = 0;
        this.ringModDryNode.gain.value = 1;
    }

    async initSpectralFreezeAndPhaser() {
        // Spectral Freeze (simplified using delay and feedback)
        this.spectralFreezeNode = this.audioContext.createDelay(0.1);
        this.spectralFreezeNode.delayTime.value = 0.05;
        
        // ENHANCED: Create 12-stage phaser with better audibility
        this.phaserNodes = [];
        for (let i = 0; i < 12; i++) {
            const allpass = this.audioContext.createBiquadFilter();
            allpass.type = 'allpass';
            allpass.frequency.value = 500 + i * 200;
            allpass.Q.value = 8; // Increased Q for more pronounced effect
            this.phaserNodes.push(allpass);
            
            if (i > 0) {
                this.phaserNodes[i - 1].connect(allpass);
            }
        }
        
        // Phaser LFO
        this.phaserLfo = this.audioContext.createOscillator();
        this.phaserLfo.type = 'sine';
        this.phaserLfo.frequency.value = this.phaserRate;
        
        // Connect LFO to phaser stages
        const phaserLfoGain = this.audioContext.createGain();
        phaserLfoGain.gain.value = 0;
        this.phaserLfo.connect(phaserLfoGain);
        
        this.phaserNodes.forEach(node => {
            phaserLfoGain.connect(node.frequency);
        });
        
        this.phaserLfo.start();
        
        // ENHANCED: Phaser mix and feedback with separate wet gain
        this.phaserMixNode = this.audioContext.createGain();
        this.phaserDryNode = this.audioContext.createGain();
        this.phaserWetGainNode = this.audioContext.createGain(); // NEW: Separate wet gain
        this.phaserMixNode.gain.value = 0;
        this.phaserDryNode.gain.value = 1;
        this.phaserWetGainNode.gain.value = 1;
        
        // Phaser gain boost with harmonic saturation
        this.phaserGainNode = this.audioContext.createGain();
        this.phaserGainNode.gain.value = this.phaserGain;
        
        // Harmonic saturation waveshaper
        this.phaserSaturation = this.audioContext.createWaveShaper();
        this.phaserSaturation.curve = this.makeHarmonicSaturationCurve();
        this.phaserSaturation.oversample = '2x';
        
        // ENHANCED: Connect phaser chain with better routing
        if (this.phaserNodes.length > 0) {
            this.phaserNodes[this.phaserNodes.length - 1].connect(this.phaserWetGainNode);
            this.phaserWetGainNode.connect(this.phaserGainNode);
            this.phaserGainNode.connect(this.phaserSaturation);
            this.phaserSaturation.connect(this.phaserMixNode);
        }
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
        
        // Gain boost for frequency shifter audibility
        this.freqShifterGainBoost = this.audioContext.createGain();
        this.freqShifterGainBoost.gain.value = 3.0; // 3x boost
        
        this.freqShifterOsc.connect(this.freqShifterNode.gain);
        
        // Frequency shifter mix control
        this.freqShifterWetNode = this.audioContext.createGain();
        this.freqShifterDryNode = this.audioContext.createGain();
        this.freqShifterWetNode.gain.value = 0;
        this.freqShifterDryNode.gain.value = 1;
    }
    // ENHANCED: Comb Filter Sequencer (replaces String Sequencer) with soft clip
    async initCombSequencer() {
        // Create LFO for sequencer clock
        this.combSeqLfo = this.audioContext.createOscillator();
        this.combSeqLfo.type = 'sine';
        this.combSeqLfo.frequency.value = this.combSeqSpeed;
        
        this.combSeqLfoGain = this.audioContext.createGain();
        this.combSeqLfoGain.gain.value = 0; // Starts disabled
        
        // Gain boost for comb sequencer audibility
        this.combSeqGainBoost = this.audioContext.createGain();
        this.combSeqGainBoost.gain.value = 3.0; // 3x boost to make audible
        
        // NEW: Soft clip node for comb sequencer
        this.combSeqSoftClipNode = this.audioContext.createWaveShaper();
        this.combSeqSoftClipNode.curve = this.makeSoftClipCurve(0);
        this.combSeqSoftClipNode.oversample = '2x';
        
        // NEW: Wet/Dry mix controls
        this.combSeqWetGainNode = this.audioContext.createGain();
        this.combSeqDryGainNode = this.audioContext.createGain();
        this.combSeqWetGainNode.gain.value = 0; // Start with dry signal
        this.combSeqDryGainNode.gain.value = 1;
        
        this.combSeqLfo.connect(this.combSeqLfoGain);
        this.combSeqLfo.start();
        
        // Create 5 comb filter streams with frequency-based processing
        this.combSeqStreams = [];
        for (let i = 0; i < 5; i++) {
            const stream = {
                // Comb filter components
                delayNode: this.audioContext.createDelay(0.1),
                feedbackGain: this.audioContext.createGain(),
                outputGain: this.audioContext.createGain(),
                mixGain: this.audioContext.createGain(),
                currentStep: i, // Offset each stream
                lastTriggerTime: 0,
                frequency: this.combSeqFrequencies[i]
            };
            
            // Configure comb filter
            const delayTime = 1 / stream.frequency; // Delay time based on frequency
            stream.delayNode.delayTime.value = Math.min(delayTime, 0.1); // Cap at 100ms
            stream.feedbackGain.gain.value = 0.7; // Feedback amount
            stream.outputGain.gain.value = 0.3; // Output level
            stream.mixGain.gain.value = 0; // Start muted
            
            // Connect comb filter: input -> delay -> feedback -> delay (loop)
            //                              |-> output
            stream.delayNode.connect(stream.feedbackGain);
            stream.feedbackGain.connect(stream.delayNode);
            stream.delayNode.connect(stream.outputGain);
            stream.outputGain.connect(stream.mixGain);
            stream.mixGain.connect(this.combSeqGainBoost);
            
            this.combSeqStreams.push(stream);
        }
        
        // Connect through soft clip then wet gain
        this.combSeqGainBoost.connect(this.combSeqSoftClipNode);
        this.combSeqSoftClipNode.connect(this.combSeqWetGainNode);
        
        // Setup visualization canvas
        this.setupCombSeqVisualization();
    }

    setupCombSeqVisualization() {
        this.combSeqCanvas = document.getElementById('stringSeqWave'); // Reuse existing canvas
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
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.combSeqDepth > 0) {
            const time = this.audioContext.currentTime;
            const width = canvas.width;
            const height = canvas.height;
            const centerY = height / 2;
            
            // CHANGED: Deep teal color for comb seq display
            ctx.strokeStyle = '#008080';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            // Draw comb filter frequency response visualization
            for (let x = 0; x < width; x++) {
                const t = (x / width) * 4 + time * this.combSeqSpeed;
                let wave = 0;
                
                // Combine frequencies from active steps
                for (let i = 0; i < 5; i++) {
                    const freq = this.combSeqFrequencies[i];
                    const amplitude = this.combSeqDepth / 100 / 5; // Divide by number of steps
                    wave += Math.sin(t * freq * Math.PI * 2 / 1000) * amplitude;
                }
                
                // Apply squeeze effect
                if (this.combSeqSqueeze > 0) {
                    const squeeze = 1 + this.combSeqSqueeze * 9; // 1-10x compression
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
            
            // Add glow effect with teal color
            ctx.shadowColor = '#008080';
            ctx.shadowBlur = 4;
            ctx.stroke();
        }
        
        requestAnimationFrame(() => this.animateCombSeqWave());
    }

    async initDelay() {
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
    }

    async initReverb() {
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
    }

    connectAudioNodes() {
        // ENHANCED: Signal path with comb sequencer
        // Grains → Filter → Vocoder → Wavefolder → Ring Mod → Spectral Freeze → Phaser → 3D Panner → Freq Shifter → Delay → Reverb → Comb Seq → Mute → Master
        
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
        
        // Phaser to 3D panner
        this.phaserDryNode.connect(this.pannerNode);
        this.phaserMixNode.connect(this.pannerNode);
        
        // 3D panner to frequency shifter (with gain boost)
        this.pannerNode.connect(this.freqShifterDryNode);
        this.pannerNode.connect(this.freqShifterNode);
        this.freqShifterNode.connect(this.freqShifterGainBoost);
        this.freqShifterGainBoost.connect(this.freqShifterWetNode);
        
        // Frequency shifter to delay
        this.freqShifterDryNode.connect(this.delayDryNode);
        this.freqShifterDryNode.connect(this.delayNode);
        this.freqShifterWetNode.connect(this.delayDryNode);
        this.freqShifterWetNode.connect(this.delayNode);
        
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
        
        // ENHANCED: Reverb to comb sequencer (wet/dry mix)
        this.reverbDryNode.connect(this.combSeqDryGainNode);
        this.reverbWetNode.connect(this.combSeqDryGainNode);
        
        // Connect comb filter inputs
        if (this.combSeqEnabled && this.combSeqStreams.length > 0) {
            this.combSeqStreams.forEach(stream => {
                this.reverbDryNode.connect(stream.delayNode);
                this.reverbWetNode.connect(stream.delayNode);
            });
        }
        
        // Final mix to mute control
        this.combSeqDryGainNode.connect(this.muteGainNode);
        this.combSeqWetGainNode.connect(this.muteGainNode);
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

    makeHarmonicSaturationCurve() {
        const samples = 44100;
        const curve = new Float32Array(samples);
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            // Harmonic saturation with tube-like characteristics
            curve[i] = Math.tanh(x * 2) * 0.8 + Math.sin(x * Math.PI) * 0.1;
            curve[i] = Math.max(-1, Math.min(1, curve[i]));
        }
        
        return curve;
    }
    // Enhanced grain envelope function with sine wave
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
                
            default: // blackman
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
    
    // Reset function for RESET button
    resetAllParameters() {
        // Reset all sliders to default values
        Object.keys(this.defaultValues).forEach(param => {
            const element = document.getElementById(param);
            if (element) {
                element.value = this.defaultValues[param];
                // Trigger change event to update the parameter
                element.dispatchEvent(new Event('input'));
            }
        });
        
        // Reset special cases
        this.grainShape = 'blackman';
        this.ringModSourceType = 'envelope';
        this.lfoShape = 'sine';
        this.isMuted = false;
        this.combSeqEnabled = false; // CHANGED: from stringSeqEnabled
        this.wrapEnabled = false;
        
        // Update UI elements
        document.querySelectorAll('.grain-shape-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.shape === 'blackman') {
                btn.classList.add('active');
            }
        });
        
        // Set envelope as default
        document.getElementById('ringModEnv').classList.add('active');
        document.getElementById('ringModNoise').classList.remove('active');
        
        document.getElementById('lfoShape').value = 'sine';
        
        document.getElementById('muteButton').classList.remove('active');
        document.getElementById('stringSeqToggle').classList.remove('active'); // Note: ID stays same for compatibility
        document.getElementById('wrapToggle').classList.remove('active');
        
        // Reset ring mod to envelope source
        this.switchRingModSource('envelope');
        this.updateVolumeBoost();
        this.updateCombSequencer(); // CHANGED: from updateStringSequencer
        this.updateWrapGlow(); // Update wrap glow
        
        console.log('All parameters reset to defaults');
    }
    
    // Mute function
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.muteGainNode.gain.value = this.isMuted ? 0 : 1;
        
        const muteButton = document.getElementById('muteButton');
        muteButton.classList.toggle('active', this.isMuted);
        muteButton.textContent = this.isMuted ? '🔇 MUTED' : '🔊 MUTE';
    }
    
    // Volume booster update
    updateVolumeBoost() {
        // Apply 40% boost when volume is at maximum
        if (this.volume >= 1.9) { // Near max (2.0)
            // Increase makeup gain through compression
            this.volumeBooster.threshold.value = -6;
            this.volumeBooster.ratio.value = 20;
            
            // Add visual indicator
            const volumeControl = document.querySelector('.master-volume-control');
            if (volumeControl) {
                volumeControl.classList.add('volume-boost-indicator', 'boosted');
            }
        } else {
            // Normal compression settings
            this.volumeBooster.threshold.value = -12;
            this.volumeBooster.ratio.value = 12;
            
            // Remove visual indicator
            const volumeControl = document.querySelector('.master-volume-control');
            if (volumeControl) {
                volumeControl.classList.remove('boosted');
            }
        }
    }
    
    // ENHANCED: Update LFO with extended range for filter FM
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
    
    updateVocoderMix() {
        const mix = this.vocoderMix / 100;
        this.vocoderMixNode.gain.value = mix;
        this.vocoderDryNode.gain.value = 1 - mix;
        
        // Update vocoder modulation - simple envelope following simulation
        if (mix > 0) {
            // Process modulator signal (from wavefolder/ringmod output)
            this.vocoderBands.forEach((band, i) => {
                // Simulate envelope following by using gain reduction
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
        // Simple spectral freeze using delay feedback
        const feedbackAmount = this.spectralFreeze / 100 * 0.95;
        if (!this.spectralFeedbackNode) {
            this.spectralFeedbackNode = this.audioContext.createGain();
            this.spectralFreezeNode.connect(this.spectralFeedbackNode);
            this.spectralFeedbackNode.connect(this.spectralFreezeNode);
        }
        this.spectralFeedbackNode.gain.value = feedbackAmount;
    }

    // ENHANCED: Phaser with better audibility and wet/dry mix
    updatePhaser() {
        // Update phaser LFO rate
        this.phaserLfo.frequency.value = this.phaserRate;
        
        // Update phaser depth with better scaling
        const depthAmount = (this.phaserDepth / 100) * 1500; // Increased range
        if (this.phaserLfoGain) {
            this.phaserLfoGain.gain.value = depthAmount;
        }
        
        // Update gain with harmonic saturation at higher levels
        this.phaserGainNode.gain.value = this.phaserGain;
        if (this.phaserGain > 1.5) {
            // Enable harmonic saturation at higher gain levels
            this.phaserSaturation.curve = this.makeHarmonicSaturationCurve();
        }
        
        // Enhanced wet/dry balance for better audibility
        const wetAmount = Math.min(this.phaserDepth / 100, 0.7); // Cap wet amount
        this.phaserMixNode.gain.value = wetAmount;
        this.phaserDryNode.gain.value = 1 - wetAmount * 0.5; // Don't fully attenuate dry
    }

    update3DPanner() {
        // Update panner speeds
        this.pannerLfoX.frequency.value = this.pannerSpeed;
        this.pannerLfoY.frequency.value = this.pannerSpeed * 0.7;
        
        // Update axis depths
        const xDepth = (this.pannerXDepth / 100) * 5; // Max 5 units
        const yRange = (this.pannerYRange / 100) * 5; // Max 5 units
        
        this.pannerXGain.gain.value = xDepth;
        this.pannerYGain.gain.value = yRange;
    }
    
    // Improved frequency shifter with extended range
    updateFreqShifter() {
        // Update frequency shift amount (-50 to +50 Hz)
        this.freqShifterOsc.frequency.value = this.freqShifterAmount;
        
        // Update mix with compensation for gain boost
        const mix = this.freqShifterMix / 100;
        this.freqShifterWetNode.gain.value = mix;
        this.freqShifterDryNode.gain.value = 1 - mix;
    }

    // ENHANCED: Update wrap glow effect
    updateWrapGlow() {
        const wrapButton = document.getElementById('wrapToggle');
        if (this.looperEnabled && this.wrapEnabled) {
            wrapButton.classList.add('wrap-loop-active');
        } else {
            wrapButton.classList.remove('wrap-loop-active');
        }
    }
    // ENHANCED: Comb Filter Sequencer (replaces String Sequencer) with soft clip
    updateCombSequencer() {
        if (!this.combSeqLfo) return;
        
        // Update LFO frequency
        this.combSeqLfo.frequency.value = this.combSeqSpeed;
        
        // Update depth (acts as on/off and intensity)
        this.combSeqLfoGain.gain.value = this.combSeqDepth / 100;
        
        // NEW: Update wet/dry mix
        const wetMix = this.combSeqWetMix / 100;
        this.combSeqWetGainNode.gain.value = wetMix;
        this.combSeqDryGainNode.gain.value = 1 - wetMix;
        
        // NEW: Update soft clip
        if (this.combSeqSoftClipNode) {
            this.combSeqSoftClipNode.curve = this.makeSoftClipCurve(this.combSeqSoftClip / 100);
        }
        
        // Process comb filter sequencer if enabled and depth > 0
        if (this.combSeqEnabled && this.combSeqDepth > 0) {
            const now = this.audioContext.currentTime;
            
            this.combSeqStreams.forEach((stream, streamIndex) => {
                // Update comb filter frequency
                const frequency = this.combSeqFrequencies[stream.currentStep];
                const delayTime = 1 / frequency;
                stream.delayNode.delayTime.setValueAtTime(
                    Math.min(delayTime, 0.1), 
                    now
                );
                
                // Check if it's time to trigger this stream
                const stepDuration = 1 / (this.combSeqSpeed * 5); // 5 steps
                const timeSinceLastTrigger = now - stream.lastTriggerTime;
                
                if (timeSinceLastTrigger >= stepDuration) {
                    // Apply squeezed LFO modulation to feedback
                    let lfoValue = Math.sin(now * this.combSeqSpeed * Math.PI * 2);
                    if (this.combSeqSqueeze > 0) {
                        const squeeze = 1 + this.combSeqSqueeze * 9;
                        lfoValue = Math.tanh(lfoValue * squeeze) / Math.tanh(squeeze);
                    }
                    
                    // Modulate feedback and mix gain
                    const baseGain = 0.3 * (this.combSeqDepth / 100);
                    const modulatedGain = baseGain * (0.5 + Math.abs(lfoValue) * 0.5);
                    
                    stream.mixGain.gain.setValueAtTime(modulatedGain, now);
                    
                    // Advance to next step
                    stream.currentStep = (stream.currentStep + 1) % 5;
                    stream.lastTriggerTime = now;
                }
            });
        } else {
            // Mute all streams when disabled
            this.combSeqStreams.forEach(stream => {
                stream.mixGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            });
        }
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

    // ENHANCED: Bigger blood red grain particles (2x size)
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
        
        // ENHANCED: Bigger blood red glowing particles (2x size)
        const particle = {
            x: x,
            y: this.grainCanvas.height / 2 + (Math.random() - 0.5) * 20, // Center with small variation
            size: 1 + Math.random() * 2, // CHANGED: 2x bigger: 1-3px instead of 0.5-1.5px
            opacity: 1,
            vx: (Math.random() - 0.5) * 3, // Spray direction
            vy: -0.5 - Math.random() * 2, // Upward spray
            vz: Math.random() * 2 + 1, // Forward motion
            life: 1.0,
            decay: 0.015 + Math.random() * 0.01, // Faster decay
            color: `rgba(255, ${Math.floor(Math.random() * 50)}, 0, `, // Blood red variations
            glowIntensity: 0.8 + Math.random() * 0.4
        };
        
        this.grainParticles.push(particle);
        
        // Limit particle count for performance
        if (this.grainParticles.length > 30) {
            this.grainParticles.shift();
        }
    }

    animateGrains() {
        if (!this.grainCtx) return;
        
        // Clear canvas
        this.grainCtx.clearRect(0, 0, this.grainCanvas.width, this.grainCanvas.height);
        
        // Update and draw particles
        for (let i = this.grainParticles.length - 1; i >= 0; i--) {
            const particle = this.grainParticles[i];
            
            // Update particle physics
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vz += 0.1; // Acceleration forward
            particle.life -= particle.decay;
            particle.opacity = particle.life * particle.glowIntensity;
            
            // Scale effect as particle moves forward
            const scale = 1 + particle.vz * 0.1;
            const actualSize = particle.size * scale;
            
            // Remove dead particles (adjusted for bigger particles)
            if (particle.life <= 0 || actualSize > 6) { // CHANGED: from 3 to 6
                this.grainParticles.splice(i, 1);
                continue;
            }
            
           // ENHANCED: Blood red laser-like appearance - bigger (no white center)
            this.grainCtx.save();
            this.grainCtx.globalAlpha = particle.opacity;

            // Create glowing effect with multiple layers
            const color = particle.color + particle.opacity + ')';

            // Outer glow
            this.grainCtx.fillStyle = color;
            this.grainCtx.shadowColor = '#ff0000';
            this.grainCtx.shadowBlur = actualSize * 4;
            this.grainCtx.beginPath();
            this.grainCtx.arc(particle.x, particle.y, actualSize * 1.5, 0, Math.PI * 2);
            this.grainCtx.fill();

            // Inner bright core
            this.grainCtx.shadowBlur = actualSize * 2;
            this.grainCtx.fillStyle = `rgba(255, 100, 100, ${particle.opacity})`;
            this.grainCtx.beginPath();
            this.grainCtx.arc(particle.x, particle.y, actualSize, 0, Math.PI * 2);
            this.grainCtx.fill();

            this.grainCtx.restore();
        }
        
        requestAnimationFrame(() => this.animateGrains());
    }

    // NEW: Preset Management Functions
    savePreset(name) {
        if (!name) return false;
        
        const preset = {
            name: name,
            timestamp: Date.now(),
            parameters: {}
        };
        
        // Capture all parameter values
        const parameterElements = document.querySelectorAll('input[type="range"], select');
        parameterElements.forEach(element => {
            if (element.id) {
                preset.parameters[element.id] = element.value;
            }
        });
        
        // Capture button states
        const buttonElements = document.querySelectorAll('button.active');
        preset.buttonStates = Array.from(buttonElements).map(btn => btn.id);
        
        // Capture grain shape
        const activeShapeBtn = document.querySelector('.grain-shape-btn.active');
        if (activeShapeBtn) {
            preset.grainShape = activeShapeBtn.dataset.shape;
        }
        
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
        
        // ENHANCED: Accept both MP3 and WAV files
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
        
        // ENHANCED: Loop and Wrap buttons with glow update
        document.getElementById('looperToggle').addEventListener('click', () => {
            this.looperEnabled = !this.looperEnabled;
            document.getElementById('looperToggle').classList.toggle('active', this.looperEnabled);
            this.updateWrapGlow(); // Update wrap glow
        });

        // Wrap button
        document.getElementById('wrapToggle').addEventListener('click', () => {
            this.wrapEnabled = !this.wrapEnabled;
            document.getElementById('wrapToggle').classList.toggle('active', this.wrapEnabled);
            this.updateWrapGlow(); // Update wrap glow
        });
        
        // Reset button
        document.getElementById('resetButton').addEventListener('click', () => {
            this.resetAllParameters();
        });
        
        // Mute button
        document.getElementById('muteButton').addEventListener('click', () => {
            this.toggleMute();
        });
        
        // NEW: Preset controls
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
        
        // Ring mod source buttons - default to envelope
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
        
        // Grain shape buttons with sine option
        const grainShapeButtons = document.querySelectorAll('.grain-shape-btn');
        grainShapeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                grainShapeButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                // Update grain shape
                this.grainShape = btn.dataset.shape;
            });
        });
        
        // CHANGED: Comb sequencer toggle (was string sequencer)
        document.getElementById('stringSeqToggle').addEventListener('click', () => {
            this.combSeqEnabled = !this.combSeqEnabled; // CHANGED
            document.getElementById('stringSeqToggle').classList.toggle('active', this.combSeqEnabled);
            
            // Reinitialize comb sequencer if needed
            if (this.combSeqEnabled) {
                this.initCombSequencer(); // CHANGED
                this.connectAudioNodes(); // Reconnect with comb sequencer
            }
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
            timeStretch: (val) => { 
                this.timeStretch = parseFloat(val); 
                document.getElementById('timeStretchValue').textContent = val + 'x'; 
            },
            
            // Filter & LFO - ENHANCED: Extended LFO range
            filterFreq: (val) => { 
                this.filterFreq = parseInt(val); 
                this.filterNode.frequency.value = this.filterFreq;
                document.getElementById('filterFreqValue').textContent = val + 'Hz';
            },
            filterQ: (val) => { 
                this.filterQ = parseFloat(val); 
                this.filterNode.Q.value = this.filterQ;
                document.getElementById('filterQValue').textContent = val; // Now shows "Resonance"
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
            },
            vocoder2: (val) => { 
                this.updateVocoderBand(1, parseFloat(val));
                document.getElementById('vocoder2Value').textContent = val;
            },
            vocoder3: (val) => { 
                this.updateVocoderBand(2, parseFloat(val));
                document.getElementById('vocoder3Value').textContent = val;
            },
            vocoder4: (val) => { 
                this.updateVocoderBand(3, parseFloat(val));
                document.getElementById('vocoder4Value').textContent = val;
            },
            vocoder5: (val) => { 
                this.updateVocoderBand(4, parseFloat(val));
                document.getElementById('vocoder5Value').textContent = val;
            },
            vocoder6: (val) => { 
                this.updateVocoderBand(5, parseFloat(val));
                document.getElementById('vocoder6Value').textContent = val;
            },
            vocoder7: (val) => { 
                this.updateVocoderBand(6, parseFloat(val));
                document.getElementById('vocoder7Value').textContent = val;
            },
            vocoder8: (val) => { 
                this.updateVocoderBand(7, parseFloat(val));
                document.getElementById('vocoder8Value').textContent = val;
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
            ringModEnvSpeed: (val) => { 
                this.ringModEnvSpeed = parseFloat(val);
                this.ringModEnvNode.frequency.value = val;
                document.getElementById('ringModEnvSpeedValue').textContent = val + 'Hz';
            },
            
            // Spectral Freeze & Phaser
            spectralFreeze: (val) => { 
                this.spectralFreeze = parseInt(val);
                this.updateSpectralFreeze();
                document.getElementById('spectralFreezeValue').textContent = val + '%';
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
            
            // 3D Panner
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
            
            // Enhanced Frequency Shifter
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
                this.updateVolumeBoost(); // Apply volume boost logic
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
            
            // CHANGED: Comb Sequencer (was String Sequencer) with NEW soft clip
            stringSeqSpeed: (val) => { 
                this.combSeqSpeed = parseFloat(val); // CHANGED: from stringSeqSpeed
                this.updateCombSequencer(); // CHANGED: from updateStringSequencer
                document.getElementById('stringSeqSpeedValue').textContent = val + 'Hz';
            },
            stringSeqDepth: (val) => { 
                this.combSeqDepth = parseInt(val); // CHANGED: from stringSeqDepth
                this.updateCombSequencer(); // CHANGED: from updateStringSequencer
                document.getElementById('stringSeqDepthValue').textContent = val + '%';
            },
            // NEW: Wet Mix control for comb sequencer
            stringSeqWetMix: (val) => { 
                this.combSeqWetMix = parseInt(val);
                this.updateCombSequencer();
                document.getElementById('stringSeqWetMixValue').textContent = val + '%';
            },
            stringSeqSqueeze: (val) => { 
                this.combSeqSqueeze = parseInt(val) / 100; // CHANGED: from stringSeqSqueeze
                document.getElementById('stringSeqSqueezeValue').textContent = val + '%';
            },
            // NEW: Comb Sequencer Soft Clip
            combSeqSoftClip: (val) => { 
                this.combSeqSoftClip = parseInt(val);
                this.updateCombSequencer();
                document.getElementById('combSeqSoftClipValue').textContent = val + '%';
            },
            
            // CHANGED: Comb Sequencer Frequency Steps (was pitch steps)
            stringSeqStep1: (val) => { 
                this.combSeqFrequencies[0] = parseInt(val); // CHANGED: from stringSeqPitches[0]
                document.getElementById('stringSeqStep1Value').textContent = val;
                this.updateCombSequencer(); // Update
            },
            stringSeqStep2: (val) => { 
                this.combSeqFrequencies[1] = parseInt(val); // CHANGED: from stringSeqPitches[1]
                document.getElementById('stringSeqStep2Value').textContent = val;
                this.updateCombSequencer();
            },
            stringSeqStep3: (val) => { 
                this.combSeqFrequencies[2] = parseInt(val); // CHANGED: from stringSeqPitches[2]
                document.getElementById('stringSeqStep3Value').textContent = val;
                this.updateCombSequencer();
            },
            stringSeqStep4: (val) => { 
                this.combSeqFrequencies[3] = parseInt(val); // CHANGED: from stringSeqPitches[3]
                document.getElementById('stringSeqStep4Value').textContent = val;
                this.updateCombSequencer();
            },
            stringSeqStep5: (val) => { 
                this.combSeqFrequencies[4] = parseInt(val); // CHANGED: from stringSeqPitches[4]
                document.getElementById('stringSeqStep5Value').textContent = val;
                this.updateCombSequencer();
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
    // CHANGED: Simplified keyboard controls - disabled R key and other alphabet shortcuts
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
            
            // DISABLED: M key - mute toggle (interferes with chromatic pitch)
            // DISABLED: R key - record toggle (interferes with chromatic pitch)
            // DISABLED: Other alphabet shortcuts that interfere with chromatic keys
            
            // Number keys - scan position
            if (key >= '0' && key <= '9') {
                const position = key === '0' ? 0 : parseInt(key) / 9;
                this.setScanPosition(position);
                return;
            }
            
            // Arrow keys - CHANGED: fine navigation to "micro" navigation
            if (key === 'arrowleft') {
                e.preventDefault();
                this.microScanBackward(); // CHANGED: from fineScanBackward
                return;
            }
            
            if (key === 'arrowright') {
                e.preventDefault();
                this.microScanForward(); // CHANGED: from fineScanForward
                return;
            }
            
            // Chromatic keys - pitch (NO CHANGES TO PRESERVE CHROMATIC FUNCTIONALITY)
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
        
        // Arrow keys - micro navigation
        if (key === 'ArrowLeft') {
            this.microScanBackward(); // CHANGED: from fineScanBackward
            return;
        }
        
        if (key === 'ArrowRight') {
            this.microScanForward(); // CHANGED: from fineScanForward
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
            
            // Resize grain canvas
            this.resizeGrainCanvas();
            
            // REMOVED: Auto-configuration prompt that was causing sluggishness
            // No auto-configuration to keep it simple and lightweight
            
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
    
    // ENHANCED: Updated waveform with deep teal colors
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
            
            // Resize grain canvas too
            this.resizeGrainCanvas();
            
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
            
            // ENHANCED: Draw waveform with deep teal color
            ctx.strokeStyle = '#008080';
            ctx.lineWidth = 2;
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
            
            // ENHANCED: Add electrical glow effect variants
            ctx.shadowColor = '#006666';
            ctx.shadowBlur = 4;
            ctx.stroke();
            
            // Add waveform glow animation area
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
        
        // Update playhead visual
        const playhead = document.getElementById('playhead');
        if (playhead) {
            playhead.style.left = (position * 100) + '%';
        }
        
        // Update position display
        document.getElementById('loopPos').textContent = this.loopPosition.toFixed(2) + 's';
        document.getElementById('currentPos').textContent = this.loopPosition.toFixed(2) + 's';
    }

    // CHANGED: Renamed from fineScanBackward to microScanBackward
    microScanBackward() {
        if (!this.audioBuffer) return;
        
        const microIncrement = 0.01; // 1% increment
        const newPosition = Math.max(0, this.scanPosition - microIncrement);
        this.setScanPosition(newPosition);
    }

    // CHANGED: Renamed from fineScanForward to microScanForward
    microScanForward() {
        if (!this.audioBuffer) return;
        
        const microIncrement = 0.01; // 1% increment
        const newPosition = Math.min(1, this.scanPosition + microIncrement);
        this.setScanPosition(newPosition);
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
        let startTime;

        if (this.wrapEnabled) {
            // WRAP mode: Fast stationary loop at current scan position
            startTime = this.scanPosition * this.audioBuffer.duration;
            startTime += randomOffset * 0.1; // Reduced randomization for tighter wrap
        } else if (this.looperEnabled) {
            // LOOP mode: Progressive loop through waveform
            startTime = this.loopPosition;
            startTime += randomOffset;
            
            // Advance loop position
            const grainAdvancement = (this.grainSize / 1000) / this.timeStretch;
            this.loopPosition += grainAdvancement;
            
            // Wrap around to beginning when reaching end
            if (this.loopPosition >= this.audioBuffer.duration) {
                this.loopPosition = 0;
            }
            
            // Update scan position for visual feedback
            this.scanPosition = this.loopPosition / this.audioBuffer.duration;
            
            // Update playhead visual
            const playhead = document.getElementById('playhead');
            if (playhead) {
                playhead.style.left = (this.scanPosition * 100) + '%';
            }
            
            // Update position displays
            document.getElementById('loopPos').textContent = this.loopPosition.toFixed(2) + 's';
            document.getElementById('currentPos').textContent = this.loopPosition.toFixed(2) + 's';
        } else {
            // Normal mode: Use current scan position
            startTime = this.scanPosition * this.audioBuffer.duration;
            startTime += randomOffset;
        }

        startTime = Math.max(0, Math.min(startTime, this.audioBuffer.duration - (this.grainSize / 1000)));
        
        // Grain envelope using selected shape
        const grainDuration = this.grainSize / 1000;
        const now = this.audioContext.currentTime;
        
        // Apply envelope shape
        this.applyGrainEnvelope(gainNode, now, grainDuration, this.grainShape);
        
        // Connect: source -> gain -> filter
        source.connect(gainNode);
        gainNode.connect(this.filterNode);
        
        try {
            source.start(now, startTime, grainDuration);
            source.stop(now + grainDuration);
            console.log('Grain started successfully');
            
            // ENHANCED: Add bigger blood red grain particle animation
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
        
        // Track grain
        const grain = { source, startTime: now, duration: grainDuration };
        this.grains.push(grain);
        
        // Clean up finished grains
        source.onended = () => {
            const index = this.grains.indexOf(grain);
            if (index > -1) this.grains.splice(index, 1);
        };
        
        // Update display with pulse animation
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
        
        // Apply envelope using gain automation
        gainNode.gain.setValueAtTime(0, startTime);
        
        // Simple envelope application - start, peak, end
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
        recordButton.classList.add('success');
        setTimeout(() => {
            recordButton.textContent = '⬤ REC';
            recordButton.classList.remove('success');
        }, 2000);
        
        console.log('Recording saved');
    }
}

// ENHANCED: Initialize with visual effects and better defaults - REMOVED auto-config
document.addEventListener('DOMContentLoaded', () => {
    // Add SVG filters to document if not present with RETAINED 0.5 baseFrequency
    if (!document.querySelector('#noise-filter')) {
        const svgFilters = document.createElement('div');
        svgFilters.innerHTML = `
            <svg class="svg-filters-container" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <!-- Noise Filter with RETAINED 0.5 baseFrequency -->
                    <filter id="noise-filter" x="0%" y="0%" width="100%" height="100%">
                        <feTurbulence baseFrequency="0.5" numOctaves="1" result="noise"/>
                        <feColorMatrix in="noise" type="saturate" values="0"/>
                        <feComponentTransfer>
                            <feFuncA type="discrete" tableValues="0.02 0.02 0.02 0.02"/>
                        </feComponentTransfer>
                        <feComposite operator="over" in2="SourceGraphic"/>
                    </filter>
                    
                    <!-- Strong Noise Filter -->
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
        looperToggle.classList.remove('active'); // Remove active class for OFF state
        looperToggle.textContent = '↻ LOOP';
    }
    
    const wrapToggle = document.getElementById('wrapToggle');
    if (wrapToggle) {
        wrapToggle.classList.remove('active'); // Remove active class for OFF state
        wrapToggle.textContent = '⬜ WRAP';
    }
    
    // Set default comb sequencer toggle text
    const combSeqToggle = document.getElementById('stringSeqToggle');
    if (combSeqToggle) {
        combSeqToggle.textContent = '◼ OFF';
    }
    
    // Enhanced initialization effects
    setTimeout(() => {
        // Trigger initial animations
        const header = document.querySelector('.main-header');
        if (header) {
            header.style.animation = 'none';
            header.offsetHeight; // Trigger reflow
            header.style.animation = 'fadeInScale 1s ease-out';
        }
        
        // Initialize visual effects
        if (window.granularSampler) {
            window.granularSampler.setupVisualEffects();
        }
    }, 100);
    
    // Handle window resize for grain canvas and responsive design
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.granularSampler && window.granularSampler.grainCanvas) {
                window.granularSampler.resizeGrainCanvas();
                window.granularSampler.drawWaveform(); // Redraw waveform on resize
            }
        }, 250);
    });
    
    // Enhanced error handling
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
    
    // DISABLED: MIDI functionality commented out for future reference
    /*
    // MIDI Controller (disabled but kept for future reference)
    const MIDIController = {
        midiAccess: null,
        inputPorts: [],
        
        async initialize() {
            if (!navigator.requestMIDIAccess) {
                console.warn('MIDI not supported in this browser');
                return false;
            }
            
            try {
                this.midiAccess = await navigator.requestMIDIAccess();
                this.setupInputs();
                this.midiAccess.onstatechange = () => this.setupInputs();
                console.log('MIDI controller initialized');
                return true;
            } catch (error) {
                console.error('MIDI initialization failed:', error);
                return false;
            }
        }
        // ... rest of MIDI functionality commented out
    };
    */
    
    console.log('🎵 GRAINS Enhanced Granular Sampler Ready!');
    console.log('Features enabled:');
    console.log('- Deep teal visual theme');
    console.log('- Bigger blood red grain particles (2x size)');
    console.log('- Comb filter sequencer with soft clip');
    console.log('- Extended LFO range (1-1000Hz)');
    console.log('- Enhanced phaser audibility');
    console.log('- Preset management');
    console.log('- Fixed LFO dropdown styling');
    console.log('- Simplified keyboard controls (no alphabet shortcuts)');
    console.log('- MIDI functionality disabled but preserved');
    console.log('- Auto-configuration removed for better performance');
});

// Performance optimization: Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.granularSampler) {
        // Stop all audio processing
        window.granularSampler.stopPlayback();
        
        // Disconnect audio nodes
        if (window.granularSampler.audioContext) {
            window.granularSampler.audioContext.close();
        }
        
        // Clear intervals and timeouts
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
    
    // Try to recover by resetting the audio context
    if (window.granularSampler && event.reason.name === 'InvalidStateError') {
        setTimeout(() => {
            window.granularSampler.initAudio().catch(console.error);
        }, 1000);
    }
});

console.log('GRAINS Enhanced Granular Sampler - All systems loaded');