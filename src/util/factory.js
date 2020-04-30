/* eslint no-constant-condition: "off" */

import {getConfig} from './normalizedConfig';
import {capitalize} from './util';
import {select, selectAll} from 'd3-selection';
import Quadrant from '../models/quadrant';
import Ring from '../models/ring';
import Blip from '../models/blip';
import Radar from '../models/radar';
import GraphingRadar from '../graphing/graphing';
import MalformedDataError from '../exceptions/malformedDataError';
import SheetNotFoundError from '../exceptions/sheetNotFoundError';
import ExceptionMessages from './exceptionMessages';

let normalizedConfig = getConfig();

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
        currentQuadrant.add(new Blip(blip.id, blip.name, currentRing, blip.isNew.toLowerCase() === 'true', blip.topic, blip.description));
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

    let graphingRadar = new GraphingRadar(800, radar);
    graphingRadar.init();
    graphingRadar.plot();
    graphingRadar.createCustomHomeLink(select('header').select('div.container'));

    return graphingRadar;
}

export function setDocumentTitle() {
    document.title = 'Build your own Radar';
}

export function plotFooter() {
    if (normalizedConfig && normalizedConfig.footerText) {
        select('body')
            .insert('footer')
            .html(normalizedConfig.footerText);
    }
}

export function plotHeader() {
    let internPage = window.location.href.includes('intern') || window.location.href.includes('localhost');

    let header = select('body')
        .insert('main').attr('role', 'main').attr('class', 'container');

    if (getConfig().hint && internPage) {
        header = header.insert('div').attr('class', 'hintContainer');
        header.append('div')
            .attr('class', 'hint')
            .html(getConfig().hint);
    }

    let main = select('main');
    main.append('br');

    if (internPage) {
        main.append('br');
        main.append('br');
    }

    main.append('div')
        .attr('class', 'container')
        .append('div')
        .attr('class', 'row')
        .append('div')
        .attr('class', 'col-sm')
        .append('div')
        .attr('class', 'd-none d-md-block')
        .html('<a href="/" target="_top"><img id="headerimg" class="img-fluid" src="" alt="headerImage"/></a>');

    document.getElementById('headerimg').setAttribute('src', 'images/' + (getConfig().header ? getConfig().header : 'tech-radar-landing-page-wide.png'));
}

export function plotForm() {
    let content = select('main')
        .append('div')
        .attr('id', 'form')
        .attr('class', 'container');

    let form = content.append('div')
        .attr('class', 'row')
        .append('form')
        .attr('method', 'get')
        .attr('class', 'col');

    form.append('input')
        .attr('type', 'text')
        .attr('name', 'sheetId')
        .attr('class', 'sheetIdInput')
        .attr('placeholder', 'Enter the URL of your hosted CSV file ...')
        .attr('onfocus', 'this.placeholder=""')
        .attr('onblur', 'this.placeholder="Enter the URL of your hosted CSV file ..."')
        .attr('required', '');

    form.append('input')
        .attr('type', 'submit')
        .attr('class', 'submitBtn')
        .attr('value', 'Build my radar');
}

export function plotErrorMessage(exception) {
    plotHeader();
    let message = 'Oops! It seems like there are some problems with loading your data. ';

    let content = select('main');
    setDocumentTitle();

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

    plotFooter();
}
