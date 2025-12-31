/**
 * 입력 관리자
 *
 * 키보드, 게임패드, 핸들 컨트롤러 지원
 */

export interface InputState {
  throttle: number;     // 0-1
  brake: number;        // 0-1
  steering: number;     // -1 to 1
  handbrake: boolean;
  shiftUp: boolean;
  shiftDown: boolean;
  horn: boolean;
  headlights: boolean;
  camera: {
    lookBack: boolean;
    freeMode: boolean;
    mouseX: number;
    mouseY: number;
  };
}

type InputCallback = (state: InputState) => void;

export class InputManager {
  private state: InputState;
  private callbacks: InputCallback[] = [];
  private keysPressed: Set<string> = new Set();
  private gamepad: Gamepad | null = null;

  // 키 매핑
  private keyMap = {
    throttle: ['KeyW', 'ArrowUp'],
    brake: ['KeyS', 'ArrowDown'],
    steerLeft: ['KeyA', 'ArrowLeft'],
    steerRight: ['KeyD', 'ArrowRight'],
    handbrake: ['Space'],
    shiftUp: ['KeyE', 'ShiftLeft'],
    shiftDown: ['KeyQ', 'ControlLeft'],
    horn: ['KeyH'],
    headlights: ['KeyL'],
    lookBack: ['KeyC'],
    freeCamera: ['KeyV']
  };

  constructor() {
    this.state = this.createDefaultState();
    this.setupEventListeners();
  }

  private createDefaultState(): InputState {
    return {
      throttle: 0,
      brake: 0,
      steering: 0,
      handbrake: false,
      shiftUp: false,
      shiftDown: false,
      horn: false,
      headlights: false,
      camera: {
        lookBack: false,
        freeMode: false,
        mouseX: 0,
        mouseY: 0
      }
    };
  }

  private setupEventListeners(): void {
    // 키보드
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // 마우스
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // 게임패드
    window.addEventListener('gamepadconnected', (e) => this.onGamepadConnected(e));
    window.addEventListener('gamepaddisconnected', () => this.onGamepadDisconnected());
  }

  private onKeyDown(e: KeyboardEvent): void {
    this.keysPressed.add(e.code);

    // 토글 입력
    if (this.keyMap.headlights.includes(e.code)) {
      this.state.headlights = !this.state.headlights;
    }
    if (this.keyMap.freeCamera.includes(e.code)) {
      this.state.camera.freeMode = !this.state.camera.freeMode;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keysPressed.delete(e.code);
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.state.camera.freeMode) {
      this.state.camera.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.state.camera.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    }
  }

  private onGamepadConnected(e: GamepadEvent): void {
    console.log(`🎮 게임패드 연결: ${e.gamepad.id}`);
    this.gamepad = e.gamepad;
  }

  private onGamepadDisconnected(): void {
    console.log('🎮 게임패드 연결 해제');
    this.gamepad = null;
  }

  /**
   * 매 프레임 호출 - 입력 상태 업데이트
   */
  update(): void {
    const prevShiftUp = this.state.shiftUp;
    const prevShiftDown = this.state.shiftDown;

    // 키보드 입력 처리
    this.updateKeyboardInput();

    // 게임패드 입력 처리 (있으면 덮어쓰기)
    this.updateGamepadInput();

    // 원샷 입력 처리 (shiftUp/Down)
    this.state.shiftUp = this.state.shiftUp && !prevShiftUp;
    this.state.shiftDown = this.state.shiftDown && !prevShiftDown;

    // 콜백 호출
    for (const callback of this.callbacks) {
      callback(this.state);
    }
  }

  private updateKeyboardInput(): void {
    // 쓰로틀/브레이크 (0 또는 1)
    this.state.throttle = this.isAnyKeyPressed(this.keyMap.throttle) ? 1 : 0;
    this.state.brake = this.isAnyKeyPressed(this.keyMap.brake) ? 1 : 0;

    // 스티어링 (-1, 0, 1)
    let steering = 0;
    if (this.isAnyKeyPressed(this.keyMap.steerLeft)) steering -= 1;
    if (this.isAnyKeyPressed(this.keyMap.steerRight)) steering += 1;
    this.state.steering = steering;

    // 핸드브레이크
    this.state.handbrake = this.isAnyKeyPressed(this.keyMap.handbrake);

    // 기어
    this.state.shiftUp = this.isAnyKeyPressed(this.keyMap.shiftUp);
    this.state.shiftDown = this.isAnyKeyPressed(this.keyMap.shiftDown);

    // 혼
    this.state.horn = this.isAnyKeyPressed(this.keyMap.horn);

    // 카메라
    this.state.camera.lookBack = this.isAnyKeyPressed(this.keyMap.lookBack);
  }

  private updateGamepadInput(): void {
    // 게임패드 상태 새로고침
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0];
    if (!gp) return;

    // 왼쪽 스틱 X축 = 스티어링
    const stickDeadzone = 0.1;
    const steerValue = gp.axes[0];
    if (Math.abs(steerValue) > stickDeadzone) {
      this.state.steering = steerValue;
    }

    // RT = 쓰로틀 (axis 5 또는 button 7)
    if (gp.buttons[7]) {
      this.state.throttle = gp.buttons[7].value;
    }

    // LT = 브레이크 (axis 4 또는 button 6)
    if (gp.buttons[6]) {
      this.state.brake = gp.buttons[6].value;
    }

    // A 버튼 = 핸드브레이크
    this.state.handbrake = gp.buttons[0]?.pressed ?? false;

    // RB/LB = 기어
    this.state.shiftUp = gp.buttons[5]?.pressed ?? false;
    this.state.shiftDown = gp.buttons[4]?.pressed ?? false;
  }

  private isAnyKeyPressed(keys: string[]): boolean {
    return keys.some(key => this.keysPressed.has(key));
  }

  /**
   * 입력 콜백 등록
   */
  onInput(callback: InputCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * 현재 입력 상태 반환
   */
  getState(): Readonly<InputState> {
    return this.state;
  }

  /**
   * 정리
   */
  dispose(): void {
    this.callbacks = [];
  }
}
