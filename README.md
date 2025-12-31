# K-Driving-Sim 🚗

한국형 드라이빙 시뮬레이터 - CARLA 스타일, 실제 한국 지도, 한국 자동차

## 특징

- **WebGPU/WebGL 기반** - Babylon.js 엔진 사용, WebGPU 우선
- **실제 한국 지도** - OpenStreetMap 데이터로 서울, 용인 등 실제 도로 생성
- **한국 자동차** - 현대, 기아, 제네시스 차량 실제 스펙 기반
- **물리 시뮬레이션** - 엔진, 변속기, 타이어, 공기저항 시뮬레이션
- **AI 친화적 코드** - Claude가 완전히 이해하고 수정 가능한 구조

## 지원 차량

| 브랜드 | 모델 | 엔진 |
|--------|------|------|
| 현대 | 쏘나타 DN8 | 2.0 가솔린 |
| 현대 | 아반떼 CN7 | 1.6 가솔린 |
| 기아 | K5 DL3 | 2.0 가솔린 |
| 기아 | EV6 | 전기 |
| 제네시스 | G80 RG3 | 2.5 터보 |

## 지원 지역

### 서울
- 강남역
- 잠실
- 홍대
- 여의도
- 광화문

### 용인
- 수지구
- 기흥구
- 처인구
- 에버랜드

## 설치

```bash
npm install
npm run dev
```

## 조작법

| 키 | 기능 |
|----|------|
| W / ↑ | 가속 |
| S / ↓ | 브레이크 |
| A / ← | 좌회전 |
| D / → | 우회전 |
| Space | 핸드브레이크 |
| E / Shift | 기어 업 |
| Q / Ctrl | 기어 다운 |
| 1-4 | 카메라 모드 |
| R | 차량 리셋 |
| M | 맵 선택 |
| N | 차량 선택 |

게임패드 지원 (Xbox 컨트롤러 권장)

## 프로젝트 구조

```
k-driving-sim/
├── src/
│   ├── core/           # 엔진 코어
│   │   ├── Engine.ts           # Babylon.js 래퍼
│   │   ├── InputManager.ts     # 입력 처리
│   │   └── CameraController.ts # 카메라 시스템
│   ├── physics/        # 물리 시스템
│   │   └── VehiclePhysics.ts   # 차량 물리
│   ├── maps/           # 맵 시스템
│   │   └── KoreaMapLoader.ts   # OSM 기반 맵 로더
│   ├── vehicles/       # 차량 관련
│   └── main.ts         # 엔트리 포인트
├── public/             # 정적 파일
├── assets/             # 에셋 (모델, 텍스처)
└── index.html
```

## 기술 스택

- **렌더링**: Babylon.js 7.x (WebGPU/WebGL)
- **물리**: Havok Physics
- **맵 데이터**: OpenStreetMap Overpass API
- **빌드**: Vite
- **언어**: TypeScript

## 로드맵

- [ ] glTF 차량 모델 로더
- [ ] 실제 차량 3D 모델
- [ ] 교통 시뮬레이션 (AI 차량)
- [ ] 신호등 시스템
- [ ] 날씨 효과
- [ ] 낮/밤 사이클
- [ ] 멀티플레이어
- [ ] VR 지원

## 라이선스

MIT

## 기여

이슈와 PR 환영합니다!
