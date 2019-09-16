const MalformedDataError = require('../../src/exceptions/malformedDataError');
const ExceptionMessages = require('./exceptionMessages');

const ContentValidator = function (columnNames) {
    var self = {};
    columnNames = columnNames.map(function (columnName) {
        return columnName.trim()
    });

    self.verifyContent = function () {
        if (columnNames.length === 0) {
            throw new MalformedDataError(ExceptionMessages.MISSING_CONTENT)
        }
    };

    self.verifyHeaders = function () {
        ['name', 'ring', 'quadrant', 'isNew', 'description'].forEach(function (field) {
            if (columnNames.indexOf(field) === -1) {
                throw new MalformedDataError(ExceptionMessages.MISSING_HEADERS)
            }
        })
    };

    return self
};

module.exports = ContentValidator;
