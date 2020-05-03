
document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    var activeTab = tabs[0];
    var url = new URL(activeTab.url);
    var hostName = url.hostname;
    var today = new Date().toDateString();

    chrome.storage.local.get([today], (storageResultObj) => {

      var siteSessionDataForToday = storageResultObj[today] && storageResultObj[today].siteSessionData || {};
      var currentSite = siteSessionDataForToday[hostName];
      if (!currentSite) return;

      var ctx = document.getElementById('site-chart').getContext('2d');

      var grad = ctx.createLinearGradient(0, 0, 0, 150);
      grad.addColorStop(0.5, currentSite.grad[0] ?? "#000000");
      grad.addColorStop(1, currentSite.grad[1] ?? "#FFFFFF");

      var chartRenderData = {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            data: [],
            backgroundColor: grad,
            backgroundImage: [],
            borderColor: [],
            borderWidth: 1
          }]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            yAxes: [{
              stacked: true,
              ticks: {
                beginAtZero: true
              }
            }],
            xAxes: [{
              display: true
            }]
          }
        }
      };

      var dataForToday = currentSite.sessions;
      dataForToday.forEach((siteSessionEntry) => {
        chartRenderData.data.labels.push(siteSessionEntry.timeShort);
        chartRenderData.data.datasets[0].data.push((siteSessionEntry.elapsedMs / 60000).toFixed(3));
      });

      var myChart = new Chart(ctx, chartRenderData);
      window.myChart = myChart;


      $("#site-name").text(hostName);
    })
  })
});

