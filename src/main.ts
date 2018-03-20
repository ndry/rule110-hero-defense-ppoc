import { adjust, getRandomElement, setPixel } from "./utils/misc";
import { Universe, CellValue } from "./Universe";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const magnifierCanvas = document.getElementById("magnifier-canvas") as HTMLCanvasElement;
const fpsDisplay = document.getElementById("fps") as HTMLDivElement;
const stepDisplay = document.getElementById("step") as HTMLDivElement;
const futureDeathsDisplay = document.getElementById("futureDeaths") as HTMLDivElement;
const deathsDisplay = document.getElementById("deaths") as HTMLDivElement;
const livesDisplay = document.getElementById("lives") as HTMLDivElement;
const editsDisplay = document.getElementById("edits") as HTMLDivElement;
const futureEditsDisplay = document.getElementById("futureEdits") as HTMLDivElement;
const availableEditsDisplay = document.getElementById("availableEdits") as HTMLDivElement;
const newGameButton = document.getElementById("new-game") as HTMLButtonElement;

const ctx = canvas.getContext("2d")!;
const magnifierCtx = magnifierCanvas.getContext("2d")!;

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
magnifierCanvas.width = magnifierCanvas.clientWidth;
magnifierCanvas.height = magnifierCanvas.clientHeight;

ctx.imageSmoothingEnabled = false;
magnifierCtx.imageSmoothingEnabled = false;

let magnifierX = canvas.width / 2;
let magnifierY = canvas.height / 2;
let magnifierFactor = 4;

let paused = false;

canvas.addEventListener("mousedown", ev => {
    magnifierX = ev.offsetX;
    magnifierY = ev.offsetY;
});

canvas.addEventListener("mousemove", ev => {
    if (ev.buttons !== 0 || ev.ctrlKey) {
        magnifierX = ev.offsetX;
        magnifierY = ev.offsetY;
    }
});

canvas.addEventListener("click", ev => {
    if (ev.ctrlKey) {
        const t = Math.round(
            controller.universe.prediction.length - 1
            - ev.offsetY / cellWidth);
        const x = Math.round(ev.offsetX / cellWidth);
        controller.universe.edit(t, x);
    }
});

magnifierCanvas.addEventListener("click", ev => {
    const magnifierSize = magnifierCanvas.width / magnifierFactor;

    const t = Math.round(
        controller.universe.prediction.length - 1
        - (ev.offsetY / magnifierFactor - magnifierSize / 2 + magnifierY) / cellWidth);
    const x = Math.round((ev.offsetX / magnifierFactor - magnifierSize / 2 + magnifierX) / cellWidth);
    controller.universe.edit(t, x);
});

window.addEventListener("keypress", ev => {
    if (ev.key === " ") {
        paused = !paused;
    }
    switch (ev.code) {
        case "KeyW": {
            magnifierY -= cellHeight * (ev.shiftKey ? 10 : 1);
            break;
        }
        case "KeyS": {
            magnifierY += cellHeight * (ev.shiftKey ? 10 : 1);
            break;
        }
        case "KeyA": {
            magnifierX -= cellWidth * (ev.shiftKey ? 10 : 1);
            break;
        }
        case "KeyD": {
            magnifierX += cellWidth * (ev.shiftKey ? 10 : 1);
            break;
        }
        case "KeyQ": {
            magnifierFactor = Math.min(10, magnifierFactor + 1 * (ev.shiftKey ? 2 : 1));
            break;
        }
        case "KeyE": {
            magnifierFactor = Math.max(2, magnifierFactor - 1 * (ev.shiftKey ? 2 : 1));
            break;
        }
        case "KeyR": {
            const t = Math.round(controller.universe.prediction.length - 1 - (magnifierY) / cellWidth);
            const x = Math.round((magnifierX) / cellWidth);
            controller.universe.edit(t, x);
            break;
        }
        case "KeyF": {
            if (controller.universe.lives > 0) {
                controller.universe.update();
                const topCell
                    = controller.universe.prediction[controller.universe.halfwidth][controller.universe.halfwidth];
                if (topCell.expectedValue !== topCell.value) {
                    paused = true;
                }
            }
            break;
        }
    }
});

newGameButton.addEventListener("click", ev => {
    controller.universe = new Universe();
    paused = false;
});

class Controller {
    universe = new Universe();
}

const controller = new Controller();

const cellWidth = 2;
const cellHeight = 2;

function setPixel1(imageData: ImageData, x: number, y: number, value: CellValue, isUnexpeted: boolean, isEdited: boolean) {
    if (isEdited) {
        if (isUnexpeted) {
            if (value) {
                setPixel(imageData, x, y, 0x80, 0xFF, 0x00);
            } else {
                setPixel(imageData, x, y, 0x80, 0x00, 0xFF);
            }
        } else {
            if (value) {
                setPixel(imageData, x, y, 0x00, 0xFF, 0x00);
            } else {
                setPixel(imageData, x, y, 0x00, 0x00, 0xFF);
            }
        }
    } else {
        if (isUnexpeted) {
            if (value) {
                setPixel(imageData, x, y, 0x80, 0x60, 0x00);
            } else {
                setPixel(imageData, x, y, 0x80, 0x00, 0x60);
            }
        } else {
            if (value) {
                setPixel(imageData, x, y, 0x00, 0x60, 0x00);
            } else {
                setPixel(imageData, x, y, 0x00, 0x00, 0x60);
            }
        }
    }
}

function renderPrediction() {
    for (let t = 0; t < controller.universe.prediction.length; t++) {
        const predictionSpace = controller.universe.prediction[t];
        for (let i = t; i < predictionSpace.length - t; i++) {
            const p = predictionSpace[i];
            setPixel1(
                imageData,
                controller.universe.prediction.length - t - 1,
                i,
                p.value,
                i === controller.universe.halfwidth && p.expectedValue !== p.value,
                p.isEdited);
        }
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.globalCompositeOperation = "copy";
    ctx.drawImage(canvas,
        0, 0,
        imageData.width, imageData.height,
        0, 0,
        imageData.width * cellWidth, imageData.height * cellHeight);
    ctx.globalCompositeOperation = "source-over";
}

const imageData = ctx.createImageData(controller.universe.width, controller.universe.halfwidth + 1);

let lastIteration = Date.now();
function render() {
    const now = Date.now();
    const fps = 1000 / (now - lastIteration);
    lastIteration = now;

    renderPrediction();

    fpsDisplay.textContent = "fps: " + fps.toFixed(2);
    stepDisplay.textContent = "step: " + controller.universe.step;
    futureDeathsDisplay.style.color = controller.universe.futureDeaths ? "red" : "white";
    futureDeathsDisplay.textContent = "future deaths: " + controller.universe.futureDeaths;
    deathsDisplay.textContent = "deaths: " + controller.universe.deaths;
    livesDisplay.textContent = "lives: " + controller.universe.lives;
    editsDisplay.textContent = "applied edits: " + controller.universe.appliedEdits;
    futureEditsDisplay.textContent = "future edits: " + controller.universe.futureEdits
        + " of " + controller.universe.availableEdits;
    // availableEditsDisplay.textContent = "available edits: " + controller.universe.availableEdits;

    const magnifierSize = magnifierCanvas.width / magnifierFactor;
    magnifierCtx.globalCompositeOperation = "copy";
    magnifierCtx.drawImage(canvas,
        magnifierX - magnifierSize / 2 + cellWidth / 2, magnifierY - magnifierSize / 2 + cellHeight / 2,
        magnifierSize, magnifierSize,
        0, 0,
        magnifierCanvas.width, magnifierCanvas.height);
    magnifierCtx.globalCompositeOperation = "source-over";

    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(
        magnifierX - magnifierSize / 2 + cellWidth / 2, magnifierY - magnifierSize / 2 + cellHeight / 2,
        magnifierSize, magnifierSize);
    magnifierCtx.strokeStyle = "white";
    magnifierCtx.fillStyle = "white";
    magnifierCtx.lineWidth = 1;
    magnifierCtx.strokeRect(
        0, 0,
        magnifierCanvas.width, magnifierCanvas.height);
    const aimStart = 10;
    const aimEnd = 5;
    magnifierCtx.beginPath();
    magnifierCtx.moveTo(magnifierCanvas.width / 2 - aimStart, magnifierCanvas.height / 2);
    magnifierCtx.lineTo(magnifierCanvas.width / 2 - aimEnd, magnifierCanvas.height / 2);
    magnifierCtx.stroke();
    magnifierCtx.beginPath();
    magnifierCtx.moveTo(magnifierCanvas.width / 2 + aimStart, magnifierCanvas.height / 2);
    magnifierCtx.lineTo(magnifierCanvas.width / 2 + aimEnd, magnifierCanvas.height / 2);
    magnifierCtx.stroke();
    magnifierCtx.beginPath();
    magnifierCtx.moveTo(magnifierCanvas.width / 2, magnifierCanvas.height / 2 - aimStart);
    magnifierCtx.lineTo(magnifierCanvas.width / 2, magnifierCanvas.height / 2 - aimEnd);
    magnifierCtx.stroke();
    magnifierCtx.beginPath();
    magnifierCtx.moveTo(magnifierCanvas.width / 2, magnifierCanvas.height / 2 + aimStart);
    magnifierCtx.lineTo(magnifierCanvas.width / 2, magnifierCanvas.height / 2 + aimEnd);
    magnifierCtx.stroke();

    if (controller.universe.lives <= 0) {
        ctx.fillStyle = "red";
        ctx.font = "30px arial";
        ctx.fillText("Game over!", 500, 300);
        ctx.font = "20px arial";
        ctx.fillText("Step: " + controller.universe.step, 500, 340);
    }
}

function requestAnimationFrameCallback() {
    for (let i = 0; i < 10; i++) {
        if (paused) {
            break;
        }
        if (controller.universe.lives > 0) {
            controller.universe.update();
            const topCell
                = controller.universe.prediction[controller.universe.halfwidth][controller.universe.halfwidth];
            if (topCell.expectedValue !== topCell.value) {
                paused = true;
            }
        }
    }
    render();
    requestAnimationFrame(requestAnimationFrameCallback);
}
requestAnimationFrame(requestAnimationFrameCallback);
