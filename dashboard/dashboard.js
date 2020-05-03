var renderCategoriesChart = (labels, chartDataSets) => {
	var ctx = document.getElementById('categories-chart').getContext('2d');

	var chartRenderData = {
		type: 'pie',
		data: {
			labels: labels,
			datasets: chartDataSets
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

	var pieChart = new Chart(ctx, chartRenderData);
}
$(document).ready(function () {
	var today = new Date().toDateString();
	chrome.storage.local.get([today], (storageResultObj) => {
		var ctx = document.getElementById('basicChart').getContext('2d');

		// var purple_orange_gradient = ctx.createLinearGradient(0, 0, 0, 600);
		// purple_orange_gradient.addColorStop(0, 'orange');
		// purple_orange_gradient.addColorStop(1, 'purple');

		var chartRenderOptions = {
			type: 'horizontalBar',
			data: {
				labels: [],
				icons: [],
				datasets: [{
					label: 'Time in min',
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
				},
				legend: {
					display: true
				},
				// https://www.chartjs.org/docs/latest/configuration/legend.html#legend-label-configuration
				// https://stackoverflow.com/questions/37005297/custom-legend-with-chartjs-v2-0
				legendCallback: function (chart) {
					var text = [];
					text.push('<ul class="' + chart.id + '-legend">');
					for (var i = 0; i < chart.data.icons.length; i++) {
						text.push('<img width="32" height="32" src="' + chart.data.icons[i] + '"/>');
					}
					text.push('</ul>');
					return text.join('');
				}
			}
		}

		var siteSessionDataForToday = storageResultObj[today] && storageResultObj[today].siteSessionData || {};
		var hostEntryStorageKeys = Object.keys(siteSessionDataForToday);

		hostEntryStorageKeys = hostEntryStorageKeys
			// Sort by elapsed
			.sort((a, b) => {
				var elapsedA = siteSessionDataForToday[a].sessions.filter(x => x.day == today).reduce((s1, s2) => s1 + s2.elapsedMs, 0);
				var elapsedB = siteSessionDataForToday[b].sessions.filter(x => x.day == today).reduce((s1, s2) => s1 + s2.elapsedMs, 0);
				if (elapsedA > elapsedB) return -1;
				if (elapsedA < elapsedB) return 1;
				return 0;
			})
			// Take only top 5
			.slice(0, 10);

		hostEntryStorageKeys.forEach((hostNameKey) => {
			var siteEntry = siteSessionDataForToday[hostNameKey];
			// Add the host name label
			chartRenderOptions.data.labels.push(siteEntry.hostName);
			chartRenderOptions.data.icons.push(siteEntry.favIconUrl);

			// Filter by today only
			var todaySessions = siteEntry.sessions;
			// display minutes in the chart
			var dataSetMinutes = todaySessions.reduce((s1, s2) => s1 + s2.elapsedMs, 0) / 60000
			chartRenderOptions.data.datasets[0].data.push(dataSetMinutes);

			// Add gradient to the backround
			var grad = ctx.createLinearGradient(0, 0, 300, 0);
			grad.addColorStop(0.5, siteEntry.grad[0] ?? "#FFFFFF");
			grad.addColorStop(1, siteEntry.grad[1] ?? "#000000");
			chartRenderOptions.data.datasets[0].backgroundColor.push(grad);

		});

		var myChart = new Chart(ctx, chartRenderOptions);
		window.mainChart = myChart;
		window.chartRenderOptions = chartRenderOptions;
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