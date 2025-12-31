/**
 * MapRenderer - 통합 맵 렌더링
 *
 * 모든 그래픽 시스템을 통합하여 고품질 맵 렌더링
 */

import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  TransformNode
} from '@babylonjs/core';
import { MaterialManager } from './MaterialManager';
import { ProceduralBuilding } from './ProceduralBuilding';
import { RoadBuilder } from './RoadBuilder';
import { EnvironmentObjects } from './EnvironmentObjects';
import { SkyboxManager } from './SkyboxManager';
import { VehicleModel } from './VehicleModel';
import { MapRegion, RoadData, BuildingData } from '../data/PrebuiltMaps';

export class MapRenderer {
  private scene: Scene;
  private materials: MaterialManager;
  private buildingGenerator: ProceduralBuilding;
  private roadBuilder: RoadBuilder;
  private envObjects: EnvironmentObjects;
  private skybox: SkyboxManager;
  private vehicleModel: VehicleModel;

  private mapRoot: TransformNode | null = null;

  constructor(scene: Scene) {
    this.scene = scene;

    // 그래픽 시스템 초기화
    this.materials = new MaterialManager(scene);
    this.buildingGenerator = new ProceduralBuilding(scene, this.materials);
    this.roadBuilder = new RoadBuilder(scene, this.materials);
    this.envObjects = new EnvironmentObjects(scene, this.materials);
    this.skybox = new SkyboxManager(scene);
    this.vehicleModel = new VehicleModel(scene, this.materials);

    console.log('🎨 Graphics systems initialized');
  }

  /**
   * 맵 전체 렌더링
   */
  renderMap(mapData: MapRegion): TransformNode {
    // 기존 맵 정리
    if (this.mapRoot) {
      this.mapRoot.dispose();
    }

    this.mapRoot = new TransformNode(`map_${mapData.id}`, this.scene);

    console.log(`🗺️ Rendering map: ${mapData.name}`);

    // 지면
    this.renderGround();

    // 도로
    this.renderRoads(mapData.roads);

    // 건물
    this.renderBuildings(mapData.buildings);

    // 환경 오브젝트 (나무, 가로등 등)
    this.renderEnvironment(mapData);

    // 주차된 차량 (장식)
    this.renderParkedVehicles(mapData);

    console.log(`✅ Map rendered: ${mapData.name}`);

    return this.mapRoot;
  }

  /**
   * 지면 렌더링
   */
  private renderGround(): void {
    // 메인 지면 (잔디)
    const ground = MeshBuilder.CreateGround('ground', {
      width: 1500,
      height: 1500,
      subdivisions: 4
    }, this.scene);
    ground.material = this.materials.getMaterial('ground_grass')!;
    ground.parent = this.mapRoot;
    ground.receiveShadows = true;

    // 도시 영역 (콘크리트/아스팔트)
    const cityGround = MeshBuilder.CreateGround('cityground', {
      width: 1000,
      height: 1000,
      subdivisions: 2
    }, this.scene);
    cityGround.position.y = 0.01;
    cityGround.material = this.materials.getMaterial('sidewalk')!;
    cityGround.parent = this.mapRoot;
  }

  /**
   * 도로 렌더링
   */
  private renderRoads(roads: RoadData[]): void {
    const roadsParent = new TransformNode('roads', this.scene);
    roadsParent.parent = this.mapRoot;

    for (const road of roads) {
      // 포인트 배열을 Vector3로 변환
      const points = road.points.map(p => new Vector3(p.x, 0, p.z));

      const roadMesh = this.roadBuilder.createRoadSegment({
        points,
        width: road.width,
        lanes: road.lanes,
        type: road.type as any,
        hasSidewalk: road.type !== 'motorway' && road.type !== 'service',
        hasLaneMarkings: road.type !== 'service'
      }, road.id);

      roadMesh.parent = roadsParent;
    }

    // 교차로 처리
    this.renderIntersections(roads, roadsParent);
  }

  /**
   * 교차로 렌더링
   */
  private renderIntersections(roads: RoadData[], parent: TransformNode): void {
    // 도로 끝점들을 수집하여 교차점 찾기
    const endpoints: Map<string, Vector3> = new Map();

    for (const road of roads) {
      for (const point of road.points) {
        const key = `${Math.round(point.x / 10) * 10}_${Math.round(point.z / 10) * 10}`;
        if (!endpoints.has(key)) {
          endpoints.set(key, new Vector3(point.x, 0, point.z));
        }
      }
    }

    // 여러 도로가 만나는 지점에 교차로 생성
    let idx = 0;
    for (const [key, pos] of endpoints) {
      // 이 지점에 연결된 도로 수 계산
      let connectedRoads = 0;
      let maxWidth = 0;

      for (const road of roads) {
        for (const point of road.points) {
          if (Math.abs(point.x - pos.x) < 15 && Math.abs(point.z - pos.z) < 15) {
            connectedRoads++;
            maxWidth = Math.max(maxWidth, road.width);
            break;
          }
        }
      }

      // 2개 이상 도로가 만나면 교차로
      if (connectedRoads >= 2) {
        const intersection = this.roadBuilder.createIntersection(pos, maxWidth * 1.5);
        intersection.name = `intersection_${idx++}`;
        intersection.parent = parent;

        // 횡단보도 추가
        if (maxWidth > 10) {
          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
            const cwPos = pos.add(new Vector3(
              Math.sin(angle) * maxWidth * 0.8,
              0,
              Math.cos(angle) * maxWidth * 0.8
            ));
            const cw = this.roadBuilder.createCrosswalk(cwPos, angle, maxWidth * 0.8);
            cw.parent = parent;
          }
        }
      }
    }
  }

  /**
   * 건물 렌더링
   */
  private renderBuildings(buildings: BuildingData[]): void {
    const buildingsParent = new TransformNode('buildings', this.scene);
    buildingsParent.parent = this.mapRoot;

    for (const bld of buildings) {
      const floors = bld.levels || Math.ceil(bld.height / 3);
      const buildingType = this.getBuildingType(bld.type);

      const building = this.buildingGenerator.create({
        width: bld.width,
        depth: bld.depth,
        height: bld.height,
        floors,
        type: buildingType,
        windowDensity: buildingType === 'office' ? 0.9 : 0.7,
        hasRoofStructure: bld.height > 40
      }, new Vector3(bld.x, 0, bld.z), bld.id);

      building.parent = buildingsParent;
    }
  }

  private getBuildingType(type: string): 'office' | 'apartment' | 'retail' | 'commercial' | 'residential' {
    switch (type) {
      case 'office':
      case 'commercial':
        return 'office';
      case 'apartment':
        return 'apartment';
      case 'retail':
        return 'retail';
      case 'school':
      case 'hospital':
        return 'commercial';
      default:
        return 'residential';
    }
  }

  /**
   * 환경 오브젝트 렌더링
   */
  private renderEnvironment(mapData: MapRegion): void {
    const envParent = new TransformNode('environment', this.scene);
    envParent.parent = this.mapRoot;

    // 도로를 따라 가로등 배치
    for (const road of mapData.roads) {
      if (road.type === 'service') continue;

      const spacing = road.type === 'primary' ? 30 : 50;

      for (let i = 0; i < road.points.length - 1; i++) {
        const start = road.points[i];
        const end = road.points[i + 1];
        const dx = end.x - start.x;
        const dz = end.z - start.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const numLights = Math.floor(length / spacing);

        for (let j = 0; j <= numLights; j++) {
          const t = j / Math.max(1, numLights);
          const x = start.x + dx * t;
          const z = start.z + dz * t;

          // 양쪽에 가로등
          const perpX = -dz / length * (road.width / 2 + 2);
          const perpZ = dx / length * (road.width / 2 + 2);

          for (const side of [-1, 1]) {
            const lightPos = new Vector3(
              x + perpX * side,
              0,
              z + perpZ * side
            );

            // 일정 확률로 가로등 배치
            if (Math.random() > 0.3) {
              const streetLight = this.envObjects.createStreetLight(lightPos, 8, true);
              streetLight.parent = envParent;
            }
          }
        }
      }
    }

    // 건물 주변에 나무 배치
    for (const bld of mapData.buildings) {
      if (bld.type === 'apartment' || bld.type === 'school') {
        // 아파트/학교 주변에 나무
        const numTrees = Math.floor(Math.random() * 5 + 3);
        for (let i = 0; i < numTrees; i++) {
          const angle = (i / numTrees) * Math.PI * 2;
          const radius = Math.max(bld.width, bld.depth) * 0.7 + Math.random() * 10;
          const treePos = new Vector3(
            bld.x + Math.cos(angle) * radius,
            0,
            bld.z + Math.sin(angle) * radius
          );

          const tree = this.envObjects.createTree(
            treePos,
            0.8 + Math.random() * 0.4,
            Math.random() > 0.7 ? 'conifer' : 'deciduous'
          );
          tree.parent = envParent;
        }
      }
    }

    // POI 주변 오브젝트
    for (const poi of mapData.pois) {
      const pos = new Vector3(poi.x, 0, poi.z);

      switch (poi.type) {
        case 'subway':
          // 지하철 입구 표지
          // (간단한 박스로 표현)
          break;
        case 'parking':
          // 주차장 주변 벤치
          this.envObjects.createBench(
            pos.add(new Vector3(5, 0, 0)),
            Math.PI / 2
          ).parent = envParent;
          break;
        case 'convenience':
          // 편의점 앞 쓰레기통
          this.envObjects.createTrashCan(
            pos.add(new Vector3(3, 0, 0))
          ).parent = envParent;
          break;
      }
    }

    // 버스 정류장 추가 (주요 도로에)
    let busStopCount = 0;
    for (const road of mapData.roads) {
      if (road.type === 'primary' && busStopCount < 4) {
        const midIdx = Math.floor(road.points.length / 2);
        const point = road.points[midIdx];
        const busStop = this.envObjects.createBusStop(
          new Vector3(point.x + road.width / 2 + 3, 0, point.z),
          Math.PI / 2
        );
        busStop.parent = envParent;
        busStopCount++;
      }
    }
  }

  /**
   * 주차된 차량 렌더링 (장식용)
   */
  private renderParkedVehicles(mapData: MapRegion): void {
    const vehiclesParent = new TransformNode('parked_vehicles', this.scene);
    vehiclesParent.parent = this.mapRoot;

    // 주차장 POI 근처에 차량 배치
    for (const poi of mapData.pois) {
      if (poi.type === 'parking') {
        const numCars = Math.floor(Math.random() * 8 + 4);
        for (let i = 0; i < numCars; i++) {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const carPos = new Vector3(
            poi.x + col * 3 - 4.5,
            0,
            poi.z + row * 6 - 3
          );

          const car = this.envObjects.createParkedCar(
            carPos,
            Math.PI / 2,
            undefined  // 랜덤 색상
          );
          car.parent = vehiclesParent;
        }
      }
    }

    // 도로변에 몇 대 더 배치
    let parkedCount = 0;
    for (const road of mapData.roads) {
      if (road.type === 'residential' && parkedCount < 10) {
        for (const point of road.points) {
          if (Math.random() > 0.7 && parkedCount < 10) {
            const car = this.envObjects.createParkedCar(
              new Vector3(point.x + road.width / 2 + 2, 0, point.z),
              0
            );
            car.parent = vehiclesParent;
            parkedCount++;
          }
        }
      }
    }
  }

  /**
   * 플레이어 차량 모델 생성
   */
  createPlayerVehicle(vehicleType: string, color?: string): TransformNode {
    // 차량 타입에서 바디 타입 추론
    let bodyType: 'sedan' | 'suv' | 'hatchback' | 'sports' | 'truck' | 'bus' | 'van' = 'sedan';

    if (vehicleType.includes('suv') || vehicleType.includes('tucson') ||
        vehicleType.includes('santafe') || vehicleType.includes('palisade') ||
        vehicleType.includes('sorento') || vehicleType.includes('gv')) {
      bodyType = 'suv';
    } else if (vehicleType.includes('avante')) {
      bodyType = 'hatchback';
    } else if (vehicleType.includes('stinger') || vehicleType.includes('g70')) {
      bodyType = 'sports';
    } else if (vehicleType.includes('ev6') || vehicleType.includes('ioniq')) {
      bodyType = 'hatchback';
    } else if (vehicleType.includes('carnival')) {
      bodyType = 'van';
    }

    return this.vehicleModel.create({
      type: bodyType,
      length: 4.8,
      width: 1.85,
      height: bodyType === 'suv' ? 1.7 : 1.45,
      wheelBase: 2.85,
      color: color || 'car_white'
    }, 'player_vehicle');
  }

  /**
   * 스카이박스 시간 설정
   */
  setSkyboxTime(hour: number): void {
    this.skybox.setTimeFromHour(hour);
  }

  /**
   * MaterialManager 반환
   */
  getMaterials(): MaterialManager {
    return this.materials;
  }

  /**
   * 정리
   */
  dispose(): void {
    this.mapRoot?.dispose();
    this.skybox.dispose();
    this.materials.dispose();
  }
}
