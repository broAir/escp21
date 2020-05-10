Chart.pluginService.register({
    afterDraw: function(chart) {
        if (typeof chart.config.options.lineAt != 'undefined') {
            var lineAt = chart.config.options.lineAt.at;
            var color = chart.config.options.lineAt.borderColor || 'red';
            var lineWidth = chart.config.options.lineAt.borderWidth || 1;

            var canvasCtx = chart.chart.ctx;
            
            var xAxe = chart.scales[chart.config.options.scales.xAxes[0].id];
            var yAxe = chart.scales[chart.config.options.scales.yAxes[0].id];

            var position = yAxe.getPixelForValue(lineAt)

            canvasCtx.strokeStyle = color;
            canvasCtx.lineWidth = lineWidth;
            canvasCtx.beginPath();
            canvasCtx.moveTo(xAxe.left, position);
            canvasCtx.lineTo(xAxe.right, position);
            canvasCtx.stroke();
        }
    }
});