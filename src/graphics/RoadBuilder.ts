/**
 * RoadBuilder - 고급 도로 생성
 *
 * 차선, 횡단보도, 교차로가 있는 현실적인 도로
 */

import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  VertexData,
  Color3
} from '@babylonjs/core';
import { MaterialManager } from './MaterialManager';

export interface RoadConfig {
  points: Vector3[];
  width: number;
  lanes: number;
  type: 'motorway' | 'primary' | 'secondary' | 'residential' | 'service';
  hasSidewalk?: boolean;
  hasLaneMarkings?: boolean;
  speedLimit?: number;
}

export class RoadBuilder {
  private scene: Scene;
  private materials: MaterialManager;

  constructor(scene: Scene, materials: MaterialManager) {
    this.scene = scene;
    this.materials = materials;
  }

  /**
   * 도로 세그먼트 생성
   */
  createRoadSegment(config: RoadConfig, name: string): Mesh {
    const {
      points,
      width,
      lanes,
      type,
      hasSidewalk = type !== 'motorway',
      hasLaneMarkings = true
    } = config;

    const parent = new Mesh(`${name}_road`, this.scene);

    // 각 세그먼트 생성
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const segName = `${name}_seg_${i}`;

      // 도로 본체
      const roadMesh = this.createRoadSurface(segName, start, end, width);
      roadMesh.parent = parent;

      // 차선 표시
      if (hasLaneMarkings) {
        const markings = this.createLaneMarkings(segName, start, end, width, lanes, type);
        for (const marking of markings) {
          marking.parent = parent;
        }
      }

      // 인도
      if (hasSidewalk) {
        const sidewalks = this.createSidewalks(segName, start, end, width);
        for (const sw of sidewalks) {
          sw.parent = parent;
        }
      }
    }

    return parent;
  }

  /**
   * 도로 표면 생성
   */
  private createRoadSurface(name: string, start: Vector3, end: Vector3, width: number): Mesh {
    const direction = end.subtract(start);
    const length = direction.length();
    const center = start.add(direction.scale(0.5));

    const road = MeshBuilder.CreateBox(`${name}_surface`, {
      width,
      height: 0.1,
      depth: length
    }, this.scene);

    road.position = center.clone();
    road.position.y = 0.05;
    road.rotation.y = Math.atan2(direction.x, direction.z);
    road.material = this.materials.getMaterial('road_asphalt')!;

    return road;
  }

  /**
   * 차선 표시 생성
   */
  private createLaneMarkings(
    name: string,
    start: Vector3,
    end: Vector3,
    roadWidth: number,
    lanes: number,
    type: string
  ): Mesh[] {
    const meshes: Mesh[] = [];
    const direction = end.subtract(start);
    const length = direction.length();
    const center = start.add(direction.scale(0.5));
    const angle = Math.atan2(direction.x, direction.z);

    const laneWidth = roadWidth / lanes;
    const lineWidth = 0.15;
    const lineHeight = 0.02;

    // 중앙선 (노란색, 실선)
    if (lanes >= 2) {
      const centerLine = MeshBuilder.CreateBox(`${name}_centerline`, {
        width: lineWidth,
        height: lineHeight,
        depth: length
      }, this.scene);
      centerLine.position = center.clone();
      centerLine.position.y = 0.11;
      centerLine.rotation.y = angle;
      centerLine.material = this.materials.getMaterial('road_lane_yellow')!;
      meshes.push(centerLine);
    }

    // 차선 구분선 (흰색, 점선)
    const dashLength = 3;
    const gapLength = 5;
    const numDashes = Math.floor(length / (dashLength + gapLength));

    for (let lane = 1; lane < lanes; lane++) {
      if (lane === Math.floor(lanes / 2)) continue; // 중앙선 위치 스킵

      const offset = (lane - lanes / 2) * laneWidth;

      for (let d = 0; d < numDashes; d++) {
        const dashStart = d * (dashLength + gapLength);
        const dashCenter = dashStart + dashLength / 2;
        const t = dashCenter / length;

        const dashPos = start.add(direction.scale(t));

        const dash = MeshBuilder.CreateBox(`${name}_dash_${lane}_${d}`, {
          width: lineWidth,
          height: lineHeight,
          depth: dashLength
        }, this.scene);

        // 오프셋 적용 (도로 방향에 수직)
        const perpX = -Math.sin(angle + Math.PI / 2) * offset;
        const perpZ = -Math.cos(angle + Math.PI / 2) * offset;

        dash.position = new Vector3(
          dashPos.x + perpX,
          0.11,
          dashPos.z + perpZ
        );
        dash.rotation.y = angle;
        dash.material = this.materials.getMaterial('road_lane_white')!;
        meshes.push(dash);
      }
    }

    // 가장자리선 (흰색, 실선)
    for (const side of [-1, 1]) {
      const edgeLine = MeshBuilder.CreateBox(`${name}_edge_${side}`, {
        width: lineWidth,
        height: lineHeight,
        depth: length
      }, this.scene);

      const edgeOffset = (roadWidth / 2 - 0.3) * side;
      const perpX = -Math.sin(angle + Math.PI / 2) * edgeOffset;
      const perpZ = -Math.cos(angle + Math.PI / 2) * edgeOffset;

      edgeLine.position = new Vector3(
        center.x + perpX,
        0.11,
        center.z + perpZ
      );
      edgeLine.rotation.y = angle;
      edgeLine.material = this.materials.getMaterial('road_lane_white')!;
      meshes.push(edgeLine);
    }

    return meshes;
  }

  /**
   * 인도 생성
   */
  private createSidewalks(name: string, start: Vector3, end: Vector3, roadWidth: number): Mesh[] {
    const meshes: Mesh[] = [];
    const direction = end.subtract(start);
    const length = direction.length();
    const center = start.add(direction.scale(0.5));
    const angle = Math.atan2(direction.x, direction.z);

    const sidewalkWidth = 3;
    const sidewalkHeight = 0.15;
    const curbHeight = 0.12;

    for (const side of [-1, 1]) {
      const offset = (roadWidth / 2 + sidewalkWidth / 2 + 0.3) * side;
      const perpX = -Math.sin(angle + Math.PI / 2) * offset;
      const perpZ = -Math.cos(angle + Math.PI / 2) * offset;

      // 인도 본체
      const sidewalk = MeshBuilder.CreateBox(`${name}_sidewalk_${side}`, {
        width: sidewalkWidth,
        height: sidewalkHeight,
        depth: length
      }, this.scene);
      sidewalk.position = new Vector3(
        center.x + perpX,
        sidewalkHeight / 2 + curbHeight,
        center.z + perpZ
      );
      sidewalk.rotation.y = angle;
      sidewalk.material = this.materials.getMaterial('sidewalk')!;
      meshes.push(sidewalk);

      // 연석 (curb)
      const curbOffset = (roadWidth / 2 + 0.15) * side;
      const curbPerpX = -Math.sin(angle + Math.PI / 2) * curbOffset;
      const curbPerpZ = -Math.cos(angle + Math.PI / 2) * curbOffset;

      const curb = MeshBuilder.CreateBox(`${name}_curb_${side}`, {
        width: 0.3,
        height: curbHeight,
        depth: length
      }, this.scene);
      curb.position = new Vector3(
        center.x + curbPerpX,
        curbHeight / 2,
        center.z + curbPerpZ
      );
      curb.rotation.y = angle;
      curb.material = this.materials.getMaterial('building_concrete')!;
      meshes.push(curb);
    }

    return meshes;
  }

  /**
   * 횡단보도 생성
   */
  createCrosswalk(position: Vector3, rotation: number, width: number): Mesh {
    const crosswalk = MeshBuilder.CreateBox('crosswalk', {
      width,
      height: 0.02,
      depth: 4
    }, this.scene);

    crosswalk.position = position.clone();
    crosswalk.position.y = 0.12;
    crosswalk.rotation.y = rotation;
    crosswalk.material = this.materials.getMaterial('road_crosswalk')!;

    return crosswalk;
  }

  /**
   * 교차로 생성
   */
  createIntersection(position: Vector3, size: number): Mesh {
    const intersection = MeshBuilder.CreateBox('intersection', {
      width: size,
      height: 0.1,
      depth: size
    }, this.scene);

    intersection.position = position.clone();
    intersection.position.y = 0.05;
    intersection.material = this.materials.getMaterial('road_asphalt')!;

    return intersection;
  }

  /**
   * 정지선 생성
   */
  createStopLine(position: Vector3, rotation: number, width: number): Mesh {
    const stopLine = MeshBuilder.CreateBox('stopline', {
      width,
      height: 0.02,
      depth: 0.5
    }, this.scene);

    stopLine.position = position.clone();
    stopLine.position.y = 0.12;
    stopLine.rotation.y = rotation;
    stopLine.material = this.materials.getMaterial('road_lane_white')!;

    return stopLine;
  }
}
