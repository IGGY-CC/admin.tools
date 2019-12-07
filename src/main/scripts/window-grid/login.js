'use strict';

const { remote } = require('electron');
const protocol = remote.protocol;

class Login {
    constructor(parent) {
        this.loggedIn = false;
        this.parent = parent;
        this.register = false;
        this.authServer = "muse.am";
        this.authPort = 443;
        this.api = {
            login: this,
            fetch: fetch,
        };
    }

    setupUI(isRegister=false) {
        if(!this.loggedIn) {
            // UI inspired by youtube video by "Red Stapler" @ https://youtu.be/V-J3AWFXIYM

            let login = UtilsUI.createNewElement('div', this.parent, null, 'login');
            let logo = UtilsUI.createNewElement('div', login, null, 'logo');
            let title = UtilsUI.createNewElement('div', login, null, "title");
            title.innerHTML = "muse.am";
            let subTitle = UtilsUI.createNewElement('div', login, null, "sub-title");
            subTitle.innerHTML = "Sysadmin Tools";
            let loginData = UtilsUI.createNewElement('div', login, null, "fields");

            let usernameDiv = UtilsUI.createNewElement('div', loginData, null, "username");
            UtilsUI.createNewElement('span', usernameDiv, null, "fa fa-lock");
            let username = UtilsUI.createNewElement('input', usernameDiv, "username-input", "user-input");
            username.placeholder = "Username";
            username.type = "username";


            let privateKeyDiv = UtilsUI.createNewElement('div', loginData, null, "password");
            // UtilsUI.createNewElement('span', privateKeyDiv, null, "fa fa-lock");
            let privateKeyLabel = UtilsUI.createNewElement('label', privateKeyDiv, null, "file");
            let privateKey = UtilsUI.createNewElement('input', privateKeyLabel, "file");
            privateKey.ariaLabel = "Upload Private Key";
            privateKey.placeholder = "Private Key";
            privateKey.type = "file";
            let privateKeyCustom = UtilsUI.createNewElement('span', privateKeyLabel, null, "file-custom");
            privateKeyCustom.setAttribute('file-name', "Load Private keys...");
            privateKey.onchange = this.handleUploadFile.bind(null, privateKey, privateKeyCustom);

            let loginButton = UtilsUI.createNewElement('button', login, null, "loginButton");
            if(isRegister) {
                loginButton.innerHTML = "REGISTER";
            } else {
                loginButton.innerHTML = "LOGIN";
            }

            loginButton.addEventListener("click", (evt) => {
                console.log(evt.target);
                if(isRegister) {
                    this.registerUser();
                } else {
                    this.loginUser();
                }
            });

            let register = UtilsUI.createNewElement('div', login, null, 'registerLink');
            let registerLink = UtilsUI.createNewElement('a', register);
            registerLink.href = "#";
            if(isRegister) {
                registerLink.innerHTML = "Login";
            } else {
                registerLink.innerHTML = "Register";
            }

            registerLink.addEventListener("click", evt => {
                console.log("Register clicked!");
                evt.preventDefault();
                UtilsUI.removeElement(null, this.parent, true);
                this.setupUI(!isRegister);
            }, false);

        }
    }

    handleUploadFile(file, element) {
        element.setAttribute('file-name', file.files[0].name);
        file.style.color = "white";
    }

    // WebAuthn code from https://github.com/hbolimovsky/webauthn-example/blob/master/index.html
    bufferDecode(value) {
        // return Uint8Array.from(atob(value), c => {
        //     return c.charCodeAt(0);
        // });
        let raw = atob(value);
        let rawLength = raw.length;
        let array = new Uint8Array(new ArrayBuffer(rawLength));

        for(let i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
        }

        return array;
    }

    // ArrayBuffer to URLBase64
    bufferEncode(value) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(value)))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");;
    }

    registerUser() {
        let username = document.querySelector("#username-input").value;
        if (username === "") {
            alert("Please enter a username");
            return;
        }

        this.wss = new Socket("https", this.authServer, this.authPort, true);
        this.wss.urlPath = "/register/begin/" + username;
        this.api.makeConnection = this.wss.makeConnection.bind(this);
        this.api.wss = this.wss;
        this.api.alert = alert;
        this.api.authServer = this.authServer;
        this.api.authPort = this.authPort;


        let plugin = new Jailed.Plugin("https://muse.am/web/scripts/login.js", this.api);
        // let code = "application.remote.alert('Hello from the plugin!');";
        // let plugin = new jailed.DynamicPlugin(code, api);

        // wss.makeConnection((data) => {
        //     data.then(options => {
        //         console.log("OPTIONS RECEIVED: ", options);
        //         options.publicKey.challenge = this.bufferDecode(options.publicKey.challenge);
        //         options.publicKey.user.id = this.bufferDecode(options.publicKey.user.id);
        //         if (options.publicKey.excludeCredentials) {
        //             for (let i = 0; i < options.publicKey.excludeCredentials.length; i++) {
        //                 options.publicKey.excludeCredentials[i].id = bufferDecode(options.publicKey.excludeCredentials[i].id);
        //             }
        //         }
        //         let t = navigator.credentials.create({
        //             publicKey: options.publicKey
        //         });
        //         console.log("CREDENTIALS: ", t);
        //         return "hello";
        //     }).then((data) => {
        //         console.log("2ND OPTIONS RECEIVED: ", data);
        //     }).catch((data) => {
        //         console.error(data);
        //     });
        // }, (data) => {
        //     console.log("DATA RECEIVE FAILED: ", data);
        // });
    }

    test() {
        $.get(
            '/register/begin/' + username,
            null,
            function (data) {
                return data
            },
            'json')
            .then((credentialCreationOptions) => {
                console.log(credentialCreationOptions)
                credentialCreationOptions.publicKey.challenge = bufferDecode(credentialCreationOptions.publicKey.challenge);
                credentialCreationOptions.publicKey.user.id = bufferDecode(credentialCreationOptions.publicKey.user.id);
                if (credentialCreationOptions.publicKey.excludeCredentials) {
                    for (var i = 0; i < credentialCreationOptions.publicKey.excludeCredentials.length; i++) {
                        credentialCreationOptions.publicKey.excludeCredentials[i].id = bufferDecode(credentialCreationOptions.publicKey.excludeCredentials[i].id);
                    }
                }
                return navigator.credentials.create({
                    publicKey: credentialCreationOptions.publicKey
                })
            })
            .then((credential) => {
                console.log(credential)
                let attestationObject = credential.response.attestationObject;
                let clientDataJSON = credential.response.clientDataJSON;
                let rawId = credential.rawId;
                $.post(
                    '/register/finish/' + username,
                    JSON.stringify({
                        id: credential.id,
                        rawId: bufferEncode(rawId),
                        type: credential.type,
                        response: {
                            attestationObject: bufferEncode(attestationObject),
                            clientDataJSON: bufferEncode(clientDataJSON),
                        },
                    }),
                    function (data) {
                        return data
                    },
                    'json')
            })
            .then((success) => {
                alert("successfully registered " + username + "!");
                return
            })
            .catch((error) => {
                console.log(error);
                alert("failed to register " + username);
            })
    }

    loginUser() {
        username = $("#email").val()
        if (username === "") {
            alert("Please enter a username");
            return;
        }
        $.get(
            '/login/begin/' + username,
            null,
            function (data) {
                return data
            },
            'json')
            .then((credentialRequestOptions) => {
                console.log(credentialRequestOptions)
                credentialRequestOptions.publicKey.challenge = bufferDecode(credentialRequestOptions.publicKey.challenge);
                credentialRequestOptions.publicKey.allowCredentials.forEach(function (listItem) {
                    listItem.id = bufferDecode(listItem.id)
                });
                return navigator.credentials.get({
                    publicKey: credentialRequestOptions.publicKey
                })
            })
            .then((assertion) => {
                console.log(assertion)
                let authData = assertion.response.authenticatorData;
                let clientDataJSON = assertion.response.clientDataJSON;
                let rawId = assertion.rawId;
                let sig = assertion.response.signature;
                let userHandle = assertion.response.userHandle;
                $.post(
                    '/login/finish/' + username,
                    JSON.stringify({
                        id: assertion.id,
                        rawId: bufferEncode(rawId),
                        type: assertion.type,
                        response: {
                            authenticatorData: bufferEncode(authData),
                            clientDataJSON: bufferEncode(clientDataJSON),
                            signature: bufferEncode(sig),
                            userHandle: bufferEncode(userHandle),
                        },
                    }),
                    function (data) {
                        return data
                    },
                    'json')
            })
            .then((success) => {
                alert("successfully logged in " + username + "!")
                return
            })
            .catch((error) => {
                console.log(error)
                alert("failed to register " + username)
            })
    }
}

module.exports = new Login(document.querySelector("#login"));