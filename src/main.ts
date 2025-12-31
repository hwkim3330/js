/**
 * K-Driving-Sim 메인 엔트리 포인트
 *
 * 한국형 드라이빙 시뮬레이터
 * CARLA 스타일 + 실제 한국 지도 + 한국 자동차
 */

import { Vector3, HemisphericLight, DirectionalLight, Color3 } from '@babylonjs/core';
import { KDrivingEngine } from './core/Engine';
import { InputManager } from './core/InputManager';
import { CameraController } from './core/CameraController';
import { Vehicle, KOREAN_VEHICLES } from './physics/VehiclePhysics';
import { KoreaMapLoader, KOREA_REGIONS } from './maps/KoreaMapLoader';

// UI 요소
interface GameUI {
  speedometer: HTMLElement | null;
  tachometer: HTMLElement | null;
  gearIndicator: HTMLElement | null;
  mapInfo: HTMLElement | null;
  vehicleInfo: HTMLElement | null;
}

class KDrivingSim {
  private engine: KDrivingEngine | null = null;
  private inputManager: InputManager | null = null;
  private cameraController: CameraController | null = null;
  private mapLoader: KoreaMapLoader | null = null;

  private currentVehicle: Vehicle | null = null;
  private ui: GameUI;

  private lastTime: number = 0;
  private isRunning: boolean = false;

  constructor() {
    this.ui = {
      speedometer: document.getElementById('speedometer'),
      tachometer: document.getElementById('tachometer'),
      gearIndicator: document.getElementById('gear'),
      mapInfo: document.getElementById('map-info'),
      vehicleInfo: document.getElementById('vehicle-info')
    };
  }

  async init(): Promise<void> {
    console.log('🚗 K-Driving-Sim 초기화 중...');

    // 캔버스 가져오기
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // 엔진 초기화
    this.engine = new KDrivingEngine({
      canvas,
      useWebGPU: true,
      antialias: true
    });
    await this.engine.init();

    const scene = this.engine.getScene();

    // 조명 설정
    const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
    ambient.intensity = 0.6;

    const sun = new DirectionalLight('sun', new Vector3(-1, -2, -1), scene);
    sun.intensity = 0.8;
    sun.diffuse = new Color3(1, 0.95, 0.8);

    // 입력 관리자
    this.inputManager = new InputManager();

    // 카메라
    this.cameraController = new CameraController(scene, canvas);

    // 맵 로더
    this.mapLoader = new KoreaMapLoader(scene);

    // 기본 맵 로드 (강남역)
    await this.loadMap('seoul-gangnam');

    // 기본 차량 생성 (쏘나타)
    await this.spawnVehicle('hyundai-sonata');

    // 키보드 단축키
    this.setupHotkeys();

    console.log('✅ K-Driving-Sim 초기화 완료!');
    this.showWelcome();
  }

  private async loadMap(regionKey: string): Promise<void> {
    console.log(`🗺️ Loading map: ${regionKey}`);

    const mapData = await this.mapLoader!.loadRegion(regionKey, 500);
    this.mapLoader!.renderMap(mapData);

    const region = KOREA_REGIONS[regionKey as keyof typeof KOREA_REGIONS];
    if (this.ui.mapInfo) {
      this.ui.mapInfo.textContent = `📍 ${region?.name || regionKey}`;
    }
  }

  private async spawnVehicle(vehicleKey: string): Promise<void> {
    const spec = KOREAN_VEHICLES[vehicleKey];
    if (!spec) {
      console.error(`Unknown vehicle: ${vehicleKey}`);
      return;
    }

    console.log(`🚗 Spawning vehicle: ${spec.brand} ${spec.name}`);

    this.currentVehicle = new Vehicle(spec);
    await this.currentVehicle.spawn(
      this.engine!.getScene(),
      new Vector3(0, 1, 0)
    );

    // 카메라 타겟 설정
    const mesh = this.currentVehicle.getMesh();
    if (mesh) {
      this.cameraController!.setTarget(mesh);
    }

    if (this.ui.vehicleInfo) {
      this.ui.vehicleInfo.textContent = `${spec.brand} ${spec.name}`;
    }
  }

  private setupHotkeys(): void {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'Digit1':
          this.cameraController?.setMode('chase');
          break;
        case 'Digit2':
          this.cameraController?.setMode('cockpit');
          break;
        case 'Digit3':
          this.cameraController?.setMode('free');
          break;
        case 'Digit4':
          this.cameraController?.setMode('top');
          break;
        case 'KeyR':
          // 차량 리셋
          this.resetVehicle();
          break;
        case 'KeyM':
          // 맵 메뉴 (나중에 구현)
          this.showMapMenu();
          break;
        case 'KeyN':
          // 차량 메뉴 (나중에 구현)
          this.showVehicleMenu();
          break;
      }
    });
  }

  private resetVehicle(): void {
    const mesh = this.currentVehicle?.getMesh();
    if (mesh) {
      mesh.position = new Vector3(0, 1, 0);
      mesh.rotation = Vector3.Zero();
    }
  }

  private showMapMenu(): void {
    console.log('Available maps:', Object.keys(KOREA_REGIONS));
  }

  private showVehicleMenu(): void {
    console.log('Available vehicles:', Object.keys(KOREAN_VEHICLES));
  }

  private showWelcome(): void {
    console.log(`
╔═══════════════════════════════════════════╗
║         K-Driving-Sim v0.1.0              ║
║     한국형 드라이빙 시뮬레이터            ║
╠═══════════════════════════════════════════╣
║  조작법:                                  ║
║  W/↑ - 가속    S/↓ - 브레이크             ║
║  A/← - 좌회전  D/→ - 우회전               ║
║  Space - 핸드브레이크                     ║
║  E/Shift - 기어 업  Q/Ctrl - 기어 다운    ║
║                                           ║
║  카메라:                                  ║
║  1 - 추적  2 - 콕핏  3 - 자유  4 - 탑뷰   ║
║                                           ║
║  R - 차량 리셋                            ║
║  M - 맵 선택  N - 차량 선택               ║
╚═══════════════════════════════════════════╝
    `);
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();

    this.engine!.startRenderLoop(() => this.gameLoop());
    console.log('🎮 Game started!');
  }

  private gameLoop(): void {
    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // 입력 업데이트
    this.inputManager!.update();
    const input = this.inputManager!.getState();

    // 차량 입력 적용
    if (this.currentVehicle) {
      this.currentVehicle.setThrottle(input.throttle);
      this.currentVehicle.setBrake(input.brake);
      this.currentVehicle.setSteering(input.steering);
      this.currentVehicle.setHandbrake(input.handbrake);

      if (input.shiftUp) this.currentVehicle.shiftUp();
      if (input.shiftDown) this.currentVehicle.shiftDown();

      // 차량 물리 업데이트
      this.currentVehicle.update(deltaTime);

      // UI 업데이트
      this.updateUI();
    }

    // 카메라 업데이트
    this.cameraController!.update();
  }

  private updateUI(): void {
    if (!this.currentVehicle) return;

    const state = this.currentVehicle.getState();

    if (this.ui.speedometer) {
      this.ui.speedometer.textContent = `${Math.round(state.speed)} km/h`;
    }

    if (this.ui.tachometer) {
      this.ui.tachometer.textContent = `${Math.round(state.rpm)} RPM`;
    }

    if (this.ui.gearIndicator) {
      const gearText = state.gear === 0 ? 'R' : state.gear.toString();
      this.ui.gearIndicator.textContent = gearText;
    }
  }

  stop(): void {
    this.isRunning = false;
    this.engine?.stopRenderLoop();
  }

  dispose(): void {
    this.stop();
    this.inputManager?.dispose();
    this.cameraController?.dispose();
    this.engine?.dispose();
  }
}

// 앱 시작
const app = new KDrivingSim();

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await app.init();
    app.start();
  } catch (error) {
    console.error('Failed to start K-Driving-Sim:', error);
  }
});

// 전역 접근용 (디버깅)
(window as any).kdrivingSim = app;
