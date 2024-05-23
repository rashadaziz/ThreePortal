class KeyboardInput {
    keys: Set<string> = new Set();

    constructor() {
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.init();
    }

    init() {
        addEventListener("keydown", this.onKeyDown);
        addEventListener("keyup", this.onKeyUp);
    }

    onKeyDown(e: KeyboardEvent) {
        e.preventDefault();
        this.keys.add(e.key);
    }
    onKeyUp(e: KeyboardEvent) {
        e.preventDefault();
        this.keys.delete(e.key);
    }
}

class PointerlockInput {
    canvas: HTMLCanvasElement;
    isLocked = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.onClick = this.onClick.bind(this);
        this.onPointerlockChange = this.onPointerlockChange.bind(this);
        this.onPointerlockError = this.onPointerlockError.bind(this);
        this.init();
    }

    init() {
        this.canvas.addEventListener("click", this.onClick);
        this.canvas.ownerDocument.addEventListener(
            "pointerlockchange",
            this.onPointerlockChange
        );
        this.canvas.ownerDocument.addEventListener(
            "pointerlockerror",
            this.onPointerlockError
        );
    }

    onClick() {
        if (!this.isLocked) {
            this.canvas.requestPointerLock();
        }
    }

    onPointerlockChange() {
        if (this.canvas.ownerDocument.pointerLockElement === this.canvas) {
            this.isLocked = true;
        } else {
            this.isLocked = false;
        }
    }
    onPointerlockError() {
        console.error("Unable to use Pointer Lock API");
    }
}

export { KeyboardInput, PointerlockInput };

