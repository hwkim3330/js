/**
 * TrafficSystem - 교통 시스템
 *
 * AI 차량 및 교통 시뮬레이션
 * - AI 차량 스폰 및 경로 설정
 * - 신호등 제어
 * - 교통 법규 준수
 */

import { Scene, Vector3, Mesh, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { GameWorld, ISystem, IEntity } from '../core/GameWorld';

// 신호등 상태
export type TrafficLightState = 'red' | 'yellow' | 'green';

// 신호등 엔티티
export interface TrafficLight extends IEntity {
  type: 'traffic_light';
  position: Vector3;
  direction: Vector3;  // 어느 방향 차량을 제어하는지
  state: TrafficLightState;
  timer: number;
  greenDuration: number;
  yellowDuration: number;
  redDuration: number;
}

// AI 차량 엔티티
export interface AIVehicle extends IEntity {
  type: 'ai_vehicle';
  position: Vector3;
  rotation: number;
  speed: number;
  maxSpeed: number;
  path: Vector3[];
  currentPathIndex: number;
  vehicleType: string;
  mesh: Mesh | null;
}

// 신호등 타이밍 설정
const TRAFFIC_TIMING = {
  green: 30,
  yellow: 3,
  red: 33
};

export class TrafficSystem implements ISystem {
  name = 'TrafficSystem';
  priority = 30;

  private world!: GameWorld;
  private scene!: Scene;

  private trafficLights: Map<string, TrafficLight> = new Map();
  private aiVehicles: Map<string, AIVehicle> = new Map();

  private spawnTimer: number = 0;
  private maxAIVehicles: number = 20;

  // AI 차량 타입 및 색상
  private vehicleTypes = [
    { name: 'sedan', color: new Color3(0.8, 0.2, 0.2), scale: new Vector3(1.8, 1.4, 4.5) },
    { name: 'suv', color: new Color3(0.2, 0.3, 0.8), scale: new Vector3(2, 1.7, 4.8) },
    { name: 'truck', color: new Color3(0.9, 0.9, 0.9), scale: new Vector3(2.2, 2.5, 8) },
    { name: 'bus', color: new Color3(0.2, 0.6, 0.3), scale: new Vector3(2.5, 3, 12) },
    { name: 'taxi', color: new Color3(1, 0.8, 0), scale: new Vector3(1.8, 1.4, 4.5) }
  ];

  async init(world: GameWorld): Promise<void> {
    this.world = world;
    this.scene = world.getScene();

    // 기본 신호등 생성 (테스트용)
    this.createDefaultTrafficLights();

    console.log('🚦 Traffic system initialized');
  }

  private createDefaultTrafficLights(): void {
    // 교차로 신호등 (4방향)
    const intersections = [
      { x: 0, z: 0 },
      { x: 200, z: 0 },
      { x: 0, z: 200 },
      { x: -200, z: 0 },
      { x: 0, z: -200 }
    ];

    intersections.forEach((pos, i) => {
      // 동서 방향
      this.createTrafficLight(
        `light_${i}_ew`,
        new Vector3(pos.x + 10, 5, pos.z),
        new Vector3(1, 0, 0),
        i % 2 === 0 ? 0 : TRAFFIC_TIMING.green + TRAFFIC_TIMING.yellow
      );

      // 남북 방향
      this.createTrafficLight(
        `light_${i}_ns`,
        new Vector3(pos.x, 5, pos.z + 10),
        new Vector3(0, 0, 1),
        i % 2 === 0 ? TRAFFIC_TIMING.green + TRAFFIC_TIMING.yellow : 0
      );
    });
  }

  private createTrafficLight(
    id: string,
    position: Vector3,
    direction: Vector3,
    timerOffset: number
  ): void {
    // 신호등 기둥
    const pole = MeshBuilder.CreateCylinder(`${id}_pole`, {
      height: 5,
      diameter: 0.3
    }, this.scene);
    pole.position = position.clone();
    pole.position.y = 2.5;

    const poleMat = new StandardMaterial(`${id}_pole_mat`, this.scene);
    poleMat.diffuseColor = new Color3(0.3, 0.3, 0.3);
    pole.material = poleMat;

    // 신호등 박스
    const box = MeshBuilder.CreateBox(`${id}_box`, {
      width: 0.8,
      height: 2.4,
      depth: 0.5
    }, this.scene);
    box.position = position.clone();
    box.position.y = 5;

    const boxMat = new StandardMaterial(`${id}_box_mat`, this.scene);
    boxMat.diffuseColor = new Color3(0.2, 0.2, 0.2);
    box.material = boxMat;

    // 신호등 불 (3개)
    const lights: Mesh[] = [];
    const colors = [
      new Color3(1, 0, 0),    // 빨강
      new Color3(1, 1, 0),    // 노랑
      new Color3(0, 1, 0)     // 초록
    ];

    for (let i = 0; i < 3; i++) {
      const light = MeshBuilder.CreateSphere(`${id}_light_${i}`, {
        diameter: 0.5
      }, this.scene);
      light.position = position.clone();
      light.position.y = 5.7 - i * 0.7;
      light.position.addInPlace(direction.scale(0.3));

      const lightMat = new StandardMaterial(`${id}_light_mat_${i}`, this.scene);
      lightMat.diffuseColor = colors[i].scale(0.3);  // 꺼진 상태
      lightMat.emissiveColor = Color3.Black();
      light.material = lightMat;
      lights.push(light);
    }

    // 엔티티 등록
    const trafficLight: TrafficLight = {
      id,
      type: 'traffic_light',
      active: true,
      position,
      direction,
      state: 'red',
      timer: timerOffset,
      greenDuration: TRAFFIC_TIMING.green,
      yellowDuration: TRAFFIC_TIMING.yellow,
      redDuration: TRAFFIC_TIMING.red,
      update: (dt) => this.updateTrafficLight(trafficLight, lights, dt),
      dispose: () => {
        pole.dispose();
        box.dispose();
        lights.forEach(l => l.dispose());
      }
    };

    this.trafficLights.set(id, trafficLight);
    this.world.addEntity(trafficLight);
  }

  private updateTrafficLight(light: TrafficLight, meshes: Mesh[], deltaTime: number): void {
    light.timer += deltaTime;

    const cycleDuration = light.greenDuration + light.yellowDuration + light.redDuration;
    const cycleTime = light.timer % cycleDuration;

    let newState: TrafficLightState;
    if (cycleTime < light.greenDuration) {
      newState = 'green';
    } else if (cycleTime < light.greenDuration + light.yellowDuration) {
      newState = 'yellow';
    } else {
      newState = 'red';
    }

    if (newState !== light.state) {
      light.state = newState;
      this.updateTrafficLightVisual(meshes, newState);
    }
  }

  private updateTrafficLightVisual(meshes: Mesh[], state: TrafficLightState): void {
    const colors = [
      new Color3(1, 0, 0),    // 빨강
      new Color3(1, 1, 0),    // 노랑
      new Color3(0, 1, 0)     // 초록
    ];

    const activeIndex = state === 'red' ? 0 : state === 'yellow' ? 1 : 2;

    meshes.forEach((mesh, i) => {
      const mat = mesh.material as StandardMaterial;
      if (i === activeIndex) {
        mat.diffuseColor = colors[i];
        mat.emissiveColor = colors[i].scale(0.8);
      } else {
        mat.diffuseColor = colors[i].scale(0.3);
        mat.emissiveColor = Color3.Black();
      }
    });
  }

  update(deltaTime: number): void {
    // AI 차량 스폰
    this.spawnTimer += deltaTime;
    if (this.spawnTimer > 5 && this.aiVehicles.size < this.maxAIVehicles) {
      this.spawnTimer = 0;
      this.spawnAIVehicle();
    }

    // AI 차량 업데이트
    for (const vehicle of this.aiVehicles.values()) {
      this.updateAIVehicle(vehicle, deltaTime);
    }
  }

  private spawnAIVehicle(): void {
    const id = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 랜덤 시작 위치 (맵 가장자리)
    const side = Math.floor(Math.random() * 4);
    let position: Vector3;
    let rotation: number;

    switch (side) {
      case 0: // 북
        position = new Vector3(Math.random() * 400 - 200, 0.7, 500);
        rotation = Math.PI;
        break;
      case 1: // 남
        position = new Vector3(Math.random() * 400 - 200, 0.7, -500);
        rotation = 0;
        break;
      case 2: // 동
        position = new Vector3(500, 0.7, Math.random() * 400 - 200);
        rotation = -Math.PI / 2;
        break;
      default: // 서
        position = new Vector3(-500, 0.7, Math.random() * 400 - 200);
        rotation = Math.PI / 2;
    }

    // 랜덤 차량 타입
    const vehicleType = this.vehicleTypes[Math.floor(Math.random() * this.vehicleTypes.length)];

    // 메시 생성
    const mesh = MeshBuilder.CreateBox(id, {
      width: vehicleType.scale.x,
      height: vehicleType.scale.y,
      depth: vehicleType.scale.z
    }, this.scene);
    mesh.position = position;
    mesh.rotation.y = rotation;

    const mat = new StandardMaterial(`${id}_mat`, this.scene);
    mat.diffuseColor = vehicleType.color;
    mesh.material = mat;

    const vehicle: AIVehicle = {
      id,
      type: 'ai_vehicle',
      active: true,
      position,
      rotation,
      speed: 30 + Math.random() * 20,  // 30-50 km/h
      maxSpeed: 60,
      path: [],
      currentPathIndex: 0,
      vehicleType: vehicleType.name,
      mesh,
      update: () => {},
      dispose: () => {
        mesh.dispose();
        this.aiVehicles.delete(id);
      }
    };

    this.aiVehicles.set(id, vehicle);
  }

  private updateAIVehicle(vehicle: AIVehicle, deltaTime: number): void {
    if (!vehicle.mesh) return;

    // 앞으로 이동
    const forward = new Vector3(
      Math.sin(vehicle.rotation),
      0,
      Math.cos(vehicle.rotation)
    );

    const speedMs = vehicle.speed / 3.6;
    vehicle.position.addInPlace(forward.scale(speedMs * deltaTime));
    vehicle.mesh.position = vehicle.position;

    // 신호등 확인 및 정지
    const nearbyLight = this.getNearbyTrafficLight(vehicle.position, vehicle.rotation);
    if (nearbyLight && nearbyLight.state === 'red') {
      // 정지선 근처에서 감속
      vehicle.speed = Math.max(0, vehicle.speed - 50 * deltaTime);
    } else {
      // 정상 속도로 복귀
      vehicle.speed = Math.min(vehicle.maxSpeed, vehicle.speed + 20 * deltaTime);
    }

    // 맵 밖으로 나가면 제거
    if (Math.abs(vehicle.position.x) > 600 || Math.abs(vehicle.position.z) > 600) {
      vehicle.dispose();
    }
  }

  private getNearbyTrafficLight(position: Vector3, rotation: number): TrafficLight | null {
    for (const light of this.trafficLights.values()) {
      const distance = Vector3.Distance(position, light.position);

      // 20m 이내의 신호등
      if (distance < 20 && distance > 5) {
        // 진행 방향과 신호등 방향 확인
        const vehicleDir = new Vector3(Math.sin(rotation), 0, Math.cos(rotation));
        const dot = Vector3.Dot(vehicleDir, light.direction);

        if (Math.abs(dot) > 0.7) {
          return light;
        }
      }
    }
    return null;
  }

  // ==================== Public API ====================

  setMaxAIVehicles(count: number): void {
    this.maxAIVehicles = Math.max(0, Math.min(100, count));
  }

  getTrafficLightState(id: string): TrafficLightState | null {
    return this.trafficLights.get(id)?.state ?? null;
  }

  getAIVehicleCount(): number {
    return this.aiVehicles.size;
  }

  dispose(): void {
    for (const light of this.trafficLights.values()) {
      light.dispose();
    }
    this.trafficLights.clear();

    for (const vehicle of this.aiVehicles.values()) {
      vehicle.dispose();
    }
    this.aiVehicles.clear();
  }
}
