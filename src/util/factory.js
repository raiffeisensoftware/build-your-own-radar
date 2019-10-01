/* eslint no-constant-condition: "off" */

import {getConfig} from '../util/normalizedConfig';
import {capitalize, extractQueryParams} from "./util";
import {select, selectAll} from 'd3-selection';
import Quadrant from '../models/quadrant';
import Ring from '../models/ring';
import Blip from '../models/blip';
import Radar from '../models/radar';
import GraphingRadar from '../graphing/graphing';
import MalformedDataError from '../exceptions/malformedDataError';

import SheetNotFoundError from '../exceptions/sheetNotFoundError';
import ExceptionMessages from './exceptionMessages';

let normalizedConfig;

export function plotRadar(title, blips, currentRadarName, alternativeRadars) {
    document.title = title.replace(/\.csv/, '');
    selectAll('.loading').remove();
    normalizedConfig = getConfig(blips);

    let rings = normalizedConfig.rings;
    let ringMap = {};
    let maxRings = 4;

    rings.forEach((ringName, i) => {
        if (i === maxRings) {
            throw new MalformedDataError(ExceptionMessages.TOO_MANY_RINGS);
        }
        ringMap[ringName] = new Ring(ringName, i);
    });

    let quadrants = {};
    normalizedConfig.quadrants.forEach((name) => {
        quadrants[name] = new Quadrant(capitalize(name));
    });

    blips.forEach((blip) => {
        // errorhandling in case
        const currentQuadrant = quadrants[blip.quadrant] || quadrants[blip.quadrant.toLowerCase()];
        const currentRing = ringMap[blip.ring] || ringMap[blip.ring.toLowerCase()];
        if (!currentQuadrant) {
            throw new Error(`Invalid Quadrant ${blip.quadrant} in Sheet entry ${blip.name}`);
        } else if (!currentRing) {
            throw new Error(`Invalid ring ${blip.ring} in Sheet entry ${blip.name}`);
        }
        currentQuadrant.add(new Blip(blip.name, currentRing, blip.isNew.toLowerCase() === 'true', blip.topic, blip.description));
    });

    let radar = new Radar();
    Object.keys(quadrants).forEach((key) => {
        radar.addQuadrant(quadrants[key]);
    });

    if (alternativeRadars !== undefined || true) {
        alternativeRadars.forEach((sheetName) => {
            radar.addAlternative(sheetName);
        });
    }

    if (currentRadarName !== undefined || true) {
        radar.currentSheetName = currentRadarName;
    }

    let size = (window.innerHeight - 133) < 620 ? 620 : window.innerHeight - 133;

    let graphingRadar = new GraphingRadar(size, radar);
    graphingRadar.init();
    graphingRadar.plot();
}

export function setDocumentTitle() {
    document.title = 'Build your own Radar';
}

export function plotLoading(content) {
    content = select('body')
        .append('div')
        .attr('class', 'loading')
        .append('div')
        .attr('class', 'input-sheet');

    setDocumentTitle();

    plotLogo(content);

    let bannerText = '<h1>Building your radar...</h1><p>Your Technology Radar will be available in just a few seconds</p>';
    plotBanner(content, bannerText);
    plotFooter(content);
}

export function plotLogo(content) {
    if (getConfig().logo) {
        content.append('div')
            .attr('class', 'input-sheet__logo')
            .html('<img src="images/' + getConfig().logo + '" alt="Logo"/>');
    }
}

export function plotFooter(content) {
    if (normalizedConfig !== undefined) {
        content
            .append('div')
            .attr('id', 'footer')
            .append('div')
            .attr('class', 'footer-content')
            .append('p')
            .html(normalizedConfig.footerText);
    }
}

export function plotBanner(content, text) {
    content.append('div')
        .attr('class', 'input-sheet__banner')
        .html(text);
}

export function plotForm(content) {
    content.append('div')
        .attr('class', 'input-sheet__form')
        .append('p')
        .html('<strong>Enter the URL of your <a href="https://www.thoughtworks.com/radar/how-to-byor" target="_blank">Google Sheet or CSV</a> file below…</strong>');

    let form = content.select('.input-sheet__form').append('form')
        .attr('method', 'get');

    form.append('input')
        .attr('type', 'text')
        .attr('name', 'sheetId')
        .attr('placeholder', 'e.g. https://docs.google.com/spreadsheets/d/<sheetid> or hosted CSV file')
        .attr('required', '');

    form.append('button')
        .attr('type', 'submit')
        .append('a')
        .attr('class', 'button')
        .text('Build my radar');

    form.append('p').html("<a href='https://www.thoughtworks.com/radar/how-to-byor'>Need help?</a>");
}

export function plotErrorMessage(exception) {
    let message = 'Oops! It seems like there are some problems with loading your data. ';

    let content = select('body')
        .append('div')
        .attr('class', 'input-sheet');
    setDocumentTitle();

    plotLogo(content);

    let bannerText = '<div><h1>Build your own radar</h1><p>Once you\'ve <a href="https://www.thoughtworks.com/radar/byor">created your Radar</a>, you can use this service' +
        ' to generate an <br />interactive version of your Technology Radar. Not sure how? <a href="https://www.thoughtworks.com/radar/how-to-byor">Read this first.</a></p></div>';

    plotBanner(content, bannerText);

    selectAll('.loading').remove();
    message = "Oops! We can't find the Google Sheet you've entered";
    let faqMessage = 'Please check <a href="https://www.thoughtworks.com/radar/how-to-byor">FAQs</a> for possible solutions.';
    if (exception instanceof MalformedDataError) {
        message = message.concat(exception.message);
    } else if (exception instanceof SheetNotFoundError) {
        message = exception.message;
    } else {
        console.error(exception);
    }

    const container = content.append('div').attr('class', 'error-container');
    let errorContainer = container.append('div')
        .attr('class', 'error-container__message');
    errorContainer.append('div').append('p')
        .html(message);
    errorContainer.append('div').append('p')
        .html(faqMessage);

    let homePageURL = window.location.protocol + '//' + window.location.hostname;
    homePageURL += (window.location.port === '' ? '' : ':' + window.location.port);
    let homePage = '<a href=' + homePageURL + '>GO BACK</a>';

    errorContainer.append('div').append('p')
        .html(homePage);

    plotFooter(content);
}

export function plotUnauthorizedErrorMessage() {
    let content = select('body')
        .append('div')
        .attr('class', 'input-sheet');
    setDocumentTitle();

    plotLogo(content);

    let bannerText = '<div><h1>Build your own radar</h1></div>';

    plotBanner(content, bannerText);

    selectAll('.loading').remove();
    const currentUser = GoogleAuth.geEmail();
    let homePageURL = window.location.protocol + '//' + window.location.hostname;
    homePageURL += (window.location.port === '' ? '' : ':' + window.location.port);
    const goBack = '<a href=' + homePageURL + '>GO BACK</a>';
    const message = `<strong>Oops!</strong> Looks like you are accessing this sheet using <b>${currentUser}</b>, which does not have permission.Try switching to another account.`;

    const container = content.append('div').attr('class', 'error-container');

    const errorContainer = container.append('div')
        .attr('class', 'error-container__message');

    errorContainer.append('div').append('p')
        .attr('class', 'error-title')
        .html(message);

    const button = errorContainer.append('button')
        .attr('class', 'button switch-account-button')
        .text('SWITCH ACCOUNT');

    errorContainer.append('div').append('p')
        .attr('class', 'error-subtitle')
        .html(`or ${goBack} to try a different sheet.`);

    button.on('click', () => {
        let queryString = window.location.href.match(/sheetId(.*)/);
        let queryParams = queryString ? extractQueryParams(queryString[0]) : {};
        const sheet = GoogleSheet(queryParams.sheetId, queryParams.sheetName);
        sheet.authenticate(true, () => {
            content.remove();
        });
    });
}
