const dialogflow = require('dialogflow');
const uuid = require('uuid');

// IMPORTANT: Before executing, create an environment variable in the command prompt
// and then do `npm start`
// set GOOGLE_APPLICATION_CREDENTIALS=C:\AdityaNagaSanjeevi\Programming\MyLiveProducts\admin.tools\admin.tools\src\main\scripts\assistants\dialogflow\AppointmentScheduler-8ba0293f3f52.json
//
assistant = {};

assistant.dialogFlow = function(projectID) {
    this.projectID = projectID;
    const SESSION_ID = uuid.v4();

    this.sessionClient = new dialogflow.SessionsClient();
    this.sessionPath = this.sessionClient.sessionPath(projectID, SESSION_ID);

    this.defaultMode = 1; // text 1, voice 2
};

assistant.dialogFlow.prototype.createRequest = function(text, langCode="en-US") {
    return {
        session: this.sessionPath,
        queryInput: {
            text: {
                text: text,
                languageCode: langCode,
            },
        },
    };
};

assistant.dialogFlow.prototype.send = async function(text, lang) {
    return this.communicate(this.createRequest(text, lang));
};

assistant.dialogFlow.prototype.communicate = async function(request) {
    const responses = await this.sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    return result.fulfillmentText;
};

// dfAssistant = new assistant.dialogFlow('appointmentscheduler-bjacvw');
// dfAssistant.send('hi').then(resp => {
//     console.log("Received response: ", resp);
//     return dfAssistant.send('appointment');
//     // this.send('appointment');
// }).then(resp => {
//     console.log("Received second response: ", resp);
// }).catch(err => {
//     console.error("Received error:", err);
// });

module.exports = assistant.dialogFlow;