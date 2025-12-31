/**
 * VRManager - WebXR VR Support
 * 
 * Enables VR mode for K-Driving-Sim
 */

import {
    Scene,
    WebXRDefaultExperience,
    WebXRState,
    Vector3,
    WebXRCamera,
    TransformNode
} from "@babylonjs/core";

export interface VRConfig {
    floorMeshes?: string[];
    handTracking?: boolean;
    teleportation?: boolean;
}

export class VRManager {
    private scene: Scene;
    private xr: WebXRDefaultExperience | null = null;
    private isSupported: boolean = false;
    private isActive: boolean = false;
    private vrCamera: WebXRCamera | null = null;
    private cameraRig: TransformNode | null = null;
    
    private onEnterVR?: () => void;
    private onExitVR?: () => void;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    async init(config: VRConfig = {}): Promise<boolean> {
        try {
            // Check WebXR support
            if (!navigator.xr) {
                console.warn("WebXR not supported in this browser");
                return false;
            }

            const isSupported = await navigator.xr.isSessionSupported("immersive-vr");
            if (!isSupported) {
                console.warn("Immersive VR not supported");
                return false;
            }

            this.isSupported = true;
            console.log("WebXR VR supported");

            // Create XR experience
            this.xr = await WebXRDefaultExperience.CreateAsync(this.scene, {
                disableTeleportation: !config.teleportation,
                floorMeshes: [],
                uiOptions: {
                    sessionMode: "immersive-vr"
                }
            });

            // Setup state change listener
            this.xr.baseExperience.onStateChangedObservable.add((state) => {
                if (state === WebXRState.IN_XR) {
                    this.isActive = true;
                    this.vrCamera = this.xr!.baseExperience.camera;
                    console.log("Entered VR mode");
                    this.onEnterVR?.();
                } else if (state === WebXRState.NOT_IN_XR) {
                    this.isActive = false;
                    console.log("Exited VR mode");
                    this.onExitVR?.();
                }
            });

            // Create camera rig for vehicle attachment
            this.cameraRig = new TransformNode("vr_camera_rig", this.scene);

            console.log("VR Manager initialized");
            return true;

        } catch (error) {
            console.error("Failed to initialize VR:", error);
            return false;
        }
    }

    async enterVR(): Promise<boolean> {
        if (!this.isSupported || !this.xr) {
            console.warn("VR not available");
            return false;
        }

        try {
            await this.xr.baseExperience.enterXRAsync("immersive-vr", "local-floor");
            return true;
        } catch (error) {
            console.error("Failed to enter VR:", error);
            return false;
        }
    }

    exitVR(): void {
        if (this.isActive && this.xr) {
            this.xr.baseExperience.exitXRAsync();
        }
    }

    toggleVR(): void {
        if (this.isActive) {
            this.exitVR();
        } else {
            this.enterVR();
        }
    }

    attachToVehicle(vehicleNode: TransformNode, seatOffset: Vector3 = new Vector3(0, 1.2, 0.3)): void {
        if (!this.cameraRig) return;

        this.cameraRig.parent = vehicleNode;
        this.cameraRig.position = seatOffset;

        if (this.xr) {
            // Set the XR camera to follow the rig
            this.xr.baseExperience.camera.parent = this.cameraRig;
        }
    }

    detachFromVehicle(): void {
        if (!this.cameraRig) return;
        this.cameraRig.parent = null;
        if (this.xr) {
            this.xr.baseExperience.camera.parent = null;
        }
    }

    setEnterVRCallback(callback: () => void): void {
        this.onEnterVR = callback;
    }

    setExitVRCallback(callback: () => void): void {
        this.onExitVR = callback;
    }

    getIsSupported(): boolean {
        return this.isSupported;
    }

    getIsActive(): boolean {
        return this.isActive;
    }

    getVRCamera(): WebXRCamera | null {
        return this.vrCamera;
    }

    getCameraRig(): TransformNode | null {
        return this.cameraRig;
    }

    getControllers(): any[] {
        if (!this.xr) return [];
        return this.xr.input.controllers;
    }

    dispose(): void {
        this.exitVR();
        this.cameraRig?.dispose();
        this.xr?.dispose();
    }
}

export function createVRButton(vrManager: VRManager): HTMLButtonElement {
    const button = document.createElement("button");
    button.id = "vr-button";
    button.textContent = "Enter VR";
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 30px;
        font-size: 18px;
        font-weight: bold;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 30px;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `;

    button.onmouseenter = () => {
        button.style.transform = "scale(1.05)";
    };
    button.onmouseleave = () => {
        button.style.transform = "scale(1)";
    };

    button.onclick = () => vrManager.toggleVR();

    vrManager.setEnterVRCallback(() => {
        button.textContent = "Exit VR";
        button.style.background = "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
    });

    vrManager.setExitVRCallback(() => {
        button.textContent = "Enter VR";
        button.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    });

    if (!vrManager.getIsSupported()) {
        button.textContent = "VR Not Supported";
        button.disabled = true;
        button.style.opacity = "0.5";
        button.style.cursor = "not-allowed";
    }

    return button;
}
