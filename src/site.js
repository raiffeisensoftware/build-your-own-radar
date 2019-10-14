import 'es6-promise/auto';
import './common';
import {getConfig, normalizedConfig} from "./util/normalizedConfig";
import {select} from "d3-selection";
import {extractDomainName, extractQueryParams} from "./util/util";
import {plotFooter, plotForm, plotHeader, setDocumentTitle} from "./util/factory";
import CsvDocument from "./util/csvDocument";

if (normalizedConfig.logo && !normalizedConfig.logo.match(/http(s)?:/i)) {
    require('./images/' + normalizedConfig.logo);
}
let domainName = extractDomainName(window.location.search.substring(1));
let queryString = window.location.href.match(/\?(.*)/);
let queryParams = queryString ? extractQueryParams(queryString[1]) : {};
let sheetId = queryParams.sheetId; // is the url for the csv file

if (!sheetId) {
    sheetId = (getConfig()).generateCsvUrl(queryParams);
}

if (((queryParams.sheetId && domainName) || Object.keys(queryParams).length) && sheetId.endsWith('csv')) {
    let sheet = new CsvDocument(sheetId);
    sheet.createBlips();
} else {
    let header = select('body')
        .insert('main').attr('role', 'main').attr('class', 'container');

    if (getConfig().hint) {
        header = header.insert('div').attr('class', 'header');
        header.append('p')
            .attr('class', 'hint')
            .html(getConfig().hint);
    }

    let content = plotHeader();

    setDocumentTitle();

    plotForm(content);

    plotFooter(content);
}