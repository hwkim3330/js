/**
 * Minimap - 미니맵 UI
 *
 * 상단 우측에 표시되는 미니맵
 * - 현재 위치 표시
 * - 도로 표시
 * - 다른 차량 표시
 * - 줌 인/아웃
 */

export interface MinimapConfig {
  container: HTMLElement;
  size: number;
  zoom: number;
  showTraffic: boolean;
  showPOI: boolean;
}

interface MapMarker {
  id: string;
  x: number;
  z: number;
  type: 'player' | 'ai_vehicle' | 'poi' | 'traffic_light';
  rotation?: number;
  color?: string;
}

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: MinimapConfig;

  private playerPosition = { x: 0, z: 0 };
  private playerRotation = 0;
  private markers: Map<string, MapMarker> = new Map();

  // 맵 데이터
  private roads: { x1: number; z1: number; x2: number; z2: number; width: number }[] = [];

  constructor(config: Partial<MinimapConfig> = {}) {
    this.config = {
      container: config.container || document.body,
      size: config.size || 200,
      zoom: config.zoom || 0.2,  // 1 unit = 0.2 pixels
      showTraffic: config.showTraffic ?? true,
      showPOI: config.showPOI ?? true
    };

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.size;
    this.canvas.height = this.config.size;
    this.canvas.style.cssText = `
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,0.3);
      background: rgba(20, 30, 40, 0.8);
    `;

    this.ctx = this.canvas.getContext('2d')!;
    this.config.container.appendChild(this.canvas);

    // 기본 도로 데이터 추가
    this.initDefaultRoads();
  }

  private initDefaultRoads(): void {
    // 격자 도로
    for (let i = -5; i <= 5; i++) {
      // 동서 도로
      this.roads.push({
        x1: -600, z1: i * 100,
        x2: 600, z2: i * 100,
        width: 8
      });
      // 남북 도로
      this.roads.push({
        x1: i * 100, z1: -600,
        x2: i * 100, z2: 600,
        width: 8
      });
    }
  }

  /**
   * 플레이어 위치 업데이트
   */
  setPlayerPosition(x: number, z: number, rotation: number): void {
    this.playerPosition = { x, z };
    this.playerRotation = rotation;
  }

  /**
   * 마커 추가/업데이트
   */
  setMarker(marker: MapMarker): void {
    this.markers.set(marker.id, marker);
  }

  /**
   * 마커 제거
   */
  removeMarker(id: string): void {
    this.markers.delete(id);
  }

  /**
   * 도로 데이터 설정
   */
  setRoads(roads: typeof this.roads): void {
    this.roads = roads;
  }

  /**
   * 미니맵 렌더링
   */
  render(): void {
    const ctx = this.ctx;
    const size = this.config.size;
    const center = size / 2;
    const zoom = this.config.zoom;

    // 클리어
    ctx.clearRect(0, 0, size, size);

    // 원형 클리핑
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, Math.PI * 2);
    ctx.clip();

    // 배경
    ctx.fillStyle = 'rgba(30, 40, 50, 0.9)';
    ctx.fillRect(0, 0, size, size);

    // 좌표 변환 (플레이어 중심)
    ctx.translate(center, center);
    ctx.rotate(-this.playerRotation);  // 플레이어 방향이 위를 향하도록

    // 도로 렌더링
    ctx.strokeStyle = '#4a5568';
    ctx.lineCap = 'round';

    for (const road of this.roads) {
      const x1 = (road.x1 - this.playerPosition.x) * zoom;
      const z1 = (road.z1 - this.playerPosition.z) * zoom;
      const x2 = (road.x2 - this.playerPosition.x) * zoom;
      const z2 = (road.z2 - this.playerPosition.z) * zoom;

      // 화면 밖이면 스킵
      if (Math.abs(x1) > size && Math.abs(x2) > size) continue;
      if (Math.abs(z1) > size && Math.abs(z2) > size) continue;

      ctx.lineWidth = road.width * zoom;
      ctx.beginPath();
      ctx.moveTo(x1, -z1);
      ctx.lineTo(x2, -z2);
      ctx.stroke();
    }

    // 마커 렌더링
    for (const marker of this.markers.values()) {
      const x = (marker.x - this.playerPosition.x) * zoom;
      const z = (marker.z - this.playerPosition.z) * zoom;

      // 화면 밖이면 스킵
      if (Math.abs(x) > center || Math.abs(z) > center) continue;

      ctx.save();
      ctx.translate(x, -z);

      if (marker.rotation !== undefined) {
        ctx.rotate(marker.rotation - this.playerRotation);
      }

      switch (marker.type) {
        case 'ai_vehicle':
          ctx.fillStyle = marker.color || '#60a5fa';
          ctx.fillRect(-3, -5, 6, 10);
          break;

        case 'traffic_light':
          ctx.fillStyle = marker.color || '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'poi':
          ctx.fillStyle = marker.color || '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(4, 2);
          ctx.lineTo(-4, 2);
          ctx.closePath();
          ctx.fill();
          break;
      }

      ctx.restore();
    }

    ctx.restore();

    // 플레이어 아이콘 (항상 중앙, 위를 향함)
    ctx.save();
    ctx.translate(center, center);

    // 플레이어 차량 (삼각형)
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, 8);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();

    // 방향 표시
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, -20);
    ctx.stroke();

    ctx.restore();

    // 나침반 (북쪽 표시)
    ctx.save();
    ctx.translate(size - 20, 20);
    ctx.rotate(-this.playerRotation);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', 0, 4);

    ctx.restore();

    // 줌 레벨 표시
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(1/zoom)}m`, 8, size - 8);
  }

  /**
   * 줌 설정
   */
  setZoom(zoom: number): void {
    this.config.zoom = Math.max(0.05, Math.min(1, zoom));
  }

  /**
   * 정리
   */
  dispose(): void {
    this.canvas.remove();
  }
}
