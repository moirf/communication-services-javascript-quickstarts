import {
    CommunicationUserIdentifier,
    PhoneNumberIdentifier,
    createIdentifierFromRawId,
} from "@azure/communication-common";
import { MessageType, Logger } from "./Logger";
import {
    CallAutomationClient,
    CallAutomationEventParser,
    CallAutomationEvent,
    CallMediaRecognizeDtmfOptions,
    DtmfTone,
    RecognizeInputType,
    FileSource,
    CallInvite,
    AnswerCallResult,
    PlayOptions,
} from "@azure/communication-call-automation";
import { Request, Response } from "express";
import { SubscriptionValidationEventData, CloudEvent } from "@azure/eventgrid";


var configuration = require("./config");
var express = require("express");
var router = express.Router();
var fileSystem = require("fs");
var path = require("path");

var callAutomationEventParser=new CallAutomationEventParser();
var callInvite: CallInvite;
var baseUri = configuration.BaseUri;
var userIdentityRegex = new RegExp(
    "8:acs:[0-9a-fA-F]{8}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{12}_[0-9a-fA-F]{8}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{12}"
);
var phoneIdentityRegex = new RegExp("^\\+\\d{10,14}$");
enum CommunicationIdentifierKind {
    UserIdentity,
    PhoneIdentity,
    UnknownIdentity,
}
var identifierKind = getIdentifierKind(configuration.TargetIdentifier);
var client = new CallAutomationClient(configuration.ConnectionString);
var sourceCallerId: PhoneNumberIdentifier = {
    phoneNumber: configuration.ACSAlternatePhoneNumber,
};
async function runSample(req: Request, res: Response) {
    try {
        Logger.logMessage(MessageType.INFORMATION, "Request data ---- >" + JSON.stringify(req.body));
        var eventGridEvents = req.body;
        for (var eventGridEvent of eventGridEvents) {
            Logger.logMessage(MessageType.INFORMATION, "Incoming Call event received " + JSON.stringify(eventGridEvent));
            if (eventGridEvent.eventType == "Microsoft.EventGrid.SubscriptionValidationEvent") {
                var subscriptionValidationEventData:SubscriptionValidationEventData=eventGridEvent.data;
                if (subscriptionValidationEventData.validationCode) {
                    let responseData = {validationResponse: subscriptionValidationEventData.validationCode};
                    return res.json(responseData);
                }
            }
            var callerId = eventGridEvent.data["from"]["rawId"].toString();
            var incomingCallContext = eventGridEvent.data["incomingCallContext"].toString();
            var callbackUri = baseUri + `/api/calls?callerId=${callerId}`;
            var answerCallResult: AnswerCallResult = await client.answerCall(incomingCallContext, callbackUri);
        }
        return res.json('Ok')
    } catch (ex) {
        Logger.logMessage(MessageType.ERROR, "Failed to answer the call Exception -- > " + ex.message);
    }
}

//api to handle call back events
async function callbacks(req:Request) {
   var cloudEvents: CloudEvent<CallAutomationEvent>[]=req.body;
    var audioPlayOptions: PlayOptions = {
        loop: false,
        operationContext: "SimpleIVR",
    };
   
    try {
        cloudEvents.forEach(async (cloudEvent) => {
            Logger.logMessage(MessageType.INFORMATION, "Event received: " + JSON.stringify(cloudEvent));
            var eventType:CallAutomationEvent = await callAutomationEventParser.parse(JSON.stringify(cloudEvent));
            
            if (eventType?.callConnectionId) {
                var callConnection = client.getCallConnection(eventType.callConnectionId);
                var callMedia = callConnection?.getCallMedia();
                var playSource: FileSource = { uri: "" };
                if (eventType.kind == "CallConnected") {
                    // Start recognize prompt - play audio and recognize 1-digit DTMF input
                    Logger.logMessage(MessageType.INFORMATION, "CallConnected event received for call connection id: " + eventType.callConnectionId);
                    playSource.uri = configuration.BaseUri + configuration.MainMenuAudio;
                    playSource.playSourceId = "ReminderMenu";
                    var recognizeOptions: CallMediaRecognizeDtmfOptions = {
                        interruptPrompt: true,
                        interToneTimeoutInSeconds: 10,
                        maxTonesToCollect: 1,
                        recognizeInputType: RecognizeInputType.Dtmf,
                        targetParticipant: createIdentifierFromRawId(req.query.callerId as string),
                        operationContext: "MainMenu",
                        playPrompt: playSource,
                        initialSilenceTimeoutInSeconds: 5,
                    };

                    //Start recognition
                    await callMedia.startRecognizing(recognizeOptions);
                }
                if (eventType.kind == "RecognizeCompleted" && eventType.operationContext == "MainMenu") {
                    var recognizeCompleted = eventType;
                    var toneDetected = recognizeCompleted.collectTonesResult.tones[0];
                    if (toneDetected == DtmfTone.One) {
                        playSource.uri = baseUri + configuration.SalesAudio;
                        var salesAudio = playSource;
                        await callMedia.playToAll(salesAudio, audioPlayOptions);
                    } else if (toneDetected == DtmfTone.Two) {
                        playSource.uri = baseUri + configuration.MarketingAudio;
                        var marketingAudio = playSource;
                        await callMedia.playToAll(marketingAudio, audioPlayOptions);
                    } else if (toneDetected == DtmfTone.Three) {
                        playSource.uri = baseUri + configuration.CustomerCareAudio;
                        var customerCareAudio = playSource;
                        await callMedia.playToAll(customerCareAudio, audioPlayOptions);
                    } else if (toneDetected == DtmfTone.Four) {
                        playSource.uri = baseUri + configuration.AgentAudio;
                        var agentAudio = playSource;
                        audioPlayOptions.operationContext = "AgentConnect";
                        await callMedia.playToAll(agentAudio, audioPlayOptions);
                    } else if (toneDetected == DtmfTone.Five) {
                        // Hangup for everyone
                        await callConnection.hangUp(true);
                    } else {
                        playSource.uri = baseUri + configuration.InvalidAudio;
                        var invalidAudio = playSource;
                        await callMedia.playToAll(invalidAudio, audioPlayOptions);
                    }
                }
                if (eventType.kind == "RecognizeFailed" && eventType.operationContext == "MainMenu") {
                    playSource.uri = baseUri + configuration.InvalidAudio;
                    // play invalid audio
                    await callMedia.playToAll(playSource, audioPlayOptions);
                }
                if (eventType.kind == "PlayCompleted") {
                    // if (eventType.operationContext == "AgentConnect") {
                        var participantToAdd = configuration.ParticipantToAdd;
                        if (participantToAdd) {
                            identifierKind=getIdentifierKind(participantToAdd)
                            if (identifierKind == CommunicationIdentifierKind.PhoneIdentity) {
                                var phoneNumber: PhoneNumberIdentifier = {
                                    phoneNumber: participantToAdd,
                                };
                                callInvite = new CallInvite(phoneNumber, sourceCallerId);
                            } else if (
                                identifierKind == CommunicationIdentifierKind.UserIdentity
                            ) {
                                var communicationUser: CommunicationUserIdentifier = {
                                    communicationUserId: participantToAdd,
                                };
                                callInvite = new CallInvite(communicationUser);
                            }

                            Logger.logMessage(MessageType.INFORMATION, "Performing add Participant operation");
                            var addParticipantResponse = await callConnection.addParticipant(callInvite);
                            Logger.logMessage(MessageType.INFORMATION, "Call initiated with Call Leg id -- >" + addParticipantResponse.participant);
                        }
                    // }
                    // if (eventType.operationContext == "SimpleIVR") {
                            await callConnection.hangUp(true);
                    // }
                }
                if (eventType.kind == "PlayFailed") {
                    Logger.logMessage(MessageType.INFORMATION, "PlayFailed Event: " + JSON.stringify(eventType));
                    await callConnection.hangUp(true);
                }
            }
        });
    } catch (ex) { 
        Logger.logMessage(MessageType.ERROR, "Call objects failed to get connection id -- > " + ex.message);
    }
}

function getIdentifierKind(participantNumber: string) {
    // checks the identity type returns as string
    return userIdentityRegex.test(participantNumber) ?
        CommunicationIdentifierKind.UserIdentity : phoneIdentityRegex.test(participantNumber) ?
            CommunicationIdentifierKind.PhoneIdentity : CommunicationIdentifierKind.UnknownIdentity;
}

var program = function () {
    // Api to initiate call
    router.route("/api/incomingCall").post(async function (req: Request, res: Response) {
        Logger.logMessage(MessageType.INFORMATION, "Starting ACS Sample App");
        try {
            if (baseUri) {
                var task = await new Promise((resolve) => runSample(req, res));
            } else {
                Logger.logMessage(MessageType.ERROR, "Failed to start Ngrok service");
            }
        } catch (e) {
            let statusCode = e.statusCode || e.status || "500";
            let name = e.message || e.name || "Some error occurred";
            Logger.logMessage(MessageType.ERROR, e.message);
            return res.status(statusCode).json(String(name));
        }
    });

    router.route("/api/calls").post(function(req: Request, res: Response) {
        console.log("req.body \n" + req.body);
        callbacks(req);
        res.status(200).send("OK");
    });

    router.route("/audio").get(function (req: Request, res: Response) {
        var fileName = "/audio/" + req.query.filename;
        var filePath = path.join(__dirname, fileName);
        var stat = fileSystem.statSync(filePath);

        res.writeHead(200, {
            "Content-Type": "audio/x-wav",
            "Content-Length": stat.size,
        });
        var readStream = fileSystem.createReadStream(filePath);
        // We replaced all the event handlers with a simple call to readStream.pipe()
        readStream.pipe(res);
    });

    return router;
};
module.exports = program;