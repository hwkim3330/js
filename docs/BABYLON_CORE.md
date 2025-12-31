# Babylon.js Core Concepts

## Engine Types
- WebGPUEngine: Modern, faster (preferred)
- Engine: WebGL fallback

## Scene Graph
- Scene: Root container
- TransformNode: Group (no geometry)
- Mesh: Visible geometry

## MeshBuilder
- CreateBox, CreateGround, CreateCylinder, CreateSphere
- CreateRibbon (for roads)

## PBR Materials
- albedoColor: Base color
- metallic: 0-1 (plastic to metal)
- roughness: 0-1 (mirror to matte)
- emissiveColor: Glow

## Lighting
- HemisphericLight: Ambient
- DirectionalLight: Sun
- PointLight: Lamp
- SpotLight: Flashlight

## Cameras
- FreeCamera: FPS
- ArcRotateCamera: Orbit
- FollowCamera: Chase cam

## Physics (Havok)
- PhysicsAggregate: mass, friction, restitution
- applyForce, setLinearVelocity

## Model Loading
```typescript
import "@babylonjs/loaders/glTF";
const result = await SceneLoader.ImportMeshAsync("", "/models/", "car.glb", scene);
```

## Optimization
- LOD: addLODLevel()
- Instancing: thinInstanceAdd()
- Culling: frustum, occlusion
