# GRAINS 



<br>

![image](Image/consoleIMG.png)<br>
*Granular Browser Sampler* <br>
- 
   

**Video Demo**<br>
[Youtube](https://youtu.be/ccXyPcyo36k?si=NmFD9c_f9ruhk9Om)
-

**Tools:**<br>
<span style="color:#008080;">Browser-based audio manipulation tool using WEB AUDIO API</span>

## Live Site Deployment:

http://browsergrains.surge.sh/

OR

https://kenneth-rakentine.github.io/Grains/
<br>
![screenshot](https://i.imgur.com/0AMXjDR.png)
<br>
<br>

## Instructions:<br>

> [!IMPORTANT]
> **ON MOBILE: TURN OFF SILENT MODE ON YOUR PHONE TO HEAR AUDIO PLAYBACK**

<br>
**CONTROLS**
(use keyboard or on-screen buttons)

1. Drop an audio file into the import window, or click inside to open file browser
2. Press [SPACEBAR] (or 'START' on-screen button) to begin audio playback
3. Use the numeric keys (0-9) to change the start position of the audio file and scan through the waveform manually
4. Use arrow keys (←/→) for fine position navigation
5. Press and hold the alphabetical keys to play the audio chromatically across 3 octaves:

**Q-P**: Upper octave<br>
**A-L**: Middle octave<br>
**Z-M**: Lower octave<br>


Use **RESET** button to restore all parameters to defaults<br>
Use **MUTE** button to toggle audio output<br>
Use **LOOP** button to enable/disable looping at current position<br>
Use **WARP** button to enable/disable micro-loop warping effect at current position<br>


### **RECORDING AUDIO**

- Load audio file and start playing with granular synthesis
- Press REC button (🔴) 
- Grind your sound into dust particles - everything you hear gets recorded in real-time
- Press STOP to finish recording
- File downloads automatically as grains_[timestamp].webm format
- Compatible with all modern browsers supporting WebM audio
- Use format conversion software or CloudConvert in your browser to convert .webm files to .mp3 for compatibility with other media players: https://cloudconvert.com/webm-to-mp3

<br>

## **PARAMETERS**

<br>

**GRANULAR ENGINE** 
<br>
Grain Size (10-200ms) - Length of each audio "grain" particle<br>
Density (1-16) - Number of simultaneous grains generated<br>
Window Scan (0-100%) - Random deviation range from start position<br>
Grain Shape - 5 envelope types: Blackman, Hanning, Down-Ramp, ExpoDec, Sine<br>
Time Stretch (0.1-4x) - Playback speed without pitch change<br>

**ARPEGGIATOR**
<br>
3x3 Grid - 9-step clickable pattern grid for arpeggio sequence<br> 
Scale Selection - Chromatic, Major, Minor, Dorian, Phrygian, Mixolydian<br>
Rate (0.5-20Hz) - Arpeggio clock speed driven by sine wave LFO<br>
Squeeze (0-100%) - LFO waveshaping for rhythmic timing variations<br>
START/STOP - Enable/disable arpeggiator (triggers when chromatic keys pressed)<br>

- Activate block to enable note per-scale<br> 
- Inactive blocks skip corresponding scale note<br>
- Active grid number dictates arp pattern length<br>
- Press letter key on keyboard OR on-screen chromatic letter buttons beneath oscilloscope to trigger root note arpeggiation through scale according to scale note-select grid<br>

**BANDPASS FILTER & LFO**
<br>
Frequency (100-8000Hz) - Resonant bandpass filter center frequency<br>
Resonance (0.1-3) - Filter resonance/bandwidth<br>
LFO Speed (0.1-10Hz) - Modulation rate for filter frequency<br>
LFO Depth (0-100%) - Modulation intensity<br>
LFO Shape - Sine, Triangle, Sawtooth, Square waveforms<br>

**NOTCH FILTER**
<br>
Filter Freq (100-8000Hz) - Notch filter center frequency<br>
Bandwidth (0.1-30) - Notch filter Q/bandwidth (most effective closer to 0%)<br>
Wet Mix (0-100%) - Notch filter effect blend<br>
LFO Rate (0.01-20Hz) - Filter frequency modulation rate<br>
LFO Depth (0-100%) - Filter frequency modulation depth<br>

**8-BAND VOCODER**
<br>
8 Frequency Bands - Individual gain control for 200Hz, 400Hz, 800Hz, 1.2kHz, 1.6kHz, 2.4kHz, 3.2kHz, 4.8kHz<br>
Vocoder Mix (0-100%) - Blend between dry and vocoded signal<br>

**WAVEFOLDER & RING MODULATOR**
<br>
Fold Amount (0-100%) - Harmonic distortion intensity<br>
Ring Mod Source - Oscillator, Noise, or Grains modulation<br>
Ring Mod Frequency (20-2000Hz) - Oscillator frequency for ring modulation<br>
Ring Mod Mix (0-100%) - Effect blend amount<br>


**SPECTRAL FREEZE & PHASER**
<br>
Freeze Amount (0-100%) - Spectral freezing intensity using delay feedback<br>
Spectral Resonance (0-100%) - Resonant filter coloration within freeze effect<br>
Phaser Rate (0.1-10Hz) - 12-stage phaser LFO speed<br>
Phaser Depth (0-100%) - Frequency sweep range<br>
Feedback (0-90%) - Phaser resonance amount<br>
Gain Boost (0.5-3x) - Output amplification with harmonic saturation<br>
Phaser Wet Mix (0-100%) - Phaser effect blend amount<br>

**CHROMATIC ENVELOPE**
<br>
5-Stage Envelope - Attack, Decay, Sustain, Release, and Hold parameters<br>
Loop Depth (0-100%) - Overall envelope modulation intensity<br>
Loop Rate - Frequency of looping envelope<br>
Loop OFF/ON - Enable/disable envelope looping<br>

**WARP MODULE**
<br>
WARP Toggle - Enable/disable high-frequency micro-loop effect<br>
Loop Rate (1-100Hz) - Micro-loop repetition speed<br>
Start Point (0-20ms) - Offset within micro-loop section<br>
Start LFO Speed (0.1-10Hz) - Start point modulation rate<br>
Start LFO Depth (0-100%) - Start point modulation intensity<br>
Loop Length (1-20ms) - Duration of micro-loop section<br>
Length LFO Speed (0.1-10Hz) - Loop length modulation rate<br>
Length LFO Depth (0-100%) - Loop length modulation intensity<br>

**3D PANNER & FREQUENCY SHIFTER**
<br>
X-Axis Depth (0-100%) - Horizontal movement range in binaural field<br>
Y-Axis Range (0-100%) - Vertical movement range<br>
Rotation Speed (0-5Hz) - 3D movement rate<br>
Frequency Shift (-50 to +50Hz) - Pitch shifting without time change<br>
Freq Shift Mix (0-100%) - Effect blend amount<br>

**PT2399 ANALOG DELAY**
<br>
Time (20-600ms) - Delay time with analog character<br>
Feedback (0-95%) - Delay regeneration amount<br>
Wow & Flutter (0-100%) - Vintage tape-style pitch modulation<br>
Lo-Fi Amount (0-100%) - High-frequency filtering for analog warmth<br>
Soft Clipping (0-100%) - Analog saturation on delay path<br>
Mix (0-100%) - Wet/dry balance<br>

**12-BIT REVERB**
<br>
Size (0-100%) - Virtual room size with early reflections<br>
Decay (0-100%) - Reverb tail length<br>
Pre-Delay (0-100ms) - Initial reflection delay<br>
Wet Gain (0.5-2x) - Reverb signal amplification<br>
Mix (0-100%) - Reverb blend amount<br>

**COMB FILTER SEQUENCER**
<br>
ON/OFF Toggle - Enable 5-stream comb filter sequencer<br>
Speed (0.5-20Hz) - Sequence clock rate<br>
Depth (0-100%) - Sequencer effect intensity<br>
Wet Mix (0-100%) - Wet/dry balance for comb filtering<br>
Squeeze (0-100%) - Waveform compression effect<br>
Soft Clip (0-100%) - Harmonic saturation for comb filters<br>
5-Step Sequence - Individual frequency control (100-2000Hz per step)<br>

**3-BAND ISOLATOR**
<br>
Low Band (20-300Hz) - Bass frequency isolation and gain control<br>
Mid Band (300-3kHz) - Midrange frequency isolation and gain control<br>
High Band (3kHz-20kHz) - Treble frequency isolation and gain control<br>

**LIQUEFIER FILTER**
<br>
Filter Freq (100-8000Hz) - Lowpass filter center frequency<br>
Resonance (0-100%) - Filter resonance/Q factor<br>
LFO Depth (0-100%) - Random frequency modulation intensity<br>
LFO Rate (0.1-20Hz) - Random modulation speed<br>
Wet Mix (0-100%) - Filter effect blend<br>
Smooth/Stepped - Choose between smooth or stepped random modulation (low frequency with higher resonance + increased random lfo modulation for watery motion-effect)<br>

**SPEED CONTROLS**
<br>
Grain Speed (0.1-4x) - Grain generation speed multiplier<br>
Loop Speed (0.1-4x) - Loop playback speed multiplier *(ONLY available when "LOOP" Button is activated)<br>
LOOP Button - Secondary loop toggle (synced with main LOOP button)<br>

**MASTER CONTROLS**
<br>
Master Volume (0-200%) - Can boost gain x2 past 100% with dynamic compression<br>
Preset Management - Save, load, and manage parameter presets<br>
Mobile Support - Touch-friendly on-screen keyboard for mobile devices<br>



<br>

## SIGNAL FLOW  
<span style="color:#008080;">GRAINS → ARPEGGIATOR → BANDPASS FILTER → NOTCH FILTER → VOCODER → WAVEFOLDER → RING MOD → SPECTRAL FREEZE → PHASER → WARP → 3D PANNER → FREQ SHIFTER → PT2399 → REVERB → COMB SEQ → CHROMATIC ENVELOPE → 3-BAND ISOLATOR → LIQUEFIER → OUTPUT</span>





## Credits:
Help from Claude Sonnet 4