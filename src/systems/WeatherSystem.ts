/**
 * WeatherSystem - 날씨 시스템
 *
 * 날씨 효과 및 시간대 관리
 * - 맑음, 흐림, 비, 눈, 안개
 * - 낮/밤 사이클
 * - 조명 자동 조절
 */

import {
  Scene,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  ParticleSystem,
  Texture,
  MeshBuilder,
  StandardMaterial,
  GlowLayer
} from '@babylonjs/core';
import { GameWorld, ISystem } from '../core/GameWorld';

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

interface WeatherConfig {
  type: WeatherType;
  intensity: number;  // 0-1
  windSpeed: number;  // m/s
  windDirection: number;  // radians
}

interface TimeConfig {
  hour: number;  // 0-24
  dayLengthMinutes: number;  // 실제 분 단위 하루 길이
}

// 시간대별 조명 설정
const TIME_LIGHTING: Record<TimeOfDay, {
  ambient: Color3;
  sun: Color3;
  sunIntensity: number;
  ambientIntensity: number;
  skyColor: Color4;
}> = {
  dawn: {
    ambient: new Color3(0.6, 0.5, 0.5),
    sun: new Color3(1, 0.7, 0.5),
    sunIntensity: 0.4,
    ambientIntensity: 0.3,
    skyColor: new Color4(0.9, 0.6, 0.5, 1)
  },
  day: {
    ambient: new Color3(0.8, 0.85, 1),
    sun: new Color3(1, 0.98, 0.9),
    sunIntensity: 1.0,
    ambientIntensity: 0.6,
    skyColor: new Color4(0.5, 0.7, 1, 1)
  },
  dusk: {
    ambient: new Color3(0.6, 0.4, 0.5),
    sun: new Color3(1, 0.5, 0.3),
    sunIntensity: 0.5,
    ambientIntensity: 0.3,
    skyColor: new Color4(0.9, 0.4, 0.3, 1)
  },
  night: {
    ambient: new Color3(0.1, 0.1, 0.2),
    sun: new Color3(0.3, 0.3, 0.5),
    sunIntensity: 0.1,
    ambientIntensity: 0.15,
    skyColor: new Color4(0.05, 0.05, 0.15, 1)
  }
};

export class WeatherSystem implements ISystem {
  name = 'WeatherSystem';
  priority = 10;

  private world!: GameWorld;
  private scene!: Scene;

  // 조명
  private ambientLight!: HemisphericLight;
  private sunLight!: DirectionalLight;
  private glowLayer!: GlowLayer;

  // 파티클 시스템
  private rainParticles: ParticleSystem | null = null;
  private snowParticles: ParticleSystem | null = null;

  // 현재 상태
  private weather: WeatherConfig = {
    type: 'clear',
    intensity: 0,
    windSpeed: 0,
    windDirection: 0
  };

  private time: TimeConfig = {
    hour: 12,  // 정오 시작
    dayLengthMinutes: 24  // 24분 = 하루
  };

  private targetWeather: WeatherConfig | null = null;
  private weatherTransitionTime: number = 0;

  async init(world: GameWorld): Promise<void> {
    this.world = world;
    this.scene = world.getScene();

    this.setupLighting();
    this.setupParticles();
    this.updateLighting();

    console.log('🌤️ Weather system initialized');
  }

  private setupLighting(): void {
    // 환경광
    this.ambientLight = new HemisphericLight(
      'ambient',
      new Vector3(0, 1, 0),
      this.scene
    );

    // 태양광
    this.sunLight = new DirectionalLight(
      'sun',
      new Vector3(-1, -2, -1).normalize(),
      this.scene
    );
    this.sunLight.position = new Vector3(100, 200, 100);

    // 글로우 효과 (차량 헤드라이트 등)
    this.glowLayer = new GlowLayer('glow', this.scene);
    this.glowLayer.intensity = 0.5;
  }

  private setupParticles(): void {
    // 비 파티클
    this.rainParticles = new ParticleSystem('rain', 5000, this.scene);
    this.rainParticles.particleTexture = new Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAgCAYAAAA1zNleAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QzRBMDlFNEMxRDMwMTFFMzk0QzRGRUNBMDBDMjc2MDQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QzRBMDlFNEQxRDMwMTFFMzk0QzRGRUNBMDBDMjc2MDQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpDNEEwOUU0QTFEMzAxMUUzOTRDNEZFQ0EwMEMyNzYwNCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpDNEEwOUU0QjFEMzAxMUUzOTRDNEZFQ0EwMEMyNzYwNCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PqR/2EIAAAA2SURBVHjaYvz//z8DEwMDAwMjIxMDGDBBaAbGASLm/58JSTKEMCMzMwsTAwMT42h8DF8ACDAAnPYIFT/lgkMAAAAASUVORK5CYII=', this.scene);
    this.rainParticles.emitter = Vector3.Zero();
    this.rainParticles.minEmitBox = new Vector3(-50, 50, -50);
    this.rainParticles.maxEmitBox = new Vector3(50, 50, 50);
    this.rainParticles.color1 = new Color4(0.7, 0.8, 1, 0.8);
    this.rainParticles.color2 = new Color4(0.5, 0.6, 0.8, 0.5);
    this.rainParticles.minSize = 0.05;
    this.rainParticles.maxSize = 0.1;
    this.rainParticles.minLifeTime = 0.5;
    this.rainParticles.maxLifeTime = 1;
    this.rainParticles.emitRate = 0;
    this.rainParticles.gravity = new Vector3(0, -30, 0);
    this.rainParticles.direction1 = new Vector3(-0.1, -1, -0.1);
    this.rainParticles.direction2 = new Vector3(0.1, -1, 0.1);
    this.rainParticles.start();

    // 눈 파티클
    this.snowParticles = new ParticleSystem('snow', 3000, this.scene);
    this.snowParticles.particleTexture = new Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MzNBQkQ5NjgxRDMxMTFFMzk0QzRGRUNBMDBDMjc2MDQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MzNBQkQ5NjkxRDMxMTFFMzk0QzRGRUNBMDBDMjc2MDQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDozM0FCRDY2NjFEMzExMUUzOTRDNEZFQ0EwMEMyNzYwNCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDozM0FCRDY2NzFEMzExMUUzOTRDNEZFQ0EwMEMyNzYwNCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PhM4aSQAAAA9SURBVHjaYvz//z8DEwMDA0NxcTEjAwMYMDLgBky4JBgZcQGwBMOoxQRlGbA5hXE0NBjxOYWRkZEJIMAAAPfUC/95WSwAAAAASUVORK5CYII=', this.scene);
    this.snowParticles.emitter = Vector3.Zero();
    this.snowParticles.minEmitBox = new Vector3(-50, 50, -50);
    this.snowParticles.maxEmitBox = new Vector3(50, 50, 50);
    this.snowParticles.color1 = new Color4(1, 1, 1, 1);
    this.snowParticles.color2 = new Color4(0.9, 0.9, 1, 0.8);
    this.snowParticles.minSize = 0.1;
    this.snowParticles.maxSize = 0.3;
    this.snowParticles.minLifeTime = 3;
    this.snowParticles.maxLifeTime = 5;
    this.snowParticles.emitRate = 0;
    this.snowParticles.gravity = new Vector3(0, -2, 0);
    this.snowParticles.direction1 = new Vector3(-0.5, -1, -0.5);
    this.snowParticles.direction2 = new Vector3(0.5, -1, 0.5);
    this.snowParticles.start();
  }

  update(deltaTime: number): void {
    // 시간 진행
    const hoursPerSecond = 24 / (this.time.dayLengthMinutes * 60);
    this.time.hour += hoursPerSecond * deltaTime;
    if (this.time.hour >= 24) this.time.hour -= 24;

    // 조명 업데이트
    this.updateLighting();

    // 날씨 전환
    if (this.targetWeather && this.weatherTransitionTime > 0) {
      this.weatherTransitionTime -= deltaTime;
      // TODO: 부드러운 전환 구현
    }

    // 파티클 업데이트
    this.updateParticles();
  }

  private updateLighting(): void {
    const timeOfDay = this.getTimeOfDay();
    const lighting = TIME_LIGHTING[timeOfDay];

    // 시간대 사이 보간을 위한 비율 계산
    const blend = this.getTimeBlend();

    this.ambientLight.diffuse = lighting.ambient;
    this.ambientLight.intensity = lighting.ambientIntensity;

    this.sunLight.diffuse = lighting.sun;
    this.sunLight.intensity = lighting.sunIntensity;

    // 태양 위치 (시간에 따라 이동)
    const sunAngle = ((this.time.hour - 6) / 12) * Math.PI;
    this.sunLight.direction = new Vector3(
      -Math.cos(sunAngle),
      -Math.sin(sunAngle),
      -0.5
    ).normalize();

    // 하늘색
    this.scene.clearColor = lighting.skyColor;

    // 안개 (날씨에 따라)
    if (this.weather.type === 'fog') {
      this.scene.fogMode = Scene.FOGMODE_EXP2;
      this.scene.fogDensity = 0.01 * this.weather.intensity;
      this.scene.fogColor = new Color3(0.8, 0.8, 0.85);
    } else if (this.weather.type === 'rain') {
      this.scene.fogMode = Scene.FOGMODE_EXP2;
      this.scene.fogDensity = 0.003 * this.weather.intensity;
      this.scene.fogColor = new Color3(0.5, 0.5, 0.55);
    } else {
      this.scene.fogMode = Scene.FOGMODE_NONE;
    }
  }

  private updateParticles(): void {
    // 비
    if (this.weather.type === 'rain' && this.rainParticles) {
      this.rainParticles.emitRate = 2000 * this.weather.intensity;
    } else if (this.rainParticles) {
      this.rainParticles.emitRate = 0;
    }

    // 눈
    if (this.weather.type === 'snow' && this.snowParticles) {
      this.snowParticles.emitRate = 1000 * this.weather.intensity;
    } else if (this.snowParticles) {
      this.snowParticles.emitRate = 0;
    }
  }

  private getTimeOfDay(): TimeOfDay {
    const hour = this.time.hour;
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 17) return 'day';
    if (hour >= 17 && hour < 19) return 'dusk';
    return 'night';
  }

  private getTimeBlend(): number {
    const hour = this.time.hour;
    // 시간대 전환 시 부드러운 블렌딩
    if (hour >= 5 && hour < 7) return (hour - 5) / 2;
    if (hour >= 17 && hour < 19) return (hour - 17) / 2;
    return 1;
  }

  // ==================== Public API ====================

  setWeather(type: WeatherType, intensity: number = 0.5): void {
    this.weather.type = type;
    this.weather.intensity = Math.max(0, Math.min(1, intensity));
    this.world.emit('weather:changed', this.weather);
  }

  setTime(hour: number): void {
    this.time.hour = hour % 24;
    this.updateLighting();
  }

  setDayLength(minutes: number): void {
    this.time.dayLengthMinutes = Math.max(1, minutes);
  }

  getWeather(): Readonly<WeatherConfig> {
    return this.weather;
  }

  getTime(): number {
    return this.time.hour;
  }

  getTimeOfDayString(): TimeOfDay {
    return this.getTimeOfDay();
  }

  dispose(): void {
    this.rainParticles?.dispose();
    this.snowParticles?.dispose();
    this.ambientLight?.dispose();
    this.sunLight?.dispose();
    this.glowLayer?.dispose();
  }
}
