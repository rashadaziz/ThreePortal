import RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import { Application } from "../core/application";
import { Component } from "../core/component";

type KinematicPlayerControllerProperties = {
    physicsWorld: RAPIER.World;
    capsuleDimensions?: { h: number; r: number };
    mass?: number;
};

class KinematicPlayerController extends Component {
    COLLIDER_OFFSET = 0.1;
    MIN_JUMP_INTERVAL = 1;
    id = "kinematic-character-body-component";
    rigidBody!: RAPIER.RigidBody;
    collider!: RAPIER.Collider;
    private position = new THREE.Vector3();
    private characterController: RAPIER.KinematicCharacterController;
    private properties: Required<KinematicPlayerControllerProperties>;
    private world: RAPIER.World;
    private yVelocity = 0;
    private jumpTimer = this.MIN_JUMP_INTERVAL;

    constructor({
        physicsWorld,
        capsuleDimensions = { h: 1, r: 0.5 },
        mass = 1,
    }: KinematicPlayerControllerProperties) {
        super();
        this.world = physicsWorld;
        this.properties = { physicsWorld, capsuleDimensions, mass };
        this.characterController = this.world.createCharacterController(
            this.COLLIDER_OFFSET
        );
        this.characterController.setCharacterMass(mass);
        this.characterController.setSlideEnabled(true);
        this.characterController.setApplyImpulsesToDynamicBodies(true);
    }

    init(): void {
        this.position.copy(this.entity.position);
        const rigidBodyDesc =
            RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
                this.position.x,
                this.position.y,
                this.position.z
            );
        const body = this.world.createRigidBody(rigidBodyDesc);
        const { h, r } = this.properties.capsuleDimensions;
        const colliderDesc = RAPIER.ColliderDesc.cuboid(r, h, r)
            .setMass(this.properties.mass)
            .setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.ALL);
        this.collider = this.world.createCollider(colliderDesc, body);
        this.rigidBody = body;
        this.rigidBody.userData = {
            entity: this.entity,
        };
        this.entity.position.y += this.characterController.offset();
    }

    onGround() {
        const { h, r } = this.properties.capsuleDimensions;
        const shape = new RAPIER.Cuboid(
            r * 0.5,
            this.COLLIDER_OFFSET * 0.5,
            r * 0.5
        );
        const shapePos = this.position
            .clone()
            .sub({ x: 0, y: h / 2 + r + this.COLLIDER_OFFSET, z: 0 });
        const shapeRot = this.entity.rotation;

        let groundDetected = null;

        this.world.intersectionsWithShape(
            shapePos,
            shapeRot,
            shape,
            (collider) => {
                const hitSelf = collider.handle === this.collider.handle;
                if (!hitSelf) {
                    groundDetected = collider;
                }
                return hitSelf;
            },
            undefined,
            undefined,
            undefined,
            undefined,
            (collider) => !collider.isSensor()
        );

        return groundDetected !== null;
    }

    correctMovement(_dt: number) {
        this.rigidBody.setNextKinematicRotation(this.entity.rotation);

        if (!this.onGround()) {
            this.yVelocity += Math.max(this.world.gravity.y * _dt * _dt, -55);
        } else {
            this.yVelocity = 0;
        }

        const keyboard = Application.getInstance().keyboardInput.keys;
        if (this.onGround()) {
            if (keyboard.has(" ") && this.jumpTimer >= this.MIN_JUMP_INTERVAL) {
                this.jumpTimer = 0;
                this.yVelocity += 5 * _dt;
            }
        }

        this.entity.position.y += this.yVelocity;

        const translation = this.entity.position.clone().sub(this.position);
        if (!this.onGround()) {
            translation.x /= 1.5;
            translation.z /= 1.5;
        }

        this.characterController.computeColliderMovement(
            this.collider,
            translation,
            undefined,
            undefined,
            (collider) => !collider.isSensor()
        );

        const correctedMovement = this.characterController.computedMovement();
        this.rigidBody.setNextKinematicTranslation(
            this.position.add(correctedMovement)
        );

        this.entity.position.copy(this.position);
    }

    update(_dt: number): void {
        this.jumpTimer += _dt;
        this.correctMovement(_dt);
    }

    destroy(): void {
        this.world.removeCharacterController(this.characterController);
        this.world.removeRigidBody(this.rigidBody);
    }
}

export { KinematicPlayerController };

