import Sheet from "./sheet";
import * as Tabletop from "tabletop";
import ContentValidator from "./contentValidator";
import {plotErrorMessage, plotLoading, plotRadar, plotUnauthorizedErrorMessage} from "./factory";
import InputSanitizer from "./inputSanitizer";

const GoogleAuth = require('./googleAuth');

export default class GoogleSheet {

    constructor(sheetReference, sheetName) {
        this._sheetReference = sheetReference;
        this._sheetName = sheetName;
    }

    init() {
        plotLoading();
    }

    build() {
        Tabletop.init({
            key: this._sheetReference,
            callback: (data, tabletop) => {
                this.createBlips(tabletop);
            },
            simpleSheet: true
        });
    }

    createBlips(tabletop) {
        try {
            if (!this._sheetName) {
                this._sheetName = tabletop.foundSheetNames[0];
            }
            let columnNames = tabletop.sheets(this._sheetName).columnNames;

            let contentValidator = new ContentValidator(columnNames);
            contentValidator.verifyContent();
            contentValidator.verifyHeaders();

            let all = tabletop.sheets(this._sheetName).all();
            let blips = new InputSanitizer().sanitize(all);

            plotRadar(tabletop.googleSheetName + ' - ' + this._sheetName, blips, this._sheetName, tabletop.foundSheetNames);
        } catch (exception) {
            plotErrorMessage(exception);
        }
    }

    createBlipsForProtectedSheet(documentTitle, values, sheetNames) {
        if (!this._sheetName) {
            this._sheetName = sheetNames[0];
        }
        values.forEach(() => {
            let contentValidator = new ContentValidator(values[0]);
            contentValidator.verifyContent();
            contentValidator.verifyHeaders();
        });

        const all = values;
        const header = all.shift();
        let blips = all.map(blip => new InputSanitizer().sanitizeForProtectedSheet(blip, header));
        plotRadar(documentTitle + ' - ' + sheetName, blips, this._sheetName, sheetNames);
    }

    authenticate(force = false, callback) {
        let bipsForProtectedSheet = this.createBlipsForProtectedSheet;
        GoogleAuth.loadGoogle(function (e) {
            GoogleAuth.login(() => {
                let sheet = new Sheet(this._sheetReference);
                sheet.processSheetResponse(this._sheetName, bipsForProtectedSheet, error => {
                    if (error.status === 403) {
                        plotUnauthorizedErrorMessage();
                    } else {
                        plotErrorMessage(error);
                    }
                });
                if (callback) {
                    callback();
                }
            }, force);
        });
    };

    get sheetReference() {
        return this._sheetReference;
    }

    set sheetReference(value) {
        this._sheetReference = value;
    }

    get sheetName() {
        return this._sheetName;
    }

    set sheetName(value) {
        this._sheetName = value;
    }
}