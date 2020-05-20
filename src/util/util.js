import { select } from 'd3-selection';

export function capitalize(string) {
    return string.split(' ').map(part => {
        return part[0].toUpperCase() + part.substring(1).toLowerCase();
    }).join(' ');
}

export function extractDomainName(url) {
    const search = /.+:\/\/([^\\/]+)/;
    const match = search.exec(decodeURIComponent(url.replace(/\+/g, ' ')));
    return match == null ? null : match[1];
}

export function extractFileName(url) {
    const search = /([^\\/]+)$/;
    const match = search.exec(decodeURIComponent(url.replace(/\+/g, ' ')));
    if (match != null) {
        return match[1];
    }
    return url;
}

export function extractQueryParams(queryString) {
    const decode = function (s) {
        return decodeURIComponent(s.replace(/\+/g, ' '));
    };

    const search = /([^&=]+)=?([^&]*)/g;
    const queryParams = {};
    let match;

    while ((match = search.exec(queryString))) {
        queryParams[decode(match[1])] = decode(match[2]);
    }

    return queryParams;
}

export function searchBlipByParam(graphingRadar, searchParam) {
    const blips = graphingRadar.radar.blips;

    blips.forEach((b) => {
        b.id = decodeURIComponent(b.id.replace(/\+/g, ' '));
    });

    let blip = blips.filter(bl => bl.id === searchParam)[0];

    setTimeout(() => {
        const clickEvent = new Event('click');
        select('#blip-link-' + blip.number).node().dispatchEvent(clickEvent);
    }, 500);
}
