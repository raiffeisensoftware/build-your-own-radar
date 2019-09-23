import {getConfig} from "./util/normalizedConfig";
import {select} from "d3-selection";
import {extractDomainName, extractQueryParams} from "./util/util";
import {plotBanner, plotFooter, plotForm, plotLogo, setDocumentTitle} from "./util/factory";
import GoogleSheet from "./util/googleSheet";
import CsvDocument from "./util/csvDocument";

require('./common');

const normalizedConfig = require('./util/normalizedConfig');

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
} else if (domainName && domainName.endsWith('google.com') && sheetId) {
    let googleSheet = new GoogleSheet(sheetId, queryParams.sheetName);
    googleSheet.build();
} else {
    let content = select('body')
        .append('div')
        .attr('class', 'input-sheet');
    setDocumentTitle();

    plotLogo(content);

    const bannerText = '<div><h1>Build your own radar</h1><p>Once you\'ve <a href ="https://www.thoughtworks.com/radar/byor">created your Radar</a>, you can use this service' +
        ' to generate an <br />interactive version of your Technology Radar. Not sure how? <a href ="https://www.thoughtworks.com/radar/how-to-byor">Read this first.</a></p></div>';

    plotBanner(content, bannerText);

    plotForm(content);

    plotFooter(content);
}