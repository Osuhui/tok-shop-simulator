// ============================================================
// 音频管理器（程序化合成，无需任何二进制音频资源）
// - 音效(SFX)：用 Web Audio 振荡器实时合成，零资源依赖
// - 背景音乐(BGM)：轻量程序化环境音 pad（慢速 LFO 呼吸感）
// 全部在浏览器端懒初始化；受自动播放策略限制，首次用户手势后才会出声。
// ============================================================

export type SfxName =
  | 'click'
  | 'coin'
  | 'levelUp'
  | 'achievement'
  | 'event'
  | 'error'
  | 'warning'
  | 'success'
  | 'victory';

interface AudioPrefs {
  sfxEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicNodes: AudioNode[] = [];

  sfxEnabled = true;
  musicEnabled = false;
  sfxVolume = 0.7;
  musicVolume = 0.5;

  /** 懒创建 AudioContext，并注册首次手势恢复监听（绕过自动播放限制） */
  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxVolume;
      this.sfxBus.connect(this.master);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicVolume;
      this.musicBus.connect(this.master);

      const resume = () => this.ctx?.resume().catch(() => {});
      document.addEventListener('pointerdown', resume);
      document.addEventListener('keydown', resume);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  /** 应用用户设置（音量 / 开关），并据此启停 BGM */
  configure(p: AudioPrefs): void {
    this.sfxEnabled = p.sfxEnabled;
    this.musicEnabled = p.musicEnabled;
    this.sfxVolume = p.sfxVolume;
    this.musicVolume = p.musicVolume;
    if (this.sfxBus && this.ctx) this.sfxBus.gain.value = this.sfxVolume;
    if (this.musicBus && this.ctx) this.musicBus.gain.value = this.musicVolume;
    if (this.musicEnabled) this.startMusic();
    else this.stopMusic();
  }

  playSfx(name: SfxName): void {
    if (!this.sfxEnabled) return;
    const ctx = this.ensure();
    if (!ctx || !this.sfxBus) return;
    const now = ctx.currentTime;

    const tone = (
      freq: number,
      start: number,
      dur: number,
      type: OscillatorType,
      peak = 0.5,
    ) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);
      g.gain.setValueAtTime(0.0001, now + start);
      g.gain.exponentialRampToValueAtTime(peak, now + start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(g);
      g.connect(this.sfxBus!);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    };

    switch (name) {
      case 'click':
        tone(660, 0, 0.05, 'square', 0.22);
        break;
      case 'coin':
        tone(1318.5, 0, 0.07, 'sine', 0.4);
        tone(1760, 0.05, 0.09, 'sine', 0.38);
        break;
      case 'levelUp':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.08, 0.12, 'triangle', 0.4));
        break;
      case 'achievement':
        [659.25, 830.6, 1318.5].forEach((f, i) => tone(f, i * 0.1, 0.18, 'sine', 0.4));
        break;
      case 'event':
        tone(330, 0, 0.18, 'triangle', 0.4);
        tone(440, 0.12, 0.18, 'triangle', 0.3);
        break;
      case 'warning':
        tone(440, 0, 0.12, 'triangle', 0.32);
        tone(330, 0.1, 0.16, 'triangle', 0.28);
        break;
      case 'error':
        tone(220, 0, 0.15, 'sawtooth', 0.35);
        tone(110, 0.1, 0.22, 'sawtooth', 0.3);
        break;
      case 'success':
        tone(880, 0, 0.1, 'sine', 0.4);
        tone(1174.7, 0.06, 0.12, 'sine', 0.38);
        break;
      case 'victory':
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
          tone(f, i * 0.12, 0.3, 'triangle', 0.45),
        );
        break;
    }
  }

  /** 启动程序化环境音（A 大调柔和 pad + 慢速 LFO 呼吸） */
  startMusic(): void {
    const ctx = this.ensure();
    if (!ctx || !this.musicBus || this.musicNodes.length) return;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 850;
    filter.connect(this.musicBus);

    const tremolo = ctx.createGain();
    tremolo.gain.value = 0.5;
    tremolo.connect(filter);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.12;
    lfo.connect(lfoGain);
    lfoGain.connect(tremolo.gain);
    lfo.start();

    // A2 / E3 / A3 / C#4 —— 温暖的大三和弦铺底
    [110, 164.81, 220, 277.18].forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.12;
      osc.connect(g);
      g.connect(tremolo);
      osc.start();
      this.musicNodes.push(osc, g);
    });

    this.musicNodes.push(filter, tremolo, lfo, lfoGain);
  }

  stopMusic(): void {
    for (const n of this.musicNodes) {
      if ('stop' in n && typeof (n as OscillatorNode).stop === 'function') {
        try {
          (n as OscillatorNode).stop();
        } catch {
          /* already stopped */
        }
      }
      try {
        n.disconnect();
      } catch {
        /* ignore */
      }
    }
    this.musicNodes = [];
  }
}

export const audioManager = new AudioManager();
