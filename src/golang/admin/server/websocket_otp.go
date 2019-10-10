package server

import (
	"../otp"
	"encoding/json"
	"io"
	"net/http"
)

func webSocketOTPInit(writer http.ResponseWriter, action string, jsonString string) (createAndClose bool){
	type OTPData struct{
		Name string
		Key string
		OTP string
		All []string
	}

	createAndClose = false
	var otpManager = otp.New()
	var otpData = new(OTPData)
	err := json.Unmarshal([]byte(jsonString), &otpData)
	if err != nil {
		Log.Println("Cannot unmarshal provided data", jsonString, otpData)
	}

	switch action {
	case "create":
		err = otpManager.GenerateTOTP()
		if err != nil {
			Log.Println("Couldn't generate a new TOTP: ", err)
			// TODO
			WriteHTTP(err.Error(), writer)
		}
		// TODO
		WriteHTTP(doMarshall(otpManager), writer)
		break
	case "list":
		strings, err := otpManager.GetKeys()
		if err != nil {
			Log.Println("Couldn't retrieve any list")
		}
		Log.Println("Retrieved list: ", strings)
		// TODO
		WriteHTTP(doMarshall(strings), writer)
		break
	case "validate":
		valid := otpManager.ValidateOTP(otpData.Name, otpData.OTP)
		if !valid {
			Log.Println("Failed to authenticate with requested OTP", jsonString, otpData, err)
			return
		}
		break
	case "validate-check":
		err := otpManager.ValidateAndSave(otpData.Name, otpData.OTP)
		if err != nil {
			Log.Println("Failed to authenticate with requested OTP", jsonString, otpData, err)
			return
		}
		break
	case "add-new":
		err = otpManager.CheckAndSave(otpData.Name, otpData.Key, otpData.OTP)
		if err != nil {
			Log.Println("Failed to authenticate the Key with requested OTP", jsonString, otpData, err)
			return
		}
		WriteHTTP(doMarshall([]string {"success!"}), writer)
		break
	case "add-new-with-OTP":
		err = otpManager.CheckAndSave(otpData.Name, otpData.Key, otpData.OTP)
		if err != nil {
			Log.Println("Failed to authenticate the Key with requested OTP", jsonString, otpData, err)
			return
		}
		break
	case "generate-otp":
		otp2, err := otpManager.GenerateCodeFromNames(otpData.All)
		if err != nil {
			Log.Println("Couldn't generate a code from the given name, doesn't the name/key pair exists?", err)
			return
		}
		Log.Println("Generated codes successfully!", otp2)
		break
	case "generate-otp-names":
		otp, err := otpManager.GenerateCodeFromName(otpData.Name)
		if err != nil {
			Log.Println("Couldn't generate a code from the given name, doesn't the name/key pair exists?", err)
			return
		}
		Log.Println("Generated code successfully!", otp)
		WriteHTTP(doMarshall([]string{otp}), writer)
		break
	}

	Log.Println("OTP Validated Successfully!")
	//createAndClose = true

	return
}

func doMarshall(v interface{}) string {
	bytes, err := json.Marshal(v)
	if err != nil {
		Log.Println("There is an error Marshalling object to Json string", err)
	}
	return string(bytes)
}

func WriteHTTP(data string, writer http.ResponseWriter) {
	code, err := io.WriteString(writer, data+"\n")
	//as.httpWriter.(http.Flusher).Flush()
	//code, err := fmt.Fprintf(*as.httpWriter, data)
	if err != nil {
		Log.Println("Error while writing to http(s) stream", err, code)
	}
}