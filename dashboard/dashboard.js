var fillSelectList = (id, data, val) => {
	var select = $(id);
	select.html(data.reduce((s, x) => s + "<option>" + x + "</option>", ""));
	if (val) {
		select.val(val);
	}
}

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
		type: 'line',
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
			tooltips: {
				callbacks: {
					label: function (tooltipItem, data) {
						// def label
						// var label = data.datasets[tooltipItem.datasetIndex].label || '';
						var val = tooltipItem.yLabel;
						var hrs = Math.floor(val / 1);
						var min = ((val % 1) * 60).toFixed(0);
						return (hrs > 0 ? (hrs + " hr ") : "") + min + " min"
					}
				}
			},
			scales: {
				yAxes: [{
					scaleLabel: {
						labelString: 'Hrs',
						display: true,
						padding: 1
					},
					offset: true,
					ticks: {
						stepSize: 2,
						beginAtZero: true
					}
				}],
				xAxes: [{
					scaleLabel: {
						labelString: 'Day of the week',
						display: true,
						padding: 1
					},
					offset: true,
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
					color: 'rgba(0, 0, 0, 0.35)',
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
		var dateEntriesForLastWeek = extractDatesFromStorageObjAndSort(storageResultObj, 7);

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

var renderDayChart = (day) => {
	var ctx = document.getElementById('basicChart').getContext('2d');

	var chartRenderOptions = {
		type: 'horizontalBar',
		data: {
			labels: [],
			icons: [],
			datasets: [{
				barPercentage: 1,
				categoryPercentage: 0.9,
				barThickness: 16,
				label: 'Time in min',
				data: [],
				backgroundColor: [],
				backgroundImage: [],
				borderColor: [],
				borderWidth: 1
			}]
		},
		options: {
			tooltips: {
				callbacks: {
					// Display x Hr y Min in the tooltip
					label: (tooltipItem, data) => convertMinToMinHrLabel(tooltipItem.xLabel)
				}
			},
			scales: {
				yAxes: [{
					ticks: {
						z: 1,
						fontColor: 'black',
						mirror: true,
						fontSize: 10, //make the font slightly larger
						padding: -10, //move the text slightly away from the bar edge
						beginAtZero: true
					},
					gridLines: {
						display: false,
						drawBorder: false
					}
				}],
				xAxes: [{
					scaleLabel: {
						labelString: 'Min',
						display: false,
						padding: 1
					},
					ticks: {
						beginAtZero: true,
						callback: (value, index, values) =>
							// for ticks: if any value is more than 100 
							// convert tick labels to hr format
							values.some(x => x > 100) ?
								convertMinToMinHrLabel(value, true) :
								value + "m"
					}
				}]
			},
			legend: {
				display: false
			},
			lineHeightAnnotation: {
				always: false
			},
			// https://www.chartjs.org/docs/latest/configuration/legend.html#legend-label-configuration
			// https://stackoverflow.com/questions/44649247/how-to-create-custom-legend-in-chartjs
			legendCallback: function (chart) {
				var text = [];
				text.push('<ul class="' + chart.id + '-legend">');
				for (var i = 0; i < chart.data.icons.length; i++) {
					text.push('<img class="legend-icon-img" width="12" height="12" src="' + chart.data.icons[i] + '"/>');
				}
				text.push('</ul>');
				return text.join('');
			}
		}
	}

	var day = day || new Date().toDateString();

	chrome.storage.local.get(null, (storageResultObj) => {
		var siteSessionDataForToday = storageResultObj[day] && storageResultObj[day].siteSessionData || {};
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
			chartRenderOptions.data.icons.push(siteEntry.favIconUrl ?? "");

			// Filter by today only
			var todaySessions = siteEntry.sessions;
			// display minutes in the chart
			var dataSetMinutes = todaySessions.reduce((s1, s2) => s1 + s2.elapsedMs, 0) / 60000
			chartRenderOptions.data.datasets[0].data.push(dataSetMinutes.toFixed(2));

			// Add gradient to the backround
			var grad = ctx.createLinearGradient(0, 0, 300, 0);
			grad.addColorStop(0, "rgba(240, 248, 255, 50)");
			//grad.addColorStop(0.3, siteEntry.grad[0] ?? "#6495ed");
			grad.addColorStop(0.5, siteEntry.grad[1] ?? "#6495ed");
			chartRenderOptions.data.datasets[0].backgroundColor.push(grad);

		});

		if (window.dailyChart) {
			window.dailyChart.data = chartRenderOptions.data;
			window.dailyChart.update();
		} else {
			window.dailyChart = new Chart(ctx, chartRenderOptions);
		}

		window.dailyChartRenderOptions = chartRenderOptions;
		$("#chart-fav-labels").html(window.dailyChart.generateLegend());
	});
}

var renderChartForToday = () => {
	var today = new Date().toDateString();
	renderDayChart(today);

	chrome.storage.local.get(null, (storageResultObj) => {
		// Fill the select list on top of the page
		fillSelectList("#select-day",
			extractDatesFromStorageObjAndSort(storageResultObj, 14).map(x => x.toDateString()),
			today);
	});
};

var bindEvents = () => {
	$("#select-day").change(e => {
		var day = e.currentTarget.value;
		renderDayChart(day);
	});
}

$(document).ready(function () {
	renderChartForToday();
	renderWeeklyChart();
	bindEvents();
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