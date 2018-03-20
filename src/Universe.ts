export type CellValue = number;

export interface Cell {
    value: CellValue;
    predictedValue: CellValue;
    expectedValue: CellValue;
    isEdited: boolean;
}

export class Universe {
    halfwidth = 300;
    width = this.halfwidth * 2 + 1;
    prediction: Cell[][];
    rule = [[[0, 1], [1, 1]], [[0, 1], [1, 0]]]; // 110

    step = 0;
    deaths = 0;
    futureDeaths = 0;
    maxLives = 10;
    lives = this.maxLives;

    maxEdits = 10;
    editsRegenerationPeriod = 100;
    availableEdits = this.maxEdits;
    appliedEdits = 0;
    futureEdits = 0;

    expectedValues = [1, 0, 0, 0, 0, 1, 1];
    expectedValue(step: number) {
        return this.expectedValues[step % this.expectedValues.length];
    }
    updExpectedValue(t: number) {
        this.prediction[t][this.halfwidth].expectedValue = this.expectedValue(this.step + t);
    }

    updValue(t: number, x: number, predicted: boolean) {
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

    constructor() {
        this.prediction = Array.from({length: this.halfwidth + 1}, () => Array.from({length: this.width}, () => ({
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
        this.prediction.push(Array.from({length: this.width}, () => ({
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
            !== this.prediction[this.halfwidth][this.halfwidth].expectedValue
        ) {
            this.futureDeaths++;
        }
    }

    edit(t: number, x: number) {
        if (this.prediction[t][x].isEdited) {
            this.prediction[t][x].isEdited = false;
            this.futureEdits--;
        } else {
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
}
