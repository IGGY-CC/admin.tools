package otp

import (
	"../db"
	"errors"
	"time"

	"bytes"
	"fmt"
	"image/png"
	"log"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
)

type OTPDBSchema struct {
	ID string
	Key string
	db.DataTemplate
}

func (otpDB OTPDBSchema) GetID() (id string) {
	return otpDB.ID
}

type OTPManager struct {
	schema 		*OTPDBSchema
	dbManager 	*db.AdminDBManager
	key 		*otp.Key
}

const OTPDB string = "otp_manager"
const ACCOUNT string = "a@admin.tools"

func (otpManager OTPManager) Setup() {
	otpManager.dbManager = new(db.AdminDBManager)
	otpManager.dbManager.DBInit(OTPDB, "OTP-Database")
}

func (otpManager OTPManager) display(data []byte) {
	fmt.Printf("Issuer:       %s\n", otpManager.key.Issuer())
	fmt.Printf("Account Name: %s\n", otpManager.key.AccountName())
	fmt.Printf("Secret:       %s\n", otpManager.key.Secret())
}

func (otpManager OTPManager) GenerateTOTP() (err error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer: "admin.tools",
		AccountName: ACCOUNT,
	})
	if err != nil {
		panic(err)
		return
	}

	otpManager.key = key
	otpManager.schema = new(OTPDBSchema)
	otpManager.schema.Key = key.Secret()
	otpManager.schema.ID = key.AccountName()

	return
}

func (otpManager OTPManager) generatePNG(key *otp.Key) () {
	// Convert TOTP into a PNG
	var buf bytes.Buffer
	img, err := key.Image(200, 200)
	if err != nil {
		panic(err)
	}
	_ = png.Encode(&buf, img)

	// display the QR code to the user.
	otpManager.display(buf.Bytes())
}

func (otpManager OTPManager) GetKeyFromName(name string) (schema *OTPDBSchema, err error) {
	recvBytes, err := otpManager.dbManager.GetOne(name)
	if err != nil {
		log.Println("Could not retrieve secret key for name", name, err)
	}
	schema = new(OTPDBSchema)
	err = otpManager.dbManager.Unmarshal(schema, recvBytes)
	return
}

func (otpManager OTPManager) ValidateOTP(name string, otp string) (validated bool) {
	schema, err := otpManager.GetKeyFromName(name)
	if err != nil {
		log.Println("Could not retrieve secret key for name", name, err)
	}
	if schema.ID == name {
		return totp.Validate(otp, schema.Key)
	} else {
		log.Println("Returned JSON object didn't match with the existing")
	}
	return false
}

func (otpManager OTPManager) ValidateAndSave(name string, otp string) (err error) {
	valid := otpManager.ValidateOTP(name, otp)
	if !valid {
		log.Println("The given OTP did not match the respective key's OTP")
		return errors.New("the given OTP did not match the respective key's OTP")
	}
	log.Println("OTP Validation Successful!")
	return otpManager.dbManager.Save(otpManager.schema)
}

func (otpManager OTPManager) CheckAndSave(name string, key string, otp string) (err error) {
	if otp != "" {
		valid := totp.Validate(otp, key)
		if !valid {
			log.Println("The given OTP did not match the key's OTP")
			return errors.New("the given OTP did not match the key's OTP")
		}
	}
	otpManager.schema = new(OTPDBSchema)
	otpManager.schema.Key = key
	otpManager.schema.ID = name
	return otpManager.dbManager.Save(otpManager.schema)
}

func (otpManager OTPManager) GenerateCodeFromKey(key string) (otp string, err error) {
	otp, err = totp.GenerateCode(key, time.Now())
	return
}

func (otpManager OTPManager) GenerateCodeFromName(name string) (otp string, err error) {
	schema, err := otpManager.GetKeyFromName(name)
	if err != nil {
		log.Println("Couldn't fetch a valid key for name", name, err)
	}
	otp, err = totp.GenerateCode(schema.Key, time.Now())
	return
}

func (otpManager OTPManager) GenerateCodeFromNames(names []string) (otp[] string, err error) {
	for _,name := range names {
		otpcode, err := otpManager.GenerateCodeFromName(name)
		if err != nil{
			log.Println("Couldn't fetch a valid key for name", name, err)
			otp = append(otp, "")
		}
		otp = append(otp, otpcode)
	}
	return
}
