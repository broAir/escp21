var sortStringByDateFn = (a, b) => {

}

var extractDatesFromStorageObjAndSort = (storageObj, take, desc) =>
    Object.keys(storageObj)
        // only time-entry keys, no system keys (starts with _)
        .filter(x => x.indexOf("_") < 0)
        // map string keys to date time
        .map(x => new Date(x))
        // order by asc
        .sort((a, b) => desc ? (b - a) : (a - b))
        // Take 
        .slice(0, take || 7);

var convertMinToMinHrLabel = (val, short) => {
    var hrs = Math.floor(val / 60);
    var min = (val % 60).toFixed(0);
    return short
        ? ((hrs > 0 ? (hrs + "h ") : "") + min + "m")
        : ((hrs > 0 ? (hrs + " hr ") : "") + min + " min")
}

// https://stackoverflow.com/questions/35969656/how-can-i-generate-the-opposite-color-according-to-current-color
padZero = (str, len) => {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}
invertColor = (hex, bw) => {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    if (bw) {
        // http://stackoverflow.com/a/3943023/112731
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186
            ? '#000000'
            : '#FFFFFF';
    }
    // invert color components
    r = (255 - r).toString(16);
    g = (255 - g).toString(16);
    b = (255 - b).toString(16);
    // pad each with zeros and return
    return "#" + padZero(r) + padZero(g) + padZero(b);
}
