const IDEAL_BLIP_WIDTH = 22;

export default class Blip {
    constructor(id, name, ring, isNew, topic, description) {
        this._id = id;
        this.number = -1;
        this.width = IDEAL_BLIP_WIDTH;
        this._name = name;
        this._ring = ring;
        this._isNew = isNew;
        this._topic = topic;
        this._description = description;
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


}
