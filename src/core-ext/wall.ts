import RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import { Mesh } from "../components/mesh";
import { RigidBody } from "../components/rigid-body";
import { Entity } from "../core/entity";

type WallEntityProperties = {
    tag: string;
    width?: number;
    height?: number;
    view: THREE.Scene;
    physicsWorld: RAPIER.World;
    material?: THREE.Material;
};

class Wall extends Entity {
    static DEPTH = 0.1;
    constructor({
        tag,
        width = 10,
        height = 10,
        view,
        physicsWorld,
        material = new THREE.MeshNormalMaterial(),
    }: WallEntityProperties) {
        super(tag);
        const transparentMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
        });
        const mesh = new Mesh({
            view,
            geometry: new THREE.BoxGeometry(width, height, Wall.DEPTH),
            material: [
                transparentMaterial,
                transparentMaterial,
                transparentMaterial,
                transparentMaterial,
                material,
                transparentMaterial,
                transparentMaterial,
            ],
        });
        this.addComponent(mesh);
        this.addComponent(
            new RigidBody({
                physicsWorld,
                bodyType: "fixed",
                boxColliderSize: { w: width, h: height, d: Wall.DEPTH },
            })
        );
    }

    update(dt: number): void {
        super.update(dt);
        const offset = new THREE.Vector3(0, 0, -Wall.DEPTH / 2).applyQuaternion(
            this.rotation
        );
        this.position.add(offset);
    }
}

export { Wall };

