/**
 * 카메라 컨트롤러
 *
 * 다양한 카메라 모드 지원:
 * - 3인칭 추적
 * - 1인칭 (운전석)
 * - 자유 카메라
 * - 후방 카메라
 */

import {
  Scene,
  ArcRotateCamera,
  FreeCamera,
  Vector3,
  Mesh,
  UniversalCamera
} from '@babylonjs/core';

export type CameraMode = 'chase' | 'cockpit' | 'free' | 'rear' | 'top';

export class CameraController {
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private currentMode: CameraMode = 'chase';

  private chaseCamera: ArcRotateCamera | null = null;
  private cockpitCamera: FreeCamera | null = null;
  private freeCamera: UniversalCamera | null = null;

  private target: Mesh | null = null;

  // 카메라 설정
  private chaseDistance = 8;
  private chaseHeight = 3;
  private cockpitOffset = new Vector3(0, 1.2, 0.3);  // 운전석 위치

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.scene = scene;
    this.canvas = canvas;
    this.setupCameras();
  }

  private setupCameras(): void {
    // 추적 카메라 (기본)
    this.chaseCamera = new ArcRotateCamera(
      'chaseCamera',
      Math.PI,           // alpha (수평 회전)
      Math.PI / 3,       // beta (수직 각도)
      this.chaseDistance,
      Vector3.Zero(),
      this.scene
    );
    this.chaseCamera.lowerRadiusLimit = 4;
    this.chaseCamera.upperRadiusLimit = 20;
    this.chaseCamera.lowerBetaLimit = 0.2;
    this.chaseCamera.upperBetaLimit = Math.PI / 2.2;

    // 콕핏 카메라
    this.cockpitCamera = new FreeCamera(
      'cockpitCamera',
      Vector3.Zero(),
      this.scene
    );
    this.cockpitCamera.fov = 1.2;  // 넓은 시야각

    // 자유 카메라
    this.freeCamera = new UniversalCamera(
      'freeCamera',
      new Vector3(0, 50, -100),
      this.scene
    );
    this.freeCamera.speed = 2;
    this.freeCamera.angularSensibility = 1000;

    // 기본 카메라 활성화
    this.setMode('chase');
  }

  /**
   * 추적 대상 설정
   */
  setTarget(mesh: Mesh): void {
    this.target = mesh;
    if (this.chaseCamera) {
      this.chaseCamera.lockedTarget = mesh;
    }
  }

  /**
   * 카메라 모드 변경
   */
  setMode(mode: CameraMode): void {
    this.currentMode = mode;

    // 모든 카메라 비활성화
    this.chaseCamera!.detachControl();
    this.cockpitCamera!.detachControl();
    this.freeCamera!.detachControl();

    switch (mode) {
      case 'chase':
        this.scene.activeCamera = this.chaseCamera;
        this.chaseCamera!.attachControl(this.canvas, true);
        break;

      case 'cockpit':
        this.scene.activeCamera = this.cockpitCamera;
        // 콕핏은 마우스 룩 활성화
        this.cockpitCamera!.attachControl(this.canvas, true);
        break;

      case 'free':
        this.scene.activeCamera = this.freeCamera;
        this.freeCamera!.attachControl(this.canvas, true);
        break;

      case 'rear':
        this.scene.activeCamera = this.chaseCamera;
        // 후방 카메라는 alpha를 반대로
        if (this.chaseCamera) {
          this.chaseCamera.alpha = 0;
        }
        break;

      case 'top':
        this.scene.activeCamera = this.freeCamera;
        if (this.target && this.freeCamera) {
          this.freeCamera.position = this.target.position.add(new Vector3(0, 100, 0));
          this.freeCamera.setTarget(this.target.position);
        }
        break;
    }

    console.log(`📷 Camera mode: ${mode}`);
  }

  /**
   * 다음 카메라 모드로 전환
   */
  nextMode(): void {
    const modes: CameraMode[] = ['chase', 'cockpit', 'free', 'top'];
    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setMode(modes[nextIndex]);
  }

  /**
   * 매 프레임 업데이트
   */
  update(): void {
    if (!this.target) return;

    const targetPos = this.target.position;
    const targetRot = this.target.rotation;

    switch (this.currentMode) {
      case 'chase':
        // 자동 회전 (차량 뒤를 따라감)
        // const targetAlpha = targetRot.y + Math.PI;
        // this.chaseCamera!.alpha += (targetAlpha - this.chaseCamera!.alpha) * 0.05;
        break;

      case 'cockpit':
        // 운전석 위치 계산
        const forward = new Vector3(
          Math.sin(targetRot.y),
          0,
          Math.cos(targetRot.y)
        );
        const right = new Vector3(
          Math.cos(targetRot.y),
          0,
          -Math.sin(targetRot.y)
        );

        this.cockpitCamera!.position = targetPos
          .add(new Vector3(0, this.cockpitOffset.y, 0))
          .add(forward.scale(this.cockpitOffset.z))
          .add(right.scale(this.cockpitOffset.x));

        this.cockpitCamera!.rotation.y = targetRot.y;
        break;

      case 'rear':
        if (this.chaseCamera) {
          this.chaseCamera.setTarget(targetPos);
        }
        break;

      case 'top':
        if (this.freeCamera) {
          this.freeCamera.position.x = targetPos.x;
          this.freeCamera.position.z = targetPos.z;
          this.freeCamera.setTarget(targetPos);
        }
        break;
    }
  }

  /**
   * 현재 모드 반환
   */
  getMode(): CameraMode {
    return this.currentMode;
  }

  /**
   * 정리
   */
  dispose(): void {
    this.chaseCamera?.dispose();
    this.cockpitCamera?.dispose();
    this.freeCamera?.dispose();
  }
}
