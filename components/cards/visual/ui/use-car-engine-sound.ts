/* eslint-disable max-lines-per-function */
import {useEffect, useRef} from 'react'

export const useCarEngineSound = (
  enabled: boolean
): {
  updateEngineSound: (
    speedRatio: number,
    isThrottling: boolean,
    skidAmount?: number
  ) => void
} => {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const mainOscRef = useRef<OscillatorNode | null>(null)
  const gearOscRef = useRef<OscillatorNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)

  // ref for the sound of tires skidding
  const skidGainRef = useRef<GainNode | null>(null)
  const skidFilterRef = useRef<BiquadFilterNode | null>(null)
  const skidLfoRef = useRef<OscillatorNode | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const initAudio = (): void => {
      if (audioCtxRef.current) {
        if (audioCtxRef.current.state === 'suspended') {
          void audioCtxRef.current.resume()
        }
        return
      }

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as {webkitAudioContext: typeof AudioContext})
          .webkitAudioContext
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx

      // --- 1. THE SOUND OF THE ELECTRIC MOTOR ---
      const mainOsc = ctx.createOscillator()
      mainOsc.type = 'sawtooth'
      mainOsc.frequency.value = 38

      const gearOsc = ctx.createOscillator()
      gearOsc.type = 'triangle'
      gearOsc.frequency.value = 180

      const gearGain = ctx.createGain()
      gearGain.gain.value = 0.25

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 400
      filter.Q.value = 3

      const masterGain = ctx.createGain()
      masterGain.gain.value = 0

      mainOsc.connect(filter)
      gearOsc.connect(gearGain)
      gearGain.connect(filter)
      filter.connect(masterGain)
      masterGain.connect(ctx.destination)

      mainOsc.start()
      gearOsc.start()

      mainOscRef.current = mainOsc
      gearOscRef.current = gearOsc
      filterRef.current = filter
      masterGainRef.current = masterGain

      // --- 2. SOUND OF TIRES SPINNING / RUSTLING IN WAVES ---
      // generate 2 seconds of white noise into the buffer
      const bufferSize = ctx.sampleRate * 2
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
      }

      const whiteNoise = ctx.createBufferSource()
      whiteNoise.buffer = noiseBuffer
      whiteNoise.loop = true

      // a bandpass filter transforms the hissing sound into the sound of tires rubbing against asphalt or sand.
      const skidFilter = ctx.createBiquadFilter()
      skidFilter.type = 'bandpass'
      skidFilter.frequency.value = 100
      skidFilter.Q.value = 1.6

      // LFO (Low-Frequency Oscillator) node, to make the sound move in waves rather than as a continuous stream
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.45 // base pulsation amplitude

      const skidLfo = ctx.createOscillator()
      skidLfo.type = 'sine'
      skidLfo.frequency.value = 7 // 7 waves per second

      const lfoDepth = ctx.createGain()
      lfoDepth.gain.value = 0.55 // wave depth (varies from 0.3 to 1.0)

      // Overall wheelSpin volume (0.1 at rest)
      const skidGain = ctx.createGain()
      skidGain.gain.value = 0.1

      // connect the LFO to the pulse volume.
      skidLfo.connect(lfoDepth)
      lfoDepth.connect(lfoGain.gain)

      // connect noise -> filter -> waveform -> final volume -> speakers
      whiteNoise.connect(skidFilter)
      skidFilter.connect(lfoGain)
      lfoGain.connect(skidGain)
      skidGain.connect(ctx.destination)

      whiteNoise.start()
      skidLfo.start()

      skidGainRef.current = skidGain
      skidFilterRef.current = skidFilter
      skidLfoRef.current = skidLfo
    }

    window.addEventListener('keydown', initAudio, {once: true})
    window.addEventListener('pointerdown', initAudio, {once: true})

    return () => {
      window.removeEventListener('keydown', initAudio)
      window.removeEventListener('pointerdown', initAudio)
      if (audioCtxRef.current) {
        void audioCtxRef.current.close()
        audioCtxRef.current = null
      }
    }
  }, [enabled])

  // motor + skid intensity (skidAmount: 0..1)
  const updateEngineSound = (
    speedRatio: number,
    isThrottling: boolean,
    skidAmount = 0
  ): void => {
    const ctx = audioCtxRef.current
    const mainOsc = mainOscRef.current
    const gearOsc = gearOscRef.current
    const filter = filterRef.current
    const masterGain = masterGainRef.current
    const skidGain = skidGainRef.current
    const skidFilter = skidFilterRef.current
    const skidLfo = skidLfoRef.current

    if (!ctx || !mainOsc || !gearOsc || !filter || !masterGain) {
      return
    }

    const now = ctx.currentTime
    const clampedRatio = Math.max(0, Math.min(1, speedRatio))
    const clampedSkid = Math.max(0, Math.min(1, skidAmount))

    // a slow, deep, wave-like hum at maximum speed
    const highSpeedFactor = Math.max(0, (clampedRatio - 0.65) / 0.35)

    // two slow waves (1.4 Hz and 0.65 Hz) that overlap, creating an uneven, deep undulation
    const slowWave1 = Math.sin(now * Math.PI * 2 * 1.4) * 6.5
    const slowWave2 = Math.sin(now * Math.PI * 2 * 0.65) * 4.0
    const engineFlutter = (slowWave1 + slowWave2) * highSpeedFactor

    // smooth transition during gear shifting (~60% speed)
    const gearShiftDip =
      clampedRatio > 0.55 && clampedRatio < 0.68
        ? -14 * Math.sin(((clampedRatio - 0.55) / 0.13) * Math.PI)
        : 0

    const wheelSpinBoost = clampedSkid * 22

    // baritone range: from 38 Hz to ~135 Hz + deep wave (±10.5 Hz)
    const targetMainFreq =
      38 + clampedRatio * 197 + wheelSpinBoost + engineFlutter + gearShiftDip

    const targetGearFreq = targetMainFreq * 6.0

    // deep, synchronous filter "breathing" (opening and muting the baritone in a wave-like motion)
    const filterWobble =
      Math.sin(now * Math.PI * 2 * 1.4) * 400 * highSpeedFactor
    const targetFilterFreq = 220 + clampedRatio * 2060 + filterWobble

    // if the machine has already reached maximum speed (> 92%), we turn down the hum a little.
    const cruisingReduction = clampedRatio > 0.92 ? 0.78 : 1.0

    const baseVolume = clampedRatio > 0.01 ? 0.02 + clampedRatio * 0.01 : 0
    const targetVolume =
      (isThrottling ? baseVolume * 1.2 : baseVolume) * cruisingReduction

    mainOsc.frequency.setTargetAtTime(targetMainFreq, now, 0.05)
    gearOsc.frequency.setTargetAtTime(targetGearFreq, now, 0.05)
    filter.frequency.setTargetAtTime(targetFilterFreq, now, 0.05)
    masterGain.gain.setTargetAtTime(targetVolume, now, 0.08)

    // sound of slipping in waves
    if (skidGain && skidFilter && skidLfo) {
      // Noise volume (quiet and pleasant, up to 0.06)
      // 1. targetSkidVol: controls volume (0.032 — quiet; 0.015 — barely audible).
      const targetSkidVol = clampedSkid > 0.05 ? clampedSkid * 0.032 : 0
      // 2. ticking rate (number of beats per second: currently 5.5 to 10.5 Hz)
      const targetLfoFreq = 5.5 + clampedSkid * 5
      // 3. pitch (lower = a duller ticking sound, higher = a sharper, whistling sound)
      const targetSkidFreq = 650 + clampedSkid * 350

      skidGain.gain.setTargetAtTime(targetSkidVol, now, 0.06)
      skidLfo.frequency.setTargetAtTime(targetLfoFreq, now, 0.1)
      skidFilter.frequency.setTargetAtTime(targetSkidFreq, now, 0.08)
    }
  }

  return {updateEngineSound}
}
