import RAPIER from "@dimforge/rapier3d";
import { Component } from "../core/component";

type RigidBodyProperties = {
    physicsWorld: RAPIER.World;
    bodyType?:
        | "dynamic"
        | "fixed"
        | "kinematicPositionBased"
        | "kinematicVelocityBased";
    boxColliderSize?: { w: number; h: number; d: number };
    mass?: number;
};

class RigidBody extends Component {
    id = "rigid-body-component";
    rigidBody!: RAPIER.RigidBody;
    collider!: RAPIER.Collider;
    private properties: Required<RigidBodyProperties>;
    world: RAPIER.World;
    constructor({
        physicsWorld,
        bodyType = "dynamic",
        boxColliderSize = { w: 1, h: 1, d: 1 },
        mass = 0.1,
    }: RigidBodyProperties) {
        super();
        this.world = physicsWorld;
        this.properties = {
            physicsWorld,
            bodyType,
            boxColliderSize,
            mass,
        };
    }

    init() {
        const { x, y, z } = this.entity.position;
        const rigidBodyDesc = RAPIER.RigidBodyDesc[this.properties.bodyType]()
            .setTranslation(x, y, z)
            .setRotation(this.entity.rotation);

        const { w, h, d } = this.properties.boxColliderSize;
        const colliderDesc = RAPIER.ColliderDesc.cuboid(
            w / 2,
            h / 2,
            d / 2
        ).setMass(this.properties.mass);

        const rigidBody = this.world.createRigidBody(rigidBodyDesc);
        const collider = this.world.createCollider(colliderDesc, rigidBody);
        this.rigidBody = rigidBody;
        this.collider = collider;
        this.rigidBody.userData = {
            entity: this.entity,
        };
    }

    update(_dt: number): void {
        const collider = this.collider;
        // sync physics object with entity
        this.entity.position.copy(collider.translation());
        this.entity.rotation.copy(collider.rotation());
    }

    destroy(): void {
        this.world.removeRigidBody(this.rigidBody!);
    }
}

export { RigidBody };

