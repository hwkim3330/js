/**
 * K-Driving-Sim Core Engine
 *
 * Babylon.js 기반 한국형 드라이빙 시뮬레이터 엔진
 * Claude AI가 완전히 이해하고 수정 가능한 구조로 설계
 */

import { Engine as BabylonEngine, Scene, WebGPUEngine } from '@babylonjs/core';

export interface EngineConfig {
  canvas: HTMLCanvasElement;
  useWebGPU?: boolean;
  antialias?: boolean;
  adaptToDeviceRatio?: boolean;
}

export class KDrivingEngine {
  private engine: BabylonEngine | WebGPUEngine;
  private scene: Scene | null = null;
  private canvas: HTMLCanvasElement;
  private isWebGPU: boolean = false;

  constructor(private config: EngineConfig) {
    this.canvas = config.canvas;
    this.engine = null!; // Will be initialized in init()
  }

  /**
   * 엔진 초기화
   * WebGPU 우선 시도, 실패시 WebGL 폴백
   */
  async init(): Promise<void> {
    if (this.config.useWebGPU !== false) {
      try {
        const webgpuEngine = new WebGPUEngine(this.canvas, {
          antialias: this.config.antialias ?? true,
          adaptToDeviceRatio: this.config.adaptToDeviceRatio ?? true
        });
        await webgpuEngine.initAsync();
        this.engine = webgpuEngine;
        this.isWebGPU = true;
        console.log('✅ WebGPU 엔진 초기화 성공');
      } catch (e) {
        console.warn('⚠️ WebGPU 사용 불가, WebGL로 폴백:', e);
      }
    }

    if (!this.engine) {
      this.engine = new BabylonEngine(this.canvas, this.config.antialias ?? true, {
        adaptToDeviceRatio: this.config.adaptToDeviceRatio ?? true
      });
      console.log('✅ WebGL 엔진 초기화 성공');
    }

    this.scene = new Scene(this.engine);

    // 윈도우 리사이즈 대응
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  /**
   * 현재 씬 반환
   */
  getScene(): Scene {
    if (!this.scene) {
      throw new Error('Engine not initialized. Call init() first.');
    }
    return this.scene;
  }

  /**
   * Babylon 엔진 인스턴스 반환
   */
  getBabylonEngine(): BabylonEngine | WebGPUEngine {
    return this.engine;
  }

  /**
   * WebGPU 사용 여부
   */
  isUsingWebGPU(): boolean {
    return this.isWebGPU;
  }

  /**
   * 렌더링 루프 시작
   */
  startRenderLoop(onFrame?: () => void): void {
    this.engine.runRenderLoop(() => {
      if (onFrame) onFrame();
      this.scene?.render();
    });
  }

  /**
   * 렌더링 루프 중지
   */
  stopRenderLoop(): void {
    this.engine.stopRenderLoop();
  }

  /**
   * 엔진 정리
   */
  dispose(): void {
    this.scene?.dispose();
    this.engine.dispose();
  }
}
