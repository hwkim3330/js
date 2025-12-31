/**
 * K-Driving-Sim v0.3.0
 *
 * 한국형 드라이빙 시뮬레이터
 * - 고품질 절차적 그래픽
 * - 실제 한국 지도
 * - 21종 한국 자동차
 */

import { Vector3, TransformNode } from '@babylonjs/core';
import { KDrivingEngine } from './core/Engine';
import { GameWorld } from './core/GameWorld';
import { InputManager } from './core/InputManager';
import { CameraController } from './core/CameraController';
import { Vehicle, KOREAN_VEHICLES } from './physics/VehiclePhysics';

// 시스템
import { WeatherSystem } from './systems/WeatherSystem';
import { TrafficSystem } from './systems/TrafficSystem';
import { AudioSystem } from './systems/AudioSystem';

// 그래픽
import { MapRenderer } from './graphics/MapRenderer';

// UI
import { HUD } from './ui/HUD';
import { Minimap } from './ui/Minimap';

// 데이터
import { ALL_VEHICLES, getVehicleById } from './data/KoreanVehicles';
import { ALL_MAPS, getMapById, MapRegion, GANGNAM_MAP } from './data/PrebuiltMaps';

class KDrivingSim {
  private engine: KDrivingEngine | null = null;
  private world: GameWorld | null = null;
  private inputManager: InputManager | null = null;
  private cameraController: CameraController | null = null;

  // 그래픽
  private mapRenderer: MapRenderer | null = null;
  private playerVehicleModel: TransformNode | null = null;

  // 시스템
  private weatherSystem: WeatherSystem | null = null;
  private trafficSystem: TrafficSystem | null = null;
  private audioSystem: AudioSystem | null = null;

  // UI
  private hud: HUD | null = null;
  private minimap: Minimap | null = null;

  // 게임 상태
  private currentVehicle: Vehicle | null = null;
  private currentMap: MapRegion | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  async init(): Promise<void> {
    console.log('🚗 K-Driving-Sim v0.3.0 초기화 중...');

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

    // GameWorld 생성
    this.world = new GameWorld(scene);

    // 그래픽 시스템 (맵 렌더러)
    this.mapRenderer = new MapRenderer(scene);

    // 게임 시스템 등록
    this.weatherSystem = new WeatherSystem();
    this.trafficSystem = new TrafficSystem();
    this.audioSystem = new AudioSystem();

    this.world.registerSystem(this.weatherSystem);
    this.world.registerSystem(this.trafficSystem);
    this.world.registerSystem(this.audioSystem);

    await this.world.initSystems();

    // 입력 관리자
    this.inputManager = new InputManager();

    // 카메라
    this.cameraController = new CameraController(scene, canvas);

    // HUD
    this.hud = new HUD();

    // 미니맵
    const minimapContainer = document.getElementById('minimap');
    if (minimapContainer) {
      this.minimap = new Minimap({
        container: minimapContainer,
        size: 180,
        zoom: 0.3
      });
    }

    // 기본 맵 로드
    await this.loadMap('seoul-gangnam');

    // 기본 차량 생성
    await this.spawnVehicle('hyundai-sonata-dn8');

    // 단축키 설정
    this.setupHotkeys();

    // 로딩 화면 숨기기
    this.hud.hideLoading();

    console.log('✅ K-Driving-Sim 초기화 완료!');
    this.hud.notify('게임이 시작되었습니다!', 'success');
    this.showWelcome();
  }

  private async loadMap(mapId: string): Promise<void> {
    console.log(`🗺️ Loading map: ${mapId}`);

    const mapData = getMapById(mapId) || GANGNAM_MAP;
    this.currentMap = mapData;

    // 고품질 맵 렌더링
    this.mapRenderer!.renderMap(mapData);

    // 스카이박스 시간 설정
    this.mapRenderer!.setSkyboxTime(12);

    // HUD 업데이트
    this.hud?.updateEnvironment({
      time: 12,
      weather: 'clear',
      location: mapData.name
    });

    // 미니맵 도로 설정
    if (this.minimap) {
      const minimapRoads = mapData.roads.map(r => ({
        x1: r.points[0].x,
        z1: r.points[0].z,
        x2: r.points[r.points.length - 1].x,
        z2: r.points[r.points.length - 1].z,
        width: r.width
      }));
      this.minimap.setRoads(minimapRoads);
    }

    this.hud?.notify(`${mapData.name} 맵 로드 완료`, 'info');
  }

  private async spawnVehicle(vehicleId: string): Promise<void> {
    const vehicleSpec = getVehicleById(vehicleId);
    const legacySpec = KOREAN_VEHICLES['hyundai-sonata'];

    const spec = legacySpec || {
      name: vehicleSpec?.name || '쏘나타',
      brand: vehicleSpec?.brand || '현대',
      model: vehicleSpec?.model || 'DN8',
      mass: vehicleSpec?.mass || 1515,
      length: (vehicleSpec?.length || 4900) / 1000,
      width: (vehicleSpec?.width || 1860) / 1000,
      height: (vehicleSpec?.height || 1445) / 1000,
      wheelBase: (vehicleSpec?.wheelBase || 2840) / 1000,
      trackWidth: 1.6,
      maxPower: vehicleSpec?.maxPower || 140,
      maxTorque: vehicleSpec?.maxTorque || 179,
      maxRPM: 6000,
      idleRPM: 800,
      gearRatios: [-3.2, 4.2, 2.6, 1.8, 1.4, 1.0, 0.77, 0.64],
      finalDriveRatio: 3.5,
      transmissionType: 'auto' as const,
      tireRadius: vehicleSpec?.tireRadius || 0.34,
      tireWidth: 235,
      gripCoefficient: 1.0,
      dragCoefficient: vehicleSpec?.dragCoefficient || 0.27,
      frontalArea: vehicleSpec?.frontalArea || 2.25,
      suspensionStiffness: 35000,
      suspensionDamping: 4500,
      suspensionTravel: 0.2
    };

    console.log(`🚗 Spawning: ${spec.brand} ${spec.name}`);

    // 물리 차량 생성
    this.currentVehicle = new Vehicle(spec);

    const spawnPoint = this.currentMap?.spawnPoints[0] || { x: 0, z: 0, rotation: 0 };

    await this.currentVehicle.spawn(
      this.engine!.getScene(),
      new Vector3(spawnPoint.x, 1, spawnPoint.z)
    );

    // 기존 박스 메시 숨기기
    const physicsMesh = this.currentVehicle.getMesh();
    if (physicsMesh) {
      physicsMesh.isVisible = false;
      physicsMesh.rotation.y = spawnPoint.rotation || 0;
    }

    // 고품질 차량 모델 생성
    this.playerVehicleModel = this.mapRenderer!.createPlayerVehicle(vehicleId, 'car_white');
    this.playerVehicleModel.position = new Vector3(spawnPoint.x, 0, spawnPoint.z);
    this.playerVehicleModel.rotation.y = spawnPoint.rotation || 0;

    // 카메라 타겟 설정
    if (physicsMesh) {
      this.cameraController!.setTarget(physicsMesh);
    }

    this.hud?.notify(`${spec.brand} ${spec.name} 스폰`, 'success');
  }

  private setupHotkeys(): void {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'Digit1':
          this.cameraController?.setMode('chase');
          this.hud?.updateCameraMode('chase');
          break;
        case 'Digit2':
          this.cameraController?.setMode('cockpit');
          this.hud?.updateCameraMode('cockpit');
          break;
        case 'Digit3':
          this.cameraController?.setMode('free');
          this.hud?.updateCameraMode('free');
          break;
        case 'Digit4':
          this.cameraController?.setMode('top');
          this.hud?.updateCameraMode('top');
          break;
        case 'KeyR':
          this.resetVehicle();
          break;
        case 'KeyH':
          this.audioSystem?.playEffect('horn');
          break;
        case 'KeyM':
          this.showMapMenu();
          break;
        case 'KeyN':
          this.showVehicleMenu();
          break;
        case 'KeyF':
          this.cycleWeather();
          break;
        case 'KeyT':
          this.cycleTime();
          break;
        case 'Escape':
        case 'KeyP':
          this.togglePause();
          break;
      }
    });
  }

  private resetVehicle(): void {
    const spawnPoint = this.currentMap?.spawnPoints[0] || { x: 0, z: 0, rotation: 0 };
    const physicsMesh = this.currentVehicle?.getMesh();

    if (physicsMesh) {
      physicsMesh.position = new Vector3(spawnPoint.x, 1, spawnPoint.z);
      physicsMesh.rotation = new Vector3(0, spawnPoint.rotation || 0, 0);
    }

    if (this.playerVehicleModel) {
      this.playerVehicleModel.position = new Vector3(spawnPoint.x, 0, spawnPoint.z);
      this.playerVehicleModel.rotation.y = spawnPoint.rotation || 0;
    }

    this.hud?.notify('차량 리셋', 'info');
  }

  private showMapMenu(): void {
    console.log('Available maps:', ALL_MAPS.map(m => `${m.name} (${m.id})`));
    this.hud?.notify('M: 맵 선택 (콘솔 참조)', 'info');
  }

  private showVehicleMenu(): void {
    console.log('Available vehicles:', ALL_VEHICLES.slice(0, 10).map(v => `${v.brand} ${v.name} (${v.id})`));
    this.hud?.notify('N: 차량 선택 (콘솔 참조)', 'info');
  }

  private cycleWeather(): void {
    const weathers: Array<'clear' | 'cloudy' | 'rain' | 'snow' | 'fog'> = ['clear', 'cloudy', 'rain', 'snow', 'fog'];
    const current = this.weatherSystem?.getWeather().type || 'clear';
    const idx = weathers.indexOf(current as any);
    const next = weathers[(idx + 1) % weathers.length];

    this.weatherSystem?.setWeather(next, 0.7);

    const names: Record<string, string> = {
      'clear': '맑음', 'cloudy': '흐림', 'rain': '비', 'snow': '눈', 'fog': '안개'
    };

    this.hud?.notify(`날씨: ${names[next]}`, 'info');
  }

  private cycleTime(): void {
    const times = [6, 9, 12, 15, 18, 21, 0, 3];
    const current = Math.floor(this.weatherSystem?.getTime() || 12);
    const idx = times.findIndex(t => Math.abs(t - current) < 2);
    const next = times[(idx + 1) % times.length];

    this.weatherSystem?.setTime(next);
    this.mapRenderer?.setSkyboxTime(next);

    const names: Record<number, string> = {
      0: '자정', 3: '새벽', 6: '일출', 9: '오전',
      12: '정오', 15: '오후', 18: '일몰', 21: '밤'
    };

    this.hud?.notify(`시간: ${names[next]}`, 'info');
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.world?.pause();
      this.hud?.notify('일시정지', 'warning');
    } else {
      this.world?.resume();
      this.hud?.notify('재개', 'info');
    }
  }

  private showWelcome(): void {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║              K-Driving-Sim v0.3.0                     ║
║          한국형 드라이빙 시뮬레이터                   ║
╠═══════════════════════════════════════════════════════╣
║  차량: ${ALL_VEHICLES.length}종 | 맵: ${ALL_MAPS.length}개 | 고품질 그래픽              ║
╠═══════════════════════════════════════════════════════╣
║  W/↑ - 가속    S/↓ - 브레이크                         ║
║  A/← - 좌회전  D/→ - 우회전                           ║
║  Space - 핸드브레이크  H - 경적                       ║
║                                                       ║
║  1-4: 카메라  R: 리셋  P: 일시정지                    ║
║  F: 날씨     T: 시간   M: 맵   N: 차량                ║
╚═══════════════════════════════════════════════════════╝
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
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.hud?.updateFPS();

    if (this.isPaused) return;

    // 입력 처리
    this.inputManager!.update();
    const input = this.inputManager!.getState();

    // 차량 업데이트
    if (this.currentVehicle) {
      this.currentVehicle.setThrottle(input.throttle);
      this.currentVehicle.setBrake(input.brake);
      this.currentVehicle.setSteering(input.steering);
      this.currentVehicle.setHandbrake(input.handbrake);

      if (input.shiftUp) this.currentVehicle.shiftUp();
      if (input.shiftDown) this.currentVehicle.shiftDown();

      this.currentVehicle.update(deltaTime);

      // 차량 모델 동기화
      const state = this.currentVehicle.getState();
      if (this.playerVehicleModel) {
        this.playerVehicleModel.position = state.position.clone();
        this.playerVehicleModel.position.y = 0;
        this.playerVehicleModel.rotation.y = state.rotation.y;
      }

      // 사운드
      this.audioSystem?.setEngineRPM(state.rpm);

      // HUD
      const spec = this.currentVehicle.getSpec();
      this.hud?.updateVehicle({
        speed: state.speed,
        rpm: state.rpm,
        gear: state.gear,
        fuel: 0.85,
        name: `${spec.brand} ${spec.name}`
      });

      // 미니맵
      if (this.minimap) {
        this.minimap.setPlayerPosition(state.position.x, state.position.z, state.rotation.y);
        this.minimap.render();
      }
    }

    // 시스템 업데이트
    this.world?.update(deltaTime);

    // 카메라
    this.cameraController!.update();
  }

  stop(): void {
    this.isRunning = false;
    this.engine?.stopRenderLoop();
  }

  dispose(): void {
    this.stop();
    this.inputManager?.dispose();
    this.cameraController?.dispose();
    this.world?.dispose();
    this.mapRenderer?.dispose();
    this.engine?.dispose();
    this.hud?.dispose();
    this.minimap?.dispose();
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
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = `
        <h1>오류 발생</h1>
        <p>${error}</p>
        <p>브라우저가 WebGPU/WebGL을 지원하는지 확인하세요.</p>
      `;
    }
  }
});

(window as any).kdrivingSim = app;
(window as any).vehicles = ALL_VEHICLES;
(window as any).maps = ALL_MAPS;
