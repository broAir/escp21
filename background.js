chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.set({ color: '#3aa757' }, function () {
        console.log("The color is green.");
    });
});

chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        "id": "sampleContextMenu",
        "title": "Sample Context Menu",
        "contexts": ["selection"]
    });
});
chrome.runtime.onStartup.addListener(function () {
    chrome.storage.local["dictionary"] = {};
})
// when something inside a tab (active or not) happens
// i.e. telegram notification
// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//     console.log(tab.active);
//     console.log(tab.url);
//     console.log(tab.title);
// })

chrome.webNavigation.onCompleted.addListener(function (details) {
    chrome.storage.local["start"] = details.timeStamp;
})

chrome.webNavigation.onBeforeNavigate.addListener(function (details) {
    var elapsed = details.timeStamp - chrome.storage.local["start"] ?? 0;
    console.log(elapsed);
    chrome.storage.local["dictionary"][window.location.hostname] +=elapsed; 
    chrome.storage.sync.set({ 'elapsed': elapsed }, function () {
        console.log('Elapsed time saved');
    });
})