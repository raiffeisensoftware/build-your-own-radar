const IDEAL_BLIP_WIDTH = 22;

export default class Blip {
    constructor(id, name, ring, isNew, topic, description, quadrant) {
        this._id = id;
        this._number = -1;
        this._width = IDEAL_BLIP_WIDTH;
        this._name = name;
        this._ring = ring;
        this._isNew = isNew;
        this._topic = topic;
        this._description = description;
        this._quadrant = quadrant;
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get name() {
        return this._name;
    };

    get topic() {
        return this._topic || '';
    };

    get description() {
        return this._description || '';
    };

    get isNew() {
        return this._isNew;
    };

    get ring() {
        return this._ring;
    };

    get number() {
        return this._number;
    };

    set number(newNumber) {
        this._number = newNumber;
    };

    get width() {
        return this._width;
    }

    set width(newWidth) {
        this._width = newWidth;
    }

    get quadrant() {
        return this._quadrant;
    }

    set quadrant(newQuadrant) {
        this._quadrant = newQuadrant;
    }
}
