/**
 * ModelLoader - GLTF/GLB 3D Model Loader
 * Loads real 3D models and provides fallback to procedural models
 */

import {
    Scene,
    SceneLoader,
    TransformNode,
    AbstractMesh,
    Mesh,
    Vector3,
    AnimationGroup,
    Skeleton
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

export interface LoadedModel {
    root: TransformNode;
    meshes: AbstractMesh[];
    skeletons: Skeleton[];
    animationGroups: AnimationGroup[];
}

export interface ModelManifest {
    id: string;
    name: string;
    file: string;
    type: "vehicle" | "building" | "prop" | "character";
    scale?: number;
    offset?: { x: number; y: number; z: number };
}

export interface LoadProgress {
    loaded: number;
    total: number;
    percent: number;
    modelId: string;
}

export class ModelLoader {
    private scene: Scene;
    private modelCache: Map<string, LoadedModel> = new Map();
    private manifestCache: Map<string, ModelManifest> = new Map();
    private basePath: string;
    private onProgress?: (progress: LoadProgress) => void;

    constructor(scene: Scene, basePath: string = "/models/") {
        this.scene = scene;
        this.basePath = basePath;
    }

    setProgressCallback(callback: (progress: LoadProgress) => void): void {
        this.onProgress = callback;
    }

    registerModel(manifest: ModelManifest): void {
        this.manifestCache.set(manifest.id, manifest);
    }

    registerModels(manifests: ModelManifest[]): void {
        for (const m of manifests) {
            this.registerModel(m);
        }
    }

    async load(modelId: string): Promise<LoadedModel | null> {
        if (this.modelCache.has(modelId)) {
            return this.cloneModel(this.modelCache.get(modelId)!);
        }

        const manifest = this.manifestCache.get(modelId);
        if (!manifest) {
            console.warn("Model manifest not found:", modelId);
            return null;
        }

        try {
            const result = await this.loadFromFile(manifest);
            this.modelCache.set(modelId, result);
            return this.cloneModel(result);
        } catch (error) {
            console.error("Failed to load model", modelId, error);
            return null;
        }
    }

    private async loadFromFile(manifest: ModelManifest): Promise<LoadedModel> {
        const fullPath = this.basePath + manifest.file;
        const folder = fullPath.substring(0, fullPath.lastIndexOf("/") + 1);
        const filename = fullPath.substring(fullPath.lastIndexOf("/") + 1);

        console.log("Loading model:", manifest.name, "from", fullPath);

        const result = await SceneLoader.ImportMeshAsync(
            "",
            folder,
            filename,
            this.scene,
            (event) => {
                if (this.onProgress && event.total > 0) {
                    this.onProgress({
                        loaded: event.loaded,
                        total: event.total,
                        percent: Math.round((event.loaded / event.total) * 100),
                        modelId: manifest.id
                    });
                }
            }
        );

        const root = new TransformNode("model_" + manifest.id, this.scene);
        const scale = manifest.scale ?? 1;
        root.scaling = new Vector3(scale, scale, scale);

        if (manifest.offset) {
            root.position = new Vector3(manifest.offset.x, manifest.offset.y, manifest.offset.z);
        }

        for (const mesh of result.meshes) {
            if (!mesh.parent) {
                mesh.parent = root;
            }
        }

        return { root, meshes: result.meshes, skeletons: result.skeletons, animationGroups: result.animationGroups };
    }

    private cloneModel(original: LoadedModel): LoadedModel {
        const clonedRoot = original.root.clone(original.root.name + "_clone", null);
        if (!clonedRoot) throw new Error("Failed to clone model root");

        const clonedMeshes: AbstractMesh[] = [];
        for (const mesh of original.meshes) {
            if (mesh instanceof Mesh) {
                const cloned = mesh.clone(mesh.name + "_clone", clonedRoot);
                if (cloned) clonedMeshes.push(cloned);
            }
        }

        return { root: clonedRoot as TransformNode, meshes: clonedMeshes, skeletons: [], animationGroups: [] };
    }

    async preloadAll(modelIds: string[]): Promise<Map<string, LoadedModel | null>> {
        const results = new Map<string, LoadedModel | null>();
        for (const id of modelIds) {
            results.set(id, await this.load(id));
        }
        return results;
    }

    isLoaded(modelId: string): boolean { return this.modelCache.has(modelId); }
    getCachedCount(): number { return this.modelCache.size; }

    clearCache(): void {
        for (const model of this.modelCache.values()) {
            model.root.dispose();
        }
        this.modelCache.clear();
    }

    dispose(): void {
        this.clearCache();
        this.manifestCache.clear();
    }
}

export const KOREAN_VEHICLE_MANIFESTS: ModelManifest[] = [
    { id: "hyundai_sonata", name: "Hyundai Sonata DN8", file: "vehicles/hyundai_sonata.glb", type: "vehicle", scale: 1.0 },
    { id: "kia_k5", name: "Kia K5 DL3", file: "vehicles/kia_k5.glb", type: "vehicle", scale: 1.0 },
    { id: "genesis_g80", name: "Genesis G80 RG3", file: "vehicles/genesis_g80.glb", type: "vehicle", scale: 1.0 },
    { id: "hyundai_ioniq6", name: "Hyundai Ioniq 6", file: "vehicles/hyundai_ioniq6.glb", type: "vehicle", scale: 1.0 },
    { id: "kia_ev6", name: "Kia EV6", file: "vehicles/kia_ev6.glb", type: "vehicle", scale: 1.0 },
];
