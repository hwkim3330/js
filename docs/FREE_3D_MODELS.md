# Free 3D Vehicle Models for K-Driving-Sim

## CC0 / Public Domain (No Attribution Required)

### Kenney Assets
- **Car Kit**: https://kenney.nl/assets/car-kit
  - 45+ vehicles (cars, trucks, vans)
  - GLB, FBX, OBJ formats
  - CC0 License

### Quaternius
- **Cars Pack**: https://quaternius.com/packs/cars.html
  - 8 animated car models
  - CC0 License
  - FBX, OBJ, Blend formats

### Poly Pizza (Google Poly Archive)
- **Main**: https://poly.pizza/
- **Cars**: https://poly.pizza/search/car
- All free, GLTF format

## Sketchfab CC0 Models
- Concept Car 003: https://sketchfab.com/3d-models/free-concept-car-003-public-domain-cc0-77664fc474c444f4947e9834ed0d30ad
- Concept Car 025: https://sketchfab.com/3d-models/free-concept-car-025-public-domain-cc0-e3a65443d3e44c33b594cec591c01c05

## Integration Example

```typescript
import { ModelLoader } from "k-driving-sim";

const loader = new ModelLoader(scene, "/models/");

loader.registerModels([
    {
        id: "kenney-sedan",
        name: "Kenney Sedan",
        file: "kenney/sedan.glb",
        type: "vehicle",
        scale: 1.0
    }
]);

const car = await loader.load("kenney-sedan");
```

## Recommended Sources by Use Case

| Use Case | Best Source |
|----------|-------------|
| Stylized/Game | Kenney Assets |
| Low-poly | Quaternius, Poly Pizza |
| Realistic | Sketchfab CC0 |
| Korean Style | Custom procedural |

## Download Instructions

1. Download GLB/GLTF files
2. Place in `/public/models/vehicles/`
3. Register in ModelLoader
4. Use `loader.load()` to instantiate
