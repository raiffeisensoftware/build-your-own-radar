/* global gapi */
const SheetNotFoundError = require('../../src/exceptions/sheetNotFoundError');
const UnauthorizedError = require('../../src/exceptions/unauthorizedError');
const ExceptionMessages = require('./exceptionMessages');

export default class Sheet {
    constructor(sheetReference) {
        var matches = sheetReference.match('https:\\/\\/docs.google.com\\/spreadsheets\\/d\\/(.*?)($|\\/$|\\/.*|\\?.*)');
        this.id = matches !== null ? matches[1] : sheetReference;
    };

    validate(callback) {
        var feedURL = 'https://spreadsheets.google.com/feeds/worksheets/' + self.id + '/public/basic?alt=json';

        // TODO: Move this out (as HTTPClient)
        var xhr = new XMLHttpRequest();
        xhr.open('GET', feedURL, true);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    return callback();
                } else if (xhr.status === 404) {
                    return callback(new SheetNotFoundError(ExceptionMessages.SHEET_NOT_FOUND));
                } else {
                    return callback(new UnauthorizedError(ExceptionMessages.UNAUTHORIZED));
                }
            }
        };
        xhr.send(null);
    };

    getSheet() {
        return gapi.client.sheets.spreadsheets.get({spreadsheetId: self.id});
    };

    getData(range) {
        return gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: this.id,
            range: range
        });
    };

    processSheetResponse(sheetName, createBlips, handleError) {
        this.getSheet().then(response => processSheetData(sheetName, response, createBlips, handleError)).catch(handleError);
    };

    processSheetData(sheetName, sheetResponse, createBlips, handleError) {
        const sheetNames = sheetResponse.result.sheets.map(s => s.properties.title);
        sheetName = !sheetName ? sheetNames[0] : sheetName;
        this.getData(sheetName + '!A1:E')
            .then(r => createBlips(sheetResponse.result.properties.title, r.result.values, sheetNames))
            .catch(handleError);
    }
}
