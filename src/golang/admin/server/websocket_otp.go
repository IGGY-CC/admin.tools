package server

import (
	"../lib"
	"../otp"
	"encoding/json"
	"log"
)

func webSocketOTPInit(socket *lib.AdmSocket, action string, jsonString string) (createAndClose bool){
	type OTPData struct{
		Name string
		Key string
		OTP string
		All []string
	}

	createAndClose = true
	var otpManager = otp.New()
	var otpData = new(OTPData)
	err := json.Unmarshal([]byte(jsonString), &otpData)
	if err != nil {
		log.Println("Cannot unmarshal provided data", jsonString, otpData)
	}

	switch action {
	case "create":
		_ = otpManager.GenerateTOTP()
		break
	case "list":
		strings, err := otpManager.GetKeys()
		if err != nil {
			log.Println("Couldn't retrieve any list")
		}
		log.Println("Retrieved list: ", strings)
		break
	case "validate":
		valid := otpManager.ValidateOTP(otpData.Name, otpData.OTP)
		if !valid {
			log.Println("Failed to authenticate with requested OTP", jsonString, otpData, err)
			return
		}
		break
	case "validate-check":
		err = otpManager.ValidateAndSave(otpData.Name, otpData.OTP)
		if err != nil {
			log.Println("Failed to authenticate with requested OTP", jsonString, otpData, err)
			return
		}
		break
	case "add-new":
		err = otpManager.CheckAndSave(otpData.Name, otpData.Key, otpData.OTP)
		if err != nil {
			log.Println("Failed to authenticate the Key with requested OTP", jsonString, otpData, err)
			return
		}
		break
	case "add-new-with-OTP":
		err = otpManager.CheckAndSave(otpData.Name, otpData.Key, otpData.OTP)
		if err != nil {
			log.Println("Failed to authenticate the Key with requested OTP", jsonString, otpData, err)
			return
		}
		break
	case "generate-otp":
		otp, err := otpManager.GenerateCodeFromNames(otpData.All)
		if err != nil {
			log.Println("Couldn't generate a code from the given name, doesn't the name/key pair exists?", err)
			return
		}
		log.Println("Generated codes successfully!", otp)
		break
	case "generate-otp-names":
		otp, err := otpManager.GenerateCodeFromName(otpData.Name)
		if err != nil {
			log.Println("Couldn't generate a code from the given name, doesn't the name/key pair exists?", err)
			return
		}
		log.Println("Generated code successfully!", otp)
		break
	}

	//log.Println("OTP Validated Successfully!")
	createAndClose = true

	return
}