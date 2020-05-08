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

var renderWeeklyChart = () => {
	var ctx = document.getElementById('weekly-chart').getContext('2d');

	var chartRenderOptions = {
		type: 'bar',
		data: {
			labels: [],
			icons: [],
			datasets: [{
				label: 'Weekly time in hr',
				data: [],
				backgroundColor: 'aliceblue',
				borderColor: 'cornflowerblue',
				borderWidth: 1.5,
				lineTension: 0.01,
				type: 'line'
			}]
		},
		options: {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true
					}
				}], xAxes: [{
					ticks: {
						beginAtZero: true
					},
					gridLines: {
						display: false
					}
				}],
			},
			legend: {
				display: true
			},
			// https://www.npmjs.com/package/chartjs-plugin-lineheight-annotation
			lineHeightAnnotation: {
				// defaults to have line to the highest data point on every tick
				always: true,
				// colors of the line
				color: 'cornflowerblue',
				// name of yAxis
				yAxis: 'y-axis-0',
				// weight of the line
				lineWeight: 0.5,
				/// sets shadow for ALL lines on the canvas
				shadow: {
					// color of the shadow
					color: 'rgba(0,0,0,0.35)',
					// blur of the shadow
					blur: 10,
					/// shadow offset
					offset: {
						// x offset
						x: 0,
						// y offset
						y: 0
					}
				},
			}
		}
	}

	// get all storage entries
	chrome.storage.local.get(null, (storageResultObj) => {
		// order keys by date
		var dateEntriesForLastWeek = Object.keys(storageResultObj)
			// map string keys to date time
			.map(x => new Date(x))
			// order by desc
			.sort((a, b) => a - b)
			// Take 7
			.slice(0, 7);

		var elapsedHrsForLastWeek = dateEntriesForLastWeek
			.map(x => {
				// get an array of host entries for each date
				var siteSessions = storageResultObj[x.toDateString()].siteSessionData;
				// for each host entry
				return Object.keys(siteSessions)
					// sum of sum of each session elapsed ms (of current host entry)
					.reduce((sum1, sk) => sum1 + siteSessions[sk].sessions
						.reduce((sum2, a) => sum2 + a.elapsedMs, 0), 0);
			})
			// convert to hours
			.map(x => x / (1000 * 60 * 60));


		elapsedHrsForLastWeek.forEach((x, i) => {
			chartRenderOptions.data.datasets[0].data.push(x.toFixed(2));
			chartRenderOptions.data.labels.push(dateEntriesForLastWeek[i].toDateString().slice(0, -5));
		});

		var myChart = new Chart(ctx, chartRenderOptions);
		window.weeklyChart = myChart;
		window.weeklyChartRenderOptions = chartRenderOptions;
	});
}

var renderChartForToday = () => {
	var ctx = document.getElementById('basicChart').getContext('2d');

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
					},
					gridLines: {
						display: false
					}
				}],
				xAxes: [{
					ticks: {
						beginAtZero: true
					}
				}]
			},
			legend: {
				display: true
			},
			lineHeightAnnotation: {
				always: false
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

	var today = new Date().toDateString();

	chrome.storage.local.get([today], (storageResultObj) => {
		var siteSessionDataForToday = storageResultObj[today] && storageResultObj[today].siteSessionData || {};
		var hostEntryStorageKeys = Object.keys(siteSessionDataForToday);

		hostEntryStorageKeys = hostEntryStorageKeys
			// Sort by elapsed
			.sort((a, b) => {
				var elapsedA = siteSessionDataForToday[a].sessions.reduce((s1, s2) => s1 + s2.elapsedMs, 0);
				var elapsedB = siteSessionDataForToday[b].sessions.reduce((s1, s2) => s1 + s2.elapsedMs, 0);
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
			chartRenderOptions.data.datasets[0].data.push(dataSetMinutes.toFixed(2));

			// Add gradient to the backround
			var grad = ctx.createLinearGradient(0, 0, 300, 0);
			grad.addColorStop(0.5, siteEntry.grad[0] ?? "#FFFFFF");
			grad.addColorStop(1, siteEntry.grad[1] ?? "#000000");
			chartRenderOptions.data.datasets[0].backgroundColor.push(grad);

		});

		var myChart = new Chart(ctx, chartRenderOptions);
		window.chartForToday = myChart;
		window.chartForTodayRenderOptions = chartRenderOptions;
	});
}
$(document).ready(function () {
	renderChartForToday();
	renderWeeklyChart();

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