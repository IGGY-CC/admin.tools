const os = require('os');

function memPercentage() {
  return 100 - (os.freemem() * 100 / os.totalmem())
}

chart2 = bb.generate({
  bindto: "#ram-ratio",
  size: {
    height: 50,
    width: 100
  },
  padding: {
    top: 10,
    left: -30,
  },
  x: 'x',
  data: {
    columns: [
      [ "x", 0 ],
      ["data", memPercentage()],
    ],
    type: "gauge",
  },
  guage: {
    max: 100
  },
  tooltip: { show: false },
  legend: { show: false, usePoint: false },
  color: {
    pattern: [
      "#60B044",
      "#F6C600",
      "#F97600",
      "#FF0000",
    ],
    threshold: {
      values: [
        50,
        60,
        80,
        90
      ]
    }
  },
});

ramRatioInterval = setInterval(function () {
  document.getElementById("ram-text-align").innerHTML = "RAM: " + Math.ceil( os.totalmem() / (1024 * 1024 * 1024)) + "GB [" + (100 - memPercentage()).toFixed(2) + "%]"
  chart2.flow({
    columns: [
      ["x", 0],
      ["data1", memPercentage()]
    ],
    duration: 300,
  })
  // if (++loopCount == 30) {
  //   window.clearInterval(ramRatioInterval)
  // }
}, 3000)