const MalformedDataError = require('../exceptions/malformedDataError');
const ExceptionMessages = require('../util/exceptionMessages');
import {getConfig} from '../util/normalizedConfig';
import Ring from '../models/ring';

export default class Radar {

    constructor() {
        this._blipNumber = 0;
        this._addingQuadrant = 0;
        this._quadrants = [
            {order: 'first', startAngle: 90},
            {order: 'second', startAngle: 0},
            {order: 'third', startAngle: -90},
            {order: 'fourth', startAngle: -180}
        ];
        this._alternatives = [];
        this._currentSheetName = '';
    }

    setNumbers(blips) {
        blips.forEach((blip) => {
            blip.number = ++this._blipNumber;
        });
    }

    addAlternative(sheetName) {
        this_.alternatives.push(sheetName);
    };

    get alternatives() {
        return this._alternatives;
    };

    set currentSheetName(sheetName) {
        this._currentSheetName = sheetName;
    };

    get currentSheetName() {
        return this._currentSheetName;
    };

    addQuadrant(quadrant) {
        if (this._addingQuadrant >= 4) {
            throw new MalformedDataError(ExceptionMessages.TOO_MANY_QUADRANTS);
        }
        this._quadrants[this._addingQuadrant].quadrant = quadrant;
        this.setNumbers(quadrant.blips);
        this._addingQuadrant++;
    };

    get rings() {
        if (this._addingQuadrant !== 4) throw new MalformedDataError(ExceptionMessages.LESS_THAN_FOUR_QUADRANTS);
        return (getConfig()).rings.map((el, i) => {
            return new Ring(el, i);
        });
    };

    get quadrants() {
        return this._quadrants;
    };
}
