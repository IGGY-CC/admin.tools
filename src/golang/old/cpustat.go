package old

import (
	"time"
	 "fmt"
	 "github.com/shirou/gopsutil/cpu"
)

func main() {
	ticker := time.NewTicker(1 * time.Second)
	quit := make(chan struct{})
	for {
		select {
		case <- ticker.C:
			// cpuStat, err := cpu.Info()
			percentage, err := cpu.Percent(0, true)
			if(err != nil) {
				fmt.Println(err)
			}
			// fmt.Println(cpuStat)
			totalPercent := percentage[0] + percentage[1] + percentage[2] + percentage[3]
			fmt.Println(totalPercent/4)
			fmt.Println(percentage)
		case <- quit:
			ticker.Stop()
			return
		}
	}

}