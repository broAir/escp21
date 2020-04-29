
// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab){
//     console.log(tab.active);
//     console.log(tab.url);
//     console.log(tab.title);
// })
var openedTime = new Date();
var processNewHistoryEntry = (event) => {
    console.log("location: " + document.location + ", state: " + JSON.stringify(event.state));
    console.log("created: " + created);
};
window.addEventListener('popstate', processNewHistoryEntry);


window.addEventListener("beforeunload", function (event) {
    var unloadTime = new Date();
    var elapsedSeconds = (unloadTime.getTime() - openedTime.getTime()) / 1000;
    console.log("elapsed: " + elapsedSeconds);
});


// https://stackoverflow.com/questions/10282939/how-to-get-favicons-url-from-a-generic-webpage-in-javascript
var getFavIcon = function (domain) {
    return "https://s2.googleusercontent.com/s2/favicons?domain=" + domain;
    var $icon = $("link[rel~='icon']")
    if ($icon.length > 0) {
        var iconUrl = $icon[0].href;

        var img = new Image();
        img.onload = function () {
            getColorsFromTheImage(img);
        }
        img.src = urlimg;

    }
}
var getColorsFromTheImage = function (img) {
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
    var canvas2d = canvas.getContext('2d');
    var colorCount = 0;
    var colorsTotal = 0;
    var colors = {};
    for (var x = 0; x < img.width; x++) {
        for (var y = 0; y < img.height; y++) {
            var pxlData = canvas2d.getImageData(x, y, 1, 1).data;
            var r = pxlData[0];
            var g = pxlData[1];
            var b = pxlData[2];
            var a = pxlData[3];
            if (a != 0) {
                colorsTotal++;
                var colorName = ("" + r + g + b + a);
                var colorCount = (colors.colorName && colors.colorName.count)
                    || 0;
                var color = {
                    colorName: colorName,
                    colorCount: colorCount++,
                    percentage: colorsTotal / colorCount,
                    color: {
                        r: r,
                        g: g,
                        b: b,
                        a: a
                    }
                }
                colors.colorName = color;
            }
        }
    }
    return colors;
}


var getColorsForTheFav = function () {

    var img = document.getElementById('my-image');

    $('#output').html('R: ' + pixelData[0] + '<br>G: ' + pixelData[1] + '<br>B: ' + pixelData[2] + '<br>A: ' + pixelData[3]);

}

//  Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    switch (request.type) {
        case 'getFavIcon': {
            sendResponse({ favUrl: document.querySelectorAll('[rel~="icon"]')[0].href });
            break;
        }
        case 'collectPageTags': {
            sendResponse({ hostName: window.location.host });
            break;
        }
    }
});

// // Sending a request from a content script looks like this:
// chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
//   console.log(response.farewell);
// });