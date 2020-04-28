const Alexa = require("ask-sdk-core");
// ASK SDK adapter to connecto to Amazon S3
const persistenceAdapter = require("ask-sdk-s3-persistence-adapter");

/////////////////////////////////
// Helper Function
/////////////////////////////////
const calculateRisk = ({ fever, cold, travel }) => {
  let frisk = 0;
  let crisk = 0;
  let trisk = 0;
  switch (fever) {
    case "high fever":
      frisk = 99;
      break;
    case "mild fever":
      frisk = 66;
      break;
    case "no fever":
      frisk = 33;
      break;
  }
  switch (cold) {
    case "severe cold":
      crisk = 99;
      break;
    case "mild cold":
      frisk = 66;
      break;
    case "no cold":
      frisk = 33;
      break;
  }
  switch (travel) {
    case "yes":
      trisk = 80;
      break;
    case "no":
      trisk = 10;
      break;
  }
  const risk = (frisk + crisk + trisk) / 3;
  console.log("RISK ====> ", risk);
  if (0 < risk && risk <= 33) return "low";
  if (33 < risk && risk <= 66) return "moderate";
  if (66 < risk && risk <= 100) return "high";
};

/////////////////////////////////
// Handlers Definition
/////////////////////////////////

/**
 * Handles LaunchRequest requests sent by Alexa
 * Note : this type of request is send when the user invokes your skill without providing a specific intent.
 */

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  handle(handlerInput) {
    const speakOutput = "Hi, Lets start your Covid symptoms test...";

    return handlerInput.responseBuilder
      .addDelegateDirective({
        name: "FeverSymptomIntent",
        confirmationStatus: "NONE",
        slots: {},
      })
      .speak(speakOutput)
      .getResponse();
  },
};

const FeverSymptomIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "FeverSymptomIntent"
    );
  },
  async handle(handlerInput) {
    const { attributesManager, requestEnvelope } = handlerInput;
    const feverSymptom = Alexa.getSlotValue(requestEnvelope, "fever");
    const symptoms = {
      fever: feverSymptom,
    };
    attributesManager.setPersistentAttributes(symptoms);
    await attributesManager.savePersistentAttributes();

    const speakOutput = `Okay, I got that you have ${feverSymptom}`;

    return handlerInput.responseBuilder
      .addDelegateDirective({
        name: "ColdSymptomIntent",
        confirmationStatus: "NONE",
        slots: {},
      })
      .speak(speakOutput)
      .getResponse();
  },
};

const ColdSymptomIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "ColdSymptomIntent"
    );
  },
  async handle(handlerInput) {
    const { attributesManager, requestEnvelope } = handlerInput;
    const prevSymptoms = await attributesManager.getPersistentAttributes();
    console.log("Prevoius Symp in COLD===> ", prevSymptoms);
    const coldSymptom = Alexa.getSlotValue(requestEnvelope, "cold");
    prevSymptoms.cold = coldSymptom;
    attributesManager.setPersistentAttributes(prevSymptoms);
    await attributesManager.savePersistentAttributes();

    const speakOutput = `I got that you have ${coldSymptom}`;

    return handlerInput.responseBuilder
      .addDelegateDirective({
        name: "TravelIntent",
        confirmationStatus: "NONE",
        slots: {},
      })
      .speak(speakOutput)
      .getResponse();
  },
};

const TravelIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "TravelIntent"
    );
  },
  async handle(handlerInput) {
    const { attributesManager, requestEnvelope } = handlerInput;
    const symptoms = await attributesManager.getPersistentAttributes();
    console.log("Prevoius Symp in TRAVEL===> ", symptoms);
    const travel = Alexa.getSlotValue(requestEnvelope, "travelhistory");
    symptoms.travel = travel;
    attributesManager.setPersistentAttributes(symptoms);
    await attributesManager.savePersistentAttributes();
    const risk = await calculateRisk(symptoms);
    const speakOutput = `You have a ${risk} risk of getting infected with Coronavirus. Be indoors,be safe!`;
    console.log("OUTPUT ====> ", speakOutput);
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput = handlerInput.t("HELP_MSG");

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speakOutput = handlerInput.t("GOODBYE_MSG");

    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};

/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs
 * */
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "SessionEndedRequest"
    );
  },
  handle(handlerInput) {
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${error.message}`);
    const speakOutput = handlerInput.t("ERROR_MSG");

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

/////////////////////////////////
// Interceptors Definition
/////////////////////////////////

/**
 * This request interceptor will log all incoming requests in the associated Logs (CloudWatch) of the AWS Lambda functions
 */
const LoggingRequestInterceptor = {
  process(handlerInput) {
    console.log(
      "\n" +
        "********** REQUEST *********\n" +
        JSON.stringify(handlerInput, null, 4)
    );
  },
};

/**
 * This response interceptor will log outgoing responses if any in the associated Logs (CloudWatch) of the AWS Lambda functions
 */
const LoggingResponseInterceptor = {
  process(handlerInput, response) {
    if (response)
      console.log(
        "\n" +
          "************* RESPONSE **************\n" +
          JSON.stringify(response, null, 4)
      );
  },
};

/////////////////////////////////
// SkillBuilder Definition
/////////////////////////////////

/**
 * The SkillBuilder acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom.
 */
exports.handler = Alexa.SkillBuilders.custom()
  .withPersistenceAdapter(
    new persistenceAdapter.S3PersistenceAdapter({
      bucketName: process.env.S3_PERSISTENCE_BUCKET,
    })
  )
  .addRequestHandlers(
    LaunchRequestHandler,
    FeverSymptomIntentHandler,
    ColdSymptomIntentHandler,
    TravelIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  ) // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(LoggingRequestInterceptor)
  .addResponseInterceptors(LoggingResponseInterceptor)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();
