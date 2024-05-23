import * as THREE from "three";
import { Component } from "./component";

class Entity {
    tag: string;
    components: Component[] = [];
    position = new THREE.Vector3();
    rotation = new THREE.Quaternion();

    constructor(tag: string) {
        this.tag = tag;
    }

    getDirection() {
        return new THREE.Vector3(0, 0, 1).applyQuaternion(this.rotation);
    }

    getComponent<T extends Component>(componentClass: {
        new (...args: any[]): T;
    }): T | null {
        for (const component of this.components) {
            if (component instanceof componentClass) {
                return component;
            }
        }
        return null;
    }

    removeComponent<T extends Component>(componentClass: {
        new (...args: any[]): T;
    }) {
        for (let i = 0; i < this.components.length; i++) {
            const component = this.components[i];
            if (component instanceof componentClass) {
                this.components.splice(i, 1);
                return;
            }
        }
    }

    addComponent(component: Component) {
        component.entity = this;
        this.components.push(component);
    }

    init() {
        for (const component of this.components) {
            component.init();
        }
    }

    update(dt: number) {
        for (const component of this.components) {
            component.update(dt);
        }
    }

    destroy() {
        for (const component of this.components) {
            component.destroy();
        }
    }
}

export { Entity };

