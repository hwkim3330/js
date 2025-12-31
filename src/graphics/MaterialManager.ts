/**
 * MaterialManager - PBR 머티리얼 관리
 *
 * 텍스처 생성 및 PBR 머티리얼 관리
 * 절차적 텍스처 생성으로 외부 에셋 불필요
 */

import {
  Scene,
  StandardMaterial,
  PBRMaterial,
  Color3,
  Texture,
  DynamicTexture,
  CubeTexture,
  RawTexture
} from '@babylonjs/core';

export class MaterialManager {
  private scene: Scene;
  private materials: Map<string, StandardMaterial | PBRMaterial> = new Map();
  private textures: Map<string, Texture> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
    this.createAllMaterials();
  }

  private createAllMaterials(): void {
    // 도로 머티리얼
    this.createRoadMaterials();
    // 건물 머티리얼
    this.createBuildingMaterials();
    // 지면 머티리얼
    this.createGroundMaterials();
    // 차량 머티리얼
    this.createVehicleMaterials();
    // 환경 머티리얼
    this.createEnvironmentMaterials();
  }

  // ==================== 도로 머티리얼 ====================

  private createRoadMaterials(): void {
    // 아스팔트 도로
    const asphalt = new PBRMaterial('road_asphalt', this.scene);
    asphalt.albedoColor = new Color3(0.15, 0.15, 0.17);
    asphalt.metallic = 0;
    asphalt.roughness = 0.9;
    asphalt.albedoTexture = this.createAsphaltTexture();
    this.materials.set('road_asphalt', asphalt);

    // 차선 (흰색)
    const laneLine = new StandardMaterial('road_lane_white', this.scene);
    laneLine.diffuseColor = new Color3(0.95, 0.95, 0.95);
    laneLine.emissiveColor = new Color3(0.1, 0.1, 0.1);
    this.materials.set('road_lane_white', laneLine);

    // 차선 (노란색)
    const laneYellow = new StandardMaterial('road_lane_yellow', this.scene);
    laneYellow.diffuseColor = new Color3(1, 0.85, 0);
    laneYellow.emissiveColor = new Color3(0.1, 0.08, 0);
    this.materials.set('road_lane_yellow', laneYellow);

    // 횡단보도
    const crosswalk = new StandardMaterial('road_crosswalk', this.scene);
    crosswalk.diffuseTexture = this.createCrosswalkTexture();
    this.materials.set('road_crosswalk', crosswalk);

    // 인도
    const sidewalk = new PBRMaterial('sidewalk', this.scene);
    sidewalk.albedoColor = new Color3(0.6, 0.58, 0.55);
    sidewalk.metallic = 0;
    sidewalk.roughness = 0.85;
    sidewalk.albedoTexture = this.createSidewalkTexture();
    this.materials.set('sidewalk', sidewalk);
  }

  private createAsphaltTexture(): DynamicTexture {
    const texture = new DynamicTexture('asphalt_tex', 256, this.scene, true);
    const ctx = texture.getContext();

    // 기본 아스팔트 색상
    ctx.fillStyle = '#282828';
    ctx.fillRect(0, 0, 256, 256);

    // 노이즈 추가 (아스팔트 질감)
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const brightness = Math.random() * 40 + 20;
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // 균열 추가
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 256, Math.random() * 256);
      ctx.lineTo(Math.random() * 256, Math.random() * 256);
      ctx.stroke();
    }

    texture.update();
    return texture;
  }

  private createCrosswalkTexture(): DynamicTexture {
    const texture = new DynamicTexture('crosswalk_tex', 256, this.scene, true);
    const ctx = texture.getContext();

    // 아스팔트 배경
    ctx.fillStyle = '#282828';
    ctx.fillRect(0, 0, 256, 256);

    // 횡단보도 줄무늬
    ctx.fillStyle = '#f0f0f0';
    const stripeWidth = 30;
    const gap = 25;
    for (let x = 10; x < 256; x += stripeWidth + gap) {
      ctx.fillRect(x, 0, stripeWidth, 256);
    }

    texture.update();
    return texture;
  }

  private createSidewalkTexture(): DynamicTexture {
    const texture = new DynamicTexture('sidewalk_tex', 256, this.scene, true);
    const ctx = texture.getContext();

    // 보도블록 패턴
    ctx.fillStyle = '#9a9590';
    ctx.fillRect(0, 0, 256, 256);

    // 블록 경계선
    ctx.strokeStyle = '#7a7570';
    ctx.lineWidth = 2;
    const blockSize = 64;
    for (let x = 0; x <= 256; x += blockSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y <= 256; y += blockSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    texture.update();
    return texture;
  }

  // ==================== 건물 머티리얼 ====================

  private createBuildingMaterials(): void {
    // 유리 외벽 (오피스)
    const glass = new PBRMaterial('building_glass', this.scene);
    glass.albedoColor = new Color3(0.4, 0.5, 0.6);
    glass.metallic = 0.9;
    glass.roughness = 0.1;
    glass.alpha = 0.85;
    this.materials.set('building_glass', glass);

    // 콘크리트
    const concrete = new PBRMaterial('building_concrete', this.scene);
    concrete.albedoColor = new Color3(0.65, 0.63, 0.6);
    concrete.metallic = 0;
    concrete.roughness = 0.8;
    concrete.albedoTexture = this.createConcreteTexture();
    this.materials.set('building_concrete', concrete);

    // 아파트 외벽
    const apartment = new PBRMaterial('building_apartment', this.scene);
    apartment.albedoColor = new Color3(0.85, 0.83, 0.8);
    apartment.metallic = 0;
    apartment.roughness = 0.7;
    this.materials.set('building_apartment', apartment);

    // 창문 (발광)
    const windowLit = new StandardMaterial('window_lit', this.scene);
    windowLit.diffuseColor = new Color3(1, 0.95, 0.7);
    windowLit.emissiveColor = new Color3(0.8, 0.75, 0.5);
    this.materials.set('window_lit', windowLit);

    // 창문 (어두운)
    const windowDark = new StandardMaterial('window_dark', this.scene);
    windowDark.diffuseColor = new Color3(0.2, 0.25, 0.3);
    windowDark.specularColor = new Color3(0.5, 0.5, 0.5);
    this.materials.set('window_dark', windowDark);

    // 상가/소매점
    const retail = new PBRMaterial('building_retail', this.scene);
    retail.albedoColor = new Color3(0.9, 0.88, 0.85);
    retail.metallic = 0;
    retail.roughness = 0.6;
    this.materials.set('building_retail', retail);
  }

  private createConcreteTexture(): DynamicTexture {
    const texture = new DynamicTexture('concrete_tex', 256, this.scene, true);
    const ctx = texture.getContext();

    ctx.fillStyle = '#a8a4a0';
    ctx.fillRect(0, 0, 256, 256);

    // 콘크리트 질감
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const brightness = Math.random() * 30 + 150;
      ctx.fillStyle = `rgb(${brightness}, ${brightness - 5}, ${brightness - 10})`;
      ctx.fillRect(x, y, 3, 3);
    }

    texture.update();
    return texture;
  }

  // ==================== 지면 머티리얼 ====================

  private createGroundMaterials(): void {
    // 잔디
    const grass = new PBRMaterial('ground_grass', this.scene);
    grass.albedoColor = new Color3(0.2, 0.4, 0.15);
    grass.metallic = 0;
    grass.roughness = 0.95;
    grass.albedoTexture = this.createGrassTexture();
    this.materials.set('ground_grass', grass);

    // 흙
    const dirt = new PBRMaterial('ground_dirt', this.scene);
    dirt.albedoColor = new Color3(0.45, 0.35, 0.25);
    dirt.metallic = 0;
    dirt.roughness = 0.9;
    this.materials.set('ground_dirt', dirt);
  }

  private createGrassTexture(): DynamicTexture {
    const texture = new DynamicTexture('grass_tex', 256, this.scene, true);
    const ctx = texture.getContext();

    // 기본 잔디색
    ctx.fillStyle = '#3a6b2a';
    ctx.fillRect(0, 0, 256, 256);

    // 잔디 변화
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const g = Math.floor(Math.random() * 40 + 80);
      ctx.fillStyle = `rgb(${Math.floor(g * 0.4)}, ${g}, ${Math.floor(g * 0.3)})`;
      ctx.fillRect(x, y, 4, 4);
    }

    texture.update();
    return texture;
  }

  // ==================== 차량 머티리얼 ====================

  private createVehicleMaterials(): void {
    // 차량 페인트 색상들
    const carColors: [string, Color3][] = [
      ['car_white', new Color3(0.95, 0.95, 0.95)],
      ['car_black', new Color3(0.05, 0.05, 0.05)],
      ['car_silver', new Color3(0.75, 0.75, 0.78)],
      ['car_red', new Color3(0.8, 0.1, 0.1)],
      ['car_blue', new Color3(0.1, 0.2, 0.6)],
      ['car_green', new Color3(0.1, 0.4, 0.2)],
      ['car_yellow', new Color3(0.9, 0.8, 0.1)],
      ['car_orange', new Color3(0.9, 0.4, 0.1)],
      ['car_gray', new Color3(0.4, 0.4, 0.42)],
    ];

    for (const [name, color] of carColors) {
      const mat = new PBRMaterial(name, this.scene);
      mat.albedoColor = color;
      mat.metallic = 0.4;
      mat.roughness = 0.3;
      this.materials.set(name, mat);
    }

    // 차량 유리
    const carGlass = new PBRMaterial('car_glass', this.scene);
    carGlass.albedoColor = new Color3(0.1, 0.15, 0.2);
    carGlass.metallic = 0.1;
    carGlass.roughness = 0.05;
    carGlass.alpha = 0.4;
    this.materials.set('car_glass', carGlass);

    // 타이어
    const tire = new PBRMaterial('car_tire', this.scene);
    tire.albedoColor = new Color3(0.1, 0.1, 0.1);
    tire.metallic = 0;
    tire.roughness = 0.9;
    this.materials.set('car_tire', tire);

    // 휠
    const wheel = new PBRMaterial('car_wheel', this.scene);
    wheel.albedoColor = new Color3(0.7, 0.7, 0.72);
    wheel.metallic = 0.9;
    wheel.roughness = 0.2;
    this.materials.set('car_wheel', wheel);

    // 헤드라이트
    const headlight = new StandardMaterial('car_headlight', this.scene);
    headlight.diffuseColor = new Color3(1, 1, 0.95);
    headlight.emissiveColor = new Color3(1, 1, 0.9);
    this.materials.set('car_headlight', headlight);

    // 테일라이트
    const taillight = new StandardMaterial('car_taillight', this.scene);
    taillight.diffuseColor = new Color3(0.8, 0.1, 0.1);
    taillight.emissiveColor = new Color3(0.6, 0, 0);
    this.materials.set('car_taillight', taillight);
  }

  // ==================== 환경 머티리얼 ====================

  private createEnvironmentMaterials(): void {
    // 나무 줄기
    const treeTrunk = new PBRMaterial('tree_trunk', this.scene);
    treeTrunk.albedoColor = new Color3(0.35, 0.25, 0.15);
    treeTrunk.metallic = 0;
    treeTrunk.roughness = 0.9;
    this.materials.set('tree_trunk', treeTrunk);

    // 나뭇잎
    const treeLeaves = new PBRMaterial('tree_leaves', this.scene);
    treeLeaves.albedoColor = new Color3(0.2, 0.5, 0.15);
    treeLeaves.metallic = 0;
    treeLeaves.roughness = 0.8;
    this.materials.set('tree_leaves', treeLeaves);

    // 금속 (가로등, 신호등 기둥)
    const metal = new PBRMaterial('metal_pole', this.scene);
    metal.albedoColor = new Color3(0.3, 0.3, 0.32);
    metal.metallic = 0.8;
    metal.roughness = 0.4;
    this.materials.set('metal_pole', metal);

    // 신호등 빨강
    const trafficRed = new StandardMaterial('traffic_red', this.scene);
    trafficRed.diffuseColor = new Color3(0.8, 0.1, 0.1);
    trafficRed.emissiveColor = new Color3(0.8, 0, 0);
    this.materials.set('traffic_red', trafficRed);

    // 신호등 노랑
    const trafficYellow = new StandardMaterial('traffic_yellow', this.scene);
    trafficYellow.diffuseColor = new Color3(1, 0.9, 0.1);
    trafficYellow.emissiveColor = new Color3(0.8, 0.7, 0);
    this.materials.set('traffic_yellow', trafficYellow);

    // 신호등 초록
    const trafficGreen = new StandardMaterial('traffic_green', this.scene);
    trafficGreen.diffuseColor = new Color3(0.1, 0.9, 0.2);
    trafficGreen.emissiveColor = new Color3(0, 0.7, 0.1);
    this.materials.set('traffic_green', trafficGreen);

    // 가로등 빛
    const streetLight = new StandardMaterial('street_light', this.scene);
    streetLight.diffuseColor = new Color3(1, 0.95, 0.8);
    streetLight.emissiveColor = new Color3(1, 0.9, 0.7);
    this.materials.set('street_light', streetLight);
  }

  // ==================== Public API ====================

  getMaterial(name: string): StandardMaterial | PBRMaterial | undefined {
    return this.materials.get(name);
  }

  getTexture(name: string): Texture | undefined {
    return this.textures.get(name);
  }

  getRandomCarColor(): PBRMaterial {
    const colors = ['car_white', 'car_black', 'car_silver', 'car_red', 'car_blue', 'car_gray'];
    const name = colors[Math.floor(Math.random() * colors.length)];
    return this.materials.get(name) as PBRMaterial;
  }

  dispose(): void {
    for (const mat of this.materials.values()) {
      mat.dispose();
    }
    for (const tex of this.textures.values()) {
      tex.dispose();
    }
  }
}
