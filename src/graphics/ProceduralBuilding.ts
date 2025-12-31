/**
 * ProceduralBuilding - 절차적 건물 생성
 *
 * 창문 패턴이 있는 현실적인 건물 메시 생성
 * 타입별 다양한 외관
 */

import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  VertexData,
  StandardMaterial,
  PBRMaterial,
  Color3,
  MultiMaterial,
  SubMesh
} from '@babylonjs/core';
import { MaterialManager } from './MaterialManager';

export interface BuildingConfig {
  width: number;
  depth: number;
  height: number;
  floors: number;
  type: 'office' | 'apartment' | 'retail' | 'commercial' | 'residential';
  windowDensity?: number;  // 0-1
  hasRoofStructure?: boolean;
}

export class ProceduralBuilding {
  private scene: Scene;
  private materials: MaterialManager;

  constructor(scene: Scene, materials: MaterialManager) {
    this.scene = scene;
    this.materials = materials;
  }

  /**
   * 건물 생성
   */
  create(config: BuildingConfig, position: Vector3, name: string): Mesh {
    const {
      width,
      depth,
      height,
      floors,
      type,
      windowDensity = 0.7,
      hasRoofStructure = Math.random() > 0.5
    } = config;

    // 메인 건물 박스
    const building = MeshBuilder.CreateBox(name, {
      width,
      height,
      depth
    }, this.scene);
    building.position = position.clone();
    building.position.y = height / 2;

    // 타입별 머티리얼 적용
    const wallMat = this.getWallMaterial(type);
    building.material = wallMat;

    // 창문 추가
    const windows = this.createWindows(
      name,
      width,
      depth,
      height,
      floors,
      windowDensity,
      type
    );

    // 창문들을 건물 위치로 이동
    for (const win of windows) {
      win.position.addInPlace(building.position);
      win.position.y -= height / 2;  // 바닥 기준으로 조정
      win.parent = building;
    }

    // 지붕 구조물 (옵션)
    if (hasRoofStructure && height > 30) {
      const roofStructure = this.createRoofStructure(name, width, depth, type);
      roofStructure.position = new Vector3(0, height / 2, 0);
      roofStructure.parent = building;
    }

    // 1층 상가 (상업 건물)
    if ((type === 'commercial' || type === 'retail') && floors > 1) {
      const storefront = this.createStorefront(name, width, depth);
      storefront.position = new Vector3(0, -height / 2 + 2, 0);
      storefront.parent = building;
    }

    return building;
  }

  private getWallMaterial(type: string): StandardMaterial | PBRMaterial {
    switch (type) {
      case 'office':
        return this.materials.getMaterial('building_glass')!;
      case 'apartment':
        return this.materials.getMaterial('building_apartment')!;
      case 'retail':
      case 'commercial':
        return this.materials.getMaterial('building_retail')!;
      default:
        return this.materials.getMaterial('building_concrete')!;
    }
  }

  /**
   * 창문 생성
   */
  private createWindows(
    baseName: string,
    buildingWidth: number,
    buildingDepth: number,
    buildingHeight: number,
    floors: number,
    density: number,
    type: string
  ): Mesh[] {
    const windows: Mesh[] = [];
    const floorHeight = buildingHeight / floors;
    const windowHeight = floorHeight * 0.6;
    const windowWidth = type === 'office' ? 1.8 : 1.2;
    const windowDepth = 0.1;

    // 창문 간격 계산
    const horizSpacing = type === 'office' ? 2.5 : 3;
    const windowsPerFloorX = Math.floor(buildingWidth / horizSpacing) - 1;
    const windowsPerFloorZ = Math.floor(buildingDepth / horizSpacing) - 1;

    // 창문 머티리얼 (밤에는 일부 켜짐)
    const isNight = false;  // TODO: 시간 시스템 연동

    for (let floor = 0; floor < floors; floor++) {
      const floorY = floor * floorHeight + floorHeight * 0.5;

      // 앞/뒤 면 창문
      for (let i = 0; i < windowsPerFloorX; i++) {
        if (Math.random() > density) continue;

        const x = (i - windowsPerFloorX / 2 + 0.5) * horizSpacing;
        const isLit = isNight && Math.random() > 0.4;
        const matName = isLit ? 'window_lit' : 'window_dark';

        // 앞면
        const winFront = MeshBuilder.CreateBox(`${baseName}_win_f_${floor}_${i}`, {
          width: windowWidth,
          height: windowHeight,
          depth: windowDepth
        }, this.scene);
        winFront.position = new Vector3(x, floorY, buildingDepth / 2 + 0.05);
        winFront.material = this.materials.getMaterial(matName)!;
        windows.push(winFront);

        // 뒷면
        const winBack = MeshBuilder.CreateBox(`${baseName}_win_b_${floor}_${i}`, {
          width: windowWidth,
          height: windowHeight,
          depth: windowDepth
        }, this.scene);
        winBack.position = new Vector3(x, floorY, -buildingDepth / 2 - 0.05);
        winBack.material = this.materials.getMaterial(matName)!;
        windows.push(winBack);
      }

      // 좌/우 면 창문
      for (let i = 0; i < windowsPerFloorZ; i++) {
        if (Math.random() > density) continue;

        const z = (i - windowsPerFloorZ / 2 + 0.5) * horizSpacing;
        const isLit = isNight && Math.random() > 0.4;
        const matName = isLit ? 'window_lit' : 'window_dark';

        // 오른쪽
        const winRight = MeshBuilder.CreateBox(`${baseName}_win_r_${floor}_${i}`, {
          width: windowDepth,
          height: windowHeight,
          depth: windowWidth
        }, this.scene);
        winRight.position = new Vector3(buildingWidth / 2 + 0.05, floorY, z);
        winRight.material = this.materials.getMaterial(matName)!;
        windows.push(winRight);

        // 왼쪽
        const winLeft = MeshBuilder.CreateBox(`${baseName}_win_l_${floor}_${i}`, {
          width: windowDepth,
          height: windowHeight,
          depth: windowWidth
        }, this.scene);
        winLeft.position = new Vector3(-buildingWidth / 2 - 0.05, floorY, z);
        winLeft.material = this.materials.getMaterial(matName)!;
        windows.push(winLeft);
      }
    }

    return windows;
  }

  /**
   * 옥상 구조물 생성 (냉각탑, 계단실 등)
   */
  private createRoofStructure(baseName: string, width: number, depth: number, type: string): Mesh {
    const parent = new Mesh(`${baseName}_roof`, this.scene);

    // 계단실
    const stairRoom = MeshBuilder.CreateBox(`${baseName}_stair`, {
      width: Math.min(width * 0.3, 8),
      height: 4,
      depth: Math.min(depth * 0.3, 8)
    }, this.scene);
    stairRoom.position = new Vector3(
      width * 0.25 - width * 0.15,
      2,
      depth * 0.25 - depth * 0.15
    );
    stairRoom.material = this.materials.getMaterial('building_concrete')!;
    stairRoom.parent = parent;

    // 냉각탑/설비 (오피스 건물)
    if (type === 'office' && width > 20) {
      const hvac = MeshBuilder.CreateBox(`${baseName}_hvac`, {
        width: 6,
        height: 3,
        depth: 6
      }, this.scene);
      hvac.position = new Vector3(-width * 0.2, 1.5, -depth * 0.2);
      hvac.material = this.materials.getMaterial('metal_pole')!;
      hvac.parent = parent;
    }

    return parent;
  }

  /**
   * 1층 상가 전면 생성
   */
  private createStorefront(baseName: string, width: number, depth: number): Mesh {
    const parent = new Mesh(`${baseName}_storefront`, this.scene);
    const storefrontHeight = 4;

    // 유리 쇼윈도
    const numShops = Math.floor(width / 8);
    const shopWidth = (width - 2) / numShops;

    for (let i = 0; i < numShops; i++) {
      const x = (i - numShops / 2 + 0.5) * shopWidth;

      // 쇼윈도 유리
      const window = MeshBuilder.CreateBox(`${baseName}_shop_${i}`, {
        width: shopWidth * 0.7,
        height: storefrontHeight * 0.7,
        depth: 0.1
      }, this.scene);
      window.position = new Vector3(x, storefrontHeight * 0.4, depth / 2 + 0.1);
      window.material = this.materials.getMaterial('building_glass')!;
      window.parent = parent;

      // 간판 영역
      const signage = MeshBuilder.CreateBox(`${baseName}_sign_${i}`, {
        width: shopWidth * 0.6,
        height: 0.8,
        depth: 0.2
      }, this.scene);
      signage.position = new Vector3(x, storefrontHeight * 0.85, depth / 2 + 0.15);
      const signMat = new StandardMaterial(`${baseName}_sign_mat_${i}`, this.scene);
      signMat.diffuseColor = new Color3(Math.random() * 0.5 + 0.5, Math.random() * 0.5, Math.random() * 0.5);
      signMat.emissiveColor = signMat.diffuseColor.scale(0.3);
      signage.material = signMat;
      signage.parent = parent;
    }

    return parent;
  }

  /**
   * 아파트 동 생성 (여러 세대)
   */
  createApartmentBlock(
    name: string,
    position: Vector3,
    width: number,
    depth: number,
    floors: number,
    units: number = 4
  ): Mesh {
    const floorHeight = 2.8;
    const height = floors * floorHeight;

    const building = MeshBuilder.CreateBox(name, {
      width,
      height,
      depth
    }, this.scene);
    building.position = position.clone();
    building.position.y = height / 2;
    building.material = this.materials.getMaterial('building_apartment')!;

    // 발코니 추가
    const balconyDepth = 1.5;
    const unitWidth = width / units;

    for (let floor = 0; floor < floors; floor++) {
      const y = floor * floorHeight + floorHeight * 0.3;

      for (let unit = 0; unit < units; unit++) {
        const x = (unit - units / 2 + 0.5) * unitWidth;

        // 발코니 바닥
        const balcony = MeshBuilder.CreateBox(`${name}_balc_${floor}_${unit}`, {
          width: unitWidth * 0.8,
          height: 0.15,
          depth: balconyDepth
        }, this.scene);
        balcony.position = new Vector3(x, y, depth / 2 + balconyDepth / 2);
        balcony.material = this.materials.getMaterial('building_concrete')!;
        balcony.parent = building;

        // 발코니 난간
        const railing = MeshBuilder.CreateBox(`${name}_rail_${floor}_${unit}`, {
          width: unitWidth * 0.8,
          height: 1,
          depth: 0.05
        }, this.scene);
        railing.position = new Vector3(x, y + 0.5, depth / 2 + balconyDepth);
        railing.material = this.materials.getMaterial('metal_pole')!;
        railing.parent = building;

        // 창문
        const window = MeshBuilder.CreateBox(`${name}_win_${floor}_${unit}`, {
          width: unitWidth * 0.6,
          height: floorHeight * 0.5,
          depth: 0.1
        }, this.scene);
        window.position = new Vector3(x, y + floorHeight * 0.3, depth / 2 + 0.05);
        window.material = this.materials.getMaterial('window_dark')!;
        window.parent = building;
      }
    }

    return building;
  }
}
