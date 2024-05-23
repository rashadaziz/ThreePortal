import * as THREE from "three";
import { Portal } from "../core-ext/portal";
import { Wall } from "../core-ext/wall";
import { Application } from "../core/application";
import { Component } from "../core/component";
import { Entity } from "../core/entity";

type PortalGunProperties = {
    view: THREE.Scene;
    playerCam: THREE.PerspectiveCamera;
    onPortalPlaced?: (
        transform: THREE.Object3D,
        portalHost: Entity,
        isBlue: boolean
    ) => void;
};

class PortalGun extends Component {
    id = "portal-gun";
    properties: Required<PortalGunProperties>;
    raycaster = new THREE.Raycaster(undefined, undefined, undefined, 100);

    constructor({
        view,
        playerCam,
        onPortalPlaced = () => {},
    }: PortalGunProperties) {
        super();
        this.properties = { view, playerCam, onPortalPlaced };
    }

    init(): void {
        this.onMouseClick = this.onMouseClick.bind(this);
        const canvas = Application.getInstance().getDomElement();
        canvas.addEventListener("click", this.onMouseClick);
    }

    private fixPortalOverhang(
        transform: THREE.Object3D,
        hostObject: THREE.Object3D
    ) {
        const fixPoints = [
            new THREE.Vector3(Portal.WIDTH / 2, 0, 0), // right
            new THREE.Vector3(0, Portal.HEIGHT / 2, 0), // top
            new THREE.Vector3(-Portal.WIDTH / 2, 0, 0), // left
            new THREE.Vector3(0, -Portal.HEIGHT / 2, 0), // bottom
        ];

        const offset = new THREE.Vector3(0, 0, -Wall.DEPTH / 2).applyQuaternion(
            transform.quaternion
        );

        const newTransform = transform.position.clone();

        for (let i = 0; i < fixPoints.length; i++) {
            const fixPoint = fixPoints[i];
            const ray = fixPoint.clone().applyQuaternion(transform.quaternion);

            this.raycaster.set(
                transform.position.clone().add(offset).add(ray),
                ray.normalize().negate()
            );

            const hit = this.raycaster.intersectObject(hostObject);

            if (hit.length) {
                const translation = ray.multiplyScalar(hit[0].distance);
                newTransform.add(translation);
            }
        }

        transform.position.copy(newTransform);
    }

    private placePortal(
        transform: THREE.Object3D,
        hostObject: THREE.Object3D,
        isBlue: boolean
    ) {
        const hostDirection = transform.getWorldDirection(new THREE.Vector3());
        const bias = 0.02;
        const portalCorners = [
            new THREE.Vector3(
                -Portal.WIDTH / 2 + bias,
                Portal.HEIGHT / 2 - bias,
                0.1
            ), // top-left
            new THREE.Vector3(
                Portal.WIDTH / 2 - bias,
                Portal.HEIGHT / 2 - bias,
                0.1
            ), // top-right
            new THREE.Vector3(
                Portal.WIDTH / 2 - bias,
                -Portal.HEIGHT / 2 + bias,
                0.1
            ), // bottom-right
            new THREE.Vector3(
                -Portal.WIDTH / 2 + bias,
                -Portal.HEIGHT / 2 + bias,
                0.1
            ), // bottom-left
        ];

        this.fixPortalOverhang(transform, hostObject);

        for (const corner of portalCorners) {
            corner.applyQuaternion(transform.quaternion);
            this.raycaster.set(
                transform.position.clone().add(corner),
                hostDirection.clone().negate()
            );

            const hits = this.raycaster.intersectObjects(
                this.properties.view.children,
                false
            );

            if (hits.length === 0) {
                return false;
            }

            // shit code
            let blueHit = false;
            let orangeHit = false;
            let hostHit = false;
            for (const hit of hits) {
                const tag = hit.object.userData.entity?.tag;
                if (tag === Portal.BLUE_TAG) {
                    blueHit = true;
                } else if (tag === Portal.ORANGE_TAG) {
                    orangeHit = true;
                } else if (hit.object === hostObject) {
                    if (blueHit || orangeHit) {
                        continue;
                    }
                    hostHit = true;
                }
            }
            
            // don't allow a corner to intersect with both portals
            if (blueHit && orangeHit) {
                return false;
            }

            if (blueHit && isBlue) {
                continue;
            }

            if (orangeHit && !isBlue) {
                continue;
            }

            if (!hostHit) {
                return false;
            }
        }

        return true;
    }

    private shootPortal(isBlue: boolean) {
        this.raycaster.setFromCamera(
            new THREE.Vector2(0, 0),
            this.properties.playerCam
        );
        const objects = this.raycaster.intersectObjects(
            this.properties.view.children,
            false
        );

        if (objects.length === 0) return;

        const hit = objects[0];
        if (!hit.object.userData.entity) return;
        if (hit.object.userData.entity.tag !== Portal.PORTAL_HOST_TAG) return;

        const surface = hit.object;
        const surfaceDir = surface.getWorldDirection(new THREE.Vector3());
        const transform = new THREE.Object3D();
        const position = hit.point.clone();
        const lookAt = surfaceDir.add(position);

        transform.position.copy(position);
        transform.lookAt(lookAt);

        if (this.placePortal(transform, surface, isBlue)) {
            const rotation = transform.quaternion;
            const offset = new THREE.Vector3(
                0,
                0,
                Portal.PORTAL_PLANE_OFFSET
            ).applyQuaternion(rotation);
            transform.position.add(offset);
            this.properties.onPortalPlaced(
                transform,
                surface.userData.entity,
                isBlue
            );
        }
    }

    onMouseClick(e: MouseEvent) {
        const pointerInput = Application.getInstance().pointerlockInput;
        if (!pointerInput.isLocked) return;

        if (e.button === 0) {
            this.shootPortal(true);
        } else if (e.button === 2) {
            this.shootPortal(false);
        }
    }

    destroy(): void {
        const canvas = Application.getInstance().getDomElement();
        canvas.removeEventListener("click", this.onMouseClick);
    }
}

export { PortalGun };

