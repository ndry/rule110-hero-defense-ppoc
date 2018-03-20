System.register("utils/misc", [], function (exports_1, context_1) {
    var __moduleName = context_1 && context_1.id;
    function isVisible(elt) {
        const style = window.getComputedStyle(elt);
        return (style.width !== null && +style.width !== 0)
            && (style.height !== null && +style.height !== 0)
            && (style.opacity !== null && +style.opacity !== 0)
            && style.display !== "none"
            && style.visibility !== "hidden";
    }
    exports_1("isVisible", isVisible);
    function adjust(x, ...applyAdjustmentList) {
        for (const applyAdjustment of applyAdjustmentList) {
            applyAdjustment(x);
        }
        return x;
    }
    exports_1("adjust", adjust);
    function getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    exports_1("getRandomElement", getRandomElement);
    function setPixel(imageData, x, y, r, g, b, a = 255) {
        const offset = (x * imageData.width + y) * 4;
        imageData.data[offset + 0] = r;
        imageData.data[offset + 1] = g;
        imageData.data[offset + 2] = b;
        imageData.data[offset + 3] = a;
    }
    exports_1("setPixel", setPixel);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("Universe", [], function (exports_2, context_2) {
    var __moduleName = context_2 && context_2.id;
    var Universe;
    return {
        setters: [],
        execute: function () {
            Universe = class Universe {
                constructor() {
                    this.halfwidth = 300;
                    this.width = this.halfwidth * 2 + 1;
                    this.rule = [[[0, 1], [1, 1]], [[0, 1], [1, 0]]]; // 110
                    this.step = 0;
                    this.deaths = 0;
                    this.futureDeaths = 0;
                    this.maxLives = 10;
                    this.lives = this.maxLives;
                    this.maxEdits = 10;
                    this.editsRegenerationPeriod = 100;
                    this.availableEdits = this.maxEdits;
                    this.appliedEdits = 0;
                    this.futureEdits = 0;
                    this.expectedValues = [1, 0, 0, 0, 0, 1, 1];
                    this.prediction = Array.from({ length: this.halfwidth + 1 }, () => Array.from({ length: this.width }, () => ({
                        value: 0,
                        predictedValue: 0,
                        expectedValue: 0,
                        isEdited: false,
                    })));
                    const p0 = this.prediction[0];
                    const texture = [0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1];
                    for (let x = 0; x < this.halfwidth - 2; x++) {
                        p0[x].value = texture[(x - (this.halfwidth - 6) % texture.length + texture.length) % texture.length];
                    }
                    for (let x = this.halfwidth - 2; x < this.halfwidth + 5; x++) {
                        p0[x].value = 1;
                    }
                    for (let x = this.halfwidth + 5; x < this.width; x++) {
                        p0[x].value = texture[(x - (this.halfwidth + 5)) % texture.length];
                    }
                    this.updExpectedValue(0);
                    for (let t = 1; t < this.halfwidth + 1; t++) {
                        for (let x = t; x < this.width - t; x++) {
                            this.updValue(t, x, true);
                        }
                        this.updExpectedValue(t);
                    }
                }
                expectedValue(step) {
                    return this.expectedValues[step % this.expectedValues.length];
                }
                updExpectedValue(t) {
                    this.prediction[t][this.halfwidth].expectedValue = this.expectedValue(this.step + t);
                }
                updValue(t, x, predicted) {
                    const pt = this.prediction[t];
                    const ptm1 = this.prediction[t - 1];
                    pt[x].value = this.rule[ptm1[x - 1].value][ptm1[x].value][ptm1[x + 1].value];
                    if (pt[x].isEdited) {
                        pt[x].isEdited = false;
                        this.futureEdits--;
                    }
                    if (predicted) {
                        pt[x].predictedValue = pt[x].value;
                    }
                }
                update() {
                    if (this.step % 100 === 99) {
                        this.lives = Math.min(this.lives + 1, this.maxLives);
                    }
                    if (this.prediction[0][this.halfwidth].expectedValue !== this.prediction[0][this.halfwidth].value) {
                        this.deaths++;
                        this.lives--;
                    }
                    if (this.step % this.editsRegenerationPeriod === this.editsRegenerationPeriod - 1) {
                        this.availableEdits = Math.min(this.availableEdits + 1, this.maxEdits);
                    }
                    for (let x = 0; x < this.prediction[0].length; x++) {
                        if (this.prediction[0][x].isEdited) {
                            this.appliedEdits++;
                            this.availableEdits--;
                            this.futureEdits--;
                        }
                    }
                    this.step++;
                    this.prediction.shift();
                    this.prediction.push(Array.from({ length: this.width }, () => ({
                        value: 0,
                        predictedValue: 0,
                        expectedValue: 0,
                        isEdited: false,
                    })));
                    this.prediction[0][0].value = Math.round(Math.random());
                    this.prediction[0][this.width - 1].value = Math.round(Math.random());
                    this.updExpectedValue(this.halfwidth);
                    for (let t = 1; t <= this.halfwidth; t++) {
                        this.updValue(t, t, true);
                        this.updValue(t, this.width - 1 - t, true);
                    }
                    if (this.prediction[this.halfwidth][this.halfwidth].value
                        !== this.prediction[this.halfwidth][this.halfwidth].expectedValue) {
                        this.futureDeaths++;
                    }
                }
                edit(t, x) {
                    if (this.prediction[t][x].isEdited) {
                        this.prediction[t][x].isEdited = false;
                        this.futureEdits--;
                    }
                    else {
                        if (this.futureEdits >= this.availableEdits) {
                            return;
                        }
                        this.prediction[t][x].isEdited = true;
                        this.futureEdits++;
                    }
                    this.prediction[t][x].value = 1 - this.prediction[t][x].value;
                    for (let _t = t + 1; _t <= this.halfwidth; _t++) {
                        for (let _x = Math.max(x - (_t - t), _t); _x < Math.min(x + (_t - t) + 1, this.width - _t); _x++) {
                            this.updValue(_t, _x, false);
                        }
                    }
                    this.futureDeaths = 0;
                    for (let _t = 0; _t <= this.halfwidth; _t++) {
                        if (this.prediction[_t][this.halfwidth].value !== this.prediction[_t][this.halfwidth].expectedValue) {
                            this.futureDeaths++;
                        }
                    }
                }
            };
            exports_2("Universe", Universe);
        }
    };
});
System.register("main", ["utils/misc", "Universe"], function (exports_3, context_3) {
    var __moduleName = context_3 && context_3.id;
    function setPixel1(imageData, x, y, value, isUnexpeted, isEdited) {
        if (isEdited) {
            if (isUnexpeted) {
                if (value) {
                    misc_1.setPixel(imageData, x, y, 0x80, 0xFF, 0x00);
                }
                else {
                    misc_1.setPixel(imageData, x, y, 0x80, 0x00, 0xFF);
                }
            }
            else {
                if (value) {
                    misc_1.setPixel(imageData, x, y, 0x00, 0xFF, 0x00);
                }
                else {
                    misc_1.setPixel(imageData, x, y, 0x00, 0x00, 0xFF);
                }
            }
        }
        else {
            if (isUnexpeted) {
                if (value) {
                    misc_1.setPixel(imageData, x, y, 0x80, 0x60, 0x00);
                }
                else {
                    misc_1.setPixel(imageData, x, y, 0x80, 0x00, 0x60);
                }
            }
            else {
                if (value) {
                    misc_1.setPixel(imageData, x, y, 0x00, 0x60, 0x00);
                }
                else {
                    misc_1.setPixel(imageData, x, y, 0x00, 0x00, 0x60);
                }
            }
        }
    }
    function renderPrediction() {
        for (let t = 0; t < controller.universe.prediction.length; t++) {
            const predictionSpace = controller.universe.prediction[t];
            for (let i = t; i < predictionSpace.length - t; i++) {
                const p = predictionSpace[i];
                setPixel1(imageData, controller.universe.prediction.length - t - 1, i, p.value, i === controller.universe.halfwidth && p.expectedValue !== p.value, p.isEdited);
            }
        }
        ctx.putImageData(imageData, 0, 0);
        ctx.globalCompositeOperation = "copy";
        ctx.drawImage(canvas, 0, 0, imageData.width, imageData.height, 0, 0, imageData.width * cellWidth, imageData.height * cellHeight);
        ctx.globalCompositeOperation = "source-over";
    }
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
        magnifierCtx.drawImage(canvas, magnifierX - magnifierSize / 2 + cellWidth / 2, magnifierY - magnifierSize / 2 + cellHeight / 2, magnifierSize, magnifierSize, 0, 0, magnifierCanvas.width, magnifierCanvas.height);
        magnifierCtx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.strokeRect(magnifierX - magnifierSize / 2 + cellWidth / 2, magnifierY - magnifierSize / 2 + cellHeight / 2, magnifierSize, magnifierSize);
        magnifierCtx.strokeStyle = "white";
        magnifierCtx.fillStyle = "white";
        magnifierCtx.lineWidth = 1;
        magnifierCtx.strokeRect(0, 0, magnifierCanvas.width, magnifierCanvas.height);
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
                const topCell = controller.universe.prediction[controller.universe.halfwidth][controller.universe.halfwidth];
                if (topCell.expectedValue !== topCell.value) {
                    paused = true;
                }
            }
        }
        render();
        requestAnimationFrame(requestAnimationFrameCallback);
    }
    var misc_1, Universe_1, canvas, magnifierCanvas, fpsDisplay, stepDisplay, futureDeathsDisplay, deathsDisplay, livesDisplay, editsDisplay, futureEditsDisplay, availableEditsDisplay, newGameButton, ctx, magnifierCtx, magnifierX, magnifierY, magnifierFactor, paused, Controller, controller, cellWidth, cellHeight, imageData, lastIteration;
    return {
        setters: [
            function (misc_1_1) {
                misc_1 = misc_1_1;
            },
            function (Universe_1_1) {
                Universe_1 = Universe_1_1;
            }
        ],
        execute: function () {
            canvas = document.getElementById("canvas");
            magnifierCanvas = document.getElementById("magnifier-canvas");
            fpsDisplay = document.getElementById("fps");
            stepDisplay = document.getElementById("step");
            futureDeathsDisplay = document.getElementById("futureDeaths");
            deathsDisplay = document.getElementById("deaths");
            livesDisplay = document.getElementById("lives");
            editsDisplay = document.getElementById("edits");
            futureEditsDisplay = document.getElementById("futureEdits");
            availableEditsDisplay = document.getElementById("availableEdits");
            newGameButton = document.getElementById("new-game");
            ctx = canvas.getContext("2d");
            magnifierCtx = magnifierCanvas.getContext("2d");
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            magnifierCanvas.width = magnifierCanvas.clientWidth;
            magnifierCanvas.height = magnifierCanvas.clientHeight;
            ctx.imageSmoothingEnabled = false;
            magnifierCtx.imageSmoothingEnabled = false;
            magnifierX = canvas.width / 2;
            magnifierY = canvas.height / 2;
            magnifierFactor = 4;
            paused = false;
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
                    const t = Math.round(controller.universe.prediction.length - 1
                        - ev.offsetY / cellWidth);
                    const x = Math.round(ev.offsetX / cellWidth);
                    controller.universe.edit(t, x);
                }
            });
            magnifierCanvas.addEventListener("click", ev => {
                const magnifierSize = magnifierCanvas.width / magnifierFactor;
                const t = Math.round(controller.universe.prediction.length - 1
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
                            const topCell = controller.universe.prediction[controller.universe.halfwidth][controller.universe.halfwidth];
                            if (topCell.expectedValue !== topCell.value) {
                                paused = true;
                            }
                        }
                        break;
                    }
                }
            });
            newGameButton.addEventListener("click", ev => {
                controller.universe = new Universe_1.Universe();
                paused = false;
            });
            Controller = class Controller {
                constructor() {
                    this.universe = new Universe_1.Universe();
                }
            };
            controller = new Controller();
            cellWidth = 2;
            cellHeight = 2;
            imageData = ctx.createImageData(controller.universe.width, controller.universe.halfwidth + 1);
            lastIteration = Date.now();
            requestAnimationFrame(requestAnimationFrameCallback);
        }
    };
});
