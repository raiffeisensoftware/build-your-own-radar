// Check if Browser < IE11
export function checkForOldIE() {
    if (navigator.appVersion.indexOf('MSIE') !== -1) {
        const text = document.createTextNode('Für die korrekte Darstellung benötigen Sie mindestens Internet Explorer 11, Google Chrome oder Mozilla Firefox. Bitte nutzen Sie einen aktuelleren Browser.');
        document.body.appendChild(text);
    }
}
