import { csv } from 'd3-fetch';
import ContentValidator from './contentValidator';
import { extractFileName, searchBlipByParam } from './util';
import { plotRadar } from './factory';
import InputSanitizer from './inputSanitizer';

export default class CsvDocument {
    constructor(url) {
        this._url = url;
    }

    createBlips(queryParams) {
        csv(this._url, {credentials: 'same-origin'})
            .then((data) => {
                try {
                    let columnNames = data['columns'];
                    delete data['columns'];
                    let contentValidator = new ContentValidator(columnNames);
                    contentValidator.verifyContent();
                    contentValidator.verifyHeaders();
                    let blips = new InputSanitizer().sanitize(data);
                    let graphingRadar = plotRadar(extractFileName(this._url), blips, 'CSV File', []);

                    data.forEach(bl => bl.id = decodeURIComponent(bl.id.replace(/\+/g, ' ')));
                    if (queryParams.search) {
                        searchBlipByParam(graphingRadar, queryParams.search);
                    }
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

    get data() {
        return this._data;
    }
}
