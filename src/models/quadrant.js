export default class Quadrant {
    constructor(name) {
        this._name = name;
        this._blips = [];
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
}
