import * as THREE from "three";
import { Component } from "../core/component";

type MeshProperties = {
    view: THREE.Scene;
    geometry?: THREE.BufferGeometry;
    material?: THREE.Material | THREE.Material[];
    positionOffset?: THREE.Vector3Like;
    rotationOffset?: THREE.Vector3Like;
};

class Mesh extends Component {
    id = "mesh-component";
    private mesh: THREE.Mesh;
    private properties: Required<MeshProperties>;
    constructor({
        view,
        geometry = new THREE.BoxGeometry(1, 1, 1),
        material = new THREE.MeshNormalMaterial(),
        positionOffset = { x: 0, y: 0, z: 0 },
        rotationOffset = { x: 0, y: 0, z: 0 },
    }: MeshProperties) {
        super();
        this.properties = {
            view,
            geometry,
            material,
            positionOffset,
            rotationOffset,
        };
        this.mesh = new THREE.Mesh(geometry, material);
        if (Array.isArray(this.mesh.material)) {
            for (const material of this.mesh.material) {
                material.stencilWrite = true;
            }
        } else {
            this.mesh.material.stencilWrite = true;
        }
    }

    getMesh() {
        return this.mesh;
    }

    init(): void {
        const { view } = this.properties;
        view.add(this.mesh);
        this.mesh.userData = {
            entity: this.entity,
        };
    }

    update(_dt: number): void {
        const { positionOffset, rotationOffset } = this.properties;
        const translate = new THREE.Vector3(
            positionOffset.x,
            positionOffset.y,
            positionOffset.z
        );
        const rotate = new THREE.Euler(
            rotationOffset.x,
            rotationOffset.y,
            rotationOffset.z
        );

        this.mesh.position.copy(this.entity.position).add(translate);
        this.mesh.quaternion.copy(this.entity.rotation);
        this.mesh.rotation.x += rotate.x;
        this.mesh.rotation.y += rotate.y;
        this.mesh.rotation.z += rotate.z;
    }

    destroy(): void {
        const { view } = this.properties;
        view.remove(this.mesh);
    }
}

export { Mesh };

