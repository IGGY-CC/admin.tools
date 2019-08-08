package db

import (
	"encoding/json"
	"log"
	"os"

	"github.com/linkthings/boltsec"
)

type DataTemplate interface {
	GetID() (id string)
}

type AdminDBManager struct {
	dbm		*boltsec.DBManager
	logger	*log.Logger
	bucket  string
}

func (dbm AdminDBManager) DBInit(bucket string, logDesc string) {
	dbm.logger = log.New(os.Stdout, "[" + logDesc + "] ", log.LstdFlags)
	dbm.bucket = bucket
	newDbm, err := boltsec.NewDBManager(bucket+".db", "admin.tools", "hello,world", false, []string{bucket})
	if err != nil {
		dbm.logger.Printf("Cannot create database %s", bucket)
	}
	dbm.dbm = newDbm
}

func (dbm AdminDBManager) Save(data DataTemplate) (err error) {
	err = dbm.dbm.Save(dbm.bucket, data.GetID(), data)
	if err != nil {
		dbm.logger.Printf("Save data return err: %s", err)
	}
	return
}

func (dbm AdminDBManager) GetOne(id string) (bytes []byte, err error) {
	bytes, err = dbm.dbm.GetOne(dbm.bucket, id)
	if err != nil {
		dbm.logger.Printf("GetOne returned err: %s", err)
	}
	return
}

func (dbm AdminDBManager) Delete(id string) {
	if err := dbm.dbm.Delete(dbm.bucket, id); err != nil {
		dbm.logger.Printf("Delete returned err: %s", err)
	}
}

func (dbm AdminDBManager) Unmarshal(database interface{}, bytes []byte) (err error) {
	err = json.Unmarshal(bytes, database)
	if err != nil {
		dbm.logger.Printf("json.Unmarshal return err: %s", err)
	}
	return
}