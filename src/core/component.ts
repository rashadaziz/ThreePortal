import { Entity } from "./entity";

abstract class Component {
    abstract id: string;
    entity!: Entity;
    init() {}
    update(_dt: number) {}
    destroy() {}
}

export { Component };

