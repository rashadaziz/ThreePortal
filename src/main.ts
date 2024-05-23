import { Application } from "./core/application";
import { PortalsScene } from "./scenes/portals";
import "./style.css";

function main() {
    const canvas = document.getElementById("root") as HTMLCanvasElement;
    Application.setCanvas(canvas);
    Application.setFps(60);
    Application.getInstance().start()
    Application.getInstance().setScene(new PortalsScene())
}

main();
