import Stats from "stats.js";
import * as THREE from "three";
import { Clock } from "./clock";
import { KeyboardInput, PointerlockInput } from "./input";
import { Scene } from "./scene";

class Application {
    private static instance: Application | null = null;
    private static canvas: HTMLCanvasElement | null = null;
    private static fps = 60;

    started = false;
    renderer: THREE.WebGLRenderer;
    currentScene = new Scene();
    clock = new Clock();
    stats = new Stats();
    keyboardInput: KeyboardInput;
    pointerlockInput: PointerlockInput;

    private constructor(canvas: HTMLCanvasElement) {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            stencil: true,
            powerPreference: "high-performance",
            logarithmicDepthBuffer: true,
            canvas,
        });
        this.keyboardInput = new KeyboardInput();
        this.pointerlockInput = new PointerlockInput(canvas);
        this.init();
    }

    start() {
        this.currentScene.init();
        this.started = true;
        this.loop();
    }

    setScene(scene: Scene) {
        this.started = false;
        this.currentScene.destroy();
        this.currentScene = scene;
        this.refreshSceneDimensions();
        this.start();
    }

    private init() {
        this.stats.showPanel(0);
        document.body.appendChild(this.stats.dom);
        this.refreshSceneDimensions();
        addEventListener("resize", this.refreshSceneDimensions.bind(this));
        addEventListener("keyup", (e) => {
            e.preventDefault();
            if (e.key === "F3") {
                this.currentScene.toggleDebug();
            }
        });
    }

    private refreshSceneDimensions() {
        const canvas = this.getDomElement();
        const aspect = canvas.clientWidth / canvas.clientHeight;
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        this.currentScene.refreshCameraAspect(aspect);
    }

    private loop() {
        if (!this.started) return;

        requestAnimationFrame(this.loop.bind(this));
        const shouldTick = this.clock.tick(Application.fps);

        if (shouldTick) {
            this.stats.begin();
            this.currentScene.update(this.clock.getDeltaTime());
            this.currentScene.render(this.renderer);
            this.stats.end();
        }
    }

    getDomElement() {
        return this.renderer.domElement;
    }

    static setCanvas(canvas: HTMLCanvasElement) {
        Application.canvas = canvas;
    }

    static getFps() {
        return Application.fps;
    }

    static setFps(fps: number) {
        Application.fps = fps;
    }

    static getInstance() {
        if (!Application.canvas) {
            throw new Error("Application requires a valid HTMLCanvasElement.");
        }

        if (Application.instance === null) {
            Application.instance = new Application(Application.canvas);
        }

        return Application.instance;
    }
}

export { Application };

