/**
 * AdditionalMaps - More Korean City Maps
 */

import { MapRegion } from "./PrebuiltMaps";

// Busan Haeundae
export const BUSAN_HAEUNDAE: MapRegion = {
    id: "busan-haeundae",
    name: "Busan Haeundae Beach",
    center: { lat: 35.1587, lon: 129.1604 },
    roads: [
        { id: "haeundae-main", type: "primary", width: 25, lanes: 4, speedLimit: 60,
          points: [{ x: -200, z: 0 }, { x: 200, z: 0 }] },
        { id: "beach-road", type: "primary", width: 20, lanes: 3, speedLimit: 50,
          points: [{ x: 0, z: -150 }, { x: 0, z: 150 }] },
        { id: "marine-city", type: "secondary", width: 15, lanes: 2, speedLimit: 40,
          points: [{ x: 100, z: 50 }, { x: 200, z: 100 }] }
    ],
    buildings: [
        { id: "hotel1", x: -80, z: 60, width: 40, depth: 30, height: 80, type: "hotel" },
        { id: "hotel2", x: 80, z: 60, width: 35, depth: 35, height: 100, type: "hotel" },
        { id: "marine-tower", x: 150, z: 80, width: 50, depth: 50, height: 150, type: "apartment" },
        { id: "beach-mall", x: -50, z: -50, width: 60, depth: 40, height: 25, type: "retail" }
    ],
    pois: [
        { id: "haeundae-beach", type: "attraction", x: 0, z: 100, name: "Haeundae Beach" },
        { id: "aquarium", type: "attraction", x: -100, z: 50, name: "SEA LIFE Busan" }
    ],
    spawnPoints: [{ x: -150, z: 0, rotation: 0 }]
};

// Jeju City
export const JEJU_CITY: MapRegion = {
    id: "jeju-city",
    name: "Jeju City Center",
    center: { lat: 33.4996, lon: 126.5312 },
    roads: [
        { id: "jungang-ro", type: "primary", width: 25, lanes: 4, speedLimit: 50,
          points: [{ x: -200, z: 0 }, { x: 200, z: 0 }] },
        { id: "harbor-rd", type: "secondary", width: 18, lanes: 3, speedLimit: 40,
          points: [{ x: 0, z: -100 }, { x: 0, z: 150 }] },
        { id: "airport-rd", type: "primary", width: 22, lanes: 4, speedLimit: 60,
          points: [{ x: -150, z: -80 }, { x: 150, z: 80 }] }
    ],
    buildings: [
        { id: "city-hall", x: 0, z: 50, width: 50, depth: 40, height: 35, type: "government" },
        { id: "harbor-building", x: -100, z: -50, width: 80, depth: 30, height: 20, type: "commercial" },
        { id: "hotel-jeju", x: 100, z: 70, width: 45, depth: 35, height: 60, type: "hotel" }
    ],
    pois: [
        { id: "jeju-airport", type: "airport", x: -200, z: 100, name: "Jeju Airport" },
        { id: "harbor", type: "harbor", x: -150, z: -80, name: "Jeju Harbor" }
    ],
    spawnPoints: [{ x: -180, z: 0, rotation: 0 }]
};

// Daegu Downtown
export const DAEGU_DOWNTOWN: MapRegion = {
    id: "daegu-downtown",
    name: "Daegu Downtown",
    center: { lat: 35.8714, lon: 128.6014 },
    roads: [
        { id: "dongseong-ro", type: "primary", width: 20, lanes: 4, speedLimit: 50,
          points: [{ x: -180, z: 0 }, { x: 180, z: 0 }] },
        { id: "jungang-daero", type: "primary", width: 30, lanes: 6, speedLimit: 60,
          points: [{ x: 0, z: -200 }, { x: 0, z: 200 }] },
        { id: "station-rd", type: "secondary", width: 15, lanes: 2, speedLimit: 40,
          points: [{ x: -100, z: 100 }, { x: 100, z: 100 }] }
    ],
    buildings: [
        { id: "dept-store", x: -50, z: 30, width: 60, depth: 50, height: 45, type: "retail" },
        { id: "tower1", x: 80, z: -40, width: 35, depth: 35, height: 120, type: "office" },
        { id: "station", x: 0, z: 150, width: 100, depth: 40, height: 25, type: "station" }
    ],
    pois: [
        { id: "dongseong-shopping", type: "shopping", x: 0, z: 0, name: "Dongseong-ro" },
        { id: "daegu-station", type: "station", x: 0, z: 150, name: "Daegu Station" }
    ],
    spawnPoints: [{ x: -150, z: 0, rotation: 0 }]
};

// Incheon Songdo
export const INCHEON_SONGDO: MapRegion = {
    id: "incheon-songdo",
    name: "Songdo International City",
    center: { lat: 37.3916, lon: 126.6400 },
    roads: [
        { id: "central-park-rd", type: "primary", width: 30, lanes: 6, speedLimit: 60,
          points: [{ x: -250, z: 0 }, { x: 250, z: 0 }] },
        { id: "tech-park-rd", type: "primary", width: 25, lanes: 4, speedLimit: 50,
          points: [{ x: 0, z: -200 }, { x: 0, z: 200 }] },
        { id: "ocean-rd", type: "secondary", width: 18, lanes: 3, speedLimit: 40,
          points: [{ x: 150, z: -100 }, { x: 150, z: 150 }] }
    ],
    buildings: [
        { id: "g-tower", x: -80, z: 50, width: 40, depth: 40, height: 150, type: "office" },
        { id: "posco-tower", x: 50, z: -60, width: 50, depth: 50, height: 180, type: "office" },
        { id: "convensia", x: -120, z: -80, width: 120, depth: 60, height: 30, type: "convention" },
        { id: "triple-street", x: 100, z: 80, width: 80, depth: 50, height: 35, type: "retail" },
        { id: "nc-cube", x: -60, z: -30, width: 100, depth: 80, height: 25, type: "retail" }
    ],
    pois: [
        { id: "central-park", type: "park", x: 0, z: 0, name: "Songdo Central Park" },
        { id: "g-tower-obs", type: "attraction", x: -80, z: 50, name: "G-Tower Observatory" }
    ],
    spawnPoints: [{ x: -200, z: 0, rotation: 0 }]
};

// Gwangju City
export const GWANGJU_CITY: MapRegion = {
    id: "gwangju-city",
    name: "Gwangju City Center",
    center: { lat: 35.1595, lon: 126.8526 },
    roads: [
        { id: "geumnam-ro", type: "primary", width: 25, lanes: 4, speedLimit: 50,
          points: [{ x: -200, z: 0 }, { x: 200, z: 0 }] },
        { id: "chungjang-ro", type: "secondary", width: 15, lanes: 2, speedLimit: 40,
          points: [{ x: 50, z: -100 }, { x: 50, z: 100 }] }
    ],
    buildings: [
        { id: "asia-culture", x: -100, z: 50, width: 150, depth: 100, height: 20, type: "culture" },
        { id: "dept-store-gj", x: 80, z: -30, width: 50, depth: 40, height: 40, type: "retail" }
    ],
    pois: [
        { id: "acc", type: "culture", x: -100, z: 50, name: "Asia Culture Center" }
    ],
    spawnPoints: [{ x: -180, z: 0, rotation: 0 }]
};

export const ADDITIONAL_MAPS: MapRegion[] = [
    BUSAN_HAEUNDAE,
    JEJU_CITY,
    DAEGU_DOWNTOWN,
    INCHEON_SONGDO,
    GWANGJU_CITY
];
