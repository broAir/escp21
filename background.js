var lastActiveTabData = {
    tabId: 0,
    windowId: 0,
    hostName: ""
}

this.settings = {
    // threshold in seconds to record the elapsed time for the session (def: 8 sec)
    elapsedThreshold: 8 * 1000,
    // threshold in ms which will tell to append value to the old session (def: 5 min)
    appendToOldSessionThreshold: 5 * 60 * 1000
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

var addNewTimeCollectionEntry = (data, appendToOldSession) => {
    appendToOldSession = appendToOldSession || false;

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
        var hostName = data.hostName;
        // check if there is a storage entry for today and filling metadata
        var timeSessionsForToday = storageResultObj && storageResultObj[todayString] || {
            date: todayString,
            dayOfWeek: new Date().getDay(),
            siteSessionData: {},
        };
        // check if there is a hostname key entry in the todays storage
        var timeSessionByHostEntry = timeSessionsForToday.siteSessionData[hostName] || {};
        // check if there is any data in the host name entry
        var sessionsByHostname = (timeSessionByHostEntry.sessions) || [];

        // shall we append data to the old session?
        if (!appendToOldSession || sessionsByHostname.length < 1) {
            sessionsByHostname.push(currentSessionData);
        } else {
            // get last session
            var prevSession = sessionsByHostname[sessionsByHostname.length - 1];
            var prevSessionDate = Date.parse(prevSession.date);
            // compare previous session date and current session date
            // prevSess.Start+Elapsed = endOfPrevSession
            if (Math.abs(prevSessionDate + prevSession.elapsedMs - data.startDate) <= settings.appendToOldSessionThreshold) {
                // if difference is less then threshold - add elapsedMs to the prevSession
                prevSession.elapsedMs += data.elapsedMs;
            } else {
                // if difference is too big - push new session
                sessionsByHostname.push(currentSessionData);
            }
        }
        timeSessionByHostEntry.hostName = currentSessionData.hostName || timeSessionByHostEntry.hostName;
        timeSessionByHostEntry.favIconUrl = data.favIconUrl || timeSessionByHostEntry.favIconUrl;
        timeSessionByHostEntry.grad = timeSessionByHostEntry.grad;
        timeSessionByHostEntry.sessions = sessionsByHostname;
        timeSessionByHostEntry.totalElapsedMs = (timeSessionByHostEntry.totalElapsedMs || 0) + data.elapsedMs;
        console.log(sessionsByHostname[sessionsByHostname.length - 1]);
        timeSessionsForToday.siteSessionData[hostName] = timeSessionByHostEntry;
        // If has gradient assigned
        if (timeSessionByHostEntry.grad ?? false) {
            sendToStorage([todayString], timeSessionsForToday);
        } else {
            getColorsFromFavUrl(data.favIconUrl)
                .then((grad) => {
                    timeSessionsForToday.siteSessionData[hostName].grad = grad;
                    sendToStorage([todayString], timeSessionsForToday);
                })
                // if impossible to get favicon - save anyway
                .catch(() => sendToStorage([todayString], timeSessionsForToday));
        }
    });
}

var saveSessionData = (tabId, windowId, hostname, favIconUrl, ignoreThreshold) => {
    var start_key = getStorageKeyForTab(tabId, windowId, "start");
    var startDateTime = chrome.storage.sync[start_key] ?? new Date();
    var elapsedDateTime = new Date();
    var elapsedMs = elapsedDateTime - startDateTime;

    // Do not save if less then threshold
    if (ignoreThreshold || elapsedMs >= settings.elapsedThreshold) {
        addNewTimeCollectionEntry({
            startDate: startDateTime,
            elapsedMs: elapsedMs,
            hostName: hostname,
            favIconUrl: favIconUrl
        }, true);
    }

    // empty local storage for this tab
    chrome.storage.sync.remove([start_key]);
    delete chrome.storage.sync[start_key];
}

var collectTabData = (tab, ignoreThreshold) => {
    var pendingUrl = tab.pendingUrl;
    var lastUrl = tab.url;
    var pendingUrlHostName = pendingUrl && new URL(pendingUrl).host || null;
    var lastUrlHostName = lastUrl == "" ? "" : new URL(lastUrl).host;

    // if navigated to a different host name
    if (lastUrlHostName != pendingUrlHostName
        // or there is no pending host name provided (tab switch)
        || !pendingUrlHostName) {
        collectFavIconUrlFromTheTab(tab)
            .then((favIconUrl) => {
                saveSessionData(tab.id, tab.windowId, lastUrlHostName, favIconUrl, ignoreThreshold);
            })
    }
}

var isTracking = (tabId, windowId) => {
    return (chrome.storage.sync[getStorageKeyForTab(tabId, windowId, "start")] && true) || false;
}

var startTrackingTabTime = (tab) => {
    // preserve this tab data for future
    lastActiveTabData.tabId = tab.id;
    lastActiveTabData.windowId = tab.windowId;
    lastActiveTabData.hostName = (tab.url && new URL(tab.url).host) || "";

    var start_key = getStorageKeyForTab(tab.id, tab.windowId, "start");
    chrome.storage.sync[start_key] = new Date();
}

var startTrackingTabTimeById = (tabId) => {
    chrome.tabs.get(tabId, (tab) => {
        startTrackingTabTime(tab);
    });
}

var startTrackingActiveTabTime = () => {
    chrome.tabs.query({ active: true }, (tabs) => {
        var activeTab = tabs[0];
        if (!activeTab)
            return console.error("active tab was null");

        startTrackingTabTime(activeTab);
    });
}

// Completed web navigation, so we need to start a time track
chrome.webNavigation.onCommitted.addListener((details) => {
    // We are interested only in the top frame
    if (details.frameId != 0) return;
    // this means the page has been reloaded
    if (details.transitionType == "reload") return;
    // Navigated within the same host, so skip the tracking
    if (new URL(details.url).hostname == lastActiveTabData.hostName) return;

    chrome.tabs.get(details.tabId, (tab) => {
        // start tracking only if navigated inside the active tab
        // (not middle-mouse click, etc)
        if (tab.active) {
            startTrackingTabTime(tab);
        }
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

// start the clock when a tab has become active
chrome.tabs.onActivated.addListener((activeInfo) => {
    // something is wrong - restart tracking
    if (lastActiveTabData.tabId < 0) {
        // start tracking activated tab
        startTrackingTabTimeById(activeInfo.tabId);
    }
    // get and collect data from the previous last active tab
    chrome.tabs.get(lastActiveTabData.tabId, (lastActiveTab) => {
        // get the new tab
        chrome.tabs.get(activeInfo.tabId, (newTab) => {
            // if we switched to a tab with the same host name as prev tab
            //  => ignore the threshold for elapsed ms == it means we are in the same session / hostname
            var ignoreThreshold = new URL(newTab.url).hostname == lastActiveTabData.hostName;
            // lastActiveTab will be null if it was removed and its data was collected in the onRemoved
            if (lastActiveTab) {
                collectTabData(lastActiveTab, ignoreThreshold);
            }
            // start tracking activated tab
            startTrackingTabTime(newTab);
        });
    });
});


chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    // If user has closed the tab that was last active
    if (tabId == lastActiveTabData.tabId) {
        saveSessionData(lastActiveTabData.tabId, lastActiveTabData.windowId, lastActiveTabData.hostName, null);
    }
});

chrome.idle.setDetectionInterval(5 * 60);//(15);
chrome.idle.onStateChanged.addListener((newState) => {
    console.log(new Date().toTimeString() + newState);
    if (newState == "active") {
        // window has been activated
        if (!isTracking(lastActiveTabData.windowId, lastActiveTabData.tabId)) {
            startTrackingActiveTabTime();
        }
    } else {
        // The pc is locked so we can flush the data
        if (newState == "locked") {
            saveSessionData(lastActiveTabData.tabId, lastActiveTabData.windowId, lastActiveTabData.hostName, null);
        }
        if (newState == "idle") {
            // if user is idle we need to get last focused window and check if window is focused
            chrome.windows.getLastFocused((windowinfo) => {
                // user has switched the window. means we can flush session data
                if (!windowinfo.focused)
                    saveSessionData(lastActiveTabData.tabId, lastActiveTabData.windowId, lastActiveTabData.hostName, null);

                // if user is idle and window is focused we
                // need to check if there is any video playing on the page
                // - if video playing - keep tracking time
                // - if no video = flush data to storage and stop tracking
                if (windowinfo.focused) {
                    chrome.tabs.sendMessage(lastActiveTabData.tabId, { type: "checkIfMediaPlay" }, null, (response) => {
                        if (!response || !response.isPlaying) {
                            saveSessionData(lastActiveTabData.tabId, lastActiveTabData.windowId, lastActiveTabData.hostName, null);
                        }
                    });
                }
                console.log(windowinfo);
            })
        }
    }
})