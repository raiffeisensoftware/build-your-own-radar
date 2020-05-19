import * as d3Tip from 'd3-tip';
import {event, select, selectAll} from 'd3-selection';
import {arc} from 'd3-shape';
import {Chance} from 'chance';
import 'd3-transition';
import {getConfig} from '../util/normalizedConfig';
import RingCalculator from '../util/ringCalculator';
import {extractQueryParams} from '../util/util';
import $ from 'jquery';
import 'jquery-ui/ui/widgets/autocomplete';

const MIN_BLIP_WIDTH = 12;
const ANIMATION_DURATION = 1000;

let svg;
let radarElement;
let quadrantButtons;
let buttonsGroup;
let header;
let alternativeDiv;
let chance;
let scale = 1.2;
let isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
let selectQuadrantTimer;

export default class Graphing {
    constructor(size, radar) {
        this._size = size;
        this._radar = radar;
        this.normalizedConfig = getConfig();
        this.tip = d3Tip.default().attr('class', 'd3-tip d-none d-lg-flex').html((text) => {
            return text;
        });
        this.ringCalculator = new RingCalculator(this.normalizedConfig.rings.length, this.center());
    }

    get radar() {
        return this._radar;
    }

    center() {
        return Math.round(this._size / 2);
    }

    toRadian(angleInDegrees) {
        return Math.PI * angleInDegrees / 180;
    }

    plotLines(quadrantGroup, quadrant) {
        let startX = this._size * (1 - (-Math.sin(this.toRadian(quadrant.startAngle)) + 1) / 2);
        let endX = this._size * (1 - (-Math.sin(this.toRadian(quadrant.startAngle - 90)) + 1) / 2);

        let startY = this._size * (1 - (Math.cos(this.toRadian(quadrant.startAngle)) + 1) / 2);
        let endY = this._size * (1 - (Math.cos(this.toRadian(quadrant.startAngle - 90)) + 1) / 2);

        if (startY > endY) {
            let aux = endY;
            endY = startY;
            startY = aux;
        }

        quadrantGroup.append('line')
            .attr('id', 'horizontal-line-' + quadrant.order)
            .attr('x1', this.center()).attr('x2', this.center())
            .attr('y1', startY - 2).attr('y2', endY + 2)
            .attr('stroke-width', 10);

        quadrantGroup.append('line')
            .attr('x1', endX).attr('y1', this.center())
            .attr('x2', startX).attr('y2', this.center())
            .attr('stroke-width', 10);
    }

    plotQuadrant(rings, quadrant) {
        let quadrantGroup = svg.append('g')
            .attr('id', 'quadrant-group-' + quadrant.order)
            .attr('class', 'quadrant-group quadrant-group-' + quadrant.order)
            .on('mouseover', () => {
                this.mouseoverQuadrant(quadrant.order);
            })
            .on('mouseout', () => {
                this.mouseoutQuadrant(quadrant.order);
            })
            .on('click', () => {
                this.selectQuadrant(quadrant.order, quadrant.startAngle);
            });

        rings.forEach((ring, i) => {
            let ringArc = new arc()
                .innerRadius(this.ringCalculator.getRadius(i))
                .outerRadius(this.ringCalculator.getRadius(i + 1))
                .startAngle(this.toRadian(quadrant.startAngle))
                .endAngle(this.toRadian(quadrant.startAngle - 90));

            quadrantGroup.append('path')
                .attr('d', ringArc)
                .attr('class', 'ring-arc-' + ring.order)
                .attr('transform', 'translate(' + this.center() + ', ' + this.center() + ')');
        });

        quadrant.clientRect = document.getElementById('quadrant-group-' + quadrant.order).getBoundingClientRect();

        return quadrantGroup;
    }

    plotTexts(quadrantGroup, rings, quadrant) {
        rings.forEach((ring, i) => {
            if (quadrant.order === 'first' || quadrant.order === 'fourth') {
                quadrantGroup.append('text')
                    .attr('class', 'line-text')
                    .attr('y', this.center() + 4)
                    .attr('x', this.center() + (this.ringCalculator.getRadius(i) + this.ringCalculator.getRadius(i + 1)) / 2)
                    .attr('text-anchor', 'middle')
                    .text(ring.name);
            } else {
                quadrantGroup.append('text')
                    .attr('class', 'line-text')
                    .attr('y', this.center() + 4)
                    .attr('x', this.center() - (this.ringCalculator.getRadius(i) + this.ringCalculator.getRadius(i + 1)) / 2)
                    .attr('text-anchor', 'middle')
                    .text(ring.name);
            }
        });
    }

    triangle(blip, x, y, order, group) {
        return group.append('path').attr('d', 'M412.201,311.406c0.021,0,0.042,0,0.063,0c0.067,0,0.135,0,0.201,0c4.052,0,6.106-0.051,8.168-0.102c2.053-0.051,4.115-0.102,8.176-0.102h0.103c6.976-0.183,10.227-5.306,6.306-11.53c-3.988-6.121-4.97-5.407-8.598-11.224c-1.631-3.008-3.872-4.577-6.179-4.577c-2.276,0-4.613,1.528-6.48,4.699c-3.578,6.077-3.26,6.014-7.306,11.723C402.598,306.067,405.426,311.406,412.201,311.406')
            .attr('transform', 'scale(' + (blip.width / 34) + ') translate(' + (-404 + x * (34 / blip.width) - 17) + ', ' + (-282 + y * (34 / blip.width) - 17) + ')')
            .attr('class', order);
    }

    triangleLegend(x, y, group) {
        return group.append('path').attr('d', 'M412.201,311.406c0.021,0,0.042,0,0.063,0c0.067,0,0.135,0,0.201,0c4.052,0,6.106-0.051,8.168-0.102c2.053-0.051,4.115-0.102,8.176-0.102h0.103c6.976-0.183,10.227-5.306,6.306-11.53c-3.988-6.121-4.97-5.407-8.598-11.224c-1.631-3.008-3.872-4.577-6.179-4.577c-2.276,0-4.613,1.528-6.48,4.699c-3.578,6.077-3.26,6.014-7.306,11.723C402.598,306.067,405.426,311.406,412.201,311.406')
            .attr('transform', 'scale(' + (22 / 64) + ') translate(' + (-404 + x * (64 / 22) - 17) + ', ' + (-282 + y * (64 / 22) - 17) + ')');
    }

    circle(blip, x, y, order, group) {
        return (group || svg).append('path')
            .attr('d', 'M420.084,282.092c-1.073,0-2.16,0.103-3.243,0.313c-6.912,1.345-13.188,8.587-11.423,16.874c1.732,8.141,8.632,13.711,17.806,13.711c0.025,0,0.052,0,0.074-0.003c0.551-0.025,1.395-0.011,2.225-0.109c4.404-0.534,8.148-2.218,10.069-6.487c1.747-3.886,2.114-7.993,0.913-12.118C434.379,286.944,427.494,282.092,420.084,282.092')
            .attr('transform', 'scale(' + (blip.width / 34) + ') translate(' + (-404 + x * (34 / blip.width) - 17) + ', ' + (-282 + y * (34 / blip.width) - 17) + ')')
            .attr('class', order);
    }

    circleLegend(x, y, group) {
        return (group || svg).append('path')
            .attr('d', 'M420.084,282.092c-1.073,0-2.16,0.103-3.243,0.313c-6.912,1.345-13.188,8.587-11.423,16.874c1.732,8.141,8.632,13.711,17.806,13.711c0.025,0,0.052,0,0.074-0.003c0.551-0.025,1.395-0.011,2.225-0.109c4.404-0.534,8.148-2.218,10.069-6.487c1.747-3.886,2.114-7.993,0.913-12.118C434.379,286.944,427.494,282.092,420.084,282.092')
            .attr('transform', 'scale(' + (22 / 64) + ') translate(' + (-404 + x * (64 / 22) - 17) + ', ' + (-282 + y * (64 / 22) - 17) + ')');
    }

    addRing(ring, order) {
        let table = select('.quadrant-table.' + order);
        table.append('h4').text(ring);
        return table.append('ul');
    }

    calculateBlipCoordinates(blip, chance, minRadius, maxRadius, startAngle) {
        let adjustX = Math.sin(this.toRadian(startAngle)) - Math.cos(this.toRadian(startAngle));
        let adjustY = -Math.cos(this.toRadian(startAngle)) - Math.sin(this.toRadian(startAngle));

        let radius = chance.floating({min: minRadius + blip.width / 2, max: maxRadius - blip.width / 2});
        let angleDelta = Math.asin(blip.width / 2 / radius) * 180 / Math.PI;
        angleDelta = angleDelta > 45 ? 45 : angleDelta;
        let angle = this.toRadian(chance.integer({min: angleDelta, max: 90 - angleDelta}));

        let x = this.center() + radius * Math.cos(angle) * adjustX;
        let y = this.center() + radius * Math.sin(angle) * adjustY;

        return [x, y];
    }

    thereIsCollision(blip, coordinates, allCoordinates) {
        return allCoordinates.some((currentCoordinates) => {
            return (Math.abs(currentCoordinates[0] - coordinates[0]) < blip.width) && (Math.abs(currentCoordinates[1] - coordinates[1]) < blip.width);
        });
    }

    plotBlips(quadrantGroup, rings, quadrantWrapper) {
        let quadrant = quadrantWrapper.quadrant;
        let startAngle = quadrantWrapper.startAngle;
        let order = quadrantWrapper.order;
        let blips = quadrant.blips;

        let elem = select('.quadrant-table.' + order);

        this.drawLegend(elem);

        elem.append('h2')
            .attr('class', 'quadrant-table__name')
            .text(quadrant.name);

        rings.forEach((ring, i) => {

            let ringBlips = blips.filter((blip) => {
                return blip.ring.name === ring.name;
            });

            if (ringBlips.length === 0) {
                return;
            }

            let maxRadius, minRadius;

            minRadius = this.ringCalculator.getRadius(i);
            maxRadius = this.ringCalculator.getRadius(i + 1);

            let sumRing = ring.name.split('').reduce((p, c) => {
                return p + c.charCodeAt(0);
            }, 0);

            let sumQuadrant = quadrant.name.split('').reduce((p, c) => {
                return p + c.charCodeAt(0);
            }, 0);

            chance = new Chance(Math.PI * sumRing * ring.name.length * sumQuadrant * quadrant.name.length);

            let ringList = this.addRing(ring.name, order);
            let allBlipCoordinatesInRing = [];

            ringBlips.forEach((blip) => {
                this._radar.addBlip(blip);
                const coordinates = this.findBlipCoordinates(blip,
                    minRadius,
                    maxRadius,
                    startAngle,
                    allBlipCoordinatesInRing);

                allBlipCoordinatesInRing.push(coordinates);
                this.drawBlipInCoordinates(blip, coordinates, order, quadrantGroup, ringList);
            });
        });
    }

    drawLegend(elem) {
        elem = elem.append('div').attr('class', 'legend').html('<strong>Legende:</strong><br/>');

        // draw circle Legend
        this.drawCircle(elem);
        elem.append('text').html(this.normalizedConfig.legend !== undefined ? this.normalizedConfig.legend.circleKey : 'CircleKey');
        elem.append('br');

        // draw triangle Legend
        this.drawTriangle(elem);
        elem.append('i').attr('class', 'oldTech')
            .html(this.normalizedConfig.legend !== undefined ? this.normalizedConfig.legend.triangleKey : 'TriangleKey');
    }

    drawCircle(elem) {
        elem.append('svg').attr('class', 'd-none d-lg-inline').attr('height', 20).attr('width', 20).append('circle').attr('cx', 8).attr('cy', 8).attr('r', 6);
    }

    drawTriangle(elem) {
        elem.append('svg').attr('class', 'd-none d-lg-inline').attr('height', 20).attr('width', 20).append('polygon').attr('points', '00,15 8,00 16,15');
    }

    findBlipCoordinates(blip, minRadius, maxRadius, startAngle, allBlipCoordinatesInRing) {
        const maxIterations = 200;
        let coordinates = this.calculateBlipCoordinates(blip, chance, minRadius, maxRadius, startAngle);
        let iterationCounter = 0;
        let foundAPlace = false;

        while (iterationCounter < maxIterations) {
            if (this.thereIsCollision(blip, coordinates, allBlipCoordinatesInRing)) {
                coordinates = this.calculateBlipCoordinates(blip, chance, minRadius, maxRadius, startAngle);
            } else {
                foundAPlace = true;
                break;
            }
            iterationCounter++;
        }

        if (!foundAPlace && blip.width > MIN_BLIP_WIDTH) {
            blip.width = blip.width - 1;
            return this.findBlipCoordinates(blip, minRadius, maxRadius, startAngle, allBlipCoordinatesInRing);
        } else {
            return coordinates;
        }
    }

    drawBlipInCoordinates(blip, coordinates, order, quadrantGroup, ringList) {
        let x = coordinates[0];
        let y = coordinates[1];

        let group = quadrantGroup.append('g').attr('class', 'blip-link').attr('id', 'blip-link-' + blip.number);

        if (blip.isNew) {
            this.triangle(blip, x, y, order, group);
        } else {
            this.circle(blip, x, y, order, group);
        }

        group.append('text')
            .attr('x', x)
            .attr('y', y + 4)
            .attr('class', 'blip-text')
            // derive font-size from current blip width
            .style('font-size', ((blip.width * 10) / 22) + 'px')
            .attr('text-anchor', 'middle')
            .text(blip.number);

        let blipListItem = ringList.append('li');
        let blipText = blip.number + '. ' + blip.name + (blip.topic ? ('. - ' + blip.topic) : '');

        let tmpBlipListItem = blipListItem.append('div')
            .attr('class', 'blip-list-item')
            .attr('id', 'blip-list-item-' + blip.number);

        blip.isNew ? tmpBlipListItem.html('<i class="oldTech">' + blipText + '</i>') : tmpBlipListItem.html(blipText);

        let blipItemDescription = blipListItem.append('div')
            .attr('id', 'blip-description-' + blip.number)
            .attr('class', 'blip-item-description');


        blipItemDescription.append('p').html(blip.description);
        // Disabled until further notice (Share Button)
        /* let blipshareId = 'share-btn-' + blip.number;
        let shareButton = blipItemDescription.append('p').html(blip.description)
            .append('button')
            .attr('id', blipshareId)
            .attr('type', 'button').attr('class', 'btn btn-lg share-btn')
            .attr('data-toggle', 'tooltip');

        shareButton.on('click', () => {
            let text = location.href + '&search=' + blip.id;
            navigator.clipboard.writeText(text).then(() => {
                let shareTooltip = $('#' + blipshareId).tooltip({title: 'Link in die Zwischenablage kopiert', trigger: 'click'});

                shareTooltip.tooltip('show');

                setTimeout(() => {
                    shareTooltip.tooltip('hide');
                }, 2000);
            });
        }); */

        let mouseOver = () => {
            selectAll('g.blip-link').attr('opacity', 0.3);
            group.attr('opacity', 1.0);
            this.tip.show(blip.name, group.node());
        };

        let mouseOut = () => {
            selectAll('g.blip-link').attr('opacity', 1.0);
            this.tip.hide();
        };

        blipListItem.on('mouseover', mouseOver).on('mouseout', mouseOut);
        group.on('mouseover', mouseOver).on('mouseout', mouseOut);

        let clickBlip = () => {
            // check if highlight is already applied to listItem
            let highlightApplied = blipListItem.select('.blip-list-item').classed('highlight');
            // remove non-clicked expanded and highlight 2 attributes
            select('.blip-list-item.highlight').node() !== blipListItem.node() &&
            select('.blip-list-item.highlight').classed('highlight', false);

            select('.blip-item-description.expanded').node() !== blipItemDescription.node() &&
            select('.blip-item-description.expanded').classed('expanded', false);


            // toggle expanded and highlight attributes
            blipItemDescription.classed('expanded', !blipItemDescription.classed('expanded'));
            blipListItem.select('.blip-list-item').classed('highlight', !highlightApplied);

            blipItemDescription.on('click', () => {
                event.stopPropagation();
            });
        };

        if (blip.description) {
            blipListItem.on('click', clickBlip);
        }

        group.on('click', () => {
            let blipNumber = group.select('text').text();
            let description = select('#blip-description-' + blipNumber);

            // remove non-clicked expanded and highlight 2 attributes
            let highlightApplied = blipListItem.select('.blip-list-item').classed('highlight');
            select('.blip-list-item.highlight').node() !== blipListItem.node() &&
            select('.blip-list-item.highlight').classed('highlight', false);
            blipListItem.selectAll('.blip-list-item').classed('highlight', !highlightApplied);

            // set all other expanded to false
            let expanded = description.attr('class').includes('expanded');
            selectAll('.blip-item-description').classed('expanded', false);
            description.classed('expanded', !expanded);

            if (description.attr('class').includes('expanded')) {
                // Gets the name of the quadrant from the blip parent element (quadrant-group-x) and sets faster timeout if selected to account for transition animation
                let parent = select(group.node().parentNode).attr('class');
                let index = parent.indexOf('p-');
                let timeout = select('.quadrant-table.' + parent.substr(index + 2))
                    .attr('class').includes('selected') ? 300 : ANIMATION_DURATION + 100;

                setTimeout(() => {
                    if (isIE11) { // workaround for IE11 because of lacking scrollIntoViewOptions support
                        document.getElementById('blip-description-' + blipNumber).scrollIntoView(false);
                    } else {
                        document.getElementById('blip-description-' + blipNumber).scrollIntoView({block: 'center', behavior: 'smooth'});
                    }
                }, timeout);
            }
            quadrantGroup.node().dispatchEvent(new MouseEvent('click'));
        });
    }

    removeHomeLink() {
        select('#home-link').remove();
    }

    createHomeLink(pageElement) {
        if (pageElement.select('.home-link').empty()) {
            pageElement = pageElement.insert('div', 'div#alternative-buttons')
                .attr('id', 'home-link')
                .attr('class', 'container row py-2');

            pageElement.append('a')
                .attr('href', 'javascript:void(0)')
                .html('&#171; Zurück zur Radar-Übersicht')
                .classed('home-link', true)
                .classed('selected', true)
                .on('click', () => {
                    this.redrawFullRadar();
                });
        }
    }

    createCustomHomeLink(pageElement) {
        if (getConfig().platformPath !== undefined) {
            if (pageElement.select('.home-link').empty()) {
                pageElement = pageElement.insert('div', 'div#alternative-buttons')
                    .attr('id', 'home-link')
                    .attr('class', 'container row py-2');

                pageElement.append('a')
                    .attr('href', getConfig().platformPath)
                    .attr('target', '_top')
                    .html('&#171; Zurück zur Plattform-Übersicht')
                    .classed('home-link', true)
                    .classed('selected', true);
            }
        }
    }

    redrawFullRadar() {
        this.removeHomeLink();
        this.createCustomHomeLink(select('header').select('div.container'));

        this.tip.hide();
        selectAll('g.blip-link').attr('opacity', 1.0);

        selectAll('.quadrant-group').classed('opaque', false);

        selectAll('.btn')
            .classed('selected', false)
            .classed('colored', true);

        select('.btn-container').classed('no-center', false);
        select('.btn-container').classed('center', true);
        selectAll('.quadrant-table').classed('selected', false);
        selectAll('.home-link').classed('selected', false);
        selectAll('.blip-item-description').classed('expanded', false);
        selectAll('.blip-list-item').classed('highlight', false);

        selectAll('.quadrant-group')
            .transition()
            .duration(ANIMATION_DURATION)
            .attr('transform', 'scale(1)');

        selectAll('.quadrant-group .blip-link')
            .transition()
            .duration(ANIMATION_DURATION)
            .attr('transform', 'scale(1)');

        selectAll('.quadrant-group').classed('noPointerEvent', false);

        selectAll('line').transition().duration(ANIMATION_DURATION).attr('stroke-width', 10);
    }

    searchBlip(_e, ui) {
        const {blip, quadrant} = ui.item;
        const isQuadrantSelected = select('button.' + quadrant.order).classed('selected');
        this.selectQuadrant(quadrant.order, quadrant.startAngle);
        const selectedDesc = select('#blip-description-' + blip.number);
        select('.blip-item-description.expanded').node() !== selectedDesc.node() &&
        select('.blip-item-description.expanded').classed('expanded', false);
        selectedDesc.classed('expanded', true);

        selectAll('g.blip-link').attr('opacity', 0.3);
        const group = select('#blip-link-' + blip.number);
        group.attr('opacity', 1.0);
        selectAll('.blip-list-item').classed('highlight', false);
        select('#blip-list-item-' + blip.number).classed('highlight', true);

        let timeout = 0;

        if (window.innerWidth > 992) {
            if (isQuadrantSelected) {
                this.tip.show(blip.name, group.node());
                timeout = 300;
            } else {
                // need to account for the animation time associated with selecting a quadrant
                this.tip.hide();

                setTimeout(() => {
                    this.tip.show(blip.name, group.node());
                }, ANIMATION_DURATION);

                timeout = ANIMATION_DURATION + 100;
            }
        }

        setTimeout(() => {
            if (isIE11) { // check for IE11 because of lacking scrollIntoViewOptions support
                document.getElementById('blip-description-' + blip.number).scrollIntoView(false);
            } else {
                document.getElementById('blip-description-' + blip.number).scrollIntoView({block: 'center', behavior: 'smooth'});
            }
        }, timeout);
    }

    plotRadarHeader() {
        header = select('body').insert('header', '#radar').attr('role', 'main').attr('class', 'container');
        let internPage = window.location.href.includes('intern') || window.location.href.includes('localhost');

        if (getConfig().hint && internPage) {
            header = header.insert('div').attr('class', 'hintContainer');
            header.append('div')
                .attr('class', 'hint')
                .html(getConfig().hint);
        }

        header = select('header');

        if (internPage) {
            header.append('br');
            header.append('br');
        }

        header = header.append('div').attr('class', 'container');

        let tmpHeader = header
            .append('div').attr('class', 'row')
            .append('div').attr('class', 'col-sm');

        tmpHeader.append('br');

        // add normal header
        tmpHeader.append('div')
            .attr('class', 'd-none d-md-block')
            .html('<a href="/" target="_top"><img id="headerimg" class="img-fluid" src="" alt="headerImage"/></a>');

        document.getElementById('headerimg').setAttribute('src', './images/' + (getConfig().header ? getConfig().header : 'tech-radar-landing-page-wide.png'));

        // add mobile header
        tmpHeader.append('div')
            .attr('class', 'd-block d-md-none')
            .html('<a href="/" target="_top"><img id="headerimgMobile" class="img-fluid" src="" alt="headerImage"/></a>');

        document.getElementById('headerimgMobile').setAttribute('src', './images/' + (getConfig().mobileHeader ? getConfig().mobileHeader : 'tech-radar-landing-page-wide.png'));

        buttonsGroup = header.append('div')
            .attr('class', 'row btn-container center');

        quadrantButtons = buttonsGroup.append('div')
            .attr('class', 'col-lg-6 btn-toolbar')
            .attr('role', 'group')

        alternativeDiv = header.append('div')
            .attr('id', 'alternative-buttons');

        return header;
    }

    plotQuadrantButtons(quadrants) {
        [0, 1, 2, 3].forEach((i) => {
            radarElement
                .append('div')
                .attr('class', 'quadrant-table ' + quadrants[i].order);

            quadrantButtons.append('button').attr('type', 'button')
                .attr('class', 'col-6 col-xl-3 py-2 btn ' + quadrants[i].order + ' colored')
                .text(quadrants[i].quadrant.name)
                .on('mouseover', () => {
                    this.mouseoverQuadrant(quadrants[i].order);
                })
                .on('mouseout', () => {
                    this.mouseoutQuadrant(quadrants[i].order);
                })
                .on('click', () => {
                    this.tip.hide();
                    selectAll('.blip-item-description').classed('expanded', false);
                    selectAll('.blip-list-item').classed('highlight', false);

                    let timeout = 0;
                    if (this.isAnyQuadrantSelected() && window.innerWidth > 992) {
                        clearTimeout(selectQuadrantTimer);
                        this.redrawFullRadar();
                        timeout = ANIMATION_DURATION;
                        selectAll('.btn-toolbar button').property('disabled', true);
                    }
                    setTimeout(() => {
                        selectQuadrantTimer = this.selectQuadrant(quadrants[i].order, quadrants[i].startAngle);
                    }, timeout);
                });
        });

        buttonsGroup.append('div').attr('class', 'col-12 col-lg-2 py-2 platform')
            .html('Plattform: <strong>' + document.title + '</strong>');

        buttonsGroup.append('div')
            .attr('class', 'search-box col-8 offset-2 col-lg-3 offset-lg-0')
            .append('input')
            .attr('id', 'auto-complete')
            .attr('placeholder', 'Suchen im Radar')
            .classed('search-radar', true);

        $('#auto-complete').autocomplete({
            source: quadrants.map((q) => {
                return q.quadrant.blips.map((b) => {
                    const name = b.name;
                    return {label: name, value: name, blip: b, quadrant: q};
                });
            }).flat(),
            select: (event, ui) => {
                selectAll('.btn-toolbar button').property('disabled', true);
                this.redrawFullRadar();
                const timeout = window.innerWidth > 992 ? ANIMATION_DURATION : 0;
                setTimeout(() => {
                    this.searchBlip(event, ui)
                }, timeout)
            }
        });

        buttonsGroup.append('button')
            .attr('class', 'btn print-btn-image print-radar-btn d-none d-lg-block col-1')
            .on('click', () => {
                window.print();
            });
    }

    plotRadarFooter() {
        select('body')
            .insert('footer')
            .html(this.normalizedConfig.footerText);
    }

    mouseoverQuadrant(order) {
        select('.quadrant-group-' + order).classed('opaque', false);
        selectAll('.quadrant-group:not(.quadrant-group-' + order + ')').classed('opaque', true);
    }

    mouseoutQuadrant(order) {
        selectAll('.quadrant-group:not(.quadrant-group-' + order + ')').classed('opaque', false);
    }

    selectQuadrant(order, startAngle) {
        let quadrantSelected = select('.quadrant-table.' + order).attr('class').includes('selected');
        if (quadrantSelected) {
            return;
        }

        selectAll('.quadrant-group:not(.quadrant-group-' + order + ')').classed('opaque', true);

        selectAll('.home-link').classed('selected', false);
        this.removeHomeLink();
        this.createHomeLink(select('header').select('div.container'));

        select('.btn-container').classed('center', false);
        select('.btn-container').classed('no-center', true);
        selectAll('.btn').classed('selected', false).classed('colored', false);
        selectAll('.btn.' + order).classed('selected', true);
        selectAll('.quadrant-table').classed('selected', false);
        selectAll('.quadrant-table.' + order).classed('selected', true);

        let adjustX = Math.sin(this.toRadian(startAngle)) - Math.cos(this.toRadian(startAngle));
        let adjustY = Math.cos(this.toRadian(startAngle)) + Math.sin(this.toRadian(startAngle));

        let translateY = (-0.9 * (1 - adjustY) * (this._size / 2 - 7) * (scale - 1)) - ((1 - adjustY) / 2.1 * (1 - scale / 2) * this._size);

        this.moveQuadrant(order, translateY, true);

        let translateXAll = (1 - adjustX) / 2 * this._size * scale / 2 + ((1 - adjustX) / 2 * (1 - scale / 2) * this._size);
        let translateYAll = (1 + adjustY) / 2 * this._size * scale / 2;

        selectAll('.quadrant-group').classed('noPointerEvent', false);

        // hide other quadrants
        selectAll('.quadrant-group:not(.quadrant-group-' + order + ')')
            .classed('noPointerEvent', true)
            .transition()
            .duration(ANIMATION_DURATION)
            .attr('transform', 'translate(' + translateXAll + ',' + translateYAll + ')scale(0)');

        // remove the stroke width of the horizontal line to align with container
        select('.quadrant-group-' + order).selectAll('#horizontal-line-' + order).transition().duration(ANIMATION_DURATION).attr('stroke-width', 0);

        selectAll('.btn-toolbar button').property('disabled', false);
    }

    moveQuadrant(order, translateY, transition) {
        let image = document.getElementById('headerimg');
        let quadrantGroup = document.getElementById('quadrant-group-' + order).getBoundingClientRect();

        let lgScreenWidth = window.innerWidth > 992;
        let coordDiff = lgScreenWidth ? (scale * quadrantGroup.width) - quadrantGroup.width : 0; // only consider coordDiff for large screen width

        let translateX;

        if (order === 'second' || order === 'third') {
            translateX = image.getBoundingClientRect().right === 0 ? 0 : (image.getBoundingClientRect().right - coordDiff) - quadrantGroup.right;
        } else {
            translateX = image.getBoundingClientRect().left === 0 ? 0 : (image.getBoundingClientRect().left - coordDiff) - quadrantGroup.left;
        }

        // move quadrant
        if (transition) {
            select('.quadrant-group-' + order)
                .transition()
                .duration(ANIMATION_DURATION)
                .attr('transform', 'translate(' + translateX + ',' + translateY + ')scale(' + scale + ')');
        } else {
            select('.quadrant-group-' + order)
                .attr('transform', 'translate(' + translateX + ',' + translateY + ')scale(' + scale + ')');
        }

        let blipScale = 3 / 4;
        let blipTranslate = (1 - blipScale) / blipScale;

        // move blips
        selectAll('.quadrant-group-' + order + ' .blip-link text').each((d, i, nodes) => {
            let x = select(nodes[i]).attr('x');
            let y = select(nodes[i]).attr('y');
            select(nodes[i].parentNode)
                .transition()
                .duration(ANIMATION_DURATION)
                .attr('transform', 'scale(' + blipScale + ')translate(' + blipTranslate * x + ',' + blipTranslate * y + ')');
        });
    }

    init() {
        radarElement = select('body')
            .append('div').attr('id', 'radar').attr('class', 'container')
            .append('div').attr('id', 'radar-container').attr('class', 'container row');
    };

    constructSheetUrl(sheetName) {
        let noParamUrl = window.location.href.substring(0, window.location.href.indexOf(window.location.search));
        let queryParams = extractQueryParams(window.location.search.substring(1));
        return noParamUrl + '?sheetId=' + queryParams.sheetId + '&sheetName=' + encodeURIComponent(sheetName);
    }

    plotAlternativeRadars(alternatives, currentSheet) {
        let alternativeSheetButton = alternativeDiv
            .append('div')
            .classed('multiple-sheet-button-group', true);

        alternatives.forEach((alternative) => {
            alternativeSheetButton
                .append('div:a')
                .attr('class', 'first colored alternative multiple-sheet-button')
                .attr('href', this.constructSheetUrl(alternative))
                .text(alternative);

            if (alternative === currentSheet) {
                selectAll('.alternative').filter((d, i, nodes) => {
                    return select(nodes[i]).text() === alternative;
                }).attr('class', 'highlight multiple-sheet-button');
            }
        });
    }

    plot() {
        this.plotRadarHeader();
        this.plotRadar();
        this.plotRadarFooter();
    };

    plotRadar() {
        let rings = this._radar.rings;
        let quadrants = this._radar.quadrants;
        let alternatives = this._radar.alternatives;
        let currentSheet = this._radar.currentSheetName;

        this.plotAlternativeRadars(alternatives, currentSheet);

        this.plotQuadrantButtons(quadrants);

        svg = radarElement.append('svg').call(this.tip);
        svg.attr('id', 'radar-plot')
            .attr('class', 'd-none d-lg-block')
            .attr('viewBox', '0 0 800 938')
            .attr('preserveAspectRatio', 'xMidYMin meet');
        quadrants.forEach((quadrant) => {
            let quadrantGroup = this.plotQuadrant(rings, quadrant);
            this.plotLines(quadrantGroup, quadrant);
            this.plotTexts(quadrantGroup, rings, quadrant);
            this.plotBlips(quadrantGroup, rings, quadrant);
        });

        select(window).on('resize', () => this.alignQuadrant());
    }


    alignQuadrant() {
        if (this.isAnyQuadrantSelected()) {
            let order = select('.quadrant-table.selected').attr('class').match(/(first)|(second)|(third)|(fourth)/g).toString();

            let translate = this.getTranslation(select('#quadrant-group-' + order).node());
            select('.quadrant-group-' + order).attr('transform', null);
            this.moveQuadrant(order, translate[1], false);
        }
    }

    isAnyQuadrantSelected() {
        return selectAll('.quadrant-table.selected').node() !== null;
    }


    getTranslation(elem) {
        let matrix = elem.transform.baseVal.consolidate().matrix;
        return [matrix.e, matrix.f];
    }
}
