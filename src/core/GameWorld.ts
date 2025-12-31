/**
 * GameWorld - 게임 월드 관리자
 *
 * 모든 시스템과 엔티티를 통합 관리하는 중앙 컨트롤러
 * 확장 가능한 시스템 아키텍처
 */

import { Scene } from '@babylonjs/core';

// 시스템 인터페이스 - 모든 시스템이 구현해야 함
export interface ISystem {
  name: string;
  priority: number;  // 낮을수록 먼저 실행

  init(world: GameWorld): Promise<void>;
  update(deltaTime: number): void;
  dispose(): void;
}

// 엔티티 인터페이스
export interface IEntity {
  id: string;
  type: string;
  active: boolean;

  update(deltaTime: number): void;
  dispose(): void;
}

// 이벤트 시스템
type EventCallback = (...args: any[]) => void;

export class GameWorld {
  private scene: Scene;
  private systems: Map<string, ISystem> = new Map();
  private entities: Map<string, IEntity> = new Map();
  private events: Map<string, EventCallback[]> = new Map();

  private isPaused: boolean = false;
  private timeScale: number = 1.0;
  private gameTime: number = 0;  // 게임 내 시간 (초)

  constructor(scene: Scene) {
    this.scene = scene;
  }

  // ==================== 시스템 관리 ====================

  /**
   * 시스템 등록
   */
  registerSystem(system: ISystem): void {
    this.systems.set(system.name, system);
    console.log(`📦 System registered: ${system.name}`);
  }

  /**
   * 시스템 가져오기
   */
  getSystem<T extends ISystem>(name: string): T | undefined {
    return this.systems.get(name) as T;
  }

  /**
   * 모든 시스템 초기화
   */
  async initSystems(): Promise<void> {
    // 우선순위 순으로 정렬
    const sorted = Array.from(this.systems.values())
      .sort((a, b) => a.priority - b.priority);

    for (const system of sorted) {
      console.log(`🔧 Initializing: ${system.name}`);
      await system.init(this);
    }

    console.log(`✅ All systems initialized (${this.systems.size})`);
  }

  // ==================== 엔티티 관리 ====================

  /**
   * 엔티티 추가
   */
  addEntity(entity: IEntity): void {
    this.entities.set(entity.id, entity);
    this.emit('entity:added', entity);
  }

  /**
   * 엔티티 제거
   */
  removeEntity(id: string): void {
    const entity = this.entities.get(id);
    if (entity) {
      entity.dispose();
      this.entities.delete(id);
      this.emit('entity:removed', entity);
    }
  }

  /**
   * 엔티티 가져오기
   */
  getEntity<T extends IEntity>(id: string): T | undefined {
    return this.entities.get(id) as T;
  }

  /**
   * 타입별 엔티티 필터
   */
  getEntitiesByType<T extends IEntity>(type: string): T[] {
    return Array.from(this.entities.values())
      .filter(e => e.type === type) as T[];
  }

  // ==================== 이벤트 시스템 ====================

  /**
   * 이벤트 리스너 등록
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  /**
   * 이벤트 리스너 해제
   */
  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 이벤트 발생
   */
  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(...args);
      }
    }
  }

  // ==================== 게임 루프 ====================

  /**
   * 매 프레임 업데이트
   */
  update(deltaTime: number): void {
    if (this.isPaused) return;

    const scaledDelta = deltaTime * this.timeScale;
    this.gameTime += scaledDelta;

    // 시스템 업데이트 (우선순위 순)
    const sorted = Array.from(this.systems.values())
      .sort((a, b) => a.priority - b.priority);

    for (const system of sorted) {
      system.update(scaledDelta);
    }

    // 활성 엔티티 업데이트
    for (const entity of this.entities.values()) {
      if (entity.active) {
        entity.update(scaledDelta);
      }
    }
  }

  // ==================== 게임 상태 ====================

  pause(): void {
    this.isPaused = true;
    this.emit('game:paused');
  }

  resume(): void {
    this.isPaused = false;
    this.emit('game:resumed');
  }

  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0, Math.min(10, scale));
  }

  getGameTime(): number {
    return this.gameTime;
  }

  getScene(): Scene {
    return this.scene;
  }

  // ==================== 정리 ====================

  dispose(): void {
    // 엔티티 정리
    for (const entity of this.entities.values()) {
      entity.dispose();
    }
    this.entities.clear();

    // 시스템 정리 (역순)
    const sorted = Array.from(this.systems.values())
      .sort((a, b) => b.priority - a.priority);

    for (const system of sorted) {
      system.dispose();
    }
    this.systems.clear();

    // 이벤트 정리
    this.events.clear();
  }
}
