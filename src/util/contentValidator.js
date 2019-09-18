const MalformedDataError = require('../../src/exceptions/malformedDataError');
const ExceptionMessages = require('./exceptionMessages');

export default class ContentValidator {
    constructor(columnNames) {
        this.columnNames = columnNames.map((columnName) => {
            return columnName.trim();
        });
    }

    verifyContent() {
        if (this.columnNames === undefined || this.columnNames.length === 0) {
            throw new MalformedDataError(ExceptionMessages.MISSING_CONTENT);
        }
    };

    verifyHeaders() {
        ['name', 'ring', 'quadrant', 'isNew', 'description'].forEach((field) => {
            if (this.columnNames.indexOf(field) === -1) {
                throw new MalformedDataError(ExceptionMessages.MISSING_HEADERS);
            }
        });
    };
}