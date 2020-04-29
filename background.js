var findCategoryByWebsiteInfo = (data) => {
    // Coming soon
    // <meta property="og:type" content="article">
    // <meta property="og:type" content="product"></meta>
    return "Other";
}
var addNewTimeCollectionEntry = (data) => {
    var dateTimeKey = new Date();
    var hostNameKey = data.hostName;

    var dataToSave = {
        timeOfTheDay: dateTimeKey,
        elapsedTimeInTheTab: data.elapsed,
        hostName: data.hostName,
        category: findCategoryByWebsiteInfo(data)
    }
    // Save by the date time key
    // chrome.storage.sync.set({ [dateTimeKey]: dataToSave }, () => {
    //     console.log('Key: ' + dateTimeKey.toString() + ' value is set to ' + dataToSave);
    // });

    // save by the hostnameKey
    chrome.storage.sync.get(hostNameKey, (storageResultObj) => {
        var dataArr = (storageResultObj && storageResultObj[hostNameKey]) || [];
        dataArr.push(dataToSave);

        chrome.storage.sync.set({ [hostNameKey]: dataArr }, () => {
            console.log('Key: ' + hostNameKey + ' value is set to ' + dataArr);
        });
    })
}

var getStorageKeyForTab = (tab, key) => {
    return key + "_" + tab.windowId + "_" + tab.id;
}
chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        "id": "sampleContextMenu",
        "title": "Sample Context Menu",
        "contexts": ["selection"]
    });
});

chrome.runtime.onStartup.addListener(function () {
    chrome.storage.local["dictionary"] = chrome.storage.local["dictionary"] ?? {};
});

// when something inside a tab (active or not) happens
// i.e. telegram notification
// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//     console.log(tab.active);
//     console.log(tab.url);
//     console.log(tab.title);
// })

chrome.webNavigation.onCompleted.addListener((details) => {
    chrome.tabs.get(details.tabId, (tab) => {
        var start_key = getStorageKeyForTab(tab, "start");
        chrome.storage.local[start_key] = details.timeStamp;
    });

});

chrome.webNavigation.onBeforeNavigate.addListener((evt) => {
    // https://developer.chrome.com/extensions/tabs#method-query
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { type: "collectPageTags" }, null, (response) => {
            var start_key = getStorageKeyForTab(activeTab, "start");
            var elapsed_key = getStorageKeyForTab(activeTab, "elapsed")

            var elapsed = evt.timeStamp - chrome.storage.local[start_key] ?? 0;
            addNewTimeCollectionEntry({ elapsed: elapsed, hostName: response.hostName });

            // empty local storage for this tab
            chrome.storage.local[start_key] = chrome.storage.local[elapsed_key] = null;
        });
    });
});


chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        var start_key = getStorageKeyForTab(tab, "start");
        chrome.storage.local[start_key] = activeInfo.timeStamp;
    });
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => { });