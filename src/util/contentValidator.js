import MalformedDataError from '../../src/exceptions/malformedDataError';
import ExceptionMessages from './exceptionMessages';
import {plotErrorMessage} from './factory';

const requiredFields = ['id', 'name', 'ring', 'quadrant', 'isNew'];
export let hasDescriptionColumn = true;

export default class ContentValidator {

    constructor(columnNames) {
        this.columnNames = columnNames.map((columnName) => {
            return columnName.trim();
        });
    }

    verifyContent() {
        if (this.columnNames === undefined || this.columnNames.length === 0) {
            plotErrorMessage(new MalformedDataError(ExceptionMessages.MISSING_CONTENT));
            throw new Error();
        }
    };

    verifyHeaders() {
        requiredFields.forEach((field) => {
            if (this.columnNames.indexOf(field) === -1) {
                plotErrorMessage(new MalformedDataError(ExceptionMessages.MISSING_HEADERS));
                throw new Error();
            }
        });

        // description is an optional field. if present the description in the radar can be opened; otherwise not
        if (this.columnNames.indexOf('description') === -1) {
            hasDescriptionColumn = false;
        }
    };
}
