const os = require('os');

chart = bb.generate({
  bindto: "#cpudata",
  size: {
    height: 60,
    width: 140
  },
  padding: {
    right: -1,
    bottom: 10
  },
  data: {
    x: "x",
    columns: [
      ["x", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
      ["data1", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
    ],
    type: "area",
    axes: { data1: 'y2' }
  },
  axis: {
    y: { show: false },
    x: { show: false }, 
    y2: { 
      show: true,
      tick: {
        format: function(d) { return parseInt(d, 10); },
        count: 2,
        text: {
          position: {
            x: -23
          }
        },
        centered: false,
        culling: true,
        fit: false,
        // width: 30,
      }
    },
  },
  area: { zerobased: true, linearGradient: true },
  // line: { point: { show: false } },
  point: { show: false },
  tooltip: { show: false },
  legend: { show: false, usePoint: false },
  grid: { 
    x: { show: false }, 
    y: { show: false }, 
    /*y2: { 
      lines: [
        {value: 25, text: "25%"},
        {value: 75, text: "75%"}
      ]
    }*/ 
  },
  color: { pattern: ["#6f6f6f"] },
});
chart.zoom.enable(true);
// var testt = 0;
// testId = setInterval(function() {
//   console.log(os.cpus())
//   if (++testt == 10) {
//     window.clearInterval(testId)
//   }
// }, 1000);


let cpuFrequency;

function localCPUTimes() {
  const cpus = os.cpus();
  return cpus.map(cpu => {
    const times = cpu.times;
    cpuFrequency = cpu.model.split("@ ")[1];
    return {
      tick: Object.keys(times).reduce((tick, time) => tick + times[time], 0),
      idle: times.idle,
    }
  });
}

function cpuTimes() {
  switch(server) {
    case "remote":

    case "local":
    default:
      return localCPUTimes();
  }

}

let initMeasurements = cpuTimes();
let element = document.getElementById("cpu-cycles");
if(element !== null) {
  element.innerHTML = os.cpus().length + " * " + cpuFrequency;
}

// Set a delay of 1 sec (timeout) before the next call to cpu times and next update to graph
setTimeout(function () {
  cpufreqInterval = setInterval(function () {
    const currentMeasurements = cpuTimes();
    const diffValues = currentMeasurements.map((cur, i) => {
      return ((cur.idle - initMeasurements[i].idle) / (cur.tick - initMeasurements[i].tick) * 100);
    });
    initMeasurements = currentMeasurements;

    let totalPercentage = 100 - ((diffValues.reduce((sum, val) => sum + val)) / os.cpus().length);
    let textElement = document.getElementById("cpu-text");

    if(textElement !== null) {
      textElement.innerHTML = totalPercentage.toFixed(1) + "%";
    }

    chart.flow({
      columns: [
        ["x", new Date().getUTCSeconds()],
        ["data1", totalPercentage]
      ],
      duration: 300,
    })
    // if (++loopCount == 30) {
    //   window.clearInterval(cpufreqInterval)
    // }
  }, 1000);
}, 1000);
