import RAPIER from "@dimforge/rapier3d";
import * as THREE from "three";
import { Entity } from "../core/entity";

type PortalEntityProperties = {
    tag: "portal-blue" | "portal-orange";
    physicsWorld: RAPIER.World;
    hostCollider: RAPIER.Collider;
};


class Portal extends Entity {
    static BLUE_TAG = "portal-blue" as const;
    static ORANGE_TAG = "portal-orange" as const;
    static PORTAL_HOST_TAG = "portal-host";
    static PORTAL_PLANE_OFFSET = 0.1;
    static WIDTH = 2;
    static HEIGHT = 3;
    static SENSOR_DEPTH = 1;
    mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(Portal.WIDTH, Portal.HEIGHT),
        new THREE.MeshBasicMaterial({
            stencilWrite: true,
            // side: THREE.DoubleSide
        })
    );
    borderGroup = new THREE.Group()
    destination: Portal | null = null;
    physicsWorld: RAPIER.World;
    hostCollider: RAPIER.Collider;
    sensor: RAPIER.RigidBody;
    sensorOffset = new THREE.Vector3(0, 0, Portal.SENSOR_DEPTH / 2);
    portalFrameColliders: RAPIER.RigidBody[];

    constructor({ tag, physicsWorld, hostCollider }: PortalEntityProperties) {
        super(tag);
        this.mesh.frustumCulled = false;
        this.mesh.userData = {
            entity: this,
        };
        this.physicsWorld = physicsWorld;
        this.hostCollider = hostCollider;
        this.sensor = this.initializeSensor();
        this.portalFrameColliders = this.initializePortalFrameColliders();

        if (tag === Portal.BLUE_TAG) {
            this.mesh.material.color = new THREE.Color("blue");
        } else if (tag === Portal.ORANGE_TAG) {
            this.mesh.material.color = new THREE.Color("orange");
        }

        const borderWidth = 0.1;

        const border1 = new THREE.Mesh(
            new THREE.PlaneGeometry(Portal.HEIGHT, borderWidth),
            new THREE.MeshNormalMaterial()
        );
        border1.translateX(Portal.WIDTH / 2 + borderWidth * 0.5);
        border1.rotateZ(Math.PI / 2);

        const border2 = new THREE.Mesh(
            new THREE.PlaneGeometry(Portal.HEIGHT, borderWidth),
            new THREE.MeshNormalMaterial()
        );
        border2.translateX(-(Portal.WIDTH / 2 + borderWidth * 0.5));
        border2.rotateZ(Math.PI / 2);

        const border3 = new THREE.Mesh(
            new THREE.PlaneGeometry(
                borderWidth,
                Portal.WIDTH + borderWidth * 2
            ),
            new THREE.MeshNormalMaterial()
        );
        border3.translateY(Portal.HEIGHT / 2 + borderWidth * 0.5);
        border3.rotateZ(Math.PI / 2);

        const border4 = new THREE.Mesh(
            new THREE.PlaneGeometry(
                borderWidth,
                Portal.WIDTH + borderWidth * 2
            ),
            new THREE.MeshNormalMaterial()
        );
        border4.translateY(-(Portal.HEIGHT / 2 + borderWidth * 0.5));
        border4.rotateZ(Math.PI / 2);

        this.borderGroup.add(border1);
        this.borderGroup.add(border2);
        this.borderGroup.add(border3);
        this.borderGroup.add(border4);
    }

    initializePortalFrameColliders() {
        const bodies: RAPIER.RigidBody[] = [];

        return bodies;
    }

    initializeSensor() {
        const rigidBodyDesc =
            RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
                this.position.x,
                this.position.y,
                this.position.z
            );
        const colliderDesc = RAPIER.ColliderDesc.cuboid(
            Portal.WIDTH / 2,
            Portal.HEIGHT / 2,
            Portal.SENSOR_DEPTH / 2
        )
            .setSensor(true)
            .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

        const rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc);
        this.physicsWorld.createCollider(colliderDesc, rigidBody);

        rigidBody.userData = {
            entity: this,
        };

        return rigidBody;
    }

    getDestinationCamera(srcCam: THREE.PerspectiveCamera) {
        if (!this.destination) {
            throw new Error(
                `Portal with tag ${this.tag} has no destination set.`
            );
        }

        const portalCam = new THREE.PerspectiveCamera(
            srcCam.fov,
            srcCam.aspect,
            srcCam.near,
            srcCam.far
        );

        const rotation180 = new THREE.Matrix4().makeRotationY(Math.PI);

        const destView = srcCam.matrixWorldInverse
            .clone()
            .multiply(this.getWorldMatrix())
            .multiply(rotation180)
            .multiply(this.destination.getWorldMatrix().invert());

        destView.invert();

        portalCam.position.setFromMatrixPosition(destView);
        portalCam.rotation.setFromRotationMatrix(destView);

        portalCam.updateMatrixWorld(true);

        this.setObliqueProjection(portalCam);

        return portalCam;
    }

    private setObliqueProjection(portalCam: THREE.PerspectiveCamera) {
        if (!this.destination) {
            throw new Error(
                `Portal with tag ${this.tag} has no destination set.`
            );
        }

        const cameraViewMat = portalCam.matrixWorldInverse.clone();
        const dstRotationMat = new THREE.Matrix4().extractRotation(
            this.destination.getWorldMatrix()
        );
        const normal = new THREE.Vector3(0, 0, 1).applyMatrix4(dstRotationMat);

        const clipPlane = new THREE.Plane()
            .setFromNormalAndCoplanarPoint(
                normal,
                this.destination.getWorldPosition()
            )
            .applyMatrix4(cameraViewMat);

        const clipVector = new THREE.Vector4().set(
            clipPlane.normal.x,
            clipPlane.normal.y,
            clipPlane.normal.z,
            clipPlane.constant
        );

        const projectionMatrix = new THREE.Matrix4().copy(
            portalCam.projectionMatrix
        );

        const q = new THREE.Vector4();

        q.x =
            (Math.sign(clipVector.x) + projectionMatrix.elements[8]) /
            projectionMatrix.elements[0];
        q.y =
            (Math.sign(clipVector.y) + projectionMatrix.elements[9]) /
            projectionMatrix.elements[5];
        q.z = -1.0;
        q.w =
            (1.0 + projectionMatrix.elements[10]) /
            portalCam.projectionMatrix.elements[14];

        clipVector.multiplyScalar(2 / clipVector.dot(q));

        projectionMatrix.elements[2] = clipVector.x;
        projectionMatrix.elements[6] = clipVector.y;
        projectionMatrix.elements[10] = clipVector.z + 1.0;
        projectionMatrix.elements[14] = clipVector.w;

        portalCam.projectionMatrix.copy(projectionMatrix);
    }

    isVisibleFromCamera(camera: THREE.PerspectiveCamera) {
        const frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(
                camera.projectionMatrix,
                camera.matrixWorldInverse
            )
        );
        return frustum.intersectsObject(this.mesh);
    }

    private getWorldPosition() {
        return this.mesh.getWorldPosition(new THREE.Vector3());
    }

    getWorldMatrix() {
        return new THREE.Matrix4().copy(this.mesh.matrixWorld);
    }

    updateSensor() {
        if (this.destination != null && !this.sensor.isEnabled()) {
            this.sensor.setEnabled(true);
        }

        if (this.destination == null && this.sensor.isEnabled()) {
            this.sensor.setEnabled(false);
        }

        const translation = this.position
            .clone()
            .add(this.sensorOffset.clone().applyQuaternion(this.rotation));
        this.sensor.setTranslation(translation, true);
        this.sensor.setRotation(this.rotation, true);
    }

    update(_dt: number): void {
        this.mesh.position.copy(this.position);
        this.borderGroup.position.copy(this.position);
        this.mesh.quaternion.copy(this.rotation);
        this.borderGroup.quaternion.copy(this.rotation);
        this.mesh.updateMatrixWorld(true);
        this.updateSensor();
    }
}

export { Portal };

