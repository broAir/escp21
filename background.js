var lastActiveTabData = {
    tabId: 0,
    windowId: 0,
    hostName: ""
}

var getStorageKeyForTab = (tabId, windowId, key) => {
    return key + "_" + windowId + "_" + tabId;
};

var findCategoryByWebsiteInfo = (data) => {
    // Coming soon
    // <meta property="og:type" content="article">
    // <meta property="og:type" content="product"></meta>
    return "Other";
}

var collectFavIconUrlFromTheTab = (tab) => {
    return tab.favIconUrl || false
        ? new Promise((resolve, reject) => resolve(tab.favIconUrl))
        : new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tab.id, { type: "collectPageTags" }, null, (response) => {
                resolve((response && response.favIconUrl) || "");
            });
        })
}

var sendToStorage = (key, obj) => {
    chrome.storage.local.set({ [key]: obj }, () => {
        console.log('Key: ' + key + ' value is set to ' + obj);
        console.log(obj);
    });
}

var addNewTimeCollectionEntry = (data) => {
    var hostNameKey = data.hostName;

    var currentSessionData = {
        day: data.startDate.toDateString(),
        time: data.startDate.toTimeString(),
        timeShort: data.startDate.toTimeString().substr(0, 5),
        elapsedMs: data.elapsedMs,
        hostName: data.hostName,
        date: data.startDate.toJSON(),
        category: findCategoryByWebsiteInfo(data)
    }

    // save by the day key
    var todayString = new Date().toDateString();
    chrome.storage.local.get([todayString], (storageResultObj) => {
        // check if there is a storage entry for today and filling metadata
        var timeSessionsForToday = storageResultObj && storageResultObj[todayString] || {
            date: todayString,
            dayOfWeek: new Date().getDay(),
            siteSessionData: {},
        };
        // check if there is a hostname key entry in the todays storage
        var timeSessionByHostEntry = timeSessionsForToday.siteSessionData[hostNameKey] || {};
        // check if there is any data in the host name entry
        var sessionsByHostname = (timeSessionByHostEntry.sessions) || [];
        sessionsByHostname.push(currentSessionData);

        timeSessionByHostEntry.hostName = currentSessionData.hostName || timeSessionByHostEntry.hostName;
        timeSessionByHostEntry.favIconUrl = data.favIconUrl || timeSessionByHostEntry.favIconUrl;
        timeSessionByHostEntry.grad = timeSessionByHostEntry.grad;
        timeSessionByHostEntry.sessions = sessionsByHostname;

        timeSessionsForToday.siteSessionData[hostNameKey] = timeSessionByHostEntry;
        // If has gradient assigned
        if (timeSessionByHostEntry.grad ?? false) {
            sendToStorage([todayString], timeSessionsForToday);
        } else {
            getColorsFromFavUrl(data.favIconUrl)
                .then((grad) => {
                    timeSessionsForToday.siteSessionData[hostNameKey].grad = grad;
                    sendToStorage([todayString], timeSessionsForToday);
                })
                // if impossible to get favicon - save anyway
                .error(() => sendToStorage([todayString], timeSessionsForToday));
        }
    });
}

var saveSessionData = (tabId, windowId, hostname, favIconUrl) => {
    var start_key = getStorageKeyForTab(tabId, windowId, "start");
    var startDate = chrome.storage.sync[start_key] ?? new Date();
    var elapsedMs = new Date() - startDate;

    addNewTimeCollectionEntry({
        startDate: startDate,
        elapsedMs: elapsedMs,
        hostName: hostname,
        favIconUrl: favIconUrl
    });
    // empty local storage for this tab
    chrome.storage.sync.remove([start_key]);
}

var collectTabData = (tab) => {
    var pendingUrl = tab.pendingUrl;
    var lastUrl = tab.url;
    var pendingUrlHostName = tab.pendingUrl && new URL(pendingUrl).host || null;
    var lastUrlHostName = new URL(lastUrl).host;

    // if navigated to a different host name
    if (lastUrlHostName != pendingUrlHostName
        // or there is no pending host name provided (tab switch)
        || !pendingUrlHostName) {
        collectFavIconUrlFromTheTab(tab)
            .then((favIconUrl) => {
                saveSessionData(tab.tabId, tab.windowId, lastUrlHostName, favIconUrl);
            })
    }
}

// when something inside a tab (active or not) happens
// i.e. telegram notification
// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
// })

chrome.webNavigation.onCommitted.addListener((details) => {
    chrome.tabs.get(details.tabId, (tab) => {
        if (tab.frameId != 0) return;
        var start_key = getStorageKeyForTab(tab.tabId, tab.windowId, "start");
        chrome.storage.sync[start_key] = new Date();
    });
});

// This event is fired when we havigate to a different page within one tab 
// OR go back 
// OR hit ENTER in the address bar
// So we need to save the session data ONLY if the target navigation URL is different 
chrome.webNavigation.onBeforeNavigate.addListener((evt) => {
    // Means frame is not parent
    // https://stackoverflow.com/questions/37779142/chrome-webnavigation-oncompleted-event-firing-multiple-times
    if (evt.frameId != 0) return;

    chrome.tabs.query({ active: true }, (tabs) => {
        var activeTab = tabs[0];
        if (!activeTab)
            return console.error("active tab was null");
        // collect active tab data before navigated to different browser url
        collectTabData(activeTab);
    });

});

// Start the clock when tab has become active
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Collect data from the previous tab
    chrome.tabs.get(lastActiveTabData.tabId, (lastActiveTab) => {
        if (!lastActiveTab) return;
        // collect data
        collectTabData(lastActiveTab);
    });

    chrome.tabs.get(activeInfo.tabId, (tab) => {
        // preserve this tab data for future
        lastActiveTabData.tabId = tab.id;
        lastActiveTabData.windowId = tab.windowId;
        lastActiveTabData.hostName = new URL(tab.url).host;

        var start_key = getStorageKeyForTab(tab.tabId, tab.windowId, "start");
        chrome.storage.sync[start_key] = new Date();
    });
});

// chrome.tabs.onSelectionChanged.addListener((tabId, selectInfo) => {
//     console.log(tabId);
//     console.log(selectInfo);
// });

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabId == lastActiveTabData.tabId) {
        saveSessionData(lastActiveTabData.tabId, lastActiveTabData.windowId, lastActiveTabData.hostName, null);
    }
});