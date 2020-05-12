var settings = {
    sessionLimitStorageKey: "_SessionLimits",
    sessionLimitMs: 0,
    limitText: "",
    timeOutSetThreshould: 15 * 1000,
    // If we are not in the tab for 2 minutes then clear timeout
    //timeOutClearThreshold: 2 * 1000,
    timeOutClearThreshold: 2 * 60 * 1000

}
var lastTimeOutHandle = 0;
var documentHiddenTime = 0;

var showAlertFn = () => {
    alert(`
    ${settings.limitText} 
    [OK] will rechedule this notification`)
    recheduleLimitNotification();
};

var setLimitNotificationSchedule = () => {
    if (settings.sessionLimitMs > 0 && lastTimeOutHandle == 0) {
        lastTimeOutHandle = window.setTimeout(() => {
            //document.getElementById('limit-notification-container').style.display = 'block';
            showAlertFn();
        }, settings.sessionLimitMs);
    }
}

var clearLimitNotificationSchedule = () => {
    if (lastTimeOutHandle != 0) {
        window.clearTimeout(lastTimeOutHandle);
        lastTimeOutHandle = 0;
    }
}
var recheduleLimitNotification = () => {
    clearLimitNotificationSchedule();
    setLimitNotificationSchedule();
}

// add new element to show the limit notification
var addLimitNotificationBox = () => {
    if (!document.getElementById('limit-notification-container')) {
        document.body.innerHTML += "<div id='limit-notification-container' style='display:none; border: 2px solid #c4c8bf; border-radius: 12px; left: 25%; z-index: 100; position: fixed;  top: 0; width: 50%; background-color: rgba(160, 230, 160, 1); padding: 10px; margin-top: 50px;'></div>";
        var notificationContainer = document.getElementById('limit-notification-container');
        notificationContainer.innerHTML += "<label style='padding-left: 20px;font-family: sans-serif; font-weight: 500;'>" + settings.limitText + "</label>";
        notificationContainer.innerHTML += "<a id='limit-notification-dismiss' style='margin-right: 10px;right:0px; top:2.5px;position: absolute; text-decoration: none; padding: 5px;border-radius: 6.5px;border: 2px solid;border-style: solid;border-color: lightblue;background-color: #c6e7ff;font-family: sans-serif;'>Ok, remind me later</a>";
        document.getElementById('limit-notification-dismiss').addEventListener('click', ((e) => {
            e.preventDefault();
            document.getElementById('limit-notification-container').style.display = 'none';
            // Reschedule notification
            recheduleLimitNotification();
        }));
    }
}


chrome.storage.local.get([settings.sessionLimitStorageKey], (res) => {
    var currentHostSessionLimit = res[settings.sessionLimitStorageKey]
        && res[settings.sessionLimitStorageKey][window.location.hostname] || {};

    if (currentHostSessionLimit && currentHostSessionLimit.limitMin) {
        settings.sessionLimitMs = currentHostSessionLimit.limitMs;
        settings.limitText = currentHostSessionLimit.limitText;
        setLimitNotificationSchedule();
    }
});

// if document is unfocused for some time clear the notification interval handle
window.setInterval(() => {
    // if document is hidden and there is a timeout handle
    if (document.hidden && lastTimeOutHandle != 0) {
        // if enough time has passed since document became hidden
        if (new Date() - documentHiddenTime > settings.timeOutClearThreshold) {
            clearLimitNotificationSchedule();
        }
    }
}, settings.timeOutClearThreshold);

// Track when user changes tab
document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
        documentHiddenTime = new Date();
    } else {
        if (lastTimeOutHandle == 0) {
            setLimitNotificationSchedule();
        }
    }
});


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