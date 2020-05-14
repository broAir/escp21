console.log(window.location);
if (window.location.host == "ogs.google.com") {
    var chromeLogoContainer = document.getElementById('logo');
    if (chromeLogoContainer) {
        chromeLogoContainer.innerHTML += "<div style='display: block; right: calc(50% - 272px/2);position: absolute; bottom: var(--logo-margin-bottom);' >Test</div>"
    }
}