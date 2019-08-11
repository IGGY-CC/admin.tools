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

type Manager struct {
	dbm		*boltsec.DBManager
	logger	*log.Logger
	bucket  string
	Name    string
}

type Data struct {
	maxLength int64
	maxRows int64
}

func New(bucket string, logDesc string) (dbm *Manager) {
	dbm = &Manager{}
	dbm.logger = log.New(os.Stdout, "[" + logDesc + "] ", log.LstdFlags)
	dbm.bucket = bucket
	newDbm, err := boltsec.NewDBManager(bucket+".db", "./", "hello,world", false, []string{bucket})
	if err != nil {
		dbm.logger.Printf("Cannot create database %s", bucket)
	}
	dbm.dbm = newDbm
	dbm.Name = "hello, world"
	return
}

func (dbm Manager) Save(data DataTemplate) (err error) {
	err = dbm.dbm.Save(dbm.bucket, data.GetID(), data)
	if err != nil {
		dbm.logger.Printf("Save data return err: %s", err)
	}
	return
}

func (dbm Manager) GetOne(id string) (bytes []byte, err error) {
	bytes, err = dbm.dbm.GetOne(dbm.bucket, id)
	if err != nil {
		dbm.logger.Printf("GetOne returned err: %s", err)
	}
	return
}

func (dbm Manager) GetAll() (strings []string, err error) {
	dbm.logger.Println("Got call for GetAll...")
	strings, err = dbm.dbm.GetKeyList(dbm.bucket, "")
	if err != nil {
		dbm.logger.Printf("GetAll returned err: %s", err)
	}
	dbm.logger.Println("Returned strings", strings)
	return
}

func (dbm Manager) Delete(id string) {
	if err := dbm.dbm.Delete(dbm.bucket, id); err != nil {
		dbm.logger.Printf("Delete returned err: %s", err)
	}
}

func (dbm Manager) Unmarshal(database interface{}, bytes []byte) (err error) {
	err = json.Unmarshal(bytes, database)
	if err != nil {
		dbm.logger.Printf("json.Unmarshal return err: %s", err)
	}
	return
}