export function capitalize(string) {
    return string.split(' ').map(part => {
        return part[0].toUpperCase() + part.substring(1).toLowerCase();
    }).join(' ');
}