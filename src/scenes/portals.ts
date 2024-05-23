import * as THREE from "three";
import { FirstPersonController } from "../components/first-person-controller";
import { KinematicPlayerController } from "../components/kinematic-player-controller";
import { Mesh } from "../components/mesh";
import { PortalGun } from "../components/portal-gun";
import { RigidBody } from "../components/rigid-body";
import { Portal } from "../core-ext/portal";
import { Wall } from "../core-ext/wall";
import { Entity } from "../core/entity";
import { Scene } from "../core/scene";

class PortalsScene extends Scene {
    MAX_PORTAL_RECURSION = 1;
    portalView = new THREE.Scene();
    portals: Portal[] = [];

    constructor() {
        super();
    }

    addPortal(portal: Portal) {
        this.portals.push(portal);
        this.mainView.add(portal.mesh);
        this.mainView.add(portal.borderGroup)
    }

    init(): void {
        const ground = new Wall({
            tag: Portal.PORTAL_HOST_TAG,
            physicsWorld: this.physicsWorld,
            view: this.mainView,
            width: 20,
            height: 20,
            material: new THREE.MeshToonMaterial(),
        });
        ground.rotation.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));

        const wall1 = new Wall({
            tag: Portal.PORTAL_HOST_TAG,
            physicsWorld: this.physicsWorld,
            view: this.mainView,
            width: 20,
            height: 20,
            material: new THREE.MeshToonMaterial({ color: 0x404040 }),
        });
        wall1.position.z = -10;
        wall1.position.y = 10;

        const wall2 = new Wall({
            tag: Portal.PORTAL_HOST_TAG,
            physicsWorld: this.physicsWorld,
            view: this.mainView,
            width: 20,
            height: 20,
            material: new THREE.MeshToonMaterial({ color: 0x40604f }),
        });
        wall2.position.x = -10;
        wall2.position.y = 10;
        wall2.rotation.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));

        const wall3 = new Wall({
            tag: Portal.PORTAL_HOST_TAG,
            physicsWorld: this.physicsWorld,
            view: this.mainView,
            width: 20,
            height: 20,
            material: new THREE.MeshToonMaterial({ color: 0x4040ff }),
        });
        wall3.position.z = 10;
        wall3.position.y = 10;
        wall3.rotation.setFromEuler(new THREE.Euler(0, Math.PI, 0));

        const wall4 = new Wall({
            tag: Portal.PORTAL_HOST_TAG,
            physicsWorld: this.physicsWorld,
            view: this.mainView,
            width: 20,
            height: 20,
            material: new THREE.MeshPhysicalMaterial({ color: 0x6040af }),
        });
        wall4.position.x = 10;
        wall4.position.y = 10;
        wall4.rotation.setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));

        this.addEntity(wall1);
        this.addEntity(wall2);
        this.addEntity(wall3);
        this.addEntity(wall4);

        const roof = new Wall({
            tag: Portal.PORTAL_HOST_TAG,
            physicsWorld: this.physicsWorld,
            view: this.mainView,
            width: 20,
            height: 20,
            material: new THREE.MeshPhysicalMaterial({ color: 0x404faf }),
        });
        roof.position.y = 20;
        roof.rotation.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));

        this.addEntity(roof);

        const player = new Entity("player");
        player.position = new THREE.Vector3(0, 1.5, 4);
        player.addComponent(
            new Mesh({
                view: this.mainView,
                geometry: new THREE.CapsuleGeometry(0.5, 1),
            })
        );
        player.addComponent(
            new FirstPersonController({
                camera: this.mainCamera,
                cameraHeight: 0.8,
                speed: 5,
            })
        );
        player.addComponent(
            new KinematicPlayerController({
                physicsWorld: this.physicsWorld,
                mass: 999,
            })
        );
        player.addComponent(
            new PortalGun({
                view: this.mainView,
                playerCam: this.mainCamera,
                onPortalPlaced: this.onPortalPlaced.bind(this),
            })
        );

        this.addEntity(player);
        this.addEntity(ground);

        const box = new Entity("box");
        box.addComponent(
            new Mesh({
                view: this.mainView,
                geometry: new THREE.BoxGeometry(1.5, 1.5, 1.5),
            })
        );
        box.position.add({ x: 0, y: .75, z: 0 });
        this.addEntity(box);
        this.onPortalCollide = this.onPortalCollide.bind(this);

        super.init();
    }

    portalBlue: Portal | null = null;
    portalOrange: Portal | null = null;

    onPortalPlaced(
        transform: THREE.Object3D,
        portalHost: Entity,
        isBlue: boolean
    ) {
        const hostCollider = portalHost.getComponent(RigidBody)!.collider!;
        if (isBlue && this.portalBlue === null) {
            this.portalBlue = new Portal({
                tag: Portal.BLUE_TAG,
                physicsWorld: this.physicsWorld,
                hostCollider,
            });
            this.portalBlue.position.copy(transform.position);
            this.portalBlue.rotation.copy(transform.quaternion);
            this.portalBlue.updateSensor();
            this.addPortal(this.portalBlue);
        }
        if (!isBlue && this.portalOrange === null) {
            this.portalOrange = new Portal({
                tag: Portal.ORANGE_TAG,
                physicsWorld: this.physicsWorld,
                hostCollider,
            });
            this.portalOrange.position.copy(transform.position);
            this.portalOrange.rotation.copy(transform.quaternion);
            this.portalOrange.updateSensor();
            this.addPortal(this.portalOrange);
        }

        if (this.portalBlue && this.portalOrange) {
            this.portalBlue.destination = this.portalOrange;
            this.portalOrange.destination = this.portalBlue;
            this.mainView.remove(this.portalBlue.mesh);
            this.mainView.remove(this.portalOrange.mesh);
        }

        if (isBlue && this.portalBlue) {
            this.portalBlue.position.copy(transform.position);
            this.portalBlue.rotation.copy(transform.quaternion);
            this.portalBlue.hostCollider = hostCollider;
        }
        if (!isBlue && this.portalOrange) {
            this.portalOrange.position.copy(transform.position);
            this.portalOrange.rotation.copy(transform.quaternion);
            this.portalOrange.hostCollider = hostCollider;
        }
    }

    teleportingEntity: Entity | null = null;
    teleportingPortal: Portal | null = null;

    onPortalCollide(entityA: Entity, entityB: Entity, started: boolean) {
        let teleportingEntity = entityA;
        let portal = entityB as Portal;

        if (teleportingEntity.tag.includes("portal")) {
            teleportingEntity = entityB;
            portal = entityA as Portal;
        }

        portal.hostCollider.setEnabled(!started);

        if (started) {
            this.teleportingPortal = portal;
            this.teleportingEntity = teleportingEntity;
        } else {
            this.teleportingPortal = null;
            this.teleportingEntity = null;
        }
    }

    update(_dt: number): void {
        for (const portal of this.portals) {
            portal.update(_dt);
        }
        this.eventQueue.drainCollisionEvents((_handle1, _handle2, started) => {
            const collider1 = this.physicsWorld.getCollider(_handle1);
            const collider2 = this.physicsWorld.getCollider(_handle2);
            const entityA = (collider1.parent()?.userData as any)?.entity;
            const entityB = (collider2.parent()?.userData as any)?.entity;
            if (entityA && entityB) {
                this.onPortalCollide(entityA, entityB, started);
            }
        });

        if (this.teleportingEntity && this.teleportingPortal) {
            const portalNormal = this.teleportingPortal.getDirection();
            const forward = this.teleportingEntity.position
                .clone()
                .sub(this.teleportingPortal.position);
            const meshComponent = this.teleportingEntity.getComponent(Mesh);
            const fpsComponent = this.teleportingEntity.getComponent(
                FirstPersonController
            );
            const kinematicComponent = this.teleportingEntity.getComponent(
                KinematicPlayerController
            );
            const dot = forward.dot(portalNormal);
            if (dot <= 0.01 && this.teleportingPortal.destination) {
                if (meshComponent && kinematicComponent) {
                    const rotation180 = new THREE.Matrix4().makeRotationY(
                        Math.PI
                    );
                    const destView = meshComponent
                        .getMesh()
                        .matrixWorld.clone()
                        .invert()
                        .multiply(this.teleportingPortal.getWorldMatrix())
                        .multiply(rotation180)
                        .multiply(
                            this.teleportingPortal.destination
                                .getWorldMatrix()
                                .invert()
                        );
                    destView.invert();

                    this.teleportingEntity.position.setFromMatrixPosition(
                        destView
                    );
                    this.teleportingEntity.rotation.setFromRotationMatrix(
                        destView
                    );

                    kinematicComponent.correctMovement(_dt);

                    const camera = this.teleportingPortal.getDestinationCamera(
                        this.mainCamera
                    );
                    this.mainCamera.position.copy(camera.position);
                    this.mainCamera.rotation.copy(camera.rotation);

                    if (fpsComponent) {
                        fpsComponent.lastMovement.copy(new THREE.Vector3());
                        fpsComponent.updateLook();
                    }
                }
            }
        }

        super.update(_dt);
    }

    renderPortals(
        renderer: THREE.WebGLRenderer,
        camera: THREE.PerspectiveCamera,
        recursionLevel = 0
    ) {
        const gl = renderer.getContext();
        let portals = this.portals.filter((p) => p.isVisibleFromCamera(camera));

        this.portalView.children = [];

        for (let portal of portals) {
            if (portal.destination === null) {
                continue;
            }

            gl.colorMask(false, false, false, false);
            gl.depthMask(false);
            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.STENCIL_TEST);
            gl.stencilFunc(gl.NOTEQUAL, recursionLevel, 0xff);
            gl.stencilOp(gl.INCR, gl.KEEP, gl.KEEP);
            gl.stencilMask(0xff);

            this.portalView.children = [portal.mesh];
            renderer.render(this.portalView, camera);

            const portalCam = portal.getDestinationCamera(camera);

            if (recursionLevel == this.MAX_PORTAL_RECURSION) {
                gl.colorMask(true, true, true, true);
                gl.depthMask(true);
                gl.clear(gl.DEPTH_BUFFER_BIT);
                gl.enable(gl.DEPTH_TEST);
                gl.enable(gl.STENCIL_TEST);
                gl.stencilMask(0x00);
                gl.stencilFunc(gl.EQUAL, recursionLevel + 1, 0xff);

                renderer.render(this.mainView, portalCam);
            } else {
                this.renderPortals(renderer, portalCam, recursionLevel + 1);
            }

            gl.colorMask(false, false, false, false);
            gl.depthMask(false);
            gl.enable(gl.STENCIL_TEST);
            gl.stencilMask(0xff);
            gl.stencilFunc(gl.NOTEQUAL, recursionLevel + 1, 0xff);
            gl.stencilOp(gl.DECR, gl.KEEP, gl.KEEP);

            this.portalView.children = [portal.mesh];
            renderer.render(this.portalView, camera);
        }

        gl.disable(gl.STENCIL_TEST);
        gl.stencilMask(0);
        gl.colorMask(false, false, false, false);
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.depthFunc(gl.ALWAYS);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        for (let portal of portals) {
            if (portal.destination === null) {
                continue;
            }
            this.portalView.children = [portal.mesh];
            renderer.render(this.portalView, camera);
        }

        gl.depthFunc(gl.LESS);
        gl.enable(gl.STENCIL_TEST);
        gl.stencilMask(0);
        gl.stencilFunc(gl.LEQUAL, recursionLevel, 0xff);
        gl.colorMask(true, true, true, true);
        gl.depthMask(true);

        renderer.render(this.mainView, camera);
    }

    render(renderer: THREE.WebGLRenderer): void {
        renderer.autoClear = false;
        if (this.debugMode) {
            this.renderPortals(renderer, this.mainCamera);
            this.debugRender();
            renderer.render(this.debugView, this.mainCamera);
        } else {
            this.renderPortals(renderer, this.mainCamera);
        }
    }
}

export { PortalsScene };

