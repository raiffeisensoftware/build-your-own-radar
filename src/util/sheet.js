/* global gapi */
export default class Sheet {
    constructor(sheetReference) {
        let matches = sheetReference.match('https:\\/\\/docs.google.com\\/spreadsheets\\/d\\/(.*?)($|\\/$|\\/.*|\\?.*)');
        this.id = matches !== null ? matches[1] : sheetReference;
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
        this.getSheet().then(response => this.processSheetData(sheetName, response, createBlips, handleError)).catch(handleError);
    };

    processSheetData(sheetName, sheetResponse, createBlips, handleError) {
        const sheetNames = sheetResponse.result.sheets.map(s => s.properties.title);
        sheetName = !sheetName ? sheetNames[0] : sheetName;
        this.getData(sheetName + '!A1:E')
            .then(r => createBlips(sheetResponse.result.properties.title, r.result.values, sheetNames))
            .catch(handleError);
    }
}
