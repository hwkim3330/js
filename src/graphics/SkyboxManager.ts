/**
 * SkyboxManager - 스카이박스 관리
 *
 * 시간대별 하늘 배경
 * 절차적 생성으로 외부 에셋 불필요
 */

import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  Texture,
  DynamicTexture,
  CubeTexture,
  RawCubeTexture
} from '@babylonjs/core';

export type SkyboxTime = 'dawn' | 'day' | 'dusk' | 'night';

export class SkyboxManager {
  private scene: Scene;
  private skybox: Mesh | null = null;
  private skyboxMaterial: StandardMaterial | null = null;
  private currentTime: SkyboxTime = 'day';

  // 시간대별 색상
  private readonly skyColors: Record<SkyboxTime, { top: Color3; bottom: Color3; sun: Color3 }> = {
    dawn: {
      top: new Color3(0.4, 0.5, 0.7),
      bottom: new Color3(1, 0.6, 0.4),
      sun: new Color3(1, 0.8, 0.5)
    },
    day: {
      top: new Color3(0.3, 0.5, 0.9),
      bottom: new Color3(0.6, 0.75, 1),
      sun: new Color3(1, 1, 0.9)
    },
    dusk: {
      top: new Color3(0.3, 0.3, 0.5),
      bottom: new Color3(1, 0.4, 0.2),
      sun: new Color3(1, 0.5, 0.2)
    },
    night: {
      top: new Color3(0.02, 0.02, 0.08),
      bottom: new Color3(0.05, 0.05, 0.15),
      sun: new Color3(0.1, 0.1, 0.2)
    }
  };

  constructor(scene: Scene) {
    this.scene = scene;
    this.createSkybox();
  }

  private createSkybox(): void {
    // 큰 구체로 스카이돔 생성
    this.skybox = MeshBuilder.CreateSphere('skybox', {
      diameter: 2000,
      segments: 32,
      sideOrientation: Mesh.BACKSIDE
    }, this.scene);

    this.skyboxMaterial = new StandardMaterial('skyboxMat', this.scene);
    this.skyboxMaterial.backFaceCulling = false;
    this.skyboxMaterial.disableLighting = true;
    this.skyboxMaterial.emissiveTexture = this.createSkyTexture('day');

    this.skybox.material = this.skyboxMaterial;
    this.skybox.infiniteDistance = true;
    this.skybox.renderingGroupId = 0;
  }

  /**
   * 절차적 하늘 텍스처 생성
   */
  private createSkyTexture(time: SkyboxTime): DynamicTexture {
    const texture = new DynamicTexture('skyTex', 512, this.scene, true);
    const ctx = texture.getContext();

    const colors = this.skyColors[time];

    // 그라데이션 (위에서 아래로)
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, this.colorToCSS(colors.top));
    gradient.addColorStop(0.5, this.colorToCSS(colors.bottom.scale(0.8).add(colors.top.scale(0.2))));
    gradient.addColorStop(1, this.colorToCSS(colors.bottom));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // 해/달 (간단한 원)
    if (time === 'day' || time === 'dawn' || time === 'dusk') {
      // 태양
      ctx.beginPath();
      ctx.arc(256, 100, time === 'day' ? 40 : 50, 0, Math.PI * 2);
      ctx.fillStyle = this.colorToCSS(colors.sun);
      ctx.fill();

      // 태양 글로우
      const sunGlow = ctx.createRadialGradient(256, 100, 20, 256, 100, 80);
      sunGlow.addColorStop(0, `rgba(255, 255, 200, 0.5)`);
      sunGlow.addColorStop(1, `rgba(255, 255, 200, 0)`);
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(256, 100, 80, 0, Math.PI * 2);
      ctx.fill();
    }

    // 밤하늘 별
    if (time === 'night') {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 350;
        const size = Math.random() * 2 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 달
      ctx.beginPath();
      ctx.arc(380, 80, 25, 0, Math.PI * 2);
      ctx.fillStyle = '#e8e8d0';
      ctx.fill();
    }

    // 구름 (낮/새벽/황혼)
    if (time !== 'night') {
      this.drawClouds(ctx, time);
    }

    texture.update();
    return texture;
  }

  private drawClouds(ctx: CanvasRenderingContext2D, time: SkyboxTime): void {
    const cloudColor = time === 'day' ? 'rgba(255, 255, 255, 0.8)' :
                       time === 'dawn' ? 'rgba(255, 200, 180, 0.7)' :
                       'rgba(255, 150, 100, 0.6)';

    ctx.fillStyle = cloudColor;

    // 여러 구름 그리기
    const clouds = [
      { x: 100, y: 150, w: 80, h: 30 },
      { x: 300, y: 120, w: 100, h: 40 },
      { x: 450, y: 180, w: 60, h: 25 },
      { x: 50, y: 220, w: 70, h: 28 },
      { x: 380, y: 250, w: 90, h: 35 }
    ];

    for (const cloud of clouds) {
      // 구름 (여러 원 조합)
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(
          cloud.x + i * cloud.w * 0.2,
          cloud.y + Math.sin(i) * cloud.h * 0.3,
          cloud.h * (0.8 + Math.random() * 0.4),
          0, Math.PI * 2
        );
        ctx.fill();
      }
    }
  }

  private colorToCSS(color: Color3): string {
    return `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`;
  }

  /**
   * 시간대 설정
   */
  setTime(time: SkyboxTime): void {
    if (time === this.currentTime) return;
    this.currentTime = time;

    if (this.skyboxMaterial) {
      this.skyboxMaterial.emissiveTexture?.dispose();
      this.skyboxMaterial.emissiveTexture = this.createSkyTexture(time);
    }

    // 씬 배경색도 변경
    const colors = this.skyColors[time];
    this.scene.clearColor = new Color4(colors.bottom.r, colors.bottom.g, colors.bottom.b, 1);
  }

  /**
   * 시간 기반 자동 설정
   */
  setTimeFromHour(hour: number): void {
    let time: SkyboxTime;

    if (hour >= 5 && hour < 7) {
      time = 'dawn';
    } else if (hour >= 7 && hour < 17) {
      time = 'day';
    } else if (hour >= 17 && hour < 19) {
      time = 'dusk';
    } else {
      time = 'night';
    }

    this.setTime(time);
  }

  getCurrentTime(): SkyboxTime {
    return this.currentTime;
  }

  dispose(): void {
    this.skyboxMaterial?.dispose();
    this.skybox?.dispose();
  }
}
