/* eslint no-constant-condition: "off" */

import {getConfig} from '../util/normalizedConfig';
import {capitalize} from "./util";
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
            plotErrorMessage(new MalformedDataError(ExceptionMessages.TOO_MANY_RINGS));
            throw new Error();
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

    if (alternativeRadars !== undefined) {
        alternativeRadars.forEach((sheetName) => {
            radar.addAlternative(sheetName);
        });
    }

    if (currentRadarName !== undefined) {
        radar.currentSheetName = currentRadarName;
    }

    let size = (window.innerHeight - 133) < 620 ? 620 : window.innerHeight - 133;

    let graphingRadar = new GraphingRadar(size, radar);
    graphingRadar.init();
    graphingRadar.plot();
    graphingRadar.createCustomHomeLink(select('header'));
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

    plotHeader();

    plotFooter(content);
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

export function plotHeader() {
    let main = select('main');
    main.append('br');
    main.append('br');

    main.append('div')
        .attr('class', 'container')
        .append('div')
        .attr('class', 'row')
        .append('div')
        .attr('class', 'col')
        .append('div')
        .attr('class', 'headerpic')
        .html('<a href="/" target="_top"><img class="img-fluid" src="images/headercomp.png" alt="Logo"/></a>');

    return select('main')
        .append('div')
        .attr('class', 'row input-sheet');
}

export function plotForm(content) {
    content.append('div')
        .attr('class', 'input-sheet__form')
        .append('p')
        .html('<strong>Enter the URL of your CSV file below…</strong>');

    let form = content.select('.input-sheet__form').append('form')
        .attr('method', 'get');

    form.append('input')
        .attr('type', 'text')
        .attr('name', 'sheetId')
        .attr('placeholder', 'Enter the URL of your hosted CSV file')
        .attr('required', '');

    form.append('input')
        .attr('type', 'submit')
        .attr('value', 'Build my radar');
}

export function plotErrorMessage(exception) {
    let message = 'Oops! It seems like there are some problems with loading your data. ';

    let content = select('body')
        .append('div')
        .attr('class', 'input-sheet');
    setDocumentTitle();

    plotHeader();

    selectAll('.loading').remove();
    let faqMessage = 'Please check <a href="https://www.thoughtworks.com/radar/how-to-byor">FAQs</a> for possible solutions.';
    if (exception instanceof MalformedDataError) {
        message = message + '<br>' + exception.message;
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

    plotHeader();
    plotFooter(content);
}
