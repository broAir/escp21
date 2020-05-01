//  Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    switch (request.type) {
        case 'getFavIcon': {
            sendResponse({ favIconUrl: document.querySelectorAll('[rel~="icon"]')[0].href });
            break;
        }
        case 'collectPageTags': {
            sendResponse({ hostName: window.location.host, favIconUrl: document.querySelectorAll('[rel~="icon"]')[0].href });
            break;
        }
    }
});