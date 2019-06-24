package main

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"os/exec"
)

func main() {
	cmd := exec.Command("cmd.bat")
	stderr, err := cmd.StderrPipe()
	if err != nil {
		log.Fatalf("could not get stderr pipe: %v", err)
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Fatalf("could not get stdout pipe: %v", err)
	}
	go func() {
		merged := io.MultiReader(stderr, stdout)
		scanner := bufio.NewScanner(merged)
		for scanner.Scan() {
			msg := scanner.Text()
			fmt.Printf("msg: %s\n", msg)
		}
	}()
	if err := cmd.Run(); err != nil {
		log.Fatalf("could not run cmd: %v", err)
	}
	if err != nil {
		log.Fatalf("could not wait for cmd: %v", err)
	}
}