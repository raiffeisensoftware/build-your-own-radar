export default class RingCalculator {
    constructor(numberOfRings, maxRadius) {
        this._sequence = [0, 6, 5, 3, 2, 1, 1, 1];
        this._maxRadius = maxRadius;
        this._numberOfRings = numberOfRings;
    }

    sum(length) {
        return this._sequence.slice(0, length + 1).reduce((previous, current) => {
            return previous + current;
        }, 0);
    };

    getRadius(ring) {
        const total = this.sum(this._numberOfRings);
        const sum = this.sum(ring);

        return this._maxRadius * sum / total;
    };

    get numberOfRings() {
        return this._numberOfRings;
    }

    set numberOfRings(value) {
        this._numberOfRings = value;
    }

    get maxRadius() {
        return this._maxRadius;
    }

    set maxRadius(value) {
        this._maxRadius = value;
    }
}
