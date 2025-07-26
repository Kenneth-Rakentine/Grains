# GRAINS 
**Granular Browser Sampler** 
<br>
![LOGO](https://kenneth-rakentine.github.io/Grains/grainsIMG.png)

### Tools:
Browser-based audio manipulation tool using WEB AUDIO API
- 
## Live Site Deployment:

http://browsergrains.surge.sh/

OR

https://kenneth-rakentine.github.io/Grains/

- 
## Instructions:
**CONTROLS**
(use keyboard or on-screen buttons)

1. Drop an audio file into the import window, or click inside to open file browser
2. Press [SPACEBAR] to begin audio playback
3. Use the numeric keys (0-9) to change the start position of the audio file and scan through the waveform manually
4. Use arrow keys (←/→) for fine position navigation
5. Press and hold the alphabetical keys to play the audio chromatically across 3 octaves:

**Q-P**: Upper octave<br>
**A-L**: Middle octave<br>
**Z-M**: Lower octave<br>


Use **RESET** button to restore all parameters to defaults<br>
Use **MUTE** button to toggle audio output<br>
Use **LOOP** button to enable/disable looping at current position<br>
Use **WRAP** button to lock in a stationary micro-loop within current playhead position [only works when LOOP is enabled]<br>


### **RECORDING AUDIO**

- Load audio file and start playing with granular synthesis
- Press REC button (🔴) or R key
- Grind your sound into dust particles - everything you hear gets recorded in real-time
- Press STOP or R again to finish recording
- File downloads automatically as grains_[timestamp].webm format
- Compatible with all modern browsers supporting WebM audio



### **PARAMETERS**

**GRANULAR ENGINE** 
<br>
Grain Size (10-200ms) - Length of each audio "grain" particle<br>
Density (1-16) - Number of simultaneous grains generated<br>
Window Scan (0-100%) - Random deviation range from start position<br>
Grain Shape - 5 envelope types: Blackman, Hanning, Down-Ramp, ExpoDec, Sine<br>
Time Stretch (0.1-4x) - Playback speed without pitch change<br>

**FILTER & LFO**
<br>
Frequency (100-8000Hz) - Resonant bandpass filter center frequency<br>
Q Factor (0.1-10) - Filter resonance/bandwidth<br>
LFO Speed (0.1-10Hz) - Modulation rate for filter frequency<br>
LFO Depth (0-100%) - Modulation intensity<br>
LFO Shape - Sine, Triangle, Sawtooth, Square waveforms<br>

**8-BAND VOCODER**
<br>
8 Frequency Bands - Individual gain control for 200Hz, 400Hz, 800Hz, 1.2kHz, 1.6kHz, 2.4kHz, 3.2kHz, 4.8kHz<br>
Vocoder Mix (0-100%) - Blend between dry and vocoded signal<br>

**WAVEFOLDER & RING MODULATOR**
<br>
Fold Amount (0-100%) - Harmonic distortion intensity<br>
Ring Mod Source - Noise or Envelope modulation<br>
Ring Mod Mix (0-100%) - Effect blend amount<br>
Envelope Speed (0.1-20Hz) - Ring modulator envelope rate<br>

**SPECTRAL FREEZE & PHASER**
<br>
Freeze Amount (0-100%) - Spectral freezing intensity using delay feedback<br>
Phaser Rate (0.1-10Hz) - 12-stage phaser LFO speed<br>
Phaser Depth (0-100%) - Frequency sweep range<br>
Feedback (0-90%) - Phaser resonance amount<br>
Gain Boost (0.5-3x) - Output amplification with harmonic saturation<br>

**3D PANNER & FREQUENCY SHIFTER**
<br>
X-Axis Depth (0-100%) - Horizontal movement range in binaural field<br>
Y-Axis Range (0-100%) - Vertical movement range<br>
Rotation Speed (0-5Hz) - 3D movement rate<br>
Frequency Shift (-50 to +50Hz) - Pitch shifting without time change<br>
Freq Shift Mix (0-100%) - Effect blend amount<br>

**DELAY**
<br>
Time (10ms-5s) - Echo delay duration<br>
Feedback (0-95%) - Echo regeneration amount<br>
Soft Clip (0-100%) - Delay path saturation (careful with this saturation level in relation to the mix level below. can become very loud) *<br>
Mix (0-100%) - Wet/dry balance<br>

**12-BIT REVERB**
<br>
Size (0-100%) - Virtual room size with early reflections<br>
Decay (0-100%) - Reverb tail length<br>
Pre-Delay (0-100ms) - Initial reflection delay<br>
Wet Gain (0.5-2x) - Reverb signal amplification<br>
Mix (0-100%) - Reverb blend amount<br>

**PARAPHONIC STRING SEQUENCER**
<br>
ON/OFF Toggle - Enable 4-stream paraphonic sequencer<br>
Speed (0.5-20Hz) - Sequence clock rate<br>
Depth (0-100%) - Sequencer effect intensity<br>
Squeeze (0-100%) - Waveform compression for bow-like attack<br>
5-Step Sequence - Individual pitch control (-12 to +12 semitones per step)<br>

**MASTER CONTROLS**
<br>
Master Volume (0-200%) - Can boost gain x2 past 100% with dynamic compression<br>
Mobile Support - Touch-friendly on-screen keyboard for mobile devices<br>


- 

## SIGNAL FLOW
GRAINS → FILTER → VOCODER → WAVEFOLDER → RING MOD → SPECTRAL FREEZE → PHASER → 3D PANNER → FREQ SHIFTER → DELAY → REVERB → STRING SEQ → OUTPUT




## Credits:
Help from Claude Sonnet 4
