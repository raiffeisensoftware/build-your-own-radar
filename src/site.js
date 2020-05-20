import './common';
import {getConfig} from './util/normalizedConfig';
import {extractDomainName, extractQueryParams} from './util/util';
import {plotFooter, plotForm, plotHeader, setDocumentTitle} from './util/factory';
import CsvDocument from './util/csvDocument';

let domainName = extractDomainName(window.location.search.substring(1));
let queryString = window.location.href.match(/\?(.*)/);
let queryParams = queryString ? extractQueryParams(queryString[1]) : {};
let sheetId = queryParams.sheetId; // is the url for the csv file

if (!sheetId) {
    sheetId = (getConfig()).generateCsvUrl(queryParams);
}

if (((queryParams.sheetId && domainName) || Object.keys(queryParams).length) && sheetId.endsWith('csv')) {
    let sheet = new CsvDocument(sheetId);
    sheet.createBlips(queryParams);
} else {
    plotHeader();

    setDocumentTitle();

    plotForm();

    plotFooter();
}
