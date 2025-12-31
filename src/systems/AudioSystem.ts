/**
 * AudioSystem - 오디오 시스템
 *
 * 게임 사운드 관리
 * - 엔진 사운드 (RPM 기반)
 * - 환경음 (비, 바람, 도시)
 * - 효과음 (경적, 충돌, 브레이크)
 * - BGM
 */

import { GameWorld, ISystem } from '../core/GameWorld';

interface SoundConfig {
  url: string;
  volume: number;
  loop: boolean;
  spatial?: boolean;
}

interface EngineSound {
  idle: AudioBufferSourceNode | null;
  low: AudioBufferSourceNode | null;
  mid: AudioBufferSourceNode | null;
  high: AudioBufferSourceNode | null;
}

export class AudioSystem implements ISystem {
  name = 'AudioSystem';
  priority = 50;

  private world!: GameWorld;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // 볼륨 설정
  private volumes = {
    master: 0.8,
    engine: 0.6,
    effects: 0.7,
    ambient: 0.4,
    music: 0.3
  };

  // 오디오 버퍼 캐시
  private buffers: Map<string, AudioBuffer> = new Map();

  // 현재 재생 중인 사운드
  private engineSounds: EngineSound = {
    idle: null,
    low: null,
    mid: null,
    high: null
  };

  private ambientSound: AudioBufferSourceNode | null = null;
  private musicSource: AudioBufferSourceNode | null = null;

  private currentRPM: number = 800;
  private isEnabled: boolean = true;

  async init(world: GameWorld): Promise<void> {
    this.world = world;

    // 사용자 상호작용 후 오디오 컨텍스트 생성
    const initAudio = async () => {
      if (this.audioContext) return;

      try {
        this.audioContext = new AudioContext();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = this.volumes.master;

        // 엔진 사운드 생성 (합성)
        this.createSynthEngineSound();

        console.log('🔊 Audio context initialized');
      } catch (e) {
        console.warn('⚠️ Audio initialization failed:', e);
      }
    };

    // 클릭 시 오디오 초기화
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    console.log('🔊 Audio system ready (waiting for user interaction)');
  }

  /**
   * 합성 엔진 사운드 생성
   * Web Audio API로 엔진 사운드 시뮬레이션
   */
  private createSynthEngineSound(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;

    // 기본 엔진 톤 생성
    const createEngineTone = (frequency: number, gain: number): OscillatorNode => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = frequency;

      gainNode.gain.value = gain * this.volumes.engine;

      osc.connect(gainNode);
      gainNode.connect(this.masterGain!);

      return osc;
    };

    // 다양한 주파수의 오실레이터로 엔진음 시뮬레이션
    // 실제 구현에서는 샘플 기반이 더 좋음
  }

  update(deltaTime: number): void {
    if (!this.isEnabled || !this.audioContext) return;

    // 엔진 사운드 업데이트는 외부에서 setEngineRPM 호출로 처리
  }

  /**
   * 엔진 RPM 설정 (사운드 피치 조절)
   */
  setEngineRPM(rpm: number): void {
    this.currentRPM = rpm;

    if (!this.audioContext) return;

    // RPM에 따른 피치 계산
    // const pitch = 0.5 + (rpm / 7000) * 1.5;
    // 실제로는 더 복잡한 사운드 블렌딩 필요
  }

  /**
   * 효과음 재생
   */
  playEffect(name: string, volume: number = 1): void {
    if (!this.audioContext || !this.masterGain) return;

    // 간단한 효과음 합성
    const ctx = this.audioContext;

    switch (name) {
      case 'horn':
        this.playHorn();
        break;
      case 'brake':
        this.playBrakeSound();
        break;
      case 'collision':
        this.playCollisionSound();
        break;
      case 'gear_shift':
        this.playGearShiftSound();
        break;
    }
  }

  private playHorn(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = 400;

    gain.gain.setValueAtTime(0.3 * this.volumes.effects, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }

  private playBrakeSound(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;

    // 브레이크 끼익 소리 (노이즈 + 하이패스)
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    gain.gain.value = 0.2 * this.volumes.effects;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
  }

  private playCollisionSound(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;

    // 충돌음 (노이즈 버스트)
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 10);
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    gain.gain.value = 0.5 * this.volumes.effects;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
  }

  private playGearShiftSound(): void {
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1 * this.volumes.effects, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  /**
   * 환경음 설정
   */
  setAmbient(type: 'city' | 'rain' | 'wind' | 'none'): void {
    // 환경음 전환
    // 실제로는 오디오 파일 필요
    console.log(`🔊 Ambient: ${type}`);
  }

  /**
   * 볼륨 설정
   */
  setVolume(category: keyof typeof this.volumes, value: number): void {
    this.volumes[category] = Math.max(0, Math.min(1, value));

    if (category === 'master' && this.masterGain) {
      this.masterGain.gain.value = value;
    }
  }

  /**
   * 음소거 토글
   */
  toggleMute(): void {
    this.isEnabled = !this.isEnabled;

    if (this.masterGain) {
      this.masterGain.gain.value = this.isEnabled ? this.volumes.master : 0;
    }
  }

  dispose(): void {
    this.audioContext?.close();
  }
}
