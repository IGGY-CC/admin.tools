let DataStore = require('nedb');

const DB_PATH = "./databases/";
const ENCRYPT = true;

class LocalDB {
    constructor() {
        this.memDB = new DataStore();
        this.privateKey = null;
        this.publicKey = null;
    }

    load(name) {
        return new DataStore({filename: DB_PATH + name, autoload: true});
    }

    insert(db, doc, callback=()=>{}) {
        if(!db) {
            this.memDB.insert(doc, callback.bind(null));
        } else {
            if (ENCRYPT) {
                let encryptedDoc = this.encryptDoc(doc);
                db.insert(encryptedDoc, callback.bind(null));
            }
        }
    }

    remove(db, key, value, callback=()=>{}) {
        if(!db) db = this.memDB;
        db.remove({ [key]: value }, {multi: true}, callback.bind(null));
    }

    encryptDoc(doc) {
        Object.keys(doc).forEach(key => {
            if(typeof doc[key] === "object") {
                doc[key] = this.encryptDoc(doc[key]);
            } else {
                doc[key] = this.encrypt(doc[key]);
            }
        });
        return doc;
    }

    encrypt(text) {
        // Do something to encrypt this
        return text;
    }
}

module.exports = new LocalDB();