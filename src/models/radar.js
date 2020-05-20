import { MalformedDataError } from '../exceptions/malformedDataError';
import { ExceptionMessages } from '../util/exceptionMessages';
import { getConfig } from '../util/normalizedConfig';
import Ring from '../models/ring';
import { plotErrorMessage } from '../util/factory';

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
        this._blips = [];
    }

    setNumbers(blips) {
        blips.forEach((blip) => {
            blip.number = ++this._blipNumber;
        });
    }

    addAlternative(sheetName) {
        this._alternatives.push(sheetName);
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
            plotErrorMessage(new MalformedDataError(ExceptionMessages.TOO_MANY_QUADRANTS));
            throw new Error();
        }
        this._quadrants[this._addingQuadrant].quadrant = quadrant;
        this.setNumbers(quadrant.blips);
        this._addingQuadrant++;
    };

    get rings() {
        if (this._addingQuadrant !== 4) {
            plotErrorMessage(new MalformedDataError(ExceptionMessages.LESS_THAN_FOUR_QUADRANTS));
            throw new Error();
        }
        return (getConfig()).rings.map((el, i) => {
            return new Ring(el, i);
        });
    };

    get quadrants() {
        return this._quadrants;
    };


    get blips() {
        return this._blips.slice(0);
    }

    set blips(value) {
        this._blips = value;
    }

    addBlip(blip) {
        this._blips.push(blip);
    }
}
