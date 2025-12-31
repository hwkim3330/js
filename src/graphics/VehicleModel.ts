/**
 * VehicleModel - 절차적 차량 3D 모델 생성
 *
 * 실제 glTF 모델 없이 코드로 차량 형태 생성
 * 세단, SUV, 트럭 등 다양한 타입
 */

import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  StandardMaterial,
  PBRMaterial,
  Color3,
  Animation,
  TransformNode
} from '@babylonjs/core';
import { MaterialManager } from './MaterialManager';

export type VehicleBodyType = 'sedan' | 'suv' | 'hatchback' | 'truck' | 'bus' | 'sports' | 'van';

export interface VehicleModelConfig {
  type: VehicleBodyType;
  length: number;
  width: number;
  height: number;
  wheelBase: number;
  color?: string;
}

export class VehicleModel {
  private scene: Scene;
  private materials: MaterialManager;

  constructor(scene: Scene, materials: MaterialManager) {
    this.scene = scene;
    this.materials = materials;
  }

  /**
   * 차량 모델 생성
   */
  create(config: VehicleModelConfig, name: string): TransformNode {
    const parent = new TransformNode(name, this.scene);

    switch (config.type) {
      case 'sedan':
        this.createSedan(parent, config, name);
        break;
      case 'suv':
        this.createSUV(parent, config, name);
        break;
      case 'hatchback':
        this.createHatchback(parent, config, name);
        break;
      case 'sports':
        this.createSports(parent, config, name);
        break;
      case 'truck':
        this.createTruck(parent, config, name);
        break;
      case 'bus':
        this.createBus(parent, config, name);
        break;
      case 'van':
        this.createVan(parent, config, name);
        break;
      default:
        this.createSedan(parent, config, name);
    }

    return parent;
  }

  /**
   * 세단 생성
   */
  private createSedan(parent: TransformNode, config: VehicleModelConfig, name: string): void {
    const { length, width, height, color } = config;
    const bodyMat = this.getBodyMaterial(color);

    // 하체 (섀시)
    const chassis = MeshBuilder.CreateBox(`${name}_chassis`, {
      width: width,
      height: height * 0.35,
      depth: length
    }, this.scene);
    chassis.position.y = height * 0.2;
    chassis.material = bodyMat;
    chassis.parent = parent;

    // 차체 하부 (사이드 패널)
    const lowerBody = MeshBuilder.CreateBox(`${name}_lower`, {
      width: width * 0.98,
      height: height * 0.25,
      depth: length * 0.9
    }, this.scene);
    lowerBody.position.y = height * 0.45;
    lowerBody.material = bodyMat;
    lowerBody.parent = parent;

    // 캐빈 (유리 부분)
    const cabinWidth = width * 0.9;
    const cabinHeight = height * 0.4;
    const cabinLength = length * 0.5;

    const cabin = MeshBuilder.CreateBox(`${name}_cabin`, {
      width: cabinWidth,
      height: cabinHeight,
      depth: cabinLength
    }, this.scene);
    cabin.position = new Vector3(0, height * 0.75, -length * 0.05);
    cabin.material = this.materials.getMaterial('car_glass')!;
    cabin.parent = parent;

    // 전면 유리 (경사)
    const windshield = MeshBuilder.CreateBox(`${name}_windshield`, {
      width: cabinWidth * 0.95,
      height: cabinHeight * 0.9,
      depth: 0.05
    }, this.scene);
    windshield.position = new Vector3(0, height * 0.7, length * 0.2);
    windshield.rotation.x = -0.5;
    windshield.material = this.materials.getMaterial('car_glass')!;
    windshield.parent = parent;

    // 후면 유리 (경사)
    const rearWindow = MeshBuilder.CreateBox(`${name}_rearwindow`, {
      width: cabinWidth * 0.95,
      height: cabinHeight * 0.8,
      depth: 0.05
    }, this.scene);
    rearWindow.position = new Vector3(0, height * 0.7, -length * 0.35);
    rearWindow.rotation.x = 0.5;
    rearWindow.material = this.materials.getMaterial('car_glass')!;
    rearWindow.parent = parent;

    // 보닛 (엔진 덮개)
    const hood = MeshBuilder.CreateBox(`${name}_hood`, {
      width: width * 0.95,
      height: height * 0.08,
      depth: length * 0.25
    }, this.scene);
    hood.position = new Vector3(0, height * 0.5, length * 0.35);
    hood.material = bodyMat;
    hood.parent = parent;

    // 트렁크
    const trunk = MeshBuilder.CreateBox(`${name}_trunk`, {
      width: width * 0.95,
      height: height * 0.1,
      depth: length * 0.2
    }, this.scene);
    trunk.position = new Vector3(0, height * 0.48, -length * 0.38);
    trunk.material = bodyMat;
    trunk.parent = parent;

    // 헤드라이트
    this.addHeadlights(parent, name, width, length, height);

    // 테일라이트
    this.addTaillights(parent, name, width, length, height);

    // 휠
    this.addWheels(parent, name, config);

    // 사이드 미러
    this.addMirrors(parent, name, width, height);
  }

  /**
   * SUV 생성
   */
  private createSUV(parent: TransformNode, config: VehicleModelConfig, name: string): void {
    const { length, width, height, color } = config;
    const bodyMat = this.getBodyMaterial(color);

    // 높은 차체
    const mainBody = MeshBuilder.CreateBox(`${name}_body`, {
      width: width,
      height: height * 0.55,
      depth: length * 0.95
    }, this.scene);
    mainBody.position.y = height * 0.35;
    mainBody.material = bodyMat;
    mainBody.parent = parent;

    // 루프
    const roof = MeshBuilder.CreateBox(`${name}_roof`, {
      width: width * 0.95,
      height: height * 0.08,
      depth: length * 0.6
    }, this.scene);
    roof.position = new Vector3(0, height * 0.7, -length * 0.05);
    roof.material = bodyMat;
    roof.parent = parent;

    // 유리 영역 (전면)
    const windshield = MeshBuilder.CreateBox(`${name}_windshield`, {
      width: width * 0.9,
      height: height * 0.35,
      depth: 0.05
    }, this.scene);
    windshield.position = new Vector3(0, height * 0.55, length * 0.35);
    windshield.rotation.x = -0.3;
    windshield.material = this.materials.getMaterial('car_glass')!;
    windshield.parent = parent;

    // 측면 유리
    for (const side of [-1, 1]) {
      const sideWindow = MeshBuilder.CreateBox(`${name}_sidewin_${side}`, {
        width: 0.05,
        height: height * 0.25,
        depth: length * 0.5
      }, this.scene);
      sideWindow.position = new Vector3(side * width * 0.48, height * 0.55, 0);
      sideWindow.material = this.materials.getMaterial('car_glass')!;
      sideWindow.parent = parent;
    }

    // 휠
    this.addWheels(parent, name, config);
    this.addHeadlights(parent, name, width, length, height);
    this.addTaillights(parent, name, width, length, height);
    this.addMirrors(parent, name, width, height);
  }

  /**
   * 해치백 생성
   */
  private createHatchback(parent: TransformNode, config: VehicleModelConfig, name: string): void {
    const { length, width, height, color } = config;
    const bodyMat = this.getBodyMaterial(color);

    // 짧은 차체
    const mainBody = MeshBuilder.CreateBox(`${name}_body`, {
      width: width,
      height: height * 0.45,
      depth: length
    }, this.scene);
    mainBody.position.y = height * 0.3;
    mainBody.material = bodyMat;
    mainBody.parent = parent;

    // 경사진 후면
    const rear = MeshBuilder.CreateBox(`${name}_rear`, {
      width: width * 0.95,
      height: height * 0.35,
      depth: length * 0.3
    }, this.scene);
    rear.position = new Vector3(0, height * 0.55, -length * 0.25);
    rear.rotation.x = -0.3;
    rear.material = bodyMat;
    rear.parent = parent;

    // 루프
    const roof = MeshBuilder.CreateBox(`${name}_roof`, {
      width: width * 0.9,
      height: height * 0.06,
      depth: length * 0.45
    }, this.scene);
    roof.position = new Vector3(0, height * 0.68, length * 0.05);
    roof.material = bodyMat;
    roof.parent = parent;

    // 유리
    const windshield = MeshBuilder.CreateBox(`${name}_windshield`, {
      width: width * 0.85,
      height: height * 0.3,
      depth: 0.05
    }, this.scene);
    windshield.position = new Vector3(0, height * 0.58, length * 0.32);
    windshield.rotation.x = -0.5;
    windshield.material = this.materials.getMaterial('car_glass')!;
    windshield.parent = parent;

    this.addWheels(parent, name, config);
    this.addHeadlights(parent, name, width, length, height);
    this.addTaillights(parent, name, width, length, height);
    this.addMirrors(parent, name, width, height);
  }

  /**
   * 스포츠카 생성
   */
  private createSports(parent: TransformNode, config: VehicleModelConfig, name: string): void {
    const { length, width, height, color } = config;
    const bodyMat = this.getBodyMaterial(color);

    // 낮고 넓은 차체
    const mainBody = MeshBuilder.CreateBox(`${name}_body`, {
      width: width * 1.05,
      height: height * 0.4,
      depth: length
    }, this.scene);
    mainBody.position.y = height * 0.22;
    mainBody.material = bodyMat;
    mainBody.parent = parent;

    // 슬로프 루프
    const cabin = MeshBuilder.CreateBox(`${name}_cabin`, {
      width: width * 0.85,
      height: height * 0.35,
      depth: length * 0.4
    }, this.scene);
    cabin.position = new Vector3(0, height * 0.52, 0);
    cabin.material = bodyMat;
    cabin.parent = parent;

    // 큰 경사 유리
    const windshield = MeshBuilder.CreateBox(`${name}_windshield`, {
      width: width * 0.8,
      height: height * 0.35,
      depth: 0.05
    }, this.scene);
    windshield.position = new Vector3(0, height * 0.45, length * 0.22);
    windshield.rotation.x = -0.7;
    windshield.material = this.materials.getMaterial('car_glass')!;
    windshield.parent = parent;

    this.addWheels(parent, name, config);
    this.addHeadlights(parent, name, width, length, height);
    this.addTaillights(parent, name, width, length, height);
    this.addMirrors(parent, name, width, height);
  }

  /**
   * 트럭 생성
   */
  private createTruck(parent: TransformNode, config: VehicleModelConfig, name: string): void {
    const { length, width, height, color } = config;
    const bodyMat = this.getBodyMaterial(color);

    // 캡
    const cabLength = length * 0.35;
    const cab = MeshBuilder.CreateBox(`${name}_cab`, {
      width: width,
      height: height * 0.6,
      depth: cabLength
    }, this.scene);
    cab.position = new Vector3(0, height * 0.35, length * 0.3);
    cab.material = bodyMat;
    cab.parent = parent;

    // 적재함
    const bedLength = length * 0.6;
    const bed = MeshBuilder.CreateBox(`${name}_bed`, {
      width: width * 0.95,
      height: height * 0.35,
      depth: bedLength
    }, this.scene);
    bed.position = new Vector3(0, height * 0.3, -length * 0.15);
    bed.material = bodyMat;
    bed.parent = parent;

    // 유리
    const windshield = MeshBuilder.CreateBox(`${name}_windshield`, {
      width: width * 0.85,
      height: height * 0.35,
      depth: 0.05
    }, this.scene);
    windshield.position = new Vector3(0, height * 0.5, length * 0.45);
    windshield.rotation.x = -0.2;
    windshield.material = this.materials.getMaterial('car_glass')!;
    windshield.parent = parent;

    this.addWheels(parent, name, config);
    this.addHeadlights(parent, name, width, length, height);
    this.addTaillights(parent, name, width, length, height);
    this.addMirrors(parent, name, width, height);
  }

  /**
   * 버스 생성
   */
  private createBus(parent: TransformNode, config: VehicleModelConfig, name: string): void {
    const { length, width, height, color } = config;
    const bodyMat = this.getBodyMaterial(color || 'car_green');

    // 메인 박스
    const mainBody = MeshBuilder.CreateBox(`${name}_body`, {
      width: width,
      height: height * 0.75,
      depth: length
    }, this.scene);
    mainBody.position.y = height * 0.45;
    mainBody.material = bodyMat;
    mainBody.parent = parent;

    // 창문 (측면)
    const windowCount = Math.floor(length / 1.5);
    for (let i = 0; i < windowCount; i++) {
      for (const side of [-1, 1]) {
        const window = MeshBuilder.CreateBox(`${name}_win_${side}_${i}`, {
          width: 0.05,
          height: height * 0.35,
          depth: 1
        }, this.scene);
        window.position = new Vector3(
          side * width * 0.51,
          height * 0.55,
          length * 0.4 - i * 1.5
        );
        window.material = this.materials.getMaterial('car_glass')!;
        window.parent = parent;
      }
    }

    // 전면 유리
    const windshield = MeshBuilder.CreateBox(`${name}_windshield`, {
      width: width * 0.9,
      height: height * 0.45,
      depth: 0.05
    }, this.scene);
    windshield.position = new Vector3(0, height * 0.55, length * 0.49);
    windshield.material = this.materials.getMaterial('car_glass')!;
    windshield.parent = parent;

    this.addWheels(parent, name, config);
    this.addHeadlights(parent, name, width, length, height);
    this.addTaillights(parent, name, width, length, height);
  }

  /**
   * 밴 생성
   */
  private createVan(parent: TransformNode, config: VehicleModelConfig, name: string): void {
    const { length, width, height, color } = config;
    const bodyMat = this.getBodyMaterial(color);

    // 전체 박스형
    const mainBody = MeshBuilder.CreateBox(`${name}_body`, {
      width: width,
      height: height * 0.7,
      depth: length
    }, this.scene);
    mainBody.position.y = height * 0.4;
    mainBody.material = bodyMat;
    mainBody.parent = parent;

    // 전면 유리
    const windshield = MeshBuilder.CreateBox(`${name}_windshield`, {
      width: width * 0.9,
      height: height * 0.35,
      depth: 0.05
    }, this.scene);
    windshield.position = new Vector3(0, height * 0.55, length * 0.48);
    windshield.rotation.x = -0.2;
    windshield.material = this.materials.getMaterial('car_glass')!;
    windshield.parent = parent;

    this.addWheels(parent, name, config);
    this.addHeadlights(parent, name, width, length, height);
    this.addTaillights(parent, name, width, length, height);
    this.addMirrors(parent, name, width, height);
  }

  // ==================== 공통 부품 ====================

  private getBodyMaterial(color?: string): StandardMaterial | PBRMaterial {
    if (color && this.materials.getMaterial(color)) {
      return this.materials.getMaterial(color)!;
    }
    return this.materials.getRandomCarColor();
  }

  private addWheels(parent: TransformNode, name: string, config: VehicleModelConfig): void {
    const { width, wheelBase, height } = config;
    const wheelRadius = height * 0.22;
    const wheelWidth = 0.25;

    const positions = [
      new Vector3(-width * 0.45, wheelRadius, wheelBase * 0.4),
      new Vector3(width * 0.45, wheelRadius, wheelBase * 0.4),
      new Vector3(-width * 0.45, wheelRadius, -wheelBase * 0.4),
      new Vector3(width * 0.45, wheelRadius, -wheelBase * 0.4),
    ];

    positions.forEach((pos, i) => {
      // 타이어
      const tire = MeshBuilder.CreateCylinder(`${name}_tire_${i}`, {
        height: wheelWidth,
        diameter: wheelRadius * 2,
        tessellation: 24
      }, this.scene);
      tire.position = pos;
      tire.rotation.z = Math.PI / 2;
      tire.material = this.materials.getMaterial('car_tire')!;
      tire.parent = parent;

      // 휠 (림)
      const rim = MeshBuilder.CreateCylinder(`${name}_rim_${i}`, {
        height: wheelWidth * 1.1,
        diameter: wheelRadius * 1.2,
        tessellation: 6
      }, this.scene);
      rim.position = pos;
      rim.rotation.z = Math.PI / 2;
      rim.material = this.materials.getMaterial('car_wheel')!;
      rim.parent = parent;
    });
  }

  private addHeadlights(parent: TransformNode, name: string, width: number, length: number, height: number): void {
    for (const side of [-1, 1]) {
      const light = MeshBuilder.CreateBox(`${name}_headlight_${side}`, {
        width: width * 0.2,
        height: height * 0.1,
        depth: 0.1
      }, this.scene);
      light.position = new Vector3(side * width * 0.35, height * 0.35, length * 0.48);
      light.material = this.materials.getMaterial('car_headlight')!;
      light.parent = parent;
    }
  }

  private addTaillights(parent: TransformNode, name: string, width: number, length: number, height: number): void {
    for (const side of [-1, 1]) {
      const light = MeshBuilder.CreateBox(`${name}_taillight_${side}`, {
        width: width * 0.15,
        height: height * 0.08,
        depth: 0.1
      }, this.scene);
      light.position = new Vector3(side * width * 0.38, height * 0.35, -length * 0.48);
      light.material = this.materials.getMaterial('car_taillight')!;
      light.parent = parent;
    }
  }

  private addMirrors(parent: TransformNode, name: string, width: number, height: number): void {
    for (const side of [-1, 1]) {
      const mirror = MeshBuilder.CreateBox(`${name}_mirror_${side}`, {
        width: 0.15,
        height: 0.1,
        depth: 0.08
      }, this.scene);
      mirror.position = new Vector3(side * (width * 0.55), height * 0.55, 0.3);
      mirror.material = this.materials.getMaterial('metal_pole')!;
      mirror.parent = parent;
    }
  }
}
