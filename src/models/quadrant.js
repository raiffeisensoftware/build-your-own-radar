export default class Quadrant {
    constructor(name, clientRect) {
        this._name = name;
        this._blips = [];
        this._clientRect = clientRect;
    }

    get name() {
        return this._name;
    };

    add(newBlips) {
        if (Array.isArray(newBlips)) {
            this._blips = this._blips.concat(newBlips);
        } else {
            this._blips.push(newBlips);
        }
    };

    get blips() {
        return this._blips.slice(0);
    };

    get clientRect() {
        return this._clientRect;
    }

    set clientRect(value) {
        this._clientRect = value;
    }

}