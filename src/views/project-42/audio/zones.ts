/* eslint-disable @typescript-eslint/no-explicit-any */

const CHORDS = {
  void: ['F1', 'C2'],
  earth: ['F2', 'A2', 'C3', 'E3'], // Fmaj7
  bio1: ['D3', 'F3', 'A3', 'C4'], // Dm7
  bio2: ['Bb3', 'D4', 'F4', 'A4'], // Bbmaj7
  bio3: ['C3', 'E3', 'G3', 'B3'], // Cmaj7
  bio4: ['A3', 'C4', 'E4', 'G4'], // Am7
  digital1: ['D3', 'F3', 'Ab3', 'C4'], // Dm7b5
  digital2: ['F3', 'Ab3', 'C4', 'Eb4'], // Fm7
  merge: ['D3', 'F3', 'A3', 'C4', 'E4'], // Dm9
  soul: ['D2'],
}

const ARP_VOID = ['F2', 'C3', 'F3', 'G3', 'C4']
const ARP_DIGITAL = ['D3', 'F3', 'Ab3', 'C4', 'Ab3', 'F3']
const ARP_MERGE = ['D3', 'A3', 'E4', 'A3', 'D4', 'F4']

let _lastEarthIndex = -1
let _lastBioIndex = -1
let _lastDigitalIndex = -1
let _lastMergeIndex = -1
let _lastSoulIndex = -1

let _chordLock = false
let _droneStarted = false
let _lastArpId = ''
let _arpInterval: ReturnType<typeof setInterval> | null = null
let _lastMasterVol = -999

function setMasterVol(instruments: any, vol: number) {
  if (!instruments.masterVol?.volume) return
  if (Math.abs(_lastMasterVol - vol) < 0.2) return
  instruments.masterVol.volume.rampTo(vol, 0.1)
  _lastMasterVol = vol
}

export function stopArp() {
  if (_arpInterval) {
    clearInterval(_arpInterval)
    _arpInterval = null
    _lastArpId = ''
  }
}

function startArp(
  instruments: any,
  Tone: any,
  notes: string[],
  bpm = 300,
  velocity = 0.15,
  id = '',
) {
  if (id && id === _lastArpId) return

  if (_arpInterval) {
    clearInterval(_arpInterval)
    _arpInterval = null
  }
  _lastArpId = id

  let i = 0
  _arpInterval = setInterval(
    () => {
      const note = notes[i % notes.length]
      if (note) instruments.arpeggio?.triggerAttackRelease(note, '16n', Tone.now(), velocity)
      i++
    },
    (60 / bpm) * 1000,
  )
}

function playChord(instruments: any, Tone: any, notes: string[], duration = '2n', velocity = 0.4) {
  if (_chordLock) return
  _chordLock = true
  notes.forEach((note, i) => {
    setTimeout(() => {
      instruments.pad?.triggerAttackRelease(note, duration, Tone.now(), velocity)
    }, i * 30)
  })
  setTimeout(() => {
    _chordLock = false
  }, 400)
}

export const updateAudioZones = (progress: number, instruments: any, Tone: any) => {
  if (!instruments) return

  if (progress >= 0 && progress < 20.0) {
    if (Tone.Transport.state !== 'started') Tone.Transport.start()
    if (!_droneStarted) {
      instruments.cosmicDrone?.triggerAttack('F1')
      instruments.sweep?.triggerAttack('C2')
      startArp(instruments, Tone, ARP_VOID, 180, 0.08, 'void-arp')
      _droneStarted = true
    }
    const vol = -25 + (progress / 20.0) * 15
    setMasterVol(instruments, vol)
  }

  if (progress >= 20.0 && progress < 24.5) {
    const tension = (progress - 20.0) / 4.5
    setMasterVol(instruments, -10 + tension * 5)
    instruments.cosmicDrone?.detune?.rampTo?.(tension * 100, 0.05)
    const pulseTick = Math.floor(progress * 4) % 2
    if (pulseTick === 0 && !instruments._pulseLock) {
      instruments.pulseBass?.triggerAttackRelease('F1', '16n', Tone.now(), 0.3 * tension)
      instruments._pulseLock = true
      setTimeout(() => {
        instruments._pulseLock = false
      }, 200)
    }
  }

  const isBang = progress >= 24.5 && progress < 25.5
  if (isBang && !instruments._bangTriggered) {
    stopArp()
    instruments.cosmicDrone?.releaseAll()
    instruments.sweep?.triggerRelease()
    _droneStarted = false
    instruments.shatterNoise?.triggerAttackRelease('8n')
    instruments.pad?.triggerAttackRelease('F1', '2n', Tone.now(), 1.0)
    setTimeout(() => {
      instruments.pad?.triggerAttackRelease('C2', '1n', Tone.now(), 0.5)
    }, 150)
    setTimeout(() => {
      instruments.pad?.triggerAttackRelease('F4', '2n', Tone.now(), 0.25)
      instruments.arpeggio?.triggerAttackRelease('C5', '8n', Tone.now(), 0.3)
    }, 300)
    setTimeout(() => {
      instruments.arpeggio?.triggerAttackRelease('F5', '8n', Tone.now(), 0.2)
    }, 500)
    instruments._bangTriggered = true
  }
  if (progress < 20.0) instruments._bangTriggered = false

  if (progress >= 25.5 && progress < 45.0) {
    const decay = (progress - 25.5) / 19.5
    setMasterVol(instruments, -5 - decay * 13)
    const shockTick = Math.floor(progress * 3) % 7
    if (shockTick === 0 && !instruments._shockLock) {
      const shockNotes = ['F3', 'C4', 'Ab4', 'F4']
      const n = shockNotes[Math.floor(progress) % shockNotes.length]
      if (n) instruments.arpeggio?.triggerAttackRelease(n, '16n', Tone.now(), 0.12)
      instruments._shockLock = true
      setTimeout(() => {
        instruments._shockLock = false
      }, 300)
    }
  }

  const earthProgress = Math.floor((progress - 45) / 8)
  if (progress >= 45.0 && progress < 62.0 && earthProgress !== _lastEarthIndex) {
    _lastEarthIndex = earthProgress
    instruments.cosmicDrone?.releaseAll()
    instruments.sweep?.triggerRelease()
    _droneStarted = false

    setMasterVol(instruments, -18)
    playChord(instruments, Tone, CHORDS.earth, '1n', 0.35)
    if (earthProgress === 0) instruments.sweep?.triggerAttack('F2')
  }

  if (progress >= 62.0 && progress < 62.5 && _lastEarthIndex !== -1) {
    instruments.sweep?.triggerRelease()
    instruments.cosmicDrone?.releaseAll()
    instruments.pad?.releaseAll()
    _droneStarted = false
  }

  const bioChords = [CHORDS.bio1, CHORDS.bio2, CHORDS.bio3, CHORDS.bio4]
  const bioProgress = Math.floor((progress - 62) / 12)
  if (progress >= 62.0 && progress < 95.0 && bioProgress !== _lastBioIndex) {
    _lastBioIndex = bioProgress
    instruments.cosmicDrone?.releaseAll()
    instruments.sweep?.triggerRelease()
    _droneStarted = false

    const chord = bioChords[bioProgress % bioChords.length]
    if (chord) {
      const currentIdx = bioProgress
      chord.forEach((note, i) => {
        setTimeout(() => {
          if (_lastBioIndex === currentIdx) {
            if (progress >= 95.0 && progress < 95.5) {
              instruments.bioPad?.releaseAll()
            }
          }
        }, i * 30)
      })
      if (bioProgress % 3 === 0) {
        const arpNotes = chord.map((n) => n.replace(/(\d)$/, (m) => String(parseInt(m) + 1)))
        startArp(instruments, Tone, arpNotes, 240, 0.1, `bio-arp-${bioProgress % 3}`)
      }
    }
  }

  if (progress >= 95.0 && progress < 105.0) {
    if (!instruments._dnaShatterTriggered) {
      stopArp()
      instruments.shatterNoise?.triggerAttackRelease('16n')
      setTimeout(() => {
        instruments.arpeggio?.triggerAttackRelease('D4', '8n', Tone.now(), 0.12)
      }, 200)
      instruments._dnaShatterTriggered = true
    }
    const scatter = (progress - 95.0) / 10.0
    setMasterVol(instruments, -18 - scatter * 4)
  }
  if (progress < 93.0) instruments._dnaShatterTriggered = false

  if (progress >= 105.0 && progress < 230.0) {
    const drift = (progress - 105.0) / 125.0
    setMasterVol(instruments, -14 - drift * 6)

    if (progress >= 125.0 && !instruments._atgcSnapTriggered) {
      instruments.digitalCrystal?.triggerAttackRelease('A4', '8n', Tone.now(), 0.35)
      setTimeout(
        () => instruments.digitalCrystal?.triggerAttackRelease('C4', '8n', Tone.now(), 0.28),
        80,
      )
      setTimeout(
        () => instruments.digitalCrystal?.triggerAttackRelease('G4', '8n', Tone.now(), 0.22),
        160,
      )
      setTimeout(
        () => instruments.digitalCrystal?.triggerAttackRelease('F4', '8n', Tone.now(), 0.18),
        240,
      )
      instruments._atgcSnapTriggered = true
    }
    if (progress < 123.0) instruments._atgcSnapTriggered = false

    const driftTick = Math.floor(progress / 6)
    if (driftTick !== _lastBioIndex) {
      _lastBioIndex = driftTick
      const driftNotes = ['D3', 'A3', 'F3', 'A4', 'C4', 'G4']
      const n = driftNotes[driftTick % driftNotes.length]
      if (n) instruments.bioPad?.triggerAttackRelease(n, '2n', Tone.now(), 0.2 * (1 - drift * 0.5))
      if (progress >= 230.0 && progress < 230.5) {
        instruments.bioPad?.releaseAll()
      }
    }
  }

  if (progress >= 210.0 && progress < 230.0) {
    const coldness = (progress - 210.0) / 20.0
    setMasterVol(instruments, -18 - coldness * 5)
    if (coldness > 0.5) stopArp()
  }

  const digital8AProgress = Math.floor((progress - 230) / 10)
  if (progress >= 230.0 && progress < 300.0 && digital8AProgress !== _lastDigitalIndex) {
    _lastDigitalIndex = digital8AProgress
    instruments.pad?.releaseAll()
    const chord = digital8AProgress % 2 === 0 ? CHORDS.digital1 : CHORDS.digital2
    chord.forEach((note, i) => {
      setTimeout(() => {
        if (_lastDigitalIndex === digital8AProgress)
          instruments.pad?.triggerAttackRelease(note, '2n', Tone.now(), 0.22)
      }, i * 40)
    })
    if (digital8AProgress % 3 === 0) {
      startArp(instruments, Tone, ['D4', 'F4', 'Ab4', 'C5'], 200, 0.1, `8a-${digital8AProgress}`)
    }
    setMasterVol(instruments, -18)
  }

  const digital8BProgress = Math.floor((progress - 300) / 15)
  if (progress >= 300.0 && progress < 345.0 && digital8BProgress !== _lastDigitalIndex) {
    _lastDigitalIndex = digital8BProgress
    instruments.pad?.releaseAll()
    const chord = digital8BProgress % 2 === 0 ? CHORDS.digital2 : CHORDS.digital1
    chord.forEach((note, i) => {
      setTimeout(() => {
        if (_lastDigitalIndex === digital8BProgress)
          instruments.pad?.triggerAttackRelease(note, '2n', Tone.now(), 0.28)
      }, i * 30)
    })
    if (digital8BProgress % 2 === 0) {
      startArp(instruments, Tone, ARP_DIGITAL, 360, 0.12, `8b-${digital8BProgress}`)
    }
    const pluck8B = ['D5', 'Ab5', 'F5', 'C6'][digital8BProgress % 4]
    if (pluck8B) {
      setTimeout(() => {
        if (_lastDigitalIndex === digital8BProgress)
          instruments.digitalCrystal?.triggerAttackRelease(pluck8B, '16n', Tone.now(), 0.18)
      }, 350)
    }
    instruments.pulseBass?.triggerAttackRelease('D2', '8n', Tone.now(), 0.25)
    setMasterVol(instruments, -14)
  }

  const digital8CProgress = Math.floor((progress - 345) / 12)
  if (progress >= 345.0 && progress < 405.0 && digital8CProgress !== _lastDigitalIndex) {
    _lastDigitalIndex = digital8CProgress
    instruments.pad?.releaseAll()
    const cubeChords = [
      ['D3', 'F3', 'Ab3', 'C4'], // Dm7b5
      ['Bb3', 'D4', 'F4', 'A4'], // Bbmaj7
      ['F3', 'Ab3', 'C4', 'Eb4'], // Fm7
      ['Eb3', 'G3', 'Bb3', 'D4'], // Ebmaj7
    ]
    const chord = cubeChords[digital8CProgress % 4]
    if (chord) {
      chord.forEach((note, i) => {
        setTimeout(() => {
          if (_lastDigitalIndex === digital8CProgress)
            instruments.pad?.triggerAttackRelease(note, '1n', Tone.now(), 0.25)
        }, i * 20)
      })
    }
    instruments.pulseBass?.triggerAttackRelease('F1', '8n', Tone.now(), 0.25)
    stopArp()
    setMasterVol(instruments, -12)
  }

  const digital8DProgress = Math.floor((progress - 405) / 10)
  if (progress >= 405.0 && progress < 535.0 && digital8DProgress !== _lastDigitalIndex) {
    _lastDigitalIndex = digital8DProgress
    instruments.pad?.releaseAll()
    if (!instruments._cubeShatterTriggered) {
      instruments.shatterNoise?.triggerAttackRelease('16n')
      instruments.pad?.triggerAttackRelease('F1', '4n', Tone.now(), 0.6)
      setTimeout(() => {
        instruments.arpeggio?.triggerAttackRelease('C5', '8n', Tone.now(), 0.25)
      }, 100)
      setTimeout(() => {
        instruments.arpeggio?.triggerAttackRelease('Ab5', '8n', Tone.now(), 0.2)
      }, 220)
      instruments._cubeShatterTriggered = true
    }
    const dnaDigitalArp = ['D4', 'F4', 'Ab4', 'C5', 'Eb5', 'F5']
    if (digital8DProgress % 2 === 0) {
      startArp(instruments, Tone, dnaDigitalArp, 420, 0.14, `8d-${digital8DProgress}`)
    }
    const pluck8D = ['D6', 'F6', 'Ab5', 'C6'][digital8DProgress % 4]
    if (pluck8D) {
      setTimeout(() => {
        if (_lastDigitalIndex === digital8DProgress)
          instruments.digitalCrystal?.triggerAttackRelease(pluck8D, '32n', Tone.now(), 0.15)
      }, 300)
    }
    setMasterVol(instruments, -15)
  }
  if (progress < 403.0) instruments._cubeShatterTriggered = false

  if (!instruments._collisionTriggered && progress >= 535.0) {
    stopArp()
    instruments.pad?.releaseAll()
    instruments.shatterNoise?.triggerAttackRelease('8n') // Heavy impact
    instruments.pad?.triggerAttackRelease('D2', '4n', Tone.now(), 0.8)
    setTimeout(() => {
      instruments.pad?.triggerAttackRelease('F4', '4n', Tone.now(), 0.5)
      instruments.arpeggio?.triggerAttackRelease('D6', '8n', Tone.now(), 0.3)
    }, 80)
    setTimeout(() => {
      instruments.arpeggio?.triggerAttackRelease('Ab5', '8n', Tone.now(), 0.25)
      instruments.digitalCrystal?.triggerAttackRelease('F6', '16n', Tone.now(), 0.2)
    }, 160)
    setTimeout(() => {
      instruments.digitalCrystal?.triggerAttackRelease('C6', '16n', Tone.now(), 0.15)
    }, 280)
    instruments._collisionTriggered = true
  }
  if (progress < 533.0) instruments._collisionTriggered = false

  const mergeProgress = Math.floor((progress - 555) / 10)
  if (progress >= 555.0 && progress < 585.0 && mergeProgress !== _lastMergeIndex) {
    _lastMergeIndex = mergeProgress
    instruments.pad?.releaseAll()
    playChord(instruments, Tone, CHORDS.merge, '1n', 0.35)
    setTimeout(() => {
      instruments.digitalCrystal?.triggerAttackRelease('D5', '8n', Tone.now(), 0.15)
    }, 200)
    if (mergeProgress % 2 === 0) {
      startArp(instruments, Tone, ARP_MERGE, 300, 0.13, 'merge-arp')
    }
    if (mergeProgress === 0) {
      instruments.sweep?.triggerAttackRelease('D3', '8n')
    }
  }

  if (!instruments._mergeUnifiedTriggered && progress >= 585.0) {
    stopArp()
    instruments.pad?.releaseAll()
    // Dm9 full resolve
    ;['D3', 'F3', 'A3', 'C4', 'E4'].forEach((note, i) => {
      setTimeout(() => {
        instruments.pad?.triggerAttackRelease(note, '1n', Tone.now(), 0.3)
      }, i * 40)
    })
    // Restore bioPad warmth
    setTimeout(() => {
      instruments.bioPad?.triggerAttackRelease('D4', '2n', Tone.now(), 0.2)
    }, 300)
    setTimeout(() => {
      instruments.bioPad?.triggerAttackRelease('A4', '2n', Tone.now(), 0.15)
    }, 600)
    // Slow breathing arp
    startArp(instruments, Tone, ['D4', 'A4', 'F4', 'E4'], 180, 0.1, 'unified-arp')
    setMasterVol(instruments, -14)
    instruments._mergeUnifiedTriggered = true
  }
  if (progress < 583.0) instruments._mergeUnifiedTriggered = false

  if (progress >= 665.0 && progress < 665.5) {
    instruments.sweep?.triggerRelease()
    instruments.pad?.releaseAll()
    stopArp()
  }

  if (progress >= 665.0 && progress < 900.0) {
    const dissolve = (progress - 665.0) / 235.0
    setMasterVol(instruments, -14 - dissolve * 8)
    if (dissolve > 0.3) stopArp()

    // Sparse pad triggers
    const soulTrigger = Math.floor(progress / 35)
    if (soulTrigger !== _lastSoulIndex) {
      _lastSoulIndex = soulTrigger
      instruments.pad?.releaseAll()
      instruments.pad?.triggerAttackRelease('D2', '1n', Tone.now(), 0.12 - dissolve * 0.08)
    }

    // Neosoul piano - slow, emotional cadence
    // Dm9 voicing: D - F - A - E - C - A - F (9th E adds neosoul color)
    const pianoSeq = ['D4', 'F4', 'A4', 'E5', 'C5', 'A4', 'F4']
    // 1 note every 8 units — cinematic pacing
    const pianoTick = Math.floor(progress / 8)
    if (pianoTick !== instruments._pianoTick) {
      instruments._pianoTick = pianoTick
      // Cinematic rhythm pattern — Play Play Rest Play Play Rest Rest Play
      const pattern = [1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0]
      const shouldPlay = pattern[pianoTick % pattern.length] === 1
      if (shouldPlay) {
        const note = pianoSeq[pianoTick % pianoSeq.length]
        // Dynamic velocity — first chord notes lighter, middle accents
        const accentMap = [0.08, 0.06, 0.1, 0.07, 0.09, 0.05, 0.07]
        const vel = (accentMap[pianoTick % accentMap.length] ?? 0.07) * (1 - dissolve * 0.4)
        if (note)
          instruments.piano?.triggerAttackRelease(note, '4n', Tone.now(), Math.max(vel, 0.03))
      }
    }
  }

  if (progress >= 900.0 && progress < 1060.0) {
    stopArp()
    const soul = (progress - 900.0) / 160.0

    if (instruments.masterVol?.volume) instruments.masterVol.volume.value = -24 + soul * 20

    if (soul > 0.6) {
      const padTick = Math.floor(progress / 20)
      if (padTick !== _lastSoulIndex) {
        _lastSoulIndex = padTick
        instruments.pad?.releaseAll()
        instruments.pad?.triggerAttackRelease('D3', '1n', Tone.now(), 0.1 + soul * 0.15)
      }
    }

    const tickInterval = soul < 0.3 ? 10 : soul < 0.7 ? 6 : 3
    const pianoTick = Math.floor(progress / tickInterval)

    if (pianoTick !== instruments._pianoTick) {
      instruments._pianoTick = pianoTick

      const melodyFull = [
        'D4',
        'F4',
        'A4',
        'C5',
        'E5',
        'C5',
        'A4',
        'F4',
        'A4',
        'C5',
        'E5',
        'F5',
        'E5',
        'C5',
        'A4',
        'F4',
        'D4',
        'F4',
        'A4',
        'C5',
      ]

      const seqPhase1 = ['D4', 'F4', 'A4', 'F4', 'D4', 'A3']
      const seqPhase2 = ['D4', 'F4', 'A4', 'C5', 'A4', 'F4', 'E5', 'C5']
      const seqPhase3 = melodyFull

      const seq = soul < 0.3 ? seqPhase1 : soul < 0.7 ? seqPhase2 : seqPhase3

      const p1 = [1, 0, 1, 0, 0, 1, 0, 1, 0, 0]
      const p2 = [1, 1, 0, 1, 1, 0, 1, 0, 1, 1]
      const p3 = [1, 1, 1, 0, 1, 1, 1, 1, 0, 1]
      const pattern = soul < 0.3 ? p1 : soul < 0.7 ? p2 : p3
      const shouldPlay = pattern[pianoTick % pattern.length] === 1

      if (shouldPlay) {
        const note = seq[pianoTick % seq.length]
        const vel =
          soul < 0.3
            ? 0.08 + soul * 0.1
            : soul < 0.7
              ? 0.12 + soul * 0.15
              : 0.22 + (soul - 0.7) * 0.5
        if (note)
          instruments.piano?.triggerAttackRelease(note, '8n', Tone.now(), Math.min(vel, 0.4))

        if (soul > 0.75 && pianoTick % 4 === 0) {
          setTimeout(() => {
            if (_lastSoulIndex !== -1) {
              instruments.piano?.triggerAttackRelease('D3', '4n', Tone.now(), 0.2)
            }
          }, 30)
        }
      }
    }
  }

  const is42 = progress >= 1060.0 && progress < 1060.5
  if (is42 && !instruments._42Triggered) {
    instruments.pad?.triggerAttackRelease('D2', '2n', Tone.now(), 0.08)
    setTimeout(() => {
      instruments.arpeggio?.triggerAttackRelease('D5', '4n', Tone.now(), 0.06)
    }, 500)

    setTimeout(() => {
      instruments.piano?.triggerAttackRelease('D3', '1n', Tone.now(), 0.05)
    }, 1200)
    setTimeout(() => {
      instruments.piano?.triggerAttackRelease('A3', '1n', Tone.now(), 0.035)
    }, 3000)

    instruments._42Triggered = true
  }
  if (progress < 1058.0) instruments._42Triggered = false

  if (progress >= 1120.0) {
    stopArp()
    setMasterVol(instruments, -45)
  }
}

export const resetZonesState = (instruments: any = null) => {
  _lastEarthIndex = -1
  _lastBioIndex = -1
  _lastDigitalIndex = -1
  _lastMergeIndex = -1
  _lastSoulIndex = -1
  _chordLock = false
  _droneStarted = false
  _lastArpId = ''
  _lastMasterVol = -999
  if (instruments?.masterVol) instruments.masterVol.volume.value = -100
  stopArp()
}
