var os = require("os");

function cpuAverage() {

  let totalIdle = 0;
  let totalTick = 0;
  let cpus = os.cpus();

  for(var i = 0, len = cpus.length; i < len; i++) {
    let cpu = cpus[i];
    
    for(type in cpu.times) {
      totalTick += cpu.times[type];
      totalIdle += cpu.times.idle;
    }         
  }

  //Return the average Idle and Tick times
  return {idle: totalIdle / cpus.length,  total: totalTick / cpus.length};
}

//Grab first CPU Measure
var startMeasure = cpuAverage();
