/**
 * 차량 물리 시스템
 *
 * 실제 자동차 물리를 시뮬레이션
 * - 엔진 토크/파워
 * - 변속기 (수동/자동)
 * - 서스펜션
 * - 타이어 그립
 * - 공기저항
 */

import {
  Scene,
  Vector3,
  Mesh,
  PhysicsAggregate,
  PhysicsShapeType
} from '@babylonjs/core';

export interface VehicleSpec {
  // 기본 정보
  name: string;
  brand: string;
  model: string;

  // 차체
  mass: number;              // kg
  length: number;            // m
  width: number;             // m
  height: number;            // m
  wheelBase: number;         // 축간거리 m
  trackWidth: number;        // 윤거 m

  // 엔진
  maxPower: number;          // kW
  maxTorque: number;         // Nm
  maxRPM: number;
  idleRPM: number;

  // 변속기
  gearRatios: number[];      // [후진, 1단, 2단, ...]
  finalDriveRatio: number;
  transmissionType: 'manual' | 'auto';

  // 타이어
  tireRadius: number;        // m
  tireWidth: number;         // mm
  gripCoefficient: number;

  // 공력
  dragCoefficient: number;   // Cd
  frontalArea: number;       // m²

  // 서스펜션
  suspensionStiffness: number;
  suspensionDamping: number;
  suspensionTravel: number;
}

// 한국 자동차 기본 스펙 프리셋
export const KOREAN_VEHICLES: Record<string, VehicleSpec> = {
  'hyundai-sonata': {
    name: '쏘나타',
    brand: '현대',
    model: 'DN8',
    mass: 1515,
    length: 4.900,
    width: 1.860,
    height: 1.445,
    wheelBase: 2.840,
    trackWidth: 1.610,
    maxPower: 140,        // 2.0 가솔린
    maxTorque: 179,
    maxRPM: 6500,
    idleRPM: 800,
    gearRatios: [-3.272, 4.212, 2.637, 1.800, 1.386, 1.000, 0.772],
    finalDriveRatio: 3.510,
    transmissionType: 'auto',
    tireRadius: 0.340,
    tireWidth: 235,
    gripCoefficient: 1.0,
    dragCoefficient: 0.27,
    frontalArea: 2.25,
    suspensionStiffness: 35000,
    suspensionDamping: 4500,
    suspensionTravel: 0.2
  },
  'kia-k5': {
    name: 'K5',
    brand: '기아',
    model: 'DL3',
    mass: 1475,
    length: 4.905,
    width: 1.860,
    height: 1.445,
    wheelBase: 2.850,
    trackWidth: 1.605,
    maxPower: 137,
    maxTorque: 179,
    maxRPM: 6500,
    idleRPM: 800,
    gearRatios: [-3.272, 4.212, 2.637, 1.800, 1.386, 1.000, 0.772],
    finalDriveRatio: 3.510,
    transmissionType: 'auto',
    tireRadius: 0.340,
    tireWidth: 235,
    gripCoefficient: 1.0,
    dragCoefficient: 0.28,
    frontalArea: 2.23,
    suspensionStiffness: 33000,
    suspensionDamping: 4300,
    suspensionTravel: 0.2
  },
  'genesis-g80': {
    name: 'G80',
    brand: '제네시스',
    model: 'RG3',
    mass: 1945,
    length: 5.005,
    width: 1.925,
    height: 1.465,
    wheelBase: 3.010,
    trackWidth: 1.645,
    maxPower: 224,        // 2.5T
    maxTorque: 422,
    maxRPM: 6000,
    idleRPM: 750,
    gearRatios: [-3.167, 4.651, 2.831, 1.842, 1.386, 1.000, 0.772, 0.635],
    finalDriveRatio: 3.153,
    transmissionType: 'auto',
    tireRadius: 0.355,
    tireWidth: 275,
    gripCoefficient: 1.1,
    dragCoefficient: 0.26,
    frontalArea: 2.42,
    suspensionStiffness: 40000,
    suspensionDamping: 5000,
    suspensionTravel: 0.22
  },
  'hyundai-avante': {
    name: '아반떼',
    brand: '현대',
    model: 'CN7',
    mass: 1280,
    length: 4.650,
    width: 1.825,
    height: 1.410,
    wheelBase: 2.720,
    trackWidth: 1.575,
    maxPower: 106,
    maxTorque: 144,
    maxRPM: 6300,
    idleRPM: 800,
    gearRatios: [-3.583, 3.929, 2.188, 1.433, 1.021, 0.770, 0.651],
    finalDriveRatio: 3.739,
    transmissionType: 'auto',
    tireRadius: 0.325,
    tireWidth: 205,
    gripCoefficient: 0.95,
    dragCoefficient: 0.28,
    frontalArea: 2.12,
    suspensionStiffness: 28000,
    suspensionDamping: 3500,
    suspensionTravel: 0.18
  },
  'kia-ev6': {
    name: 'EV6',
    brand: '기아',
    model: 'CV',
    mass: 2090,
    length: 4.695,
    width: 1.890,
    height: 1.550,
    wheelBase: 2.900,
    trackWidth: 1.630,
    maxPower: 168,        // 롱레인지 2WD
    maxTorque: 350,
    maxRPM: 10000,        // 전기모터
    idleRPM: 0,
    gearRatios: [1],      // 전기차 단일 기어
    finalDriveRatio: 1,
    transmissionType: 'auto',
    tireRadius: 0.360,
    tireWidth: 255,
    gripCoefficient: 1.05,
    dragCoefficient: 0.28,
    frontalArea: 2.38,
    suspensionStiffness: 38000,
    suspensionDamping: 4800,
    suspensionTravel: 0.2
  }
};

export interface VehicleState {
  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;
  angularVelocity: Vector3;
  rpm: number;
  gear: number;
  speed: number;          // km/h
  throttle: number;       // 0-1
  brake: number;          // 0-1
  steering: number;       // -1 to 1
  handbrake: boolean;
}

export class Vehicle {
  private spec: VehicleSpec;
  private state: VehicleState;
  private mesh: Mesh | null = null;
  private physicsAggregate: PhysicsAggregate | null = null;

  constructor(spec: VehicleSpec) {
    this.spec = spec;
    this.state = {
      position: Vector3.Zero(),
      rotation: Vector3.Zero(),
      velocity: Vector3.Zero(),
      angularVelocity: Vector3.Zero(),
      rpm: spec.idleRPM,
      gear: 1,
      speed: 0,
      throttle: 0,
      brake: 0,
      steering: 0,
      handbrake: false
    };
  }

  /**
   * 차량을 씬에 생성
   */
  async spawn(scene: Scene, position: Vector3): Promise<void> {
    // 임시로 박스 메시 생성 (나중에 실제 모델로 교체)
    this.mesh = Mesh.CreateBox(
      this.spec.name,
      1,
      scene
    );
    this.mesh.scaling = new Vector3(
      this.spec.width,
      this.spec.height,
      this.spec.length
    );
    this.mesh.position = position;

    // Havok 물리 엔진 적용
    // this.physicsAggregate = new PhysicsAggregate(
    //   this.mesh,
    //   PhysicsShapeType.BOX,
    //   { mass: this.spec.mass },
    //   scene
    // );

    this.state.position = position.clone();
  }

  /**
   * 매 프레임 물리 업데이트
   */
  update(deltaTime: number): void {
    if (!this.mesh) return;

    // 엔진 토크 계산
    const engineTorque = this.calculateEngineTorque();

    // 휠 토크 계산
    const wheelTorque = this.calculateWheelTorque(engineTorque);

    // 견인력 계산
    const tractionForce = wheelTorque / this.spec.tireRadius;

    // 공기저항 계산
    const dragForce = this.calculateDragForce();

    // 순 가속력
    const netForce = tractionForce - dragForce - (this.state.brake * this.spec.mass * 9.8 * 0.8);

    // 가속도 (F = ma)
    const acceleration = netForce / this.spec.mass;

    // 속도 업데이트
    const speedMs = this.state.speed / 3.6; // km/h to m/s
    const newSpeedMs = Math.max(0, speedMs + acceleration * deltaTime);
    this.state.speed = newSpeedMs * 3.6;

    // RPM 업데이트
    this.updateRPM();

    // 자동 변속
    if (this.spec.transmissionType === 'auto') {
      this.autoShift();
    }

    // 조향 적용
    const steeringAngle = this.state.steering * Math.PI / 6; // 최대 30도

    // 위치 업데이트
    const forward = new Vector3(
      Math.sin(this.mesh.rotation.y),
      0,
      Math.cos(this.mesh.rotation.y)
    );

    this.mesh.position.addInPlace(forward.scale(newSpeedMs * deltaTime));

    // 회전 업데이트 (속도에 비례한 조향 효과)
    if (this.state.speed > 1) {
      const turnRate = (steeringAngle * newSpeedMs) / this.spec.wheelBase;
      this.mesh.rotation.y += turnRate * deltaTime;
    }

    this.state.position = this.mesh.position.clone();
    this.state.rotation = this.mesh.rotation.clone();
  }

  /**
   * 엔진 토크 계산 (토크 커브 시뮬레이션)
   */
  private calculateEngineTorque(): number {
    const rpmRatio = this.state.rpm / this.spec.maxRPM;

    // 간단한 토크 커브 (실제는 더 복잡)
    let torqueMultiplier: number;
    if (rpmRatio < 0.3) {
      torqueMultiplier = 0.6 + rpmRatio * 1.3;
    } else if (rpmRatio < 0.7) {
      torqueMultiplier = 1.0;
    } else {
      torqueMultiplier = 1.0 - (rpmRatio - 0.7) * 1.5;
    }

    return this.spec.maxTorque * torqueMultiplier * this.state.throttle;
  }

  /**
   * 휠 토크 계산
   */
  private calculateWheelTorque(engineTorque: number): number {
    const gearRatio = this.spec.gearRatios[this.state.gear] || 1;
    return engineTorque * gearRatio * this.spec.finalDriveRatio;
  }

  /**
   * 공기저항 계산
   */
  private calculateDragForce(): number {
    const speedMs = this.state.speed / 3.6;
    const airDensity = 1.225; // kg/m³
    return 0.5 * airDensity * this.spec.dragCoefficient *
           this.spec.frontalArea * speedMs * speedMs;
  }

  /**
   * RPM 업데이트
   */
  private updateRPM(): void {
    const speedMs = this.state.speed / 3.6;
    const wheelRPS = speedMs / (2 * Math.PI * this.spec.tireRadius);
    const gearRatio = this.spec.gearRatios[this.state.gear] || 1;

    const calculatedRPM = wheelRPS * 60 * gearRatio * this.spec.finalDriveRatio;

    // RPM은 아이들 이하로 내려가지 않음
    this.state.rpm = Math.max(this.spec.idleRPM, Math.min(this.spec.maxRPM, calculatedRPM));
  }

  /**
   * 자동 변속
   */
  private autoShift(): void {
    const upshiftRPM = this.spec.maxRPM * 0.85;
    const downshiftRPM = this.spec.maxRPM * 0.3;
    const maxGear = this.spec.gearRatios.length - 1;

    if (this.state.rpm > upshiftRPM && this.state.gear < maxGear) {
      this.state.gear++;
    } else if (this.state.rpm < downshiftRPM && this.state.gear > 1) {
      this.state.gear--;
    }
  }

  // 컨트롤 입력
  setThrottle(value: number): void {
    this.state.throttle = Math.max(0, Math.min(1, value));
  }

  setBrake(value: number): void {
    this.state.brake = Math.max(0, Math.min(1, value));
  }

  setSteering(value: number): void {
    this.state.steering = Math.max(-1, Math.min(1, value));
  }

  setHandbrake(value: boolean): void {
    this.state.handbrake = value;
  }

  shiftUp(): void {
    if (this.state.gear < this.spec.gearRatios.length - 1) {
      this.state.gear++;
    }
  }

  shiftDown(): void {
    if (this.state.gear > 0) {
      this.state.gear--;
    }
  }

  // 상태 조회
  getState(): Readonly<VehicleState> {
    return this.state;
  }

  getSpec(): Readonly<VehicleSpec> {
    return this.spec;
  }

  getMesh(): Mesh | null {
    return this.mesh;
  }
}
