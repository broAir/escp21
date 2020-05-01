var createImgFaviconFromUrl = function (iconUrl) {
  if (iconUrl && iconUrl.length > 0) {
    var img = document.createElement('img');
    img.src = iconUrl;
    img.id = "site-favicon-img";
    img.width = 32;
    img.height = 32;
    document.body.appendChild(img);
  }
}
var createImgFavicon = function () {
  var $icon = $("link[rel~='icon']");
  if ($icon.length > 0) {
    var iconUrl = $icon[0].href;
    if (iconUrl) {
      createImgFaviconFromUrl(iconUrl);
    }
  }
};

var rgbToHex = function (rgb) {
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
    hex = "0" + hex;
  }
  return hex;
};

var fullColorHex = function (r, g, b) {
  var red = rgbToHex(r);
  var green = rgbToHex(g);
  var blue = rgbToHex(b);
  return red + green + blue;
};

var getHexGradientArr = function (rgbColors) {
  return rgbColors.map(x => fullColorHex(x.r, x.g, x.b));
}

var getColorsFromTheCanvas = function (canvas) {
  // Options
  var percThreshold = 0.01;
  var colorRangeThreshold = 30;
  var resultCount = 4;

  var canvas2d = canvas.getContext('2d');

  var colorsTotal = 0;
  var clrsArr = [];

  for (var x = 0; x < canvas.width; x++) {
    for (var y = 0; y < canvas.height; y++) {
      var pxlData = canvas2d.getImageData(x, y, 1, 1).data;
      var r = pxlData[0];
      var g = pxlData[1];
      var b = pxlData[2];
      var a = pxlData[3];
      if (a != 0) {
        colorsTotal++;

        // comparing color similarities
        // maybe replace with smart algorithm in future
        // https://stackoverflow.com/questions/9018016/how-to-compare-two-colors-for-similarity-difference
        var sameClr = clrsArr.find((clr) => {
          return (Math.abs(clr.r - r) <= colorRangeThreshold) &&
            (Math.abs(clr.g - g) <= colorRangeThreshold) &&
            (Math.abs(clr.b - b) <= colorRangeThreshold)
        });

        if (sameClr) {
          sameClr.colorCount += 1;
        }
        else {
          var color = {
            colorCount: 1,
            perc: 0,
            percentage: function () {
              if (this.perc == 0) this.perc = this.colorCount / colorsTotal;
              return this.perc;
            },
            r: r,
            g: g,
            b: b,
            a: a,
            iswhite: (r == 255 && b == 255 && g == 255)
          }
          clrsArr.push(color);
        }

      }
    }
  }
  var filteredColorsArray = [];
  // Object.keys(colors).filter((key) => colors[key].hasOwnProperty("percentage") && colors[key].percentage() > 0.001)
  //   .reduce((o, key) => { filteredColorsArray.push(colors[key]); return colors[key] }, []);

  return clrsArr.sort(function (a, b) {
    // percentages
    if (a.percentage() < b.percentage()) return 1;
    if (a.percentage() > b.percentage()) return -1;
    return 0;
  }).slice(0, resultCount);
  // .sort(function (a, b) {
  //   if (a.iswhite || b.iswhite) return -1;
  //   if (a.r < b.r) return -1;
  //   if (a.r > b.r) return 1;
  //   return 0;
  // });
}
var getColorsFromTheImage = function (img) {
  var canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
  getColorsFromTheCanvas(canvas);
}

document.addEventListener('DOMContentLoaded', function () {
  var getColorsButton = document.getElementById('getColors');

  // https://developer.chrome.com/extensions/messaging
  getColorsButton.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "getFavIcon" },
        (response) => {
          console.log(response.favIconUrl);
          createImgFaviconFromUrl(response.favIconUrl);
          // var scr = chrome.tabs.captureVisibleTab(chrome.extension.getBackgroundPage(), function(result){

          // })
          html2canvas(document.getElementById('site-favicon-img'), { allowTaint: true }).then((canvas) => {
            //  html2canvas("#escp21-faviconimg").then(function (canvas) {
            // Export the canvas to its data URI representation
            var base64image = canvas.toDataURL("image/png");

            // Open the image in a new window
            var colors = getColorsFromTheCanvas(canvas);
            var colorsResultDiv = document.getElementById('colors-result');
            colors.forEach(clr => {

              var colorDiv = document.createElement('div');
              colorDiv.classList.add("data-color-color");
              colorDiv.style.backgroundColor = "rgba(" + clr.r + "," + clr.g + "," + clr.b + "," + clr.a + ")";
              colorsResultDiv.appendChild(colorDiv);

              var infoDiv = document.createElement('div');
              infoDiv.classList.add("data-color-info");
              infoDiv.innerText = (clr.percentage() * 100).toFixed(3) + "%";
              colorsResultDiv.appendChild(infoDiv);
            });

            // Total Perc
            // document.getElementById("colors-total-perc").innerHTML =
            //   (colors.reduce(function (a, b) { return a + b.percentage() }, 0) * 100).toFixed(3) + " %";


            var hexes = getHexGradientArr(colors, 4);

            hexes.sort().forEach(hx => {
              var colorDiv = document.createElement('div');
              colorDiv.classList.add("data-color-hex");
              colorDiv.style.backgroundColor = "#" + hx;
              colorsResultDiv.appendChild(colorDiv);

            });

            var backgroundGradient = document.getElementById("colors-gradient");
            backgroundGradient.style.backgroundImage = "-webkit-linear-gradient(left,#" + hexes.join(",#") + ")";
          });
        });
    });
  });
}, false);

