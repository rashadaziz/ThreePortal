import RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import { Application } from "./application";
import { Entity } from "./entity";

class Scene {
    mainCamera = new THREE.PerspectiveCamera(70, 16 / 9, 0.000001);
    mainView = new THREE.Scene();
    debugView = new THREE.Scene();
    physicsWorld = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    eventQueue = new RAPIER.EventQueue(true)
    entities: Entity[] = [];
    debugMode = false;
    debugLines: THREE.LineSegments;

    constructor() {
        let material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            vertexColors: true,
        });
        let geometry = new THREE.BufferGeometry();
        this.debugLines = new THREE.LineSegments(geometry, material);
        this.debugView.add(this.debugLines)
    }

    addEntity(entity: Entity) {
        this.entities.push(entity);
    }

    init() {
        this.physicsWorld.integrationParameters.dt = 1 / Application.getFps();
        for (const entity of this.entities) {
            entity.init();
        }
        const light = new THREE.AmbientLight(0xffffff);
        this.mainView.add(light);
    }

    toggleDebug() {
        this.debugMode = !this.debugMode;
        if (this.debugMode) {
            this.mainView.traverse((object) => {
                object.visible = false;
            });
        } else {
            this.mainView.traverse((object) => {
                object.visible = true;
            });
        }
    }

    refreshCameraAspect(aspect: number) {
        this.mainCamera.aspect = aspect;
        this.mainCamera.updateProjectionMatrix();
    }

    update(_dt: number) {
        this.physicsWorld.step(this.eventQueue);

        for (const entity of this.entities) {
            entity.update(_dt);
        }
    }

    debugRender() {
        let buffers = this.physicsWorld.debugRender();
        this.debugLines.geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(buffers.vertices, 3)
        );
        this.debugLines.geometry.setAttribute(
            "color",
            new THREE.BufferAttribute(buffers.colors, 4)
        );
    }

    render(renderer: THREE.WebGLRenderer) {
        if (this.debugMode) {
            this.debugRender()
        }
        renderer.render(this.mainView, this.mainCamera);
    }

    destroy() {}
}

export { Scene };

