class DataSessionEntity {
    constructor(date, elapsedMs, hostName, category) {
        this.date = date;
        this.elapsedMs = elapsedMs;
        this.hostName = hostName;
        this.category = category;
    }
}
;
class SiteDataEntity {
    constructor(hostName) {
        this.hostName = hostName;
        this.sessions = [];
        this.addSession = (pushData) => {
            this.sessions.push(new DataSessionEntity(pushData.date, pushData.elapsedMs, pushData.hostName, pushData.category));
        };
        this.totalElapsedMsForDate = (date) => {
            return this.sessions.filter((s) => {
                s.date.getYear() == date.getYear()
                    && s.date.getMonth() == date.getMonth()
                    && s.date.getDate() == date.getDate();
            }).reduce((s1, s2) => s1 + s2.elapsedMs, 0);
        };
        this.totalSiteTimeForDate = (date) => new Date(this.totalElapsedMsForDate(date));
    }
}
class StorageDateEntity {
    constructor(date) {
        this.date = date;
        this.dateKey = date.toDateString();
        this.sites = [];
        this.getSiteByHostName = (hostName) => this.sites.find(s => s.hostName == hostName);
        this.totalTimeMs = () => this.sites.reduce((s1, s2) => s1 + s2.totalElapsedMsForDate(date), 0);
        this.totalTime = () => new Date(totalTimeMs());
        this.addOrUpdateSite = (pushData) => {
            var siteEntry = this.getSiteByHostName(pushData.hostName);
            // if siteEntry is null, we need to push a new one to the array
            var isNew = siteEntry ? true : false;
            siteEntry = siteEntry ?? new SiteDataEntity(pushData.hostName);
            siteEntry.addSession(pushData);
            if (isNew) {
                this.sites.push(siteEntry);
            }
        };
    }
}
class StorageDataObject {
    constructor() {
        this.dates = [];
        this.addDate = (storageDateEntity) => this.dates.push(storageDateEntity);
        this.getDate = (date) => this.dates.find(d => d.dateKey == date.toDateString());
        this.addOrUpdate = (pushData) => {
            var date = pushData.date;
            var dateEntry = this.getDate(date);
            var isNew = dateEntry ? true : false;
            dateEntry = dateEntry ?? new StorageDateEntity(date);
            dateEntry.addOrUpdateSite(pushData);
            if (isNew)
                this.dates.push(dateEntry);
        };
    }
}

var findCategoryByWebsiteInfo = (data) => {
    // Coming soon
    // <meta property="og:type" content="article">
    // <meta property="og:type" content="product"></meta>
    return "Other";
}

var sendToStorage = (key, obj) => {
    chrome.storage.local.set({ [key]: obj }, () => {
        console.log('Key: ' + key + ' value is set to ' + obj);
        console.log(obj);
    });
}

var addNewTimeCollectionEntry = (data) => {
    var hostNameKey = data.hostName;

    var dataToSave = {
        day: data.startDate.toDateString(),
        time: data.startDate.toTimeString(),
        timeShort: data.startDate.toTimeString().substr(0, 5),
        elapsedMs: data.elapsedMs,
        hostName: data.hostName,
        date: data.startDate.toJSON(),
        category: findCategoryByWebsiteInfo(data)
    }

    // save by the hostnameKey
    chrome.storage.local.get("TimeSessionsBySite", (storageResultObj) => {
        var TimeSessionsBySite = storageResultObj && storageResultObj["TimeSessionsBySite"] || {};
        var timeSessionByHostEntry = TimeSessionsBySite[hostNameKey] || {};
        var dataArr = (timeSessionByHostEntry.arr) || [];

        dataArr.push(dataToSave);

        TimeSessionsBySite[hostNameKey] = timeSessionByHostEntry =
        {
            hostName: dataToSave.hostName,
            favIconUrl: data.favIconUrl,
            grad: timeSessionByHostEntry.grad,
            arr: dataArr
        };
        
        // If has gradient assigned
        if (timeSessionByHostEntry.grad ?? false) {
            sendToStorage("TimeSessionsBySite", TimeSessionsBySite);
        } else {
            getColorsFromFavUrl(data.favIconUrl).then((grad) => {
                TimeSessionsBySite[hostNameKey].grad = grad;
                sendToStorage("TimeSessionsBySite", TimeSessionsBySite);
            });
        }
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
        chrome.storage.sync[start_key] = new Date();
    });

});

chrome.webNavigation.onBeforeNavigate.addListener((evt) => {
    // https://developer.chrome.com/extensions/tabs#method-query
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { type: "collectPageTags" }, null, (response) => {
            var start_key = getStorageKeyForTab(activeTab, "start");
            var elapsed_key = getStorageKeyForTab(activeTab, "elapsed")
            var startDate = chrome.storage.sync[start_key] ?? new Date();

            var elapsedMs = new Date() - startDate;
            addNewTimeCollectionEntry({
                startDate: startDate,
                elapsedMs: elapsedMs,
                hostName: response.hostName,
                favIconUrl: response.favIconUrl
            });

            // empty local storage for this tab
            chrome.storage.sync[start_key] = chrome.storage.sync[elapsed_key] = null;
        });
    });
});


chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        var start_key = getStorageKeyForTab(tab, "start");
        chrome.storage.sync[start_key] = new Date();
    });
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => { });