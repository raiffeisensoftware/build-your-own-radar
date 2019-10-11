import * as d3Tip from 'd3-tip';
import {event, select, selectAll} from "d3-selection";
import {arc} from 'd3-shape';
import {Chance} from 'chance';
import 'd3-transition';
import {getConfig} from '../util/normalizedConfig';
import RingCalculator from '../util/ringCalculator';
import {extractQueryParams} from "../util/util";
import $ from 'jquery';
import 'jquery-ui/ui/widgets/autocomplete';

const MIN_BLIP_WIDTH = 12;
const ANIMATION_DURATION = 1000;

export default class Graphing {
    constructor(size, radar) {
        this._size = size;
        this._radar = radar;
        this.normalizedConfig = getConfig();
        this.svg;
        this.radarElement;
        this.quadrantButtons;
        this.buttonsGroup;
        this.header;
        this.alternativeDiv;
        this.chance;
        this.tip = d3Tip.default().attr('class', 'd3-tip').html((text) => {
            return text;
        });
        this.ringCalculator = new RingCalculator(this.normalizedConfig.rings.length, this.center());
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
            .attr('x1', this.center()).attr('x2', this.center())
            .attr('y1', startY - 2).attr('y2', endY + 2)
            .attr('stroke-width', 10);

        quadrantGroup.append('line')
            .attr('x1', endX).attr('y1', this.center())
            .attr('x2', startX).attr('y2', this.center())
            .attr('stroke-width', 10);
    }

    plotQuadrant(rings, quadrant) {
        let quadrantGroup = this.svg.append('g')
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
        return (group || this.svg).append('path')
            .attr('d', 'M420.084,282.092c-1.073,0-2.16,0.103-3.243,0.313c-6.912,1.345-13.188,8.587-11.423,16.874c1.732,8.141,8.632,13.711,17.806,13.711c0.025,0,0.052,0,0.074-0.003c0.551-0.025,1.395-0.011,2.225-0.109c4.404-0.534,8.148-2.218,10.069-6.487c1.747-3.886,2.114-7.993,0.913-12.118C434.379,286.944,427.494,282.092,420.084,282.092')
            .attr('transform', 'scale(' + (blip.width / 34) + ') translate(' + (-404 + x * (34 / blip.width) - 17) + ', ' + (-282 + y * (34 / blip.width) - 17) + ')')
            .attr('class', order);
    }

    circleLegend(x, y, group) {
        return (group || this.svg).append('path')
            .attr('d', 'M420.084,282.092c-1.073,0-2.16,0.103-3.243,0.313c-6.912,1.345-13.188,8.587-11.423,16.874c1.732,8.141,8.632,13.711,17.806,13.711c0.025,0,0.052,0,0.074-0.003c0.551-0.025,1.395-0.011,2.225-0.109c4.404-0.534,8.148-2.218,10.069-6.487c1.747-3.886,2.114-7.993,0.913-12.118C434.379,286.944,427.494,282.092,420.084,282.092')
            .attr('transform', 'scale(' + (22 / 64) + ') translate(' + (-404 + x * (64 / 22) - 17) + ', ' + (-282 + y * (64 / 22) - 17) + ')');
    }

    addRing(ring, order) {
        let table = select('.quadrant-table.' + order);
        table.append('h3').text(ring);
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

            this.chance = new Chance(Math.PI * sumRing * ring.name.length * sumQuadrant * quadrant.name.length);

            let ringList = this.addRing(ring.name, order);
            let allBlipCoordinatesInRing = [];

            ringBlips.forEach((blip) => {
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
        elem.append('svg').attr('height', 20).attr('width', 20).append('circle').attr('cx', 8).attr('cy', 8).attr('r', 6);
        elem.append('text').html(this.normalizedConfig.legend !== undefined ? this.normalizedConfig.legend.circleKey : 'CircleKey');

        elem.append('br');
        // draw triangle Legend
        elem.append('svg').attr('height', 20).attr('width', 20).append('polygon').attr('points', "00,15 8,00 16,15");
        elem.append('text').html(this.normalizedConfig.legend !== undefined ? this.normalizedConfig.legend.triangleKey : 'TriangleKey');
    }

    findBlipCoordinates(blip, minRadius, maxRadius, startAngle, allBlipCoordinatesInRing) {
        const maxIterations = 200;
        let coordinates = this.calculateBlipCoordinates(blip, this.chance, minRadius, maxRadius, startAngle);
        let iterationCounter = 0;
        let foundAPlace = false;

        while (iterationCounter < maxIterations) {
            if (this.thereIsCollision(blip, coordinates, allBlipCoordinatesInRing)) {
                coordinates = this.calculateBlipCoordinates(blip, this.chance, minRadius, maxRadius, startAngle);
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
        blipListItem.append('div')
            .attr('class', 'blip-list-item')
            .attr('id', 'blip-list-item-' + blip.number)
            .text(blipText);

        let blipItemDescription = blipListItem.append('div')
            .attr('id', 'blip-description-' + blip.number)
            .attr('class', 'blip-item-description');
        if (blip.description) {
            blipItemDescription.append('p').html(blip.description);
        }

        let mouseOver = () => {
            selectAll('g.blip-link').attr('opacity', 0.3);
            group.attr('opacity', 1.0);
            blipListItem.selectAll('.blip-list-item').classed('highlight', true);
            this.tip.show(blip.name, group.node());
        };

        let mouseOut = () => {
            selectAll('g.blip-link').attr('opacity', 1.0);
            blipListItem.selectAll('.blip-list-item').classed('highlight', false);
            this.tip.hide().style('left', 0).style('top', 0);
        };

        blipListItem.on('mouseover', mouseOver).on('mouseout', mouseOut);
        group.on('mouseover', mouseOver).on('mouseout', mouseOut);

        let clickBlip = () => {
            select('.blip-item-description.expanded').node() !== blipItemDescription.node() &&
            select('.blip-item-description.expanded').classed('expanded', false);
            blipItemDescription.classed('expanded', !blipItemDescription.classed('expanded'));

            blipItemDescription.on('click', () => {
                event.stopPropagation();
            });
        };

        blipListItem.on('click', clickBlip);
    }

    removeHomeLink() {
        select('.home-link').remove();
    }

    createHomeLink(pageElement) {
        if (pageElement.select('.home-link').empty()) {
            pageElement.insert('div', 'div#alternative-buttons')
                .html('&#171; Zurück zur Radar-Übersicht')
                .classed('home-link', true)
                .classed('selected', true)
                .on('click', () => {
                    this.redrawFullRadar();
                })
                .append('g')
                .attr('fill', '#626F87')
                .append('path')
                .attr('d', 'M27.6904224,13.939279 C27.6904224,13.7179572 27.6039633,13.5456925 27.4314224,13.4230122 L18.9285959,6.85547454 C18.6819796,6.65886965 18.410898,6.65886965 18.115049,6.85547454 L9.90776939,13.4230122 C9.75999592,13.5456925 9.68592041,13.7179572 9.68592041,13.939279 L9.68592041,25.7825947 C9.68592041,25.979501 9.74761224,26.1391059 9.87092041,26.2620876 C9.99415306,26.3851446 10.1419265,26.4467108 10.3145429,26.4467108 L15.1946918,26.4467108 C15.391698,26.4467108 15.5518551,26.3851446 15.6751633,26.2620876 C15.7984714,26.1391059 15.8600878,25.979501 15.8600878,25.7825947 L15.8600878,18.5142424 L21.4794061,18.5142424 L21.4794061,25.7822933 C21.4794061,25.9792749 21.5410224,26.1391059 21.6643306,26.2620876 C21.7876388,26.3851446 21.9477959,26.4467108 22.1448776,26.4467108 L27.024951,26.4467108 C27.2220327,26.4467108 27.3821898,26.3851446 27.505498,26.2620876 C27.6288061,26.1391059 27.6904224,25.9792749 27.6904224,25.7822933 L27.6904224,13.939279 Z M18.4849735,0.0301425662 C21.0234,0.0301425662 23.4202449,0.515814664 25.6755082,1.48753564 C27.9308469,2.45887984 29.8899592,3.77497963 31.5538265,5.43523218 C33.2173918,7.09540937 34.5358755,9.05083299 35.5095796,11.3015031 C36.4829061,13.5518717 36.9699469,15.9439104 36.9699469,18.4774684 C36.9699469,20.1744196 36.748098,21.8101813 36.3044755,23.3844521 C35.860551,24.9584216 35.238498,26.4281731 34.4373347,27.7934053 C33.6362469,29.158336 32.6753041,30.4005112 31.5538265,31.5197047 C30.432349,32.6388982 29.1876388,33.5981853 27.8199224,34.3973401 C26.4519041,35.1968717 24.9791531,35.8176578 23.4016694,36.2606782 C21.8244878,36.7033971 20.1853878,36.9247943 18.4849735,36.9247943 C16.7841816,36.9247943 15.1453837,36.7033971 13.5679755,36.2606782 C11.9904918,35.8176578 10.5180429,35.1968717 9.15002449,34.3973401 C7.78223265,33.5978839 6.53752245,32.6388982 5.41612041,31.5197047 C4.29464286,30.4005112 3.33339796,29.158336 2.53253673,27.7934053 C1.73144898,26.4281731 1.10909388,24.9584216 0.665395918,23.3844521 C0.22184898,21.8101813 0,20.1744196 0,18.4774684 C0,16.7801405 0.22184898,15.1446802 0.665395918,13.5704847 C1.10909388,11.9962138 1.73144898,10.5267637 2.53253673,9.16153157 C3.33339796,7.79652546 4.29464286,6.55435031 5.41612041,5.43523218 C6.53752245,4.3160387 7.78223265,3.35675153 9.15002449,2.55752138 C10.5180429,1.75806517 11.9904918,1.13690224 13.5679755,0.694183299 C15.1453837,0.251464358 16.7841816,0.0301425662 18.4849735,0.0301425662 L18.4849735,0.0301425662 Z');
        }
    }

    createCustomHomeLink(pageElement) {
        if (pageElement.select('.home-link').empty()) {
            pageElement = pageElement.insert('div', 'div#alternative-buttons')
                .attr('class', 'container row');

            pageElement.append('a')
                .attr('href', '/')
                .attr('class', 'col-sm')
                .html('&#171; Zurück zur Plattform-Übersicht')
                .classed('home-link', true)
                .classed('selected', true);

            pageElement.append('div')
                .attr('class', 'col-sm');
        }
    }

    removeRadarLegend() {
        select('.legend').remove();
    }

    redrawFullRadar() {
        this.removeHomeLink();
        this.createCustomHomeLink(select('header'));
        this.removeRadarLegend();
        this.tip.hide();
        selectAll('g.blip-link').attr('opacity', 1.0);

        this.svg.style('left', 0).style('right', 0);

        selectAll('.button')
            .classed('selected', false)
            .classed('full-view', true);

        selectAll('.quadrant-table').classed('selected', false);
        selectAll('.home-link').classed('selected', false);

        selectAll('.quadrant-group')
            .transition()
            .duration(ANIMATION_DURATION)
            .attr('transform', 'scale(1)');

        selectAll('.quadrant-group .blip-link')
            .transition()
            .duration(ANIMATION_DURATION)
            .attr('transform', 'scale(1)');

        selectAll('.quadrant-group')
            .style('pointer-events', 'auto');
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
        if (isQuadrantSelected) {
            this.tip.show(blip.name, group.node());
        } else {
            // need to account for the animation time associated with selecting a quadrant
            this.tip.hide();

            setTimeout(() => {
                this.tip.show(blip.name, group.node());
            }, ANIMATION_DURATION);
        }
    }

    plotRadarHeader() {
        this.header = select('body').insert('header', '#radar').attr('role', 'main').attr('class', 'container');

        if (getConfig().hint) {
            this.header = this.header.insert('div').attr('class', 'header');
            this.header.append('p')
                .attr('class', 'hint')
                .html(getConfig().hint);
        }

        this.header = select('header');
        this.header.append('br');
        this.header.append('br');

        this.header.append('div')
            .attr('class', 'row')
            .append('div')
            .attr('class', 'col')
            .append('div')
            .attr('class', 'headerpic')
            .html('<a href="/"><img class="img-fluid" src="images/headercomp.png" alt="Logo"/></a>');

        this.buttonsGroup = this.header.append('div')
            .attr('class', 'row')
            .classed('buttons-group', true);

        this.quadrantButtons = this.buttonsGroup.append('div')
            .classed('quadrant-btn--groupn', true);

        this.alternativeDiv = this.header.append('div')
            .attr('id', 'alternative-buttons');

        return this.header;
    }

    plotQuadrantButtons(quadrants) {
        [0, 1, 2, 3].forEach((i) => {
            this.radarElement
                .append('div')
                .attr('class', 'quadrant-table ' + quadrants[i].order);

            this.quadrantButtons.append('button').attr('type', 'button')
                .attr('class', 'button ' + quadrants[i].order + ' full-view')
                .text(quadrants[i].quadrant.name)
                .on('mouseover', () => {
                    this.mouseoverQuadrant(quadrants[i].order);
                })
                .on('mouseout', () => {
                    this.mouseoutQuadrant(quadrants[i].order);
                })
                .on('click', () => {
                    this.selectQuadrant(quadrants[i].order, quadrants[i].startAngle);
                });
        });

        this.buttonsGroup.append('div').attr('class', 'col-sm')
            .html('Plattform: <strong>' + document.title + '</strong>');

        this.buttonsGroup.append('div')
            .classed('search-box col', true)
            .append('input')
            .attr('id', 'auto-complete')
            .attr('placeholder', 'Suche')
            .classed('search-radar', true);

        $('#auto-complete').autocomplete({
            source: quadrants.map((q) => {
                return q.quadrant.blips.map((b) => {
                    const name = b.name;
                    return {label: name, value: name, blip: b, quadrant: q};
                });
            }).flat(),
            select: (event, ui) => {
                this.searchBlip(event, ui);
            }
        });

        this.buttonsGroup.append('button')
            .classed('btn print-radar-btn col-1', true)
            .on('click', () => {
                window.print();
            });
    }

    plotRadarFooter() {
        select('body')
            .insert('div')
            .attr('class', 'footer')
            .html(this.normalizedConfig.footerText);
    }

    mouseoverQuadrant(order) {
        select('.quadrant-group-' + order).style('opacity', 1);
        selectAll('.quadrant-group:not(.quadrant-group-' + order + ')').style('opacity', 0.3);
    }

    mouseoutQuadrant(order) {
        selectAll('.quadrant-group:not(.quadrant-group-' + order + ')').style('opacity', 1);
    }

    selectQuadrant(order, startAngle) {
        selectAll('.home-link').classed('selected', false);
        this.removeHomeLink();
        this.createHomeLink(select('header'));

        selectAll('.button').classed('selected', false).classed('full-view', false);
        selectAll('.button.' + order).classed('selected', true);
        selectAll('.quadrant-table').classed('selected', false);
        selectAll('.quadrant-table.' + order).classed('selected', true);
        selectAll('.blip-item-description').classed('expanded', false);

        let scale = 1.2;

        let adjustX = Math.sin(this.toRadian(startAngle)) - Math.cos(this.toRadian(startAngle));
        let adjustY = Math.cos(this.toRadian(startAngle)) + Math.sin(this.toRadian(startAngle));

        let translateX = (-1 * (1 + adjustX) * this._size / 2 * (scale - 1)) + (-adjustX * (1 - scale / 2) * this._size);
        let translateY = (-0.9 * (1 - adjustY) * (this._size / 2 - 7) * (scale - 1)) - ((1 - adjustY) / 2 * (1 - scale / 2) * this._size);

        let translateXAll = (1 - adjustX) / 2 * this._size * scale / 2 + ((1 - adjustX) / 2 * (1 - scale / 2) * this._size);
        let translateYAll = (1 + adjustY) / 2 * this._size * scale / 2;

        let blipScale = 3 / 4;
        let blipTranslate = (1 - blipScale) / blipScale;

        select('.quadrant-group-' + order)
            .transition()
            .duration(ANIMATION_DURATION)
            .attr('transform', 'translate(' + translateX + ',' + translateY + ')scale(' + scale + ')');

        selectAll('.quadrant-group-' + order + ' .blip-link text').each((d, i, nodes) => {
            let x = select(nodes[i]).attr('x');
            let y = select(nodes[i]).attr('y');
            select(nodes[i].parentNode)
                .transition()
                .duration(ANIMATION_DURATION)
                .attr('transform', 'scale(' + blipScale + ')translate(' + blipTranslate * x + ',' + blipTranslate * y + ')');
        });

        selectAll('.quadrant-group')
            .style('pointer-events', 'auto');

        selectAll('.quadrant-group:not(.quadrant-group-' + order + ')')
            .transition()
            .duration(ANIMATION_DURATION)
            .style('pointer-events', 'none')
            .attr('transform', 'translate(' + translateXAll + ',' + translateYAll + ')scale(0)');
    }

    init() {
        this.radarElement = select('body').append('div').attr('id', 'radar').attr('class', 'container');
    };

    constructSheetUrl(sheetName) {
        let noParamUrl = window.location.href.substring(0, window.location.href.indexOf(window.location.search));
        let queryParams = extractQueryParams(window.location.search.substring(1));
        return noParamUrl + '?sheetId=' + queryParams.sheetId + '&sheetName=' + encodeURIComponent(sheetName);
    }

    plotAlternativeRadars(alternatives, currentSheet) {
        let alternativeSheetButton = this.alternativeDiv
            .append('div')
            .classed('multiple-sheet-button-group', true);

        alternatives.forEach((alternative) => {
            alternativeSheetButton
                .append('div:a')
                .attr('class', 'first full-view alternative multiple-sheet-button')
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
        let rings = this._radar.rings;
        let quadrants = this._radar.quadrants;
        let alternatives = this._radar.alternatives;
        let currentSheet = this._radar.currentSheetName;

        this.plotRadarHeader();
        this.plotAlternativeRadars(alternatives, currentSheet);

        this.plotQuadrantButtons(quadrants);

        this.radarElement.style('height', this._size + 14 + 'px');
        this.svg = this.radarElement.append('svg').call(this.tip);
        this.svg.attr('id', 'radar-plot').attr('width', this._size).attr('height', this._size + 14);

        quadrants.forEach((quadrant) => {
            let quadrantGroup = this.plotQuadrant(rings, quadrant);
            this.plotLines(quadrantGroup, quadrant);
            this.plotTexts(quadrantGroup, rings, quadrant);
            this.plotBlips(quadrantGroup, rings, quadrant);
        });

        this.plotRadarFooter();
    };
}