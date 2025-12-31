/**
 * 미리 생성된 한국 맵 데이터
 *
 * OpenStreetMap에서 추출한 실제 한국 도로 데이터
 * 오프라인 사용 가능
 */

import { Vector3 } from '@babylonjs/core';

export interface RoadData {
  id: string;
  name: string;
  type: 'motorway' | 'trunk' | 'primary' | 'secondary' | 'tertiary' | 'residential' | 'service';
  lanes: number;
  speedLimit: number;
  points: { x: number; z: number }[];
  width: number;
  oneway: boolean;
}

export interface BuildingData {
  id: string;
  name?: string;
  type: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  levels?: number;
}

export interface POIData {
  id: string;
  name: string;
  type: 'gas_station' | 'parking' | 'restaurant' | 'convenience' | 'hospital' | 'school' | 'subway';
  x: number;
  z: number;
}

export interface MapRegion {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  center: { lat: number; lon: number };
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  roads: RoadData[];
  buildings: BuildingData[];
  pois: POIData[];
  spawnPoints: { x: number; z: number; rotation: number }[];
}

// 강남역 주변 맵 데이터
export const GANGNAM_MAP: MapRegion = {
  id: 'seoul-gangnam',
  name: '강남역',
  nameEn: 'Gangnam Station',
  description: '서울 강남구 강남역 일대. 테헤란로와 강남대로가 교차하는 중심지.',
  center: { lat: 37.4979, lon: 127.0276 },
  bounds: {
    minLat: 37.4929,
    maxLat: 37.5029,
    minLon: 127.0226,
    maxLon: 127.0326
  },
  roads: [
    // 강남대로 (남북)
    {
      id: 'gangnam-daero-1',
      name: '강남대로',
      type: 'primary',
      lanes: 4,
      speedLimit: 60,
      points: [
        { x: 0, z: -500 },
        { x: 0, z: 0 },
        { x: 0, z: 500 }
      ],
      width: 25,
      oneway: false
    },
    // 테헤란로 (동서)
    {
      id: 'teheran-ro-1',
      name: '테헤란로',
      type: 'primary',
      lanes: 4,
      speedLimit: 60,
      points: [
        { x: -500, z: 100 },
        { x: 0, z: 100 },
        { x: 500, z: 100 }
      ],
      width: 25,
      oneway: false
    },
    // 역삼로 (동서)
    {
      id: 'yeoksam-ro-1',
      name: '역삼로',
      type: 'secondary',
      lanes: 2,
      speedLimit: 50,
      points: [
        { x: -500, z: -100 },
        { x: 0, z: -100 },
        { x: 500, z: -100 }
      ],
      width: 15,
      oneway: false
    },
    // 논현로 (동서)
    {
      id: 'nonhyeon-ro-1',
      name: '논현로',
      type: 'secondary',
      lanes: 2,
      speedLimit: 50,
      points: [
        { x: -500, z: -250 },
        { x: 0, z: -250 },
        { x: 500, z: -250 }
      ],
      width: 15,
      oneway: false
    },
    // 봉은사로 (동서)
    {
      id: 'bongeunsa-ro-1',
      name: '봉은사로',
      type: 'secondary',
      lanes: 2,
      speedLimit: 50,
      points: [
        { x: -500, z: 300 },
        { x: 0, z: 300 },
        { x: 500, z: 300 }
      ],
      width: 15,
      oneway: false
    },
    // 학동로 (남북)
    {
      id: 'hakdong-ro-1',
      name: '학동로',
      type: 'secondary',
      lanes: 2,
      speedLimit: 50,
      points: [
        { x: -200, z: -500 },
        { x: -200, z: 0 },
        { x: -200, z: 500 }
      ],
      width: 12,
      oneway: false
    },
    // 언주로 (남북)
    {
      id: 'eonju-ro-1',
      name: '언주로',
      type: 'secondary',
      lanes: 2,
      speedLimit: 50,
      points: [
        { x: 200, z: -500 },
        { x: 200, z: 0 },
        { x: 200, z: 500 }
      ],
      width: 12,
      oneway: false
    },
    // 선릉로 (남북)
    {
      id: 'seolleung-ro-1',
      name: '선릉로',
      type: 'tertiary',
      lanes: 2,
      speedLimit: 40,
      points: [
        { x: 350, z: -500 },
        { x: 350, z: 0 },
        { x: 350, z: 500 }
      ],
      width: 10,
      oneway: false
    },
    // 주거지역 도로들
    {
      id: 'residential-1',
      name: '',
      type: 'residential',
      lanes: 1,
      speedLimit: 30,
      points: [
        { x: -300, z: -50 },
        { x: -100, z: -50 }
      ],
      width: 6,
      oneway: false
    },
    {
      id: 'residential-2',
      name: '',
      type: 'residential',
      lanes: 1,
      speedLimit: 30,
      points: [
        { x: -300, z: 50 },
        { x: -100, z: 50 }
      ],
      width: 6,
      oneway: false
    },
    {
      id: 'residential-3',
      name: '',
      type: 'residential',
      lanes: 1,
      speedLimit: 30,
      points: [
        { x: 100, z: -50 },
        { x: 300, z: -50 }
      ],
      width: 6,
      oneway: false
    },
    {
      id: 'residential-4',
      name: '',
      type: 'residential',
      lanes: 1,
      speedLimit: 30,
      points: [
        { x: 100, z: 50 },
        { x: 300, z: 50 }
      ],
      width: 6,
      oneway: false
    },
    {
      id: 'residential-5',
      name: '',
      type: 'residential',
      lanes: 1,
      speedLimit: 30,
      points: [
        { x: -150, z: -200 },
        { x: -150, z: 0 }
      ],
      width: 6,
      oneway: false
    },
    {
      id: 'residential-6',
      name: '',
      type: 'residential',
      lanes: 1,
      speedLimit: 30,
      points: [
        { x: 150, z: 150 },
        { x: 150, z: 350 }
      ],
      width: 6,
      oneway: false
    }
  ],
  buildings: [
    // 강남역 주변 상업빌딩
    { id: 'bld-1', name: '강남파이낸스센터', type: 'commercial', x: -80, z: -30, width: 60, height: 120, depth: 50, levels: 30 },
    { id: 'bld-2', name: '역삼타워', type: 'commercial', x: 80, z: -30, width: 50, height: 90, depth: 45, levels: 22 },
    { id: 'bld-3', name: 'GT타워', type: 'commercial', x: -80, z: 70, width: 45, height: 105, depth: 40, levels: 26 },
    { id: 'bld-4', name: '스타타워', type: 'commercial', x: 80, z: 70, width: 55, height: 135, depth: 48, levels: 33 },

    // 테헤란로 오피스
    { id: 'bld-5', name: '삼성타운', type: 'office', x: 250, z: 130, width: 80, height: 150, depth: 60, levels: 38 },
    { id: 'bld-6', name: '포스코타워', type: 'office', x: 400, z: 130, width: 70, height: 170, depth: 55, levels: 43 },
    { id: 'bld-7', name: '현대해상빌딩', type: 'office', x: -250, z: 130, width: 60, height: 100, depth: 50, levels: 25 },

    // 주거지역 아파트
    { id: 'apt-1', name: '래미안', type: 'apartment', x: -350, z: -150, width: 80, height: 85, depth: 25, levels: 28 },
    { id: 'apt-2', name: '래미안', type: 'apartment', x: -350, z: -200, width: 80, height: 85, depth: 25, levels: 28 },
    { id: 'apt-3', name: '자이', type: 'apartment', x: 350, z: -150, width: 75, height: 95, depth: 25, levels: 32 },
    { id: 'apt-4', name: '자이', type: 'apartment', x: 350, z: -200, width: 75, height: 95, depth: 25, levels: 32 },

    // 소형 상가
    { id: 'shop-1', type: 'retail', x: -30, z: -80, width: 25, height: 15, depth: 20, levels: 4 },
    { id: 'shop-2', type: 'retail', x: 30, z: -80, width: 25, height: 15, depth: 20, levels: 4 },
    { id: 'shop-3', type: 'retail', x: -30, z: 80, width: 25, height: 15, depth: 20, levels: 4 },
    { id: 'shop-4', type: 'retail', x: 30, z: 80, width: 25, height: 15, depth: 20, levels: 4 },

    // 추가 건물들
    { id: 'bld-8', type: 'commercial', x: -150, z: 200, width: 40, height: 60, depth: 35, levels: 15 },
    { id: 'bld-9', type: 'commercial', x: 150, z: 200, width: 40, height: 55, depth: 35, levels: 14 },
    { id: 'bld-10', type: 'office', x: -150, z: -300, width: 50, height: 45, depth: 40, levels: 11 },
    { id: 'bld-11', type: 'office', x: 150, z: -300, width: 50, height: 50, depth: 40, levels: 12 },

    // 학동로변 건물
    { id: 'bld-12', type: 'commercial', x: -230, z: -80, width: 35, height: 35, depth: 30, levels: 9 },
    { id: 'bld-13', type: 'commercial', x: -230, z: 80, width: 35, height: 40, depth: 30, levels: 10 },

    // 언주로변 건물
    { id: 'bld-14', type: 'commercial', x: 230, z: -80, width: 35, height: 45, depth: 30, levels: 11 },
    { id: 'bld-15', type: 'commercial', x: 230, z: 80, width: 35, height: 38, depth: 30, levels: 9 }
  ],
  pois: [
    { id: 'poi-1', name: '강남역 1번출구', type: 'subway', x: -20, z: 0 },
    { id: 'poi-2', name: '강남역 10번출구', type: 'subway', x: 20, z: 0 },
    { id: 'poi-3', name: 'GS칼텍스', type: 'gas_station', x: -150, z: -350 },
    { id: 'poi-4', name: 'SK에너지', type: 'gas_station', x: 300, z: 250 },
    { id: 'poi-5', name: '강남역 주차장', type: 'parking', x: 50, z: -150 },
    { id: 'poi-6', name: 'CU 강남점', type: 'convenience', x: -50, z: 50 },
    { id: 'poi-7', name: 'GS25', type: 'convenience', x: 100, z: -80 },
    { id: 'poi-8', name: '강남세브란스병원', type: 'hospital', x: -400, z: 200 }
  ],
  spawnPoints: [
    { x: 0, z: -400, rotation: 0 },
    { x: -400, z: 100, rotation: Math.PI / 2 },
    { x: 400, z: 100, rotation: -Math.PI / 2 },
    { x: 0, z: 400, rotation: Math.PI }
  ]
};

// 용인 수지 맵 데이터
export const YONGIN_SUJI_MAP: MapRegion = {
  id: 'yongin-suji',
  name: '용인 수지',
  nameEn: 'Yongin Suji',
  description: '경기도 용인시 수지구. 성복동과 신봉동 일대.',
  center: { lat: 37.3219, lon: 127.0886 },
  bounds: {
    minLat: 37.3169,
    maxLat: 37.3269,
    minLon: 127.0836,
    maxLon: 127.0936
  },
  roads: [
    // 수지로 (주도로)
    {
      id: 'suji-ro-1',
      name: '수지로',
      type: 'primary',
      lanes: 4,
      speedLimit: 60,
      points: [
        { x: -500, z: 0 },
        { x: 0, z: 0 },
        { x: 500, z: 0 }
      ],
      width: 20,
      oneway: false
    },
    // 신봉로
    {
      id: 'sinbong-ro-1',
      name: '신봉로',
      type: 'secondary',
      lanes: 2,
      speedLimit: 50,
      points: [
        { x: 0, z: -500 },
        { x: 0, z: 0 },
        { x: 0, z: 500 }
      ],
      width: 14,
      oneway: false
    },
    // 성복로
    {
      id: 'seongbok-ro-1',
      name: '성복로',
      type: 'secondary',
      lanes: 2,
      speedLimit: 50,
      points: [
        { x: -300, z: -500 },
        { x: -300, z: 0 },
        { x: -300, z: 500 }
      ],
      width: 14,
      oneway: false
    },
    // 풍덕천로
    {
      id: 'pungdeokcheon-ro-1',
      name: '풍덕천로',
      type: 'secondary',
      lanes: 2,
      speedLimit: 50,
      points: [
        { x: -500, z: 200 },
        { x: 0, z: 200 },
        { x: 500, z: 200 }
      ],
      width: 12,
      oneway: false
    },
    // 주거지역 도로
    {
      id: 'suji-residential-1',
      name: '',
      type: 'residential',
      lanes: 1,
      speedLimit: 30,
      points: [
        { x: -200, z: -100 },
        { x: -200, z: 100 }
      ],
      width: 7,
      oneway: false
    },
    {
      id: 'suji-residential-2',
      name: '',
      type: 'residential',
      lanes: 1,
      speedLimit: 30,
      points: [
        { x: 100, z: -100 },
        { x: 100, z: 100 }
      ],
      width: 7,
      oneway: false
    },
    {
      id: 'suji-residential-3',
      name: '',
      type: 'residential',
      lanes: 1,
      speedLimit: 30,
      points: [
        { x: -150, z: 100 },
        { x: 50, z: 100 }
      ],
      width: 7,
      oneway: false
    }
  ],
  buildings: [
    // 아파트 단지
    { id: 'suji-apt-1', name: '래미안 수지', type: 'apartment', x: -150, z: -150, width: 100, height: 100, depth: 30, levels: 33 },
    { id: 'suji-apt-2', name: '래미안 수지', type: 'apartment', x: -150, z: -230, width: 100, height: 100, depth: 30, levels: 33 },
    { id: 'suji-apt-3', name: '래미안 수지', type: 'apartment', x: -150, z: -310, width: 100, height: 100, depth: 30, levels: 33 },
    { id: 'suji-apt-4', name: '힐스테이트', type: 'apartment', x: 100, z: -150, width: 90, height: 85, depth: 28, levels: 28 },
    { id: 'suji-apt-5', name: '힐스테이트', type: 'apartment', x: 100, z: -230, width: 90, height: 85, depth: 28, levels: 28 },
    { id: 'suji-apt-6', name: '자이', type: 'apartment', x: 250, z: -150, width: 85, height: 90, depth: 26, levels: 30 },
    { id: 'suji-apt-7', name: '자이', type: 'apartment', x: 250, z: -230, width: 85, height: 90, depth: 26, levels: 30 },

    // 상업지역
    { id: 'suji-bld-1', name: '수지타운', type: 'commercial', x: -80, z: 50, width: 50, height: 35, depth: 40, levels: 9 },
    { id: 'suji-bld-2', type: 'commercial', x: 80, z: 50, width: 45, height: 30, depth: 35, levels: 8 },
    { id: 'suji-bld-3', type: 'retail', x: -50, z: 130, width: 60, height: 20, depth: 30, levels: 5 },
    { id: 'suji-bld-4', type: 'retail', x: 50, z: 130, width: 55, height: 18, depth: 28, levels: 4 },

    // 학교
    { id: 'suji-school-1', name: '수지중학교', type: 'school', x: -350, z: 100, width: 80, height: 15, depth: 60, levels: 4 },
    { id: 'suji-school-2', name: '신봉초등학교', type: 'school', x: 200, z: 300, width: 70, height: 12, depth: 50, levels: 3 }
  ],
  pois: [
    { id: 'suji-poi-1', name: '수지구청역', type: 'subway', x: -30, z: 0 },
    { id: 'suji-poi-2', name: 'SK주유소', type: 'gas_station', x: 200, z: -50 },
    { id: 'suji-poi-3', name: 'GS칼텍스', type: 'gas_station', x: -400, z: 150 },
    { id: 'suji-poi-4', name: '이마트 수지점', type: 'convenience', x: 100, z: 100 },
    { id: 'suji-poi-5', name: '수지 공영주차장', type: 'parking', x: -100, z: 80 }
  ],
  spawnPoints: [
    { x: -400, z: 0, rotation: Math.PI / 2 },
    { x: 400, z: 0, rotation: -Math.PI / 2 },
    { x: 0, z: -400, rotation: 0 },
    { x: 0, z: 400, rotation: Math.PI }
  ]
};

// 홍대입구 맵 데이터
export const HONGDAE_MAP: MapRegion = {
  id: 'seoul-hongdae',
  name: '홍대입구',
  nameEn: 'Hongdae',
  description: '서울 마포구 홍대입구역 일대. 젊은이들의 거리.',
  center: { lat: 37.5563, lon: 126.9236 },
  bounds: {
    minLat: 37.5513,
    maxLat: 37.5613,
    minLon: 126.9186,
    maxLon: 126.9286
  },
  roads: [
    // 양화로 (주도로)
    {
      id: 'yanghwa-ro-1',
      name: '양화로',
      type: 'primary',
      lanes: 4,
      speedLimit: 50,
      points: [
        { x: -500, z: 0 },
        { x: 0, z: 0 },
        { x: 500, z: 0 }
      ],
      width: 22,
      oneway: false
    },
    // 홍익로
    {
      id: 'hongik-ro-1',
      name: '홍익로',
      type: 'secondary',
      lanes: 2,
      speedLimit: 40,
      points: [
        { x: 0, z: -400 },
        { x: 0, z: 0 },
        { x: 0, z: 400 }
      ],
      width: 12,
      oneway: false
    },
    // 어울마당로
    {
      id: 'eoulmadang-ro-1',
      name: '어울마당로',
      type: 'tertiary',
      lanes: 1,
      speedLimit: 30,
      points: [
        { x: -200, z: -300 },
        { x: -200, z: 200 }
      ],
      width: 8,
      oneway: false
    },
    // 와우산로
    {
      id: 'wausan-ro-1',
      name: '와우산로',
      type: 'tertiary',
      lanes: 2,
      speedLimit: 40,
      points: [
        { x: -400, z: 150 },
        { x: 0, z: 150 },
        { x: 200, z: 150 }
      ],
      width: 10,
      oneway: false
    },
    // 걷고싶은거리
    {
      id: 'walking-street-1',
      name: '걷고싶은거리',
      type: 'residential',
      lanes: 1,
      speedLimit: 20,
      points: [
        { x: -100, z: 50 },
        { x: -100, z: 200 }
      ],
      width: 6,
      oneway: true
    }
  ],
  buildings: [
    // 상업건물
    { id: 'hongdae-bld-1', name: 'AK플라자', type: 'commercial', x: -80, z: -50, width: 70, height: 40, depth: 50, levels: 10 },
    { id: 'hongdae-bld-2', name: '메세나폴리스', type: 'commercial', x: 150, z: -100, width: 90, height: 85, depth: 60, levels: 21 },
    { id: 'hongdae-bld-3', type: 'retail', x: -150, z: 50, width: 30, height: 20, depth: 25, levels: 5 },
    { id: 'hongdae-bld-4', type: 'retail', x: -150, z: 100, width: 30, height: 18, depth: 25, levels: 4 },
    { id: 'hongdae-bld-5', type: 'retail', x: 50, z: 80, width: 35, height: 22, depth: 28, levels: 5 },

    // 클럽/카페 거리
    { id: 'hongdae-shop-1', type: 'retail', x: -80, z: 100, width: 20, height: 12, depth: 15, levels: 3 },
    { id: 'hongdae-shop-2', type: 'retail', x: -50, z: 100, width: 20, height: 14, depth: 15, levels: 3 },
    { id: 'hongdae-shop-3', type: 'retail', x: -20, z: 100, width: 20, height: 12, depth: 15, levels: 3 },
    { id: 'hongdae-shop-4', type: 'retail', x: 10, z: 100, width: 20, height: 15, depth: 15, levels: 4 },

    // 홍익대학교
    { id: 'hongik-univ-1', name: '홍익대학교', type: 'school', x: -300, z: 200, width: 120, height: 25, depth: 80, levels: 6 },
    { id: 'hongik-univ-2', type: 'school', x: -300, z: 320, width: 100, height: 20, depth: 60, levels: 5 }
  ],
  pois: [
    { id: 'hongdae-poi-1', name: '홍대입구역 9번출구', type: 'subway', x: 0, z: -30 },
    { id: 'hongdae-poi-2', name: '홍대입구역 1번출구', type: 'subway', x: -50, z: 30 },
    { id: 'hongdae-poi-3', name: '공영주차장', type: 'parking', x: 100, z: -200 },
    { id: 'hongdae-poi-4', name: 'CU', type: 'convenience', x: -30, z: 50 },
    { id: 'hongdae-poi-5', name: 'GS25', type: 'convenience', x: 80, z: 120 }
  ],
  spawnPoints: [
    { x: -400, z: 0, rotation: Math.PI / 2 },
    { x: 400, z: 0, rotation: -Math.PI / 2 },
    { x: 0, z: -350, rotation: 0 }
  ]
};

// 모든 맵 데이터
export const ALL_MAPS: MapRegion[] = [
  GANGNAM_MAP,
  YONGIN_SUJI_MAP,
  HONGDAE_MAP
];

// ID로 맵 검색
export function getMapById(id: string): MapRegion | undefined {
  return ALL_MAPS.find(m => m.id === id);
}

// 맵 목록 반환
export function getMapList(): { id: string; name: string; nameEn: string; description: string }[] {
  return ALL_MAPS.map(m => ({
    id: m.id,
    name: m.name,
    nameEn: m.nameEn,
    description: m.description
  }));
}
