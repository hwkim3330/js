/**
 * 한국 실제 맵 로더
 *
 * OpenStreetMap 데이터를 기반으로 실제 한국 도로 생성
 * 용인, 서울 등 실제 지역 지원
 */

import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, Mesh } from '@babylonjs/core';

// 한국 주요 지역 좌표 (WGS84)
export const KOREA_REGIONS = {
  // 서울
  'seoul-gangnam': { lat: 37.4979, lon: 127.0276, name: '강남역' },
  'seoul-jamsil': { lat: 37.5133, lon: 127.1001, name: '잠실' },
  'seoul-hongdae': { lat: 37.5563, lon: 126.9236, name: '홍대' },
  'seoul-yeouido': { lat: 37.5219, lon: 126.9245, name: '여의도' },
  'seoul-gwanghwamun': { lat: 37.5760, lon: 126.9769, name: '광화문' },

  // 용인
  'yongin-suji': { lat: 37.3219, lon: 127.0886, name: '수지구' },
  'yongin-giheung': { lat: 37.2750, lon: 127.1159, name: '기흥구' },
  'yongin-cheoin': { lat: 37.2343, lon: 127.2012, name: '처인구' },
  'yongin-everland': { lat: 37.2933, lon: 127.2025, name: '에버랜드' },

  // 기타 주요 도시
  'busan-haeundae': { lat: 35.1587, lon: 129.1604, name: '해운대' },
  'incheon-songdo': { lat: 37.3918, lon: 126.6399, name: '송도' },
  'daejeon-dunsan': { lat: 36.3520, lon: 127.3780, name: '둔산동' }
};

export interface RoadSegment {
  id: string;
  name: string;
  type: 'highway' | 'primary' | 'secondary' | 'residential' | 'service';
  lanes: number;
  speedLimit: number;  // km/h
  points: Vector3[];
  width: number;
}

export interface Building {
  id: string;
  name?: string;
  type: string;
  position: Vector3;
  width: number;
  depth: number;
  height: number;
}

export interface MapData {
  region: string;
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  roads: RoadSegment[];
  buildings: Building[];
}

export class KoreaMapLoader {
  private scene: Scene;
  private originLat: number = 0;
  private originLon: number = 0;
  private metersPerDegLat: number = 111320;
  private metersPerDegLon: number = 88000;  // 위도 37도 근처

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * OpenStreetMap Overpass API로 지역 데이터 가져오기
   */
  async loadRegion(regionKey: string, radius: number = 500): Promise<MapData> {
    const region = KOREA_REGIONS[regionKey as keyof typeof KOREA_REGIONS];
    if (!region) {
      throw new Error(`Unknown region: ${regionKey}`);
    }

    this.originLat = region.lat;
    this.originLon = region.lon;

    // Overpass API 쿼리
    const bbox = this.calculateBBox(region.lat, region.lon, radius);
    const query = this.buildOverpassQuery(bbox);

    console.log(`📍 Loading map: ${region.name} (${regionKey})`);

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const osmData = await response.json();
      return this.parseOSMData(osmData, regionKey, bbox);
    } catch (error) {
      console.warn('⚠️ OSM 데이터 로드 실패, 테스트 맵 생성:', error);
      return this.generateTestMap(regionKey, bbox);
    }
  }

  /**
   * Bounding box 계산
   */
  private calculateBBox(lat: number, lon: number, radiusMeters: number): {
    minLat: number; maxLat: number; minLon: number; maxLon: number
  } {
    const latDelta = radiusMeters / this.metersPerDegLat;
    const lonDelta = radiusMeters / this.metersPerDegLon;

    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLon: lon - lonDelta,
      maxLon: lon + lonDelta
    };
  }

  /**
   * Overpass API 쿼리 생성
   */
  private buildOverpassQuery(bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number }): string {
    const bboxStr = `${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}`;

    return `
      [out:json][timeout:25];
      (
        way["highway"](${bboxStr});
        way["building"](${bboxStr});
      );
      out body;
      >;
      out skel qt;
    `;
  }

  /**
   * OSM 데이터 파싱
   */
  private parseOSMData(
    osmData: any,
    regionKey: string,
    bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number }
  ): MapData {
    const nodes = new Map<number, { lat: number; lon: number }>();
    const roads: RoadSegment[] = [];
    const buildings: Building[] = [];

    // 노드 인덱싱
    for (const element of osmData.elements) {
      if (element.type === 'node') {
        nodes.set(element.id, { lat: element.lat, lon: element.lon });
      }
    }

    // Way 처리
    for (const element of osmData.elements) {
      if (element.type === 'way') {
        if (element.tags?.highway) {
          const road = this.parseRoad(element, nodes);
          if (road) roads.push(road);
        } else if (element.tags?.building) {
          const building = this.parseBuilding(element, nodes);
          if (building) buildings.push(building);
        }
      }
    }

    console.log(`✅ Loaded ${roads.length} roads, ${buildings.length} buildings`);

    return { region: regionKey, bounds: bbox, roads, buildings };
  }

  /**
   * 도로 파싱
   */
  private parseRoad(
    way: any,
    nodes: Map<number, { lat: number; lon: number }>
  ): RoadSegment | null {
    const points: Vector3[] = [];

    for (const nodeId of way.nodes) {
      const node = nodes.get(nodeId);
      if (node) {
        points.push(this.latLonToVector3(node.lat, node.lon));
      }
    }

    if (points.length < 2) return null;

    const highwayType = way.tags.highway;
    const roadConfig = this.getRoadConfig(highwayType);

    return {
      id: `road_${way.id}`,
      name: way.tags.name || highwayType,
      type: roadConfig.type,
      lanes: way.tags.lanes ? parseInt(way.tags.lanes) : roadConfig.defaultLanes,
      speedLimit: way.tags.maxspeed ? parseInt(way.tags.maxspeed) : roadConfig.defaultSpeed,
      points,
      width: roadConfig.width
    };
  }

  /**
   * 도로 타입별 설정
   */
  private getRoadConfig(highwayType: string): {
    type: RoadSegment['type'];
    defaultLanes: number;
    defaultSpeed: number;
    width: number;
  } {
    switch (highwayType) {
      case 'motorway':
      case 'trunk':
        return { type: 'highway', defaultLanes: 4, defaultSpeed: 100, width: 14 };
      case 'primary':
        return { type: 'primary', defaultLanes: 2, defaultSpeed: 60, width: 10 };
      case 'secondary':
        return { type: 'secondary', defaultLanes: 2, defaultSpeed: 50, width: 8 };
      case 'residential':
        return { type: 'residential', defaultLanes: 1, defaultSpeed: 30, width: 6 };
      default:
        return { type: 'service', defaultLanes: 1, defaultSpeed: 20, width: 4 };
    }
  }

  /**
   * 건물 파싱
   */
  private parseBuilding(
    way: any,
    nodes: Map<number, { lat: number; lon: number }>
  ): Building | null {
    const coords: Vector3[] = [];

    for (const nodeId of way.nodes) {
      const node = nodes.get(nodeId);
      if (node) {
        coords.push(this.latLonToVector3(node.lat, node.lon));
      }
    }

    if (coords.length < 3) return null;

    // 건물 중심점과 크기 계산
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const coord of coords) {
      minX = Math.min(minX, coord.x);
      maxX = Math.max(maxX, coord.x);
      minZ = Math.min(minZ, coord.z);
      maxZ = Math.max(maxZ, coord.z);
    }

    const width = maxX - minX;
    const depth = maxZ - minZ;
    const height = way.tags['building:levels']
      ? parseInt(way.tags['building:levels']) * 3
      : Math.random() * 20 + 10;

    return {
      id: `building_${way.id}`,
      name: way.tags.name,
      type: way.tags.building,
      position: new Vector3((minX + maxX) / 2, height / 2, (minZ + maxZ) / 2),
      width,
      depth,
      height
    };
  }

  /**
   * 위경도를 3D 좌표로 변환
   */
  private latLonToVector3(lat: number, lon: number): Vector3 {
    const x = (lon - this.originLon) * this.metersPerDegLon;
    const z = (lat - this.originLat) * this.metersPerDegLat;
    return new Vector3(x, 0, z);
  }

  /**
   * 테스트 맵 생성 (API 실패시)
   */
  private generateTestMap(
    regionKey: string,
    bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number }
  ): MapData {
    const roads: RoadSegment[] = [];
    const buildings: Building[] = [];

    // 테스트 도로 생성 (격자 패턴)
    for (let i = -2; i <= 2; i++) {
      // 동서 도로
      roads.push({
        id: `test_road_ew_${i}`,
        name: `테스트 도로 ${i}`,
        type: 'primary',
        lanes: 2,
        speedLimit: 50,
        points: [
          new Vector3(-500, 0, i * 100),
          new Vector3(500, 0, i * 100)
        ],
        width: 10
      });

      // 남북 도로
      roads.push({
        id: `test_road_ns_${i}`,
        name: `테스트 도로 ${i}`,
        type: 'secondary',
        lanes: 2,
        speedLimit: 40,
        points: [
          new Vector3(i * 100, 0, -500),
          new Vector3(i * 100, 0, 500)
        ],
        width: 8
      });
    }

    // 테스트 건물 생성
    for (let x = -4; x <= 4; x++) {
      for (let z = -4; z <= 4; z++) {
        if (Math.abs(x) % 2 === 1 || Math.abs(z) % 2 === 1) continue;

        const height = Math.random() * 30 + 15;
        buildings.push({
          id: `test_building_${x}_${z}`,
          name: `건물 ${x},${z}`,
          type: 'commercial',
          position: new Vector3(x * 100 + 50, height / 2, z * 100 + 50),
          width: 40 + Math.random() * 20,
          depth: 40 + Math.random() * 20,
          height
        });
      }
    }

    return { region: regionKey, bounds: bbox, roads, buildings };
  }

  /**
   * 맵 데이터를 3D 메시로 렌더링
   */
  renderMap(mapData: MapData): void {
    // 지면 생성
    const ground = MeshBuilder.CreateGround('ground', {
      width: 1200,
      height: 1200
    }, this.scene);

    const groundMat = new StandardMaterial('groundMat', this.scene);
    groundMat.diffuseColor = new Color3(0.3, 0.4, 0.3); // 잔디색
    ground.material = groundMat;

    // 도로 렌더링
    const roadMat = new StandardMaterial('roadMat', this.scene);
    roadMat.diffuseColor = new Color3(0.2, 0.2, 0.2); // 아스팔트

    for (const road of mapData.roads) {
      this.renderRoad(road, roadMat);
    }

    // 건물 렌더링
    const buildingMat = new StandardMaterial('buildingMat', this.scene);
    buildingMat.diffuseColor = new Color3(0.6, 0.6, 0.7);

    for (const building of mapData.buildings) {
      this.renderBuilding(building, buildingMat);
    }

    console.log(`✅ Map rendered: ${mapData.region}`);
  }

  /**
   * 도로 메시 생성
   */
  private renderRoad(road: RoadSegment, material: StandardMaterial): void {
    for (let i = 0; i < road.points.length - 1; i++) {
      const start = road.points[i];
      const end = road.points[i + 1];

      const direction = end.subtract(start);
      const length = direction.length();
      const center = start.add(direction.scale(0.5));

      const roadMesh = MeshBuilder.CreateBox(`${road.id}_${i}`, {
        width: road.width,
        height: 0.1,
        depth: length
      }, this.scene);

      roadMesh.position = center.add(new Vector3(0, 0.05, 0));
      roadMesh.rotation.y = Math.atan2(direction.x, direction.z);
      roadMesh.material = material;
    }
  }

  /**
   * 건물 메시 생성
   */
  private renderBuilding(building: Building, material: StandardMaterial): void {
    const mesh = MeshBuilder.CreateBox(building.id, {
      width: building.width,
      height: building.height,
      depth: building.depth
    }, this.scene);

    mesh.position = building.position;
    mesh.material = material;
  }
}
