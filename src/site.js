require('./common');

const normalizedConfig = require('./util/normalizedConfig');

if (normalizedConfig.logo && !normalizedConfig.logo.match(/http(s)?:/i)) {
    require('./images/' + normalizedConfig.logo);
}

const GoogleSheetInput = require('./util/factory');

GoogleSheetInput().build();
