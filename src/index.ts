/**
 * K-Driving-Sim Library
 * 
 * Korean Driving Simulator built with Babylon.js
 * Optimized for AI-assisted development
 */

// Core
export { KDrivingEngine } from "./core/Engine";
export { GameWorld } from "./core/GameWorld";
export { InputManager } from "./core/InputManager";
export { CameraController } from "./core/CameraController";

// Physics
export { VehiclePhysics, KOREAN_VEHICLES } from "./physics/VehiclePhysics";

// Graphics
export { MaterialManager } from "./graphics/MaterialManager";
export { MapRenderer } from "./graphics/MapRenderer";
export { VehicleModel } from "./graphics/VehicleModel";
export { ProceduralBuilding } from "./graphics/ProceduralBuilding";
export { RoadBuilder } from "./graphics/RoadBuilder";
export { EnvironmentObjects } from "./graphics/EnvironmentObjects";
export { SkyboxManager } from "./graphics/SkyboxManager";

// Loaders
export { ModelLoader, KOREAN_VEHICLE_MANIFESTS } from "./loaders/ModelLoader";

// Systems
export { WeatherSystem } from "./systems/WeatherSystem";
export { TrafficSystem } from "./systems/TrafficSystem";
export { AudioSystem } from "./systems/AudioSystem";

// UI
export { HUD } from "./ui/HUD";
export { Minimap } from "./ui/Minimap";

// Data
export { VEHICLE_DATABASE } from "./data/KoreanVehicles";
export { PREBUILT_MAPS, type MapRegion } from "./data/PrebuiltMaps";
