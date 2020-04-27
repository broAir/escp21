$(document).ready(function(){ 

    // It takes a moment for the Chrome query/update so sometimes there is a flash of content
    // Hiding the Body makes it look blank/white until either redirected or shown
	$('body').hide();

	var background = chrome.extension.getBackgroundPage();
	var _app = background._app;

	// App is OFF, show Default New Tab
	if(!_app._on){

		// Get the current Tab
		chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {

			var active = tabs[0].id;
          
            // Set the URL to the Local-NTP (New Tab Page)
			chrome.tabs.update(active, { url: "chrome-search://local-ntp/local-ntp.html" }, function() { });
		});

	// App is ON, show custom content
	} else {
		
		$('body').show();
	}

});