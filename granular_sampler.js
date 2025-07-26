class GranularSampler {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.grains = [];
        this.isPlaying = false;
        this.playheadPosition = 0;
        this.loopPosition = 0;
        this.looperEnabled = false; // CHANGED: Initialize LOOP to OFF
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
        this.grainShape = 'blackman'; // blackman, hanning, down-ramp, expodec, sine
        this.timeStretch = 1.0; // playback speed
        
        // Filter & LFO
        this.filterNode = null;
        this.filterFreq = 2281; // CHANGED: Initialize at 2281 Hz
        this.filterQ = 0.1; // CHANGED: Initialize at 0.1
        this.filterFreq = 2281; // CHANGED: Initialize at 2281 Hz
        this.filterQ = 0.1; // CHANGED: Initialize at 0.1
        this.lfoNode = null;
        this.lfoGainNode = null;
        this.lfoSpeed = 1;
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
        this.ringModSourceType = 'envelope'; // CHANGED: Initialize to envelope
        this.ringModSourceType = 'envelope'; // CHANGED: Initialize to envelope
        this.ringModEnvSpeed = 1;
        
        // Spectral Freeze & Phaser
        this.spectralFreezeNode = null;
        this.spectralFreeze = 0;
        this.phaserNodes = [];
        this.phaserLfo = null;
        this.phaserRate = 0.5;
        this.phaserDepth = 50;
        this.phaserFeedback = 0;
        this.phaserGain = 1.0;
        this.phaserMixNode = null;
        this.phaserDryNode = null;
        
        // 3D Panner
        this.pannerNode = null;
        this.pannerLfoX = null;
        this.pannerLfoY = null;
        this.pannerXDepth = 0;
        this.pannerYRange = 0;
        this.pannerXDepth = 0;
        this.pannerYRange = 0;
        this.pannerSpeed = 0.5;
        
        // Frequency Shifter (enhanced)
        // Frequency Shifter (enhanced)
        this.freqShifterNode = null;
        this.freqShifterOsc = null;
        this.freqShifterAmount = 0; // -50 to +50 Hz (CHANGED: Extended range)
        this.freqShifterAmount = 0; // -50 to +50 Hz (CHANGED: Extended range)
        this.freqShifterMix = 0;
        this.freqShifterWetNode = null;
        this.freqShifterDryNode = null;
        this.freqShifterGainBoost = null; // ADDED: Gain boost for audibility
        this.freqShifterGainBoost = null; // ADDED: Gain boost for audibility
        
        // Volume & Mute
        this.masterGainNode = null;
        this.muteGainNode = null;
        this.volume = 0.7;
        this.volume = 0.7;
        this.isMuted = false;
        this.volumeBooster = null;
        this.volumeBooster = null;
        
        // Delay effect
        this.delayNode = null;
        this.feedbackNode = null;
        this.delaySoftClipNode = null;
        this.delayTime = 0.2;
        this.delayFeedback = 0.3;
        this.delayTime = 0.2;
        this.delayFeedback = 0.3;
        this.delaySoftClip = 0;
        this.delayMix = 0;
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
        
        // Paraphonic String Sequencer (enhanced)
        // Paraphonic String Sequencer (enhanced)
        this.stringSeqEnabled = false;
        this.stringSeqStreams = [];
        this.stringSeqPitches = [0, 2, 4, 7, 12];
        this.stringSeqStreams = [];
        this.stringSeqPitches = [0, 2, 4, 7, 12];
        this.stringSeqLfo = null;
        this.stringSeqLfoGain = null;
        this.stringSeqSpeed = 4;
        this.stringSeqDepth = 0;
        this.stringSeqSqueeze = 0;
        this.stringSeqSpeed = 4;
        this.stringSeqDepth = 0;
        this.stringSeqSqueeze = 0;
        this.stringSeqCurrentStep = 0;
        this.stringSeqCanvas = null;
        this.stringSeqCtx = null;
        this.stringSeqGainBoost = null; // ADDED: Gain boost for audibility
        this.stringSeqGainBoost = null; // ADDED: Gain boost for audibility
        
        // Grain animation
        this.grainCanvas = null;
        this.grainCtx = null;
        this.grainParticles = [];
        
        // Store default values for reset function
        this.defaultValues = {};
        
        this.initAudio();
        this.setupEventListeners();
        this.setupKeyboardControls();
        this.setupMobileKeyboard();
        this.setupGrainAnimation();
        this.storeDefaultValues();
    }

    storeDefaultValues() {
        this.defaultValues = {
            grainSize: 50,
            density: 4,
            windowScan: 0,
            grainShape: 'blackman',
            timeStretch: 1.0,
            filterFreq: 2281, // CHANGED
            filterQ: 0.1, // CHANGED
            filterFreq: 2281, // CHANGED
            filterQ: 0.1, // CHANGED
            lfoSpeed: 1,
            lfoDepth: 0,
            lfoShape: 'sine',
            vocoderMix: 0,
            vocoderBandGains: [1, 1, 1, 1, 1, 1, 1, 1],
            wavefoldAmount: 0,
            ringModMix: 0,
            ringModSourceType: 'envelope', // CHANGED
            ringModSourceType: 'envelope', // CHANGED
            ringModEnvSpeed: 1,
            spectralFreeze: 0,
            phaserRate: 0.5,
            phaserDepth: 50,
            phaserFeedback: 0,
            phaserGain: 1.0,
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
            stringSeqEnabled: false,
            stringSeqSpeed: 4,
            stringSeqDepth: 0,
            stringSeqSqueeze: 0,
            stringSeqPitches: [0, 2, 4, 7, 12],
            wrapEnabled: false
        };
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
        
        // Create LFO for filter modulation
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
        await this.initSpectralFreeseAndPhaser();
        await this.init3DPannerAndFreqShifter();
        await this.initStringSequencer();
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
        
        // CHANGED: Initialize with envelope instead of noise
        this.ringModSource = this.ringModEnvNode;
        // CHANGED: Initialize with envelope instead of noise
        this.ringModSource = this.ringModEnvNode;
        this.ringModSource.connect(this.ringModNode.gain);
        
        // Ring mod mix control
        this.ringModMixNode = this.audioContext.createGain();
        this.ringModDryNode = this.audioContext.createGain();
        this.ringModMixNode.gain.value = 0;
        this.ringModDryNode.gain.value = 1;
    }
    async initSpectralFreeseAndPhaser() {
        // Spectral Freeze (simplified using delay and feedback)
        this.spectralFreezeNode = this.audioContext.createDelay(0.1);
        this.spectralFreezeNode.delayTime.value = 0.05;
        
        // Create 12-stage phaser
        this.phaserNodes = [];
        for (let i = 0; i < 12; i++) {
            const allpass = this.audioContext.createBiquadFilter();
            allpass.type = 'allpass';
            allpass.frequency.value = 500 + i * 200;
            allpass.Q.value = 5;
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
        
        // Phaser mix and feedback
        this.phaserMixNode = this.audioContext.createGain();
        this.phaserDryNode = this.audioContext.createGain();
        this.phaserMixNode.gain.value = 0;
        this.phaserDryNode.gain.value = 1;
        
        // Phaser gain boost with harmonic saturation
        this.phaserGainNode = this.audioContext.createGain();
        this.phaserGainNode.gain.value = this.phaserGain;
        
        // Harmonic saturation waveshaper
        this.phaserSaturation = this.audioContext.createWaveShaper();
        this.phaserSaturation.curve = this.makeHarmonicSaturationCurve();
        this.phaserSaturation.oversample = '2x';
        
        // Connect phaser chain
        if (this.phaserNodes.length > 0) {
            this.phaserNodes[this.phaserNodes.length - 1].connect(this.phaserGainNode);
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
        // Create Enhanced Frequency Shifter
        this.freqShifterOsc = this.audioContext.createOscillator();
        this.freqShifterOsc.type = 'sine';
        this.freqShifterOsc.frequency.value = 0;
        this.freqShifterOsc.frequency.value = 0;
        this.freqShifterOsc.start();
        
        this.freqShifterNode = this.audioContext.createGain();
        this.freqShifterNode.gain.value = 0;
        
        // ADDED: Gain boost for frequency shifter audibility
        this.freqShifterGainBoost = this.audioContext.createGain();
        this.freqShifterGainBoost.gain.value = 3.0; // 3x boost
        
        // ADDED: Gain boost for frequency shifter audibility
        this.freqShifterGainBoost = this.audioContext.createGain();
        this.freqShifterGainBoost.gain.value = 3.0; // 3x boost
        
        this.freqShifterOsc.connect(this.freqShifterNode.gain);
        
        // Frequency shifter mix control
        this.freqShifterWetNode = this.audioContext.createGain();
        this.freqShifterDryNode = this.audioContext.createGain();
        this.freqShifterWetNode.gain.value = 0;
        this.freqShifterDryNode.gain.value = 1;
    }

    async initStringSequencer() {
        // Create LFO for sequencer clock
        this.stringSeqLfo = this.audioContext.createOscillator();
        this.stringSeqLfo.type = 'sine';
        this.stringSeqLfo.frequency.value = this.stringSeqSpeed;
        
        this.stringSeqLfoGain = this.audioContext.createGain();
        this.stringSeqLfoGain.gain.value = 0; // Starts disabled
        
        // ADDED: Gain boost for string sequencer audibility
        this.stringSeqGainBoost = this.audioContext.createGain();
        this.stringSeqGainBoost.gain.value = 5.0; // 5x boost to make audible
        
        // ADDED: Gain boost for string sequencer audibility
        this.stringSeqGainBoost = this.audioContext.createGain();
        this.stringSeqGainBoost.gain.value = 5.0; // 5x boost to make audible
        
        this.stringSeqLfo.connect(this.stringSeqLfoGain);
        this.stringSeqLfo.start();
        
        // Create 4 paraphonic streams with enhanced processing
        // Create 4 paraphonic streams with enhanced processing
        this.stringSeqStreams = [];
        for (let i = 0; i < 4; i++) {
            const stream = {
                gainNode: this.audioContext.createGain(),
                envelopeGain: this.audioContext.createGain(),
                pitchNode: this.audioContext.createGain(),
                pitchNode: this.audioContext.createGain(),
                currentStep: i, // Offset each stream
                lastTriggerTime: 0
            };
            
            stream.gainNode.gain.value = 0.4; // Increased from 0.25
            stream.gainNode.gain.value = 0.4; // Increased from 0.25
            stream.envelopeGain.gain.value = 0;
            
            // Connect through gain boost
            // Connect through gain boost
            stream.gainNode.connect(stream.envelopeGain);
            stream.envelopeGain.connect(this.stringSeqGainBoost);
            
            stream.envelopeGain.connect(this.stringSeqGainBoost);
            
            this.stringSeqStreams.push(stream);
        }
        
        // Setup visualization canvas
        this.setupStringSeqVisualization();
    }

    setupStringSeqVisualization() {
        this.stringSeqCanvas = document.getElementById('stringSeqWave');
        if (this.stringSeqCanvas) {
            this.stringSeqCtx = this.stringSeqCanvas.getContext('2d');
            this.animateStringSeqWave();
        }
    }

    animateStringSeqWave() {
        if (!this.stringSeqCtx || !this.stringSeqEnabled) return;
        
        const canvas = this.stringSeqCanvas;
        const ctx = this.stringSeqCtx;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.stringSeqDepth > 0) {
            const time = this.audioContext.currentTime;
            const width = canvas.width;
            const height = canvas.height;
            const centerY = height / 2;
            
            ctx.strokeStyle = '#00ff41';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let x = 0; x < width; x++) {
                const t = (x / width) * 4 + time * this.stringSeqSpeed;
                let wave = Math.sin(t * Math.PI * 2);
                
                // Apply squeeze effect
                if (this.stringSeqSqueeze > 0) {
                    const squeeze = 1 + this.stringSeqSqueeze * 9; // 1-10x compression
                    wave = Math.tanh(wave * squeeze) / Math.tanh(squeeze);
                }
                
                const y = centerY + wave * (height * 0.3) * (this.stringSeqDepth / 100);
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
            
            // Add glow effect
            ctx.shadowColor = '#00ff41';
            ctx.shadowBlur = 4;
            ctx.stroke();
        }
        
        requestAnimationFrame(() => this.animateStringSeqWave());
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
        // Signal path: 
        // Grains → Filter → Vocoder → Wavefolder → Ring Mod → Spectral Freeze → Phaser → 3D Panner → Freq Shifter → Delay → Reverb → String Seq → Mute → Master
        
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
        // 3D panner to frequency shifter (with gain boost)
        this.pannerNode.connect(this.freqShifterDryNode);
        this.pannerNode.connect(this.freqShifterNode);
        this.freqShifterNode.connect(this.freqShifterGainBoost);
        this.freqShifterGainBoost.connect(this.freqShifterWetNode);
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
        
        // Final mix to string sequencer or directly to mute
        this.reverbDryNode.connect(this.muteGainNode);
        this.reverbWetNode.connect(this.muteGainNode);
        
        // Connect string sequencer streams if enabled (with gain boost)
        // Connect string sequencer streams if enabled (with gain boost)
        if (this.stringSeqEnabled && this.stringSeqStreams.length > 0) {
            this.stringSeqStreams.forEach(stream => {
                this.reverbDryNode.connect(stream.gainNode);
                this.reverbWetNode.connect(stream.gainNode);
                this.stringSeqGainBoost.connect(this.muteGainNode);
                this.stringSeqGainBoost.connect(this.muteGainNode);
            });
        }
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

    // ENHANCED: Added sine wave envelope function
    // ENHANCED: Added sine wave envelope function
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
                
            case 'sine': // NEW: Added sine wave envelope
                for (let i = 0; i < length; i++) {
                    const n = i / (length - 1);
                    envelope[i] = Math.sin(Math.PI * n);
                }
                break;
                
            case 'sine': // NEW: Added sine wave envelope
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
    
    // Reset function for new RESET button
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
        this.ringModSourceType = 'envelope'; // CHANGED
        this.ringModSourceType = 'envelope'; // CHANGED
        this.lfoShape = 'sine';
        this.isMuted = false;
        this.stringSeqEnabled = false;
        this.wrapEnabled = false;
        
        // Update UI elements
        document.querySelectorAll('.grain-shape-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.shape === 'blackman') {
                btn.classList.add('active');
            }
        });
        
        // CHANGED: Set envelope as default
        document.getElementById('ringModEnv').classList.add('active');
        document.getElementById('ringModNoise').classList.remove('active');
        // CHANGED: Set envelope as default
        document.getElementById('ringModEnv').classList.add('active');
        document.getElementById('ringModNoise').classList.remove('active');
        
        document.getElementById('lfoShape').value = 'sine';
        
        document.getElementById('muteButton').classList.remove('active');
        document.getElementById('stringSeqToggle').classList.remove('active');
        document.getElementById('wrapToggle').classList.remove('active');
        
        // Reset ring mod to envelope source
        this.switchRingModSource('envelope');
        // Reset ring mod to envelope source
        this.switchRingModSource('envelope');
        this.updateVolumeBoost();
        this.updateStringSequencer();
        
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
        } else {
            // Normal compression settings
            this.volumeBooster.threshold.value = -12;
            this.volumeBooster.ratio.value = 12;
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

    updatePhaser() {
        // Update phaser LFO rate
        this.phaserLfo.frequency.value = this.phaserRate;
        
        // Update phaser depth
        const depthAmount = (this.phaserDepth / 100) * 1000;
        if (this.phaserLfoGain) {
            this.phaserLfoGain.gain.value = depthAmount;
        }
        
        // Update gain with harmonic saturation at higher levels
        this.phaserGainNode.gain.value = this.phaserGain;
        if (this.phaserGain > 1.5) {
            // Enable harmonic saturation at higher gain levels
            this.phaserSaturation.curve = this.makeHarmonicSaturationCurve();
        }
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
    
    // ENHANCED: Improved frequency shifter with extended range
    // ENHANCED: Improved frequency shifter with extended range
    updateFreqShifter() {
        // Update frequency shift amount (-50 to +50 Hz)
        // Update frequency shift amount (-50 to +50 Hz)
        this.freqShifterOsc.frequency.value = this.freqShifterAmount;
        
        // Update mix with compensation for gain boost
        // Update mix with compensation for gain boost
        const mix = this.freqShifterMix / 100;
        this.freqShifterWetNode.gain.value = mix;
        this.freqShifterDryNode.gain.value = 1 - mix;
    }
    
    // ENHANCED: Fixed string sequencer to actually work
    // ENHANCED: Fixed string sequencer to actually work
    updateStringSequencer() {
        if (!this.stringSeqLfo) return;
        
        // Update LFO frequency
        this.stringSeqLfo.frequency.value = this.stringSeqSpeed;
        
        // Update depth (acts as on/off and intensity)
        this.stringSeqLfoGain.gain.value = this.stringSeqDepth / 100;
        
        // Process string sequencer if enabled and depth > 0
        if (this.stringSeqEnabled && this.stringSeqDepth > 0) {
            const now = this.audioContext.currentTime;
            
            this.stringSeqStreams.forEach((stream, streamIndex) => {
                // Check if it's time to trigger this stream
                const stepDuration = 1 / (this.stringSeqSpeed * 5); // 5 steps
                const timeSinceLastTrigger = now - stream.lastTriggerTime;
                
                if (timeSinceLastTrigger >= stepDuration) {
                    // Trigger envelope
                    const currentPitch = this.stringSeqPitches[stream.currentStep];
                    const pitchMultiplier = Math.pow(2, currentPitch / 12);
                    
                    // Apply squeezed sine LFO envelope
                    let envelopeValue = Math.sin(now * this.stringSeqSpeed * Math.PI * 2);
                    if (this.stringSeqSqueeze > 0) {
                        const squeeze = 1 + this.stringSeqSqueeze * 9;
                        envelopeValue = Math.tanh(envelopeValue * squeeze) / Math.tanh(squeeze);
                    }
                    
                    // Enhanced bow-like envelope with more pronounced attack
                    const attackTime = 0.005; // Faster attack
                    const releaseTime = stepDuration * 0.6; // Shorter sustain
                    const gainAmount = 0.8 * (this.stringSeqDepth / 100); // Increased gain
                    // Enhanced bow-like envelope with more pronounced attack
                    const attackTime = 0.005; // Faster attack
                    const releaseTime = stepDuration * 0.6; // Shorter sustain
                    const gainAmount = 0.8 * (this.stringSeqDepth / 100); // Increased gain
                    
                    stream.envelopeGain.gain.cancelScheduledValues(now);
                    stream.envelopeGain.gain.setValueAtTime(0, now);
                    stream.envelopeGain.gain.linearRampToValueAtTime(gainAmount, now + attackTime);
                    stream.envelopeGain.gain.linearRampToValueAtTime(gainAmount, now + attackTime);
                    stream.envelopeGain.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);
                    
                    // Advance to next step
                    stream.currentStep = (stream.currentStep + 1) % 5;
                    stream.lastTriggerTime = now;
                }
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
            y: Math.random() * this.grainCanvas.height,
            size: 2 + Math.random() * 4,
            opacity: 0.8,
            vx: (Math.random() - 0.5) * 2,
            vy: -1 - Math.random() * 2,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.02
        };
        
        this.grainParticles.push(particle);
        
        // Limit particle count
        if (this.grainParticles.length > 50) {
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
            
            // Update particle
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.opacity = particle.life * 0.8;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.grainParticles.splice(i, 1);
                continue;
            }
            
            // Draw smoky vapor effect
            this.grainCtx.save();
            this.grainCtx.globalAlpha = particle.opacity;
            this.grainCtx.fillStyle = '#00ff41';
            this.grainCtx.shadowColor = '#00ff41';
            this.grainCtx.shadowBlur = particle.size * 2;
            
            // Draw multiple overlapping circles for vapor effect
            for (let j = 0; j < 3; j++) {
                const offset = j * 2;
                this.grainCtx.beginPath();
                this.grainCtx.arc(
                    particle.x + offset, 
                    particle.y + offset, 
                    particle.size * (1 + j * 0.3), 
                    0, 
                    Math.PI * 2
                );
                this.grainCtx.fill();
            }
            
            this.grainCtx.restore();
        }
        
        requestAnimationFrame(() => this.animateGrains());
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
    this.updateWrapGlow(); // Update wrap glow
});

// New WRAP button
document.getElementById('wrapToggle').addEventListener('click', () => {
    this.wrapEnabled = !this.wrapEnabled;
    document.getElementById('wrapToggle').classList.toggle('active', this.wrapEnabled);
    this.updateWrapGlow(); // Update wrap glow
});
        
        // New RESET button
        document.getElementById('resetButton').addEventListener('click', () => {
            this.resetAllParameters();
        });
        
        // New MUTE button
        document.getElementById('muteButton').addEventListener('click', () => {
            this.toggleMute();
        });
        
        // CHANGED: Ring mod source buttons - default to envelope
        // CHANGED: Ring mod source buttons - default to envelope
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
        
        // ENHANCED: Grain shape buttons with new sine option
        // ENHANCED: Grain shape buttons with new sine option
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
        
        // String sequencer toggle
        document.getElementById('stringSeqToggle').addEventListener('click', () => {
            this.stringSeqEnabled = !this.stringSeqEnabled;
            document.getElementById('stringSeqToggle').classList.toggle('active', this.stringSeqEnabled);
            
            // Reinitialize string sequencer if needed
            if (this.stringSeqEnabled) {
                this.initStringSequencer();
                this.connectAudioNodes(); // Reconnect with string sequencer
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

            updateWrapGlow() {
            const wrapButton = document.getElementById('wrapToggle');
            if (this.looperEnabled && this.wrapEnabled) {
                wrapButton.classList.add('wrap-loop-active');
            } else {
                wrapButton.classList.remove('wrap-loop-active');
            }
        },
            
            // String Sequencer
            stringSeqSpeed: (val) => { 
                this.stringSeqSpeed = parseFloat(val);
                this.updateStringSequencer();
                document.getElementById('stringSeqSpeedValue').textContent = val + 'Hz';
            },
            stringSeqDepth: (val) => { 
                this.stringSeqDepth = parseInt(val);
                this.updateStringSequencer();
                document.getElementById('stringSeqDepthValue').textContent = val + '%';
            },
            stringSeqSqueeze: (val) => { 
                this.stringSeqSqueeze = parseInt(val) / 100;
                document.getElementById('stringSeqSqueezeValue').textContent = val + '%';
            },
            
            // String Sequencer Pitch Steps
            stringSeqStep1: (val) => { 
                this.stringSeqPitches[0] = parseInt(val);
                document.getElementById('stringSeqStep1Value').textContent = val;
            },
            stringSeqStep2: (val) => { 
                this.stringSeqPitches[1] = parseInt(val);
                document.getElementById('stringSeqStep2Value').textContent = val;
            },
            stringSeqStep3: (val) => { 
                this.stringSeqPitches[2] = parseInt(val);
                document.getElementById('stringSeqStep3Value').textContent = val;
            },
            stringSeqStep4: (val) => { 
                this.stringSeqPitches[3] = parseInt(val);
                document.getElementById('stringSeqStep4Value').textContent = val;
            },
            stringSeqStep5: (val) => { 
                this.stringSeqPitches[4] = parseInt(val);
                document.getElementById('stringSeqStep5Value').textContent = val;
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
            
            // M key - mute toggle
            if (key === 'meta' || key === 'control') {
                if (key === 'meta' && e.code === 'KeyM') {
                    e.preventDefault();
                    this.toggleMute();
                    return;
                }
            }
            
            // Number keys - scan position
            if (key >= '0' && key <= '9') {
                const position = key === '0' ? 0 : parseInt(key) / 9;
                this.setScanPosition(position);
                return;
            }
            
            // Arrow keys - fine navigation
            if (key === 'arrowleft') {
                e.preventDefault();
                this.fineScanBackward();
                return;
            }
            
            if (key === 'arrowright') {
                e.preventDefault();
                this.fineScanForward();
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
        
        // Arrow keys - fine navigation
        if (key === 'ArrowLeft') {
            this.fineScanBackward();
            return;
        }
        
        if (key === 'ArrowRight') {
            this.fineScanForward();
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
            
        } catch (error) {
            document.getElementById('status').textContent = 'Error loading audio file: ' + error.message;
        }
    }

    resizeGrainCanvas() {
        if (this.grainCanvas) {
            const rect = document.getElementById('waveform').getBoundingClientRect();
            this.grainCanvas.width = rect.width;
            this.grainCanvas.height = rect.height;
        }
    }
    
    // ENHANCED: Updated waveform colors
    // ENHANCED: Updated waveform colors
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
            
            // CHANGED: Draw waveform with new darker phosphor green
            ctx.strokeStyle = '#49ce6bff';
            // CHANGED: Draw waveform with new darker phosphor green
            ctx.strokeStyle = '#49ce6bff';
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
            
            // CHANGED: Add new phosphor glow effect
            ctx.shadowColor = '#53e778d8';
            // CHANGED: Add new phosphor glow effect
            ctx.shadowColor = '#53e778d8';
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

    fineScanBackward() {
        if (!this.audioBuffer) return;
        
        const fineIncrement = 0.01; // 1% increment
        const newPosition = Math.max(0, this.scanPosition - fineIncrement);
        this.setScanPosition(newPosition);
    }

    fineScanForward() {
        if (!this.audioBuffer) return;
        
        const fineIncrement = 0.01; // 1% increment
        const newPosition = Math.min(1, this.scanPosition + fineIncrement);
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
            
            // Add grain particle animation
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
        
        // Update display
        document.getElementById('activeGrains').textContent = this.grains.length;
        
        // REMOVED: Linear playhead movement - only update if looping is disabled and window scan is involved
        // The playhead now stays stationary unless manually moved with number keys or arrows
        // REMOVED: Linear playhead movement - only update if looping is disabled and window scan is involved
        // The playhead now stays stationary unless manually moved with number keys or arrows
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
            case 'sine': // NEW: Handle sine envelope
            case 'sine': // NEW: Handle sine envelope
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
     // Visual feedback
        const recordButton = document.getElementById('recordButton');
        recordButton.textContent = '✅ SAVED';
        setTimeout(() => {
        recordButton.textContent = '⬤ REC';
        recordButton.textContent = '⬤ REC';
        }, 2000);
            console.log('Recording saved');
        }
        }
        // Initialize the sampler when page loads
        document.addEventListener('DOMContentLoaded', () => {
        window.granularSampler = new GranularSampler();
        // CHANGED: Set default loop state to OFF
        const looperToggle = document.getElementById('looperToggle');
        if (looperToggle) {
            looperToggle.classList.remove('active'); // Remove active class for OFF state
        }
        // Set default wrap state to OFF
        const wrapToggle = document.getElementById('wrapToggle');
        if (wrapToggle) {
            wrapToggle.classList.remove('active'); // Remove active class for OFF state
        }

        // Handle window resize for grain canvas
        window.addEventListener('resize', () => {
            if (window.granularSampler && window.granularSampler.grainCanvas) {
                window.granularSampler.resizeGrainCanvas();
            }
        });
        });