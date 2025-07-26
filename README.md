# GRAINS 
**Granular Browser Sampler** 
<br>
![LOGO](https://kenneth-rakentine.github.io/Grains/grainsIMG.png)

- 
## Live Site Deployment:
https://kenneth-rakentine.github.io/Grains/

- 
## Instructions:
**CONTROLS**
(use keyboard or on-screen buttons)

1. Drop an mp3 file into the import window, or click inside to open file browser
2. Press [SPACEBAR] to begin audio playback
3. Use the numeric keys (0-9) to change the start position of the audio file and scan through the waveform manually
4. Use arrow keys (←/→) for fine position navigation
5. Press and hold the alphabetical keys to play the audio chromatically across 3 octaves:

**Q-P**: Upper octave
**A-L**: Middle octave
**Z-M**: Lower octave


Use **RESET** button to restore all parameters to defaults
Use **MUTE** button to toggle audio output
Use **LOOP** button to enable/disable looping at current position



### **RECORDING AUDIO**

- Load audio file and start playing with granular synthesis
- Press REC button (🔴) or R key
- Grind your sound into dust particles - everything you hear gets recorded in real-time
- Press STOP or R again to finish recording
- File downloads automatically as grains_[timestamp].webm format
- Compatible with all modern browsers supporting WebM audio



### **PARAMETERS**

- **Grain size** changes the length of each "Grain" particle of the audio clipGRANULAR ENGINE PARAMETERS

Grain Size (10-200ms) - Length of each audio "grain" particle
Density (1-16) - Number of simultaneous grains generated
Window Scan (0-100%) - Random deviation range from start position
Grain Shape - 5 envelope types: Blackman, Hanning, Down-Ramp, ExpoDec, Sine
Time Stretch (0.1-4x) - Playback speed without pitch change

**FILTER & LFO**

Frequency (100-8000Hz) - Resonant bandpass filter center frequency
Q Factor (0.1-10) - Filter resonance/bandwidth
LFO Speed (0.1-10Hz) - Modulation rate for filter frequency
LFO Depth (0-100%) - Modulation intensity
LFO Shape - Sine, Triangle, Sawtooth, Square waveforms

**8-BAND VOCODER**

8 Frequency Bands - Individual gain control for 200Hz, 400Hz, 800Hz, 1.2kHz, 1.6kHz, 2.4kHz, 3.2kHz, 4.8kHz
Vocoder Mix (0-100%) - Blend between dry and vocoded signal

**WAVEFOLDER & RING MODULATOR**

Fold Amount (0-100%) - Harmonic distortion intensity
Ring Mod Source - Noise or Envelope modulation
Ring Mod Mix (0-100%) - Effect blend amount
Envelope Speed (0.1-20Hz) - Ring modulator envelope rate

**SPECTRAL FREEZE & PHASER**

Freeze Amount (0-100%) - Spectral freezing intensity using delay feedback
Phaser Rate (0.1-10Hz) - 12-stage phaser LFO speed
Phaser Depth (0-100%) - Frequency sweep range
Feedback (0-90%) - Phaser resonance amount
Gain Boost (0.5-3x) - Output amplification with harmonic saturation

**3D PANNER & FREQUENCY SHIFTER**

X-Axis Depth (0-100%) - Horizontal movement range in binaural field
Y-Axis Range (0-100%) - Vertical movement range
Rotation Speed (0-5Hz) - 3D movement rate
Frequency Shift (-50 to +50Hz) - Pitch shifting without time change
Freq Shift Mix (0-100%) - Effect blend amount

**DELAY**

Time (10ms-5s) - Echo delay duration
Feedback (0-95%) - Echo regeneration amount
Soft Clip (0-100%) - Delay path saturation (careful with this saturation level in relation to the mix level below. can become very loud) *
Mix (0-100%) - Wet/dry balance

**12-BIT REVERB**

Size (0-100%) - Virtual room size with early reflections
Decay (0-100%) - Reverb tail length
Pre-Delay (0-100ms) - Initial reflection delay
Wet Gain (0.5-2x) - Reverb signal amplification
Mix (0-100%) - Reverb blend amount

**PARAPHONIC STRING SEQUENCER**

ON/OFF Toggle - Enable 4-stream paraphonic sequencer
Speed (0.5-20Hz) - Sequence clock rate
Depth (0-100%) - Sequencer effect intensity
Squeeze (0-100%) - Waveform compression for bow-like attack
5-Step Sequence - Individual pitch control (-12 to +12 semitones per step)

**MASTER CONTROLS**

Master Volume (0-200%) - Can boost gain x2 past 100% with dynamic compression
Mobile Support - Touch-friendly on-screen keyboard for mobile devices


- 

## SIGNAL FLOW
GRAINS → FILTER → VOCODER → WAVEFOLDER → RING MOD → SPECTRAL FREEZE → PHASER → 3D PANNER → FREQ SHIFTER → DELAY → REVERB → STRING SEQ → OUTPUT




## Credits:
Help from Claude Sonnet 4