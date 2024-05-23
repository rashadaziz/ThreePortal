import * as THREE from "three";
import { Application } from "../core/application";
import { Component } from "../core/component";

type FirstPersonControllerProperties = {
    camera: THREE.PerspectiveCamera;
    cameraHeight?: number;
    sensitivity?: number;
    speed?: number;
};

class FirstPersonController extends Component {
    id = "first-person-controller-component";
    LERP_STOP_SPEED = 5;
    ZERO_VELOCITY = new THREE.Vector3(0, 0, 0);
    private euler = new THREE.Euler(0, 0, 0, "YXZ");
    private app = Application.getInstance();
    private properties: Required<FirstPersonControllerProperties>;
    lastMovement = new THREE.Vector3();

    constructor({
        camera,
        cameraHeight = 1,
        sensitivity = 1,
        speed = 5,
    }: FirstPersonControllerProperties) {
        super();
        this.properties = { camera, cameraHeight, sensitivity, speed };
    }

    init(): void {
        this.onMouseMove = this.onMouseMove.bind(this);
        addEventListener("mousemove", this.onMouseMove);
    }

    onMouseMove(e: MouseEvent) {
        if (!this.app.pointerlockInput.isLocked) return;
        this.updateLook(e.movementX, e.movementY)
    }

    updateMovement(dt: number) {
        const keys = this.app.keyboardInput.keys;
        let forwardVel = keys.has("w") ? 1 : keys.has("s") ? -1 : 0;
        let strafeVel = keys.has("a") ? 1 : keys.has("d") ? -1 : 0;

        if (!this.app.pointerlockInput.isLocked) {
            forwardVel = 0;
            strafeVel = 0;
            keys.clear();
        }

        const qx = new THREE.Quaternion();
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.euler.y);

        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(qx);
        forward.multiplyScalar(forwardVel);

        const left = new THREE.Vector3(-1, 0, 0);
        left.applyQuaternion(qx);
        left.multiplyScalar(strafeVel);

        const direction = forward.add(left).normalize();
        let movement = direction.multiplyScalar(dt * this.properties.speed);

        if (movement.length() === 0) {
            this.lastMovement.lerp(
                this.ZERO_VELOCITY,
                dt * this.LERP_STOP_SPEED
            );
            movement.copy(this.lastMovement);
        }

        this.lastMovement.copy(movement);
        this.entity.position.add(movement);
    }

    updateLook(movementX: number = 0, movementY: number = 0) {
        const { camera, sensitivity } = this.properties;

        this.euler.setFromQuaternion(camera.quaternion);

        this.euler.y -= movementX * 0.002 * sensitivity;
        this.euler.x -= movementY * 0.002 * sensitivity;

        const maxRot = (Math.PI / 2) * 0.9;

        this.euler.x = Math.max(-maxRot, Math.min(maxRot, this.euler.x));

        camera.quaternion.setFromEuler(this.euler);
        this.entity.rotation.setFromEuler(
            new THREE.Euler(0, this.euler.y, 0, "YXZ")
        );
    }

    update(dt: number): void {
        this.updateMovement(dt);
        this.properties.camera.position.copy(this.entity.position);
        this.properties.camera.position.y += this.properties.cameraHeight;
    }

    updateEuler() {
        this.euler.copy(this.properties.camera.rotation);
    }

    destroy(): void {
        removeEventListener("mousemove", this.onMouseMove);
    }
}

export { FirstPersonController };

