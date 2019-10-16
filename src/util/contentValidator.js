import MalformedDataError from '../../src/exceptions/malformedDataError';
import ExceptionMessages from './exceptionMessages';
import {plotErrorMessage} from "./factory";

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
        ['id', 'name', 'ring', 'quadrant', 'isNew', 'description'].forEach((field) => {
            if (this.columnNames.indexOf(field) === -1) {
                plotErrorMessage(new MalformedDataError(ExceptionMessages.MISSING_HEADERS));
                throw new Error();
            }
        });
    };
}