$(document).ready(function () {
	var data = chrome.storage.local.get("TimeSessionsBySite", (storageResultObj) => {
		var ctx = document.getElementById('basicChart').getContext('2d');

		// var purple_orange_gradient = ctx.createLinearGradient(0, 0, 0, 600);
		// purple_orange_gradient.addColorStop(0, 'orange');
		// purple_orange_gradient.addColorStop(1, 'purple');

		var chartRenderData = {
			type: 'doughnut',
			data: {
				labels: [],
				datasets: [{
					label: 'Time min',
					data: [],
					backgroundColor: [],
					backgroundImage: [],
					borderColor: [],
					borderWidth: 1
				}]
			},
			options: {
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero: true
						}
					}]
				}
			}
		}
		var timeSessionsCollection = storageResultObj["TimeSessionsBySite"] || {};
		var hostEntryStorageKeys = Object.keys(timeSessionsCollection);

		var today = new Date().toDateString();

		hostEntryStorageKeys.forEach((hostNameKey) => {
			var siteEntry = timeSessionsCollection[hostNameKey];
			// Add the host name label
			chartRenderData.data.labels.push(siteEntry.hostName);
			// Filter by today only
			var dataSetForToday = siteEntry.arr.filter(x => x.day == today);
			// display minutes in the chart
			var dataSetMinutes = dataSetForToday.reduce((s1, s2) => s1 + s2.elapsedMs, 0) / 60000
			
			chartRenderData.data.datasets[0].data.push(dataSetMinutes);
			// Add gradient to the backround
			var grad = ctx.createLinearGradient(0, 0, 0, 600);
			grad.addColorStop(0, siteEntry.grad[0] ?? "#FFFFFF");
			grad.addColorStop(1, siteEntry.grad[1] ?? "#000000");
			chartRenderData.data.datasets[0].backgroundColor.push(grad);

		});

		var myChart = new Chart(ctx, chartRenderData);
	})

});
// if(!_app._on){

// 		// Get the current Tab
// 		chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {

// 			var active = tabs[0].id;

//             // Set the URL to the Local-NTP (New Tab Page)
// 			chrome.tabs.update(active, { url: "chrome-search://local-ntp/local-ntp.html" }, function() { });
// 		});

// 	// App is ON, show custom content
// 	}