/**
 * K-Driving-Sim 메인 엔트리 포인트
 *
 * 한국형 드라이빙 시뮬레이터
 * CARLA 스타일 + 실제 한국 지도 + 한국 자동차
 */

import { Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { KDrivingEngine } from './core/Engine';
import { GameWorld } from './core/GameWorld';
import { InputManager } from './core/InputManager';
import { CameraController } from './core/CameraController';
import { Vehicle, KOREAN_VEHICLES } from './physics/VehiclePhysics';

// 시스템
import { WeatherSystem } from './systems/WeatherSystem';
import { TrafficSystem } from './systems/TrafficSystem';
import { AudioSystem } from './systems/AudioSystem';

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

    // GameWorld 생성
    this.world = new GameWorld(scene);

    // 시스템 등록
    this.weatherSystem = new WeatherSystem();
    this.trafficSystem = new TrafficSystem();
    this.audioSystem = new AudioSystem();

    this.world.registerSystem(this.weatherSystem);
    this.world.registerSystem(this.trafficSystem);
    this.world.registerSystem(this.audioSystem);

    // 시스템 초기화
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

    // 기본 맵 로드 (강남역)
    await this.loadMap('seoul-gangnam');

    // 기본 차량 생성 (쏘나타)
    await this.spawnVehicle('hyundai-sonata-dn8');

    // 키보드 단축키
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

    const scene = this.engine!.getScene();

    // 지면 생성
    const ground = MeshBuilder.CreateGround('ground', {
      width: 1200,
      height: 1200
    }, scene);

    const groundMat = new StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new Color3(0.15, 0.18, 0.15);
    ground.material = groundMat;

    // 도로 렌더링
    const roadMat = new StandardMaterial('roadMat', scene);
    roadMat.diffuseColor = new Color3(0.2, 0.2, 0.22);

    for (const road of mapData.roads) {
      for (let i = 0; i < road.points.length - 1; i++) {
        const start = new Vector3(road.points[i].x, 0.05, road.points[i].z);
        const end = new Vector3(road.points[i + 1].x, 0.05, road.points[i + 1].z);

        const direction = end.subtract(start);
        const length = direction.length();
        const center = start.add(direction.scale(0.5));

        const roadMesh = MeshBuilder.CreateBox(`${road.id}_${i}`, {
          width: road.width,
          height: 0.1,
          depth: length
        }, scene);

        roadMesh.position = center;
        roadMesh.rotation.y = Math.atan2(direction.x, direction.z);
        roadMesh.material = roadMat;
      }
    }

    // 건물 렌더링
    const buildingMat = new StandardMaterial('buildingMat', scene);
    buildingMat.diffuseColor = new Color3(0.5, 0.5, 0.55);

    const glassMat = new StandardMaterial('glassMat', scene);
    glassMat.diffuseColor = new Color3(0.3, 0.4, 0.5);
    glassMat.alpha = 0.8;

    for (const building of mapData.buildings) {
      const mesh = MeshBuilder.CreateBox(building.id, {
        width: building.width,
        height: building.height,
        depth: building.depth
      }, scene);

      mesh.position = new Vector3(building.x, building.height / 2, building.z);

      // 타입에 따른 색상
      if (building.type === 'commercial' || building.type === 'office') {
        mesh.material = glassMat;
      } else {
        mesh.material = buildingMat;
      }
    }

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
    // 새 데이터베이스에서 차량 검색
    const vehicleSpec = getVehicleById(vehicleId);

    // 기존 차량 데이터에서도 검색 (호환성)
    const legacyKey = vehicleId.replace(/-/g, '_').replace('hyundai_sonata_dn8', 'hyundai-sonata');
    const legacySpec = KOREAN_VEHICLES[legacyKey];

    if (!vehicleSpec && !legacySpec) {
      console.error(`Unknown vehicle: ${vehicleId}`);
      // 기본 차량으로 폴백
      const defaultSpec = KOREAN_VEHICLES['hyundai-sonata'];
      if (defaultSpec) {
        this.currentVehicle = new Vehicle(defaultSpec);
        await this.currentVehicle.spawn(
          this.engine!.getScene(),
          new Vector3(0, 1, 0)
        );
      }
      return;
    }

    // 새 스펙을 기존 형식으로 변환
    const spec = legacySpec || {
      name: vehicleSpec!.name,
      brand: vehicleSpec!.brand,
      model: vehicleSpec!.model,
      mass: vehicleSpec!.mass,
      length: vehicleSpec!.length / 1000,
      width: vehicleSpec!.width / 1000,
      height: vehicleSpec!.height / 1000,
      wheelBase: vehicleSpec!.wheelBase / 1000,
      trackWidth: vehicleSpec!.width / 1000 * 0.85,
      maxPower: vehicleSpec!.maxPower,
      maxTorque: vehicleSpec!.maxTorque,
      maxRPM: vehicleSpec!.maxPowerRPM || 6000,
      idleRPM: 800,
      gearRatios: [-3.2, 4.2, 2.6, 1.8, 1.4, 1.0, 0.77, 0.64],
      finalDriveRatio: 3.5,
      transmissionType: 'auto' as const,
      tireRadius: vehicleSpec!.tireRadius,
      tireWidth: 235,
      gripCoefficient: 1.0,
      dragCoefficient: vehicleSpec!.dragCoefficient,
      frontalArea: vehicleSpec!.frontalArea,
      suspensionStiffness: 35000,
      suspensionDamping: 4500,
      suspensionTravel: 0.2
    };

    console.log(`🚗 Spawning vehicle: ${spec.brand} ${spec.name}`);

    this.currentVehicle = new Vehicle(spec);

    // 스폰 위치 (맵의 첫 번째 스폰 포인트)
    const spawnPoint = this.currentMap?.spawnPoints[0] || { x: 0, z: 0, rotation: 0 };

    await this.currentVehicle.spawn(
      this.engine!.getScene(),
      new Vector3(spawnPoint.x, 1, spawnPoint.z)
    );

    const mesh = this.currentVehicle.getMesh();
    if (mesh) {
      mesh.rotation.y = spawnPoint.rotation || 0;
      this.cameraController!.setTarget(mesh);
    }

    this.hud?.notify(`${spec.brand} ${spec.name} 스폰`, 'success');
  }

  private setupHotkeys(): void {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        // 카메라
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

        // 차량 제어
        case 'KeyR':
          this.resetVehicle();
          break;
        case 'KeyH':
          this.audioSystem?.playEffect('horn');
          break;

        // 메뉴
        case 'KeyM':
          this.showMapMenu();
          break;
        case 'KeyN':
          this.showVehicleMenu();
          break;

        // 날씨
        case 'KeyF':
          this.cycleWeather();
          break;

        // 시간
        case 'KeyT':
          this.cycleTime();
          break;

        // 일시정지
        case 'Escape':
        case 'KeyP':
          this.togglePause();
          break;
      }
    });
  }

  private resetVehicle(): void {
    const mesh = this.currentVehicle?.getMesh();
    const spawnPoint = this.currentMap?.spawnPoints[0] || { x: 0, z: 0, rotation: 0 };

    if (mesh) {
      mesh.position = new Vector3(spawnPoint.x, 1, spawnPoint.z);
      mesh.rotation = new Vector3(0, spawnPoint.rotation || 0, 0);
    }

    this.hud?.notify('차량 리셋', 'info');
  }

  private showMapMenu(): void {
    const maps = ALL_MAPS.map(m => `${m.name} (${m.id})`).join(', ');
    console.log('Available maps:', maps);
    this.hud?.notify('M: 맵 선택 (콘솔 참조)', 'info');
  }

  private showVehicleMenu(): void {
    const vehicles = ALL_VEHICLES.slice(0, 5).map(v => `${v.brand} ${v.name}`).join(', ');
    console.log('Available vehicles:', ALL_VEHICLES.map(v => `${v.brand} ${v.name} (${v.id})`));
    this.hud?.notify('N: 차량 선택 (콘솔 참조)', 'info');
  }

  private cycleWeather(): void {
    const weathers: Array<'clear' | 'cloudy' | 'rain' | 'snow' | 'fog'> = ['clear', 'cloudy', 'rain', 'snow', 'fog'];
    const current = this.weatherSystem?.getWeather().type || 'clear';
    const idx = weathers.indexOf(current as any);
    const next = weathers[(idx + 1) % weathers.length];

    this.weatherSystem?.setWeather(next, 0.7);

    const names: Record<string, string> = {
      'clear': '맑음',
      'cloudy': '흐림',
      'rain': '비',
      'snow': '눈',
      'fog': '안개'
    };

    this.hud?.notify(`날씨: ${names[next]}`, 'info');
    this.hud?.updateEnvironment({
      time: this.weatherSystem?.getTime() || 12,
      weather: next,
      location: this.currentMap?.name || ''
    });
  }

  private cycleTime(): void {
    const times = [6, 9, 12, 15, 18, 21, 0, 3];
    const current = Math.floor(this.weatherSystem?.getTime() || 12);
    const idx = times.findIndex(t => Math.abs(t - current) < 2);
    const next = times[(idx + 1) % times.length];

    this.weatherSystem?.setTime(next);

    const names: Record<number, string> = {
      0: '자정', 3: '새벽', 6: '일출', 9: '오전',
      12: '정오', 15: '오후', 18: '일몰', 21: '밤'
    };

    this.hud?.notify(`시간: ${names[next]}`, 'info');
    this.hud?.updateEnvironment({
      time: next,
      weather: this.weatherSystem?.getWeather().type || 'clear',
      location: this.currentMap?.name || ''
    });
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
╔═══════════════════════════════════════════════════╗
║           K-Driving-Sim v0.2.0                    ║
║       한국형 드라이빙 시뮬레이터                  ║
╠═══════════════════════════════════════════════════╣
║  차량: ${ALL_VEHICLES.length}종 | 맵: ${ALL_MAPS.length}개                           ║
╠═══════════════════════════════════════════════════╣
║  조작법:                                          ║
║  W/↑ - 가속    S/↓ - 브레이크                     ║
║  A/← - 좌회전  D/→ - 우회전                       ║
║  Space - 핸드브레이크  H - 경적                   ║
║                                                   ║
║  카메라: 1-추적 2-콕핏 3-자유 4-탑뷰              ║
║  R - 리셋  F - 날씨  T - 시간  P - 일시정지       ║
║  M - 맵 선택  N - 차량 선택                       ║
╚═══════════════════════════════════════════════════╝
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
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);  // 최대 100ms
    this.lastTime = now;

    // FPS 업데이트
    this.hud?.updateFPS();

    if (this.isPaused) return;

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

      // 엔진 사운드
      this.audioSystem?.setEngineRPM(this.currentVehicle.getState().rpm);

      // HUD 업데이트
      const state = this.currentVehicle.getState();
      const spec = this.currentVehicle.getSpec();

      this.hud?.updateVehicle({
        speed: state.speed,
        rpm: state.rpm,
        gear: state.gear,
        fuel: 0.85,  // TODO: 연료 시스템
        name: `${spec.brand} ${spec.name}`
      });

      // 미니맵 업데이트
      if (this.minimap) {
        this.minimap.setPlayerPosition(
          state.position.x,
          state.position.z,
          state.rotation.y
        );
        this.minimap.render();
      }
    }

    // GameWorld 업데이트 (모든 시스템)
    this.world?.update(deltaTime);

    // 카메라 업데이트
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
    this.engine?.dispose();
    this.hud?.dispose();
    this.minimap?.dispose();
  }

  // Public API for debugging
  getWorld(): GameWorld | null { return this.world; }
  getWeatherSystem(): WeatherSystem | null { return this.weatherSystem; }
  getTrafficSystem(): TrafficSystem | null { return this.trafficSystem; }
  getCurrentVehicle(): Vehicle | null { return this.currentVehicle; }
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
        <h1>❌ 오류 발생</h1>
        <p>${error}</p>
        <p>브라우저가 WebGPU/WebGL을 지원하는지 확인하세요.</p>
      `;
    }
  }
});

// 전역 접근용 (디버깅)
(window as any).kdrivingSim = app;
(window as any).vehicles = ALL_VEHICLES;
(window as any).maps = ALL_MAPS;
