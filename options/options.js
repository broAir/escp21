// https://developer.chrome.com/extensions/options

// Saves options to chrome.storage
function save_options() {
    var dashboardOn = document.getElementById('dashboard-on').checked;
    chrome.storage.sync.set({
        dashboardEnabled: dashboardOn
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value dashboardEnabled = true.
    chrome.storage.sync.get({
        dashboardEnabled: true
    }, function (items) {
        document.getElementById('dashboard-on').checked = items.dashboardEnabled;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);