import {csv} from "d3-fetch";
import ContentValidator from "./contentValidator";
import {extractFileName} from "./util";
import {plotRadar} from "./factory";
import InputSanitizer from "./inputSanitizer";

export default class CsvDocument {
    constructor(url) {
        this._url = url;
    }

    createBlips() {
        let that = this;
        csv(this._url, {credentials: 'same-origin'}
        ).then((data) => {
            try {
                let columnNames = data['columns'];
                delete data['columns'];
                let contentValidator = new ContentValidator(columnNames);
                contentValidator.verifyContent();
                contentValidator.verifyHeaders();
                let blips = new InputSanitizer().sanitize(data);
                plotRadar(extractFileName(that._url), blips, 'CSV File', []);
            } catch (exception) {
                throw exception;
            }
        });
    }

    get url() {
        return this._url;
    }

    set url(value) {
        this._url = value;
    }
}