/**
 * EnvironmentObjects - 환경 오브젝트 생성
 *
 * 나무, 가로등, 신호등, 벤치 등 거리 소품
 */

import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  Color3,
  PointLight,
  SpotLight
} from '@babylonjs/core';
import { MaterialManager } from './MaterialManager';

export class EnvironmentObjects {
  private scene: Scene;
  private materials: MaterialManager;

  constructor(scene: Scene, materials: MaterialManager) {
    this.scene = scene;
    this.materials = materials;
  }

  /**
   * 나무 생성 (로우폴리)
   */
  createTree(position: Vector3, scale: number = 1, type: 'deciduous' | 'conifer' = 'deciduous'): Mesh {
    const parent = new Mesh('tree', this.scene);
    parent.position = position;

    // 줄기
    const trunkHeight = 3 * scale;
    const trunkRadius = 0.3 * scale;

    const trunk = MeshBuilder.CreateCylinder('trunk', {
      height: trunkHeight,
      diameterTop: trunkRadius * 0.7,
      diameterBottom: trunkRadius,
      tessellation: 8
    }, this.scene);
    trunk.position.y = trunkHeight / 2;
    trunk.material = this.materials.getMaterial('tree_trunk')!;
    trunk.parent = parent;

    if (type === 'deciduous') {
      // 낙엽수 - 둥근 나뭇잎
      const foliageHeight = 5 * scale;
      const foliageRadius = 2.5 * scale;

      // 여러 구체로 자연스러운 모양
      const positions = [
        new Vector3(0, trunkHeight + foliageHeight * 0.4, 0),
        new Vector3(foliageRadius * 0.3, trunkHeight + foliageHeight * 0.2, foliageRadius * 0.3),
        new Vector3(-foliageRadius * 0.3, trunkHeight + foliageHeight * 0.2, -foliageRadius * 0.3),
        new Vector3(foliageRadius * 0.2, trunkHeight + foliageHeight * 0.6, -foliageRadius * 0.2),
      ];

      positions.forEach((pos, i) => {
        const foliage = MeshBuilder.CreateSphere(`foliage_${i}`, {
          diameter: foliageRadius * (0.8 + Math.random() * 0.4),
          segments: 8
        }, this.scene);
        foliage.position = pos;
        foliage.material = this.materials.getMaterial('tree_leaves')!;
        foliage.parent = parent;
      });
    } else {
      // 침엽수 - 원뿔형
      const coneHeight = 6 * scale;
      const coneRadius = 2 * scale;

      for (let i = 0; i < 3; i++) {
        const cone = MeshBuilder.CreateCylinder(`cone_${i}`, {
          height: coneHeight * (1 - i * 0.2),
          diameterTop: 0,
          diameterBottom: coneRadius * (1 - i * 0.15),
          tessellation: 8
        }, this.scene);
        cone.position.y = trunkHeight + i * coneHeight * 0.25;
        cone.material = this.materials.getMaterial('tree_leaves')!;
        cone.parent = parent;
      }
    }

    return parent;
  }

  /**
   * 가로등 생성
   */
  createStreetLight(position: Vector3, height: number = 8, addLight: boolean = true): Mesh {
    const parent = new Mesh('streetlight', this.scene);
    parent.position = position;

    // 기둥
    const pole = MeshBuilder.CreateCylinder('pole', {
      height: height,
      diameter: 0.2,
      tessellation: 8
    }, this.scene);
    pole.position.y = height / 2;
    pole.material = this.materials.getMaterial('metal_pole')!;
    pole.parent = parent;

    // 팔 (램프 연결부)
    const arm = MeshBuilder.CreateCylinder('arm', {
      height: 2,
      diameter: 0.1,
      tessellation: 8
    }, this.scene);
    arm.position = new Vector3(1, height - 0.5, 0);
    arm.rotation.z = Math.PI / 2;
    arm.material = this.materials.getMaterial('metal_pole')!;
    arm.parent = parent;

    // 램프 하우징
    const lamp = MeshBuilder.CreateBox('lamp', {
      width: 1,
      height: 0.3,
      depth: 0.5
    }, this.scene);
    lamp.position = new Vector3(1.8, height - 0.5, 0);
    lamp.material = this.materials.getMaterial('metal_pole')!;
    lamp.parent = parent;

    // 전구 (발광)
    const bulb = MeshBuilder.CreateSphere('bulb', {
      diameter: 0.3,
      segments: 8
    }, this.scene);
    bulb.position = new Vector3(1.8, height - 0.7, 0);
    bulb.material = this.materials.getMaterial('street_light')!;
    bulb.parent = parent;

    // 실제 조명 추가 (밤에만)
    if (addLight) {
      const light = new SpotLight(
        'streetlight_light',
        new Vector3(position.x + 1.8, position.y + height - 0.7, position.z),
        new Vector3(0, -1, 0),
        Math.PI / 3,
        2,
        this.scene
      );
      light.intensity = 0;  // 기본 꺼짐, WeatherSystem에서 제어
      light.diffuse = new Color3(1, 0.95, 0.8);
      (parent as any).lightRef = light;
    }

    return parent;
  }

  /**
   * 신호등 생성 (3색)
   */
  createTrafficLight(position: Vector3, direction: Vector3): Mesh {
    const parent = new Mesh('trafficlight', this.scene);
    parent.position = position;

    // 기둥
    const poleHeight = 5;
    const pole = MeshBuilder.CreateCylinder('pole', {
      height: poleHeight,
      diameter: 0.25,
      tessellation: 8
    }, this.scene);
    pole.position.y = poleHeight / 2;
    pole.material = this.materials.getMaterial('metal_pole')!;
    pole.parent = parent;

    // 신호등 박스
    const boxHeight = 2.4;
    const box = MeshBuilder.CreateBox('box', {
      width: 0.8,
      height: boxHeight,
      depth: 0.5
    }, this.scene);
    box.position.y = poleHeight;
    box.material = this.materials.getMaterial('metal_pole')!;
    box.parent = parent;

    // 후드 (햇빛 가리개)
    const hoodDepth = 0.4;
    const hood = MeshBuilder.CreateBox('hood', {
      width: 0.9,
      height: 0.1,
      depth: hoodDepth
    }, this.scene);
    hood.position = new Vector3(0, poleHeight + boxHeight / 2 + 0.05, 0.3);
    hood.material = this.materials.getMaterial('metal_pole')!;
    hood.parent = parent;

    // 신호등 (빨강, 노랑, 초록)
    const lightColors = ['traffic_red', 'traffic_yellow', 'traffic_green'];
    const lights: Mesh[] = [];

    for (let i = 0; i < 3; i++) {
      const light = MeshBuilder.CreateSphere(`light_${i}`, {
        diameter: 0.5,
        segments: 16
      }, this.scene);
      light.position = new Vector3(0, poleHeight + 0.7 - i * 0.7, 0.3);
      light.material = this.materials.getMaterial(lightColors[i])!;
      light.parent = parent;
      lights.push(light);
    }

    // 메타데이터 저장
    (parent as any).lights = lights;
    (parent as any).lightMaterials = lightColors;

    // 방향 설정
    const angle = Math.atan2(direction.x, direction.z);
    parent.rotation.y = angle;

    return parent;
  }

  /**
   * 벤치 생성
   */
  createBench(position: Vector3, rotation: number = 0): Mesh {
    const parent = new Mesh('bench', this.scene);
    parent.position = position;
    parent.rotation.y = rotation;

    const woodMat = this.materials.getMaterial('tree_trunk')!;
    const metalMat = this.materials.getMaterial('metal_pole')!;

    // 좌석
    const seat = MeshBuilder.CreateBox('seat', {
      width: 1.5,
      height: 0.08,
      depth: 0.5
    }, this.scene);
    seat.position.y = 0.45;
    seat.material = woodMat;
    seat.parent = parent;

    // 등받이
    const back = MeshBuilder.CreateBox('back', {
      width: 1.5,
      height: 0.5,
      depth: 0.08
    }, this.scene);
    back.position = new Vector3(0, 0.7, -0.2);
    back.rotation.x = 0.1;
    back.material = woodMat;
    back.parent = parent;

    // 다리 (4개)
    const legPositions = [
      new Vector3(-0.6, 0.22, 0.15),
      new Vector3(0.6, 0.22, 0.15),
      new Vector3(-0.6, 0.22, -0.15),
      new Vector3(0.6, 0.22, -0.15),
    ];

    legPositions.forEach((pos, i) => {
      const leg = MeshBuilder.CreateCylinder(`leg_${i}`, {
        height: 0.45,
        diameter: 0.06
      }, this.scene);
      leg.position = pos;
      leg.material = metalMat;
      leg.parent = parent;
    });

    return parent;
  }

  /**
   * 쓰레기통 생성
   */
  createTrashCan(position: Vector3): Mesh {
    const trashcan = MeshBuilder.CreateCylinder('trashcan', {
      height: 1,
      diameterTop: 0.4,
      diameterBottom: 0.35,
      tessellation: 12
    }, this.scene);
    trashcan.position = position;
    trashcan.position.y = 0.5;
    trashcan.material = this.materials.getMaterial('metal_pole')!;

    return trashcan;
  }

  /**
   * 버스 정류장 생성
   */
  createBusStop(position: Vector3, rotation: number = 0): Mesh {
    const parent = new Mesh('busstop', this.scene);
    parent.position = position;
    parent.rotation.y = rotation;

    const metalMat = this.materials.getMaterial('metal_pole')!;
    const glassMat = this.materials.getMaterial('building_glass')!;

    // 기둥 (2개)
    for (const x of [-1.5, 1.5]) {
      const pole = MeshBuilder.CreateCylinder(`pole_${x}`, {
        height: 2.8,
        diameter: 0.1
      }, this.scene);
      pole.position = new Vector3(x, 1.4, 0);
      pole.material = metalMat;
      pole.parent = parent;
    }

    // 지붕
    const roof = MeshBuilder.CreateBox('roof', {
      width: 3.5,
      height: 0.1,
      depth: 1.5
    }, this.scene);
    roof.position.y = 2.85;
    roof.material = metalMat;
    roof.parent = parent;

    // 뒷벽 (유리)
    const backWall = MeshBuilder.CreateBox('back', {
      width: 3.5,
      height: 2,
      depth: 0.05
    }, this.scene);
    backWall.position = new Vector3(0, 1.4, -0.7);
    backWall.material = glassMat;
    backWall.parent = parent;

    // 측면 (유리)
    for (const x of [-1.7, 1.7]) {
      const side = MeshBuilder.CreateBox(`side_${x}`, {
        width: 0.05,
        height: 2,
        depth: 1.3
      }, this.scene);
      side.position = new Vector3(x, 1.4, 0);
      side.material = glassMat;
      side.parent = parent;
    }

    // 벤치
    const bench = MeshBuilder.CreateBox('bench', {
      width: 2.5,
      height: 0.08,
      depth: 0.4
    }, this.scene);
    bench.position = new Vector3(0, 0.5, -0.4);
    bench.material = metalMat;
    bench.parent = parent;

    return parent;
  }

  /**
   * 전신주 생성
   */
  createUtilityPole(position: Vector3): Mesh {
    const parent = new Mesh('utilitypole', this.scene);
    parent.position = position;

    // 기둥
    const poleHeight = 10;
    const pole = MeshBuilder.CreateCylinder('pole', {
      height: poleHeight,
      diameterTop: 0.2,
      diameterBottom: 0.3,
      tessellation: 8
    }, this.scene);
    pole.position.y = poleHeight / 2;
    pole.material = this.materials.getMaterial('tree_trunk')!;
    pole.parent = parent;

    // 가로대
    const crossarm = MeshBuilder.CreateBox('crossarm', {
      width: 2,
      height: 0.15,
      depth: 0.15
    }, this.scene);
    crossarm.position.y = poleHeight - 1;
    crossarm.material = this.materials.getMaterial('tree_trunk')!;
    crossarm.parent = parent;

    // 절연체
    for (const x of [-0.7, 0, 0.7]) {
      const insulator = MeshBuilder.CreateCylinder(`insulator_${x}`, {
        height: 0.3,
        diameter: 0.1
      }, this.scene);
      insulator.position = new Vector3(x, poleHeight - 0.7, 0);
      insulator.material = this.materials.getMaterial('building_concrete')!;
      insulator.parent = parent;
    }

    return parent;
  }

  /**
   * 주차된 차량 (장식용)
   */
  createParkedCar(position: Vector3, rotation: number = 0, color?: string): Mesh {
    const parent = new Mesh('parkedcar', this.scene);
    parent.position = position;
    parent.rotation.y = rotation;

    // 차체
    const body = MeshBuilder.CreateBox('body', {
      width: 1.8,
      height: 1.2,
      depth: 4.5
    }, this.scene);
    body.position.y = 0.7;
    body.material = color ?
      this.materials.getMaterial(color) :
      this.materials.getRandomCarColor();
    body.parent = parent;

    // 지붕
    const roof = MeshBuilder.CreateBox('roof', {
      width: 1.6,
      height: 0.5,
      depth: 2
    }, this.scene);
    roof.position = new Vector3(0, 1.55, -0.3);
    roof.material = body.material;
    roof.parent = parent;

    // 유리
    const windshield = MeshBuilder.CreateBox('windshield', {
      width: 1.5,
      height: 0.6,
      depth: 0.05
    }, this.scene);
    windshield.position = new Vector3(0, 1.3, 0.9);
    windshield.rotation.x = -0.4;
    windshield.material = this.materials.getMaterial('car_glass')!;
    windshield.parent = parent;

    // 타이어 (4개)
    const wheelPositions = [
      new Vector3(-0.8, 0.3, 1.3),
      new Vector3(0.8, 0.3, 1.3),
      new Vector3(-0.8, 0.3, -1.3),
      new Vector3(0.8, 0.3, -1.3),
    ];

    wheelPositions.forEach((pos, i) => {
      const tire = MeshBuilder.CreateCylinder(`tire_${i}`, {
        height: 0.25,
        diameter: 0.6
      }, this.scene);
      tire.position = pos;
      tire.rotation.z = Math.PI / 2;
      tire.material = this.materials.getMaterial('car_tire')!;
      tire.parent = parent;
    });

    return parent;
  }
}
