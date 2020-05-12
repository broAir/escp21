const sessionLimitStorageKey = "_SessionLimits";

var renderChartSessionChart = (currentSite, sessionLimitForCurrentSite) => {
  var ctx = document.getElementById('site-chart').getContext('2d');

  var grad = ctx.createLinearGradient(0, 0, 0, 150);
  grad.addColorStop(0.5, currentSite.grad[0] ?? "#6495ed");
  grad.addColorStop(1, currentSite.grad[1] ?? "#6495ed");

  var chartRenderData = {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: currentSite.hostName,
        data: [],
        backgroundColor: grad,
        borderColor: grad,
        borderWidth: 1
      }]
    },
    options: {
      tooltips: {
        callbacks: {
          // Display x Hr y Min in the tooltip
          label: (tooltipItem, data) => convertMinToMinHrLabel(tooltipItem.yLabel)
        }
      },
      legend: {
        display: true
      },
      scales: {
        yAxes: [{
          scaleLabel: {
            labelString: 'Min',
            display: true,
            padding: 2
          },
          ticks: {
            beginAtZero: true
          }
        }],
        xAxes: [{
          scaleLabel: {
            labelString: 'Time of the day',
            display: true,
            padding: 1
          }
        }]
      }
    }
  };

  var dataForToday = currentSite.sessions;
  dataForToday.forEach((siteSessionEntry) => {
    chartRenderData.data.labels.push(siteSessionEntry.timeShort);
    chartRenderData.data.datasets[0].data.push((siteSessionEntry.elapsedMs / 60000).toFixed(3));
  });

  // add session limit line
  if (sessionLimitForCurrentSite > 0) {
    chartRenderData.data.datasets.push({
      label: 'session limit',
      data: new Array(dataForToday.length),
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderColor: 'rgba(76, 175, 80, 0.8)',
      borderWidth: 1.5,
      lineTension: 0.01,
      type: 'line',
      fill: '-1',
      spanGaps: true,
      order: 0
    });
    chartRenderData.data.datasets[1].data[0] = sessionLimitForCurrentSite;
    chartRenderData.data.datasets[1].data[dataForToday.length - 1] = sessionLimitForCurrentSite;
  }

  var myChart = new Chart(ctx, chartRenderData);
  window.myChart = myChart;
}

document.addEventListener('DOMContentLoaded', () => {

  $("#dashboard-link").click(e => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL("/dashboard/dashboard.html") });
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    var activeTab = tabs[0];
    var url = new URL(activeTab.url);
    var hostName = url.hostname;
    var today = new Date().toDateString();

    $("#site-name").text(hostName);
    chrome.storage.local.get([today, sessionLimitStorageKey], (storageResultObj) => {

      var siteSessionDataForToday = storageResultObj[today]
        && storageResultObj[today].siteSessionData || {};
      var currentSite = siteSessionDataForToday[hostName];
      if (!currentSite) return;

      $("#current-elapsed-value").html("Today you have been browsing for <b>"
        + currentSite.sessions.reduce((sum, b) => sum + (b.elapsedMs / 60000), 0).toFixed(0) + " min</b>");

      var limits = storageResultObj[sessionLimitStorageKey] || {};
      var sessionLimitForCurrentSite = (limits[hostName] && limits[hostName].limitMin) || 0;

      renderChartSessionChart(currentSite, sessionLimitForCurrentSite);

      if (sessionLimitForCurrentSite > 0) {
        $("#current-limit-value").html("Current limit for this site is <b>" + sessionLimitForCurrentSite + " min</b>")
        $("#remove-limit-btn").show();
        $("#remove-limit-btn").click((e) => {
          delete limits[hostName];
          chrome.storage.local.set({ [sessionLimitStorageKey]: limits });

          $('#limit-set-message-container').html("Removed limit from the <b>" + hostName + "</b>");
          $('#limit-set-message-container').show();
        });
      }

      $("#set-limit-btn").click((e) => {
        var limitMin = +$("#limit-val").val();
        if (limitMin > 0) {

          limits[hostName] = {
            limitMin: limitMin,
            limitMs: limitMin * 60 * 1000,
            limitText: $("#limit-text").val()
          };

          chrome.storage.local.set({ [sessionLimitStorageKey]: limits });
          $('#limit-set-message-container').html("You have set the limit for <b>" + hostName + "</b> to <i>" + limitMin + " minutes</i>. Please refresh the page!"); $('#limit-set-text').text("You have set the limit for " + hostName + " to " + limitMin + " minutes. Please refresh the page!");
          $('#limit-set-message-container').show();
        }
      });
    })
  })
});

