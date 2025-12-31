/**
 * HUD - 헤드업 디스플레이
 *
 * 게임 내 UI 요소 관리
 * - 속도계
 * - 타코미터
 * - 기어 표시
 * - 연료 게이지
 * - 시간/날씨 표시
 * - 알림 메시지
 */

export interface HUDElements {
  speedometer?: HTMLElement | null;
  tachometer?: HTMLElement | null;
  gear?: HTMLElement | null;
  fuel?: HTMLElement | null;
  time?: HTMLElement | null;
  weather?: HTMLElement | null;
  notification?: HTMLElement | null;
  fps?: HTMLElement | null;
  vehicleInfo?: HTMLElement | null;
  mapInfo?: HTMLElement | null;
  cameraMode?: HTMLElement | null;
}

export interface VehicleData {
  speed: number;
  rpm: number;
  gear: number;
  fuel: number;
  name: string;
}

export interface EnvironmentData {
  time: number;
  weather: string;
  location: string;
}

export class HUD {
  private elements: HUDElements;
  private notificationQueue: { message: string; duration: number; type: string }[] = [];
  private currentNotification: { message: string; timeout: number } | null = null;

  private lastFPSUpdate: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;

  constructor() {
    this.elements = {
      speedometer: document.getElementById('speedometer'),
      tachometer: document.getElementById('tachometer'),
      gear: document.getElementById('gear'),
      fuel: document.getElementById('fuel'),
      time: document.getElementById('time'),
      weather: document.getElementById('weather'),
      notification: document.getElementById('notification'),
      fps: document.getElementById('fps'),
      vehicleInfo: document.getElementById('vehicle-info'),
      mapInfo: document.getElementById('map-info'),
      cameraMode: document.getElementById('camera-mode')
    };

    this.createNotificationElement();
  }

  private createNotificationElement(): void {
    if (!this.elements.notification) {
      const el = document.createElement('div');
      el.id = 'notification';
      el.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
        z-index: 1000;
      `;
      document.body.appendChild(el);
      this.elements.notification = el;
    }
  }

  /**
   * 차량 데이터 업데이트
   */
  updateVehicle(data: VehicleData): void {
    // 속도
    if (this.elements.speedometer) {
      this.elements.speedometer.textContent = `${Math.round(data.speed)}`;
    }

    // RPM
    if (this.elements.tachometer) {
      this.elements.tachometer.textContent = `${Math.round(data.rpm)} RPM`;
    }

    // 기어
    if (this.elements.gear) {
      const gearText = data.gear === 0 ? 'R' :
                       data.gear === -1 ? 'N' : data.gear.toString();
      this.elements.gear.textContent = gearText;
    }

    // 연료
    if (this.elements.fuel) {
      const fuelPercent = Math.round(data.fuel * 100);
      this.elements.fuel.textContent = `⛽ ${fuelPercent}%`;

      // 연료 부족 경고
      if (data.fuel < 0.2) {
        this.elements.fuel.style.color = '#ef4444';
      } else {
        this.elements.fuel.style.color = '';
      }
    }

    // 차량 정보
    if (this.elements.vehicleInfo) {
      this.elements.vehicleInfo.textContent = data.name;
    }
  }

  /**
   * 환경 데이터 업데이트
   */
  updateEnvironment(data: EnvironmentData): void {
    // 시간
    if (this.elements.time) {
      const hours = Math.floor(data.time);
      const minutes = Math.floor((data.time % 1) * 60);
      this.elements.time.textContent =
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // 날씨
    if (this.elements.weather) {
      const weatherIcons: Record<string, string> = {
        'clear': '☀️',
        'cloudy': '☁️',
        'rain': '🌧️',
        'snow': '❄️',
        'fog': '🌫️'
      };
      this.elements.weather.textContent = weatherIcons[data.weather] || '☀️';
    }

    // 위치
    if (this.elements.mapInfo) {
      this.elements.mapInfo.textContent = `📍 ${data.location}`;
    }
  }

  /**
   * 카메라 모드 업데이트
   */
  updateCameraMode(mode: string): void {
    if (this.elements.cameraMode) {
      const modeNames: Record<string, string> = {
        'chase': '추적',
        'cockpit': '콕핏',
        'free': '자유',
        'top': '탑뷰',
        'rear': '후방'
      };
      this.elements.cameraMode.textContent = modeNames[mode] || mode;
    }
  }

  /**
   * 알림 메시지 표시
   */
  notify(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 3000): void {
    this.notificationQueue.push({ message, duration, type });
    this.processNotificationQueue();
  }

  private processNotificationQueue(): void {
    if (this.currentNotification || this.notificationQueue.length === 0) return;

    const { message, duration, type } = this.notificationQueue.shift()!;

    if (this.elements.notification) {
      const colors: Record<string, string> = {
        'info': '#3b82f6',
        'success': '#22c55e',
        'warning': '#f59e0b',
        'error': '#ef4444'
      };

      this.elements.notification.textContent = message;
      this.elements.notification.style.borderLeft = `4px solid ${colors[type]}`;
      this.elements.notification.style.opacity = '1';

      this.currentNotification = {
        message,
        timeout: window.setTimeout(() => {
          if (this.elements.notification) {
            this.elements.notification.style.opacity = '0';
          }
          this.currentNotification = null;
          this.processNotificationQueue();
        }, duration)
      };
    }
  }

  /**
   * FPS 업데이트
   */
  updateFPS(): void {
    this.frameCount++;
    const now = performance.now();

    if (now - this.lastFPSUpdate > 1000) {
      this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFPSUpdate));
      this.frameCount = 0;
      this.lastFPSUpdate = now;

      if (this.elements.fps) {
        this.elements.fps.textContent = `${this.fps} FPS`;
      }
    }
  }

  /**
   * 로딩 화면 숨기기
   */
  hideLoading(): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }
  }

  /**
   * 로딩 화면 표시
   */
  showLoading(message?: string): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.remove('hidden');
      if (message) {
        const p = loading.querySelector('p');
        if (p) p.textContent = message;
      }
    }
  }

  /**
   * 정리
   */
  dispose(): void {
    if (this.currentNotification) {
      clearTimeout(this.currentNotification.timeout);
    }
    this.notificationQueue = [];
  }
}
