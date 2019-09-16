export default class Ring {

    constructor(name, order) {
        this._name = name;
        this._order = order;
    }

    get name() {
        return this._name;
    };

    get order() {
        return this._order;
    };
}
