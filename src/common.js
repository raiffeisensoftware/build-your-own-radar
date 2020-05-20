import './stylesheets/base.scss';
import './images/tech-radar-landing-page-wide.png';
import './images/favicon.ico';
import './images/search-logo-2x.svg';
import 'es6-promise/auto';
import { getConfig } from './util/normalizedConfig';
import { checkForOldIE } from './util/ieCheck';

checkForOldIE();

if (getConfig().header) {
    require('./images/' + getConfig().header);
}

if (getConfig().mobileHeader) {
    require('./images/' + getConfig().mobileHeader);
}
