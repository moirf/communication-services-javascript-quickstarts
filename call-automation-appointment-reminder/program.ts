import { CommunicationIdentityClient } from "@azure/communication-identity";
var configuration = require("./config");
import {
  CommunicationIdentifier,
  CommunicationUserIdentifier,
  PhoneNumberIdentifier,
} from "@azure/communication-common";
import { MessageType, Logger } from "./Logger";
import { CallConfiguration } from "./CallConfiguration";
import {
  CallAutomationClient,
  CallConnection,
  CreateCallOptions,
  CreateCallResult,
  CallAutomationEventParser,
  CallAutomationEvent,
  CallConnected,
  CallMediaRecognizeDtmfOptions,
  DtmfTone,
  RecognizeInputType,
  RecognizeCompleted,
  FileSource,
  CallInvite,
} from "@azure/communication-call-automation";
import { CloudEvent } from "@azure/eventgrid";
import { Request, Response } from "express";

var express = require("express");
var router = express.Router();
var fileSystem = require("fs");
var path = require("path");

 var url = "http://localhost:8080";
  var serverPort = "8080";
 var callConfiguration: CallConfiguration;
  var callAutomationClient: CallAutomationClient;
  var callConnection: CreateCallResult;
  var callAutomationEventParser: CallAutomationEventParser;
  var callAutomationEvent: CallAutomationEvent;
 
    var appBaseUrl: string = configuration.AppBaseUri;
     callConfiguration=await initiateConfiguration(
      appBaseUrl
    );
    callAutomationClient = new CallAutomationClient(
      callConfiguration.connectionString
    );
  //api to handle call back events
   async function callbacks(
    cloudEvents: CloudEvent<CallAutomationEvent>[],
    callConfiguration: CallConfiguration
  ) {
    cloudEvents.forEach(async (cloudEvent) => {
      Logger.logMessage(
        MessageType.INFORMATION,
        "Event received: " + JSON.stringify(cloudEvent)
      );

      var event = callAutomationEventParser.parse(
        JSON.stringify(cloudEvent)
      );
      var callConnection = callAutomationClient.getCallConnection(
        event.then.name
      );
      var callConnectionMedia = callConnection.getCallMedia();
      var eventResponse = await event.then((response) => response);
      if (eventResponse.kind == "CallConnected") {
        var target: CommunicationUserIdentifier = {
          communicationUserId: callConfiguration.targetPhoneNumber,
        };
        //Initiate recognition as call connected event is received
        Logger.logMessage(
          MessageType.INFORMATION,
          "CallConnected event received for call connection id: " +
            eventResponse.callConnectionId
        );
        var date = Date.now().toString();
        var recognizeOptions: CallMediaRecognizeDtmfOptions = {
          interToneTimeoutInSeconds: ConvertTime(10),
          // interToneTimeoutInSeconds: TimeSpan.fromSeconds(10) as unknown as number,
          maxTonesToCollect: 1,
          stopDtmfTones: DtmfTone[5],
          kind: "callMediaRecognizeDtmfOptions",
          recognizeInputType: RecognizeInputType.Dtmf,
          targetParticipant: target,
        };
        //Start recognition
        await callConnectionMedia.startRecognizing(recognizeOptions);
      }
      if (eventResponse.kind == "RecognizeCompleted") {
        // Play audio once recognition is completed sucessfully
        Logger.logMessage(
          MessageType.INFORMATION,
          "RecognizeCompleted event received for call connection id: " +
            eventResponse.callConnectionId
        );
        var recognizeCompletedEvent: RecognizeCompleted = eventResponse;
        var toneDetected = (
          recognizeCompletedEvent?.collectTonesResult?.tones
            ? recognizeCompletedEvent?.collectTonesResult?.tones[0]
            : undefined
        ) as DtmfTone;
        var playSource = GetAudioForTone(toneDetected, callConfiguration);
        // Play audio for dtmf response
        await callConnectionMedia.playToAll(playSource, {
          operationContext: "ResponseToDtmf",
          loop: false,
        });
      }
      if (eventResponse.kind == "RecognizeFailed") {
        Logger.logMessage(
          MessageType.INFORMATION,
          "RecognizeFailed event received for call connection id: " +
            eventResponse.callConnectionId
        );
        var recognizeFailedEvent = eventResponse;
        let playSource: FileSource = { uri: "" };
        // Check for time out, and then play audio message
        // if (recognizeFailedEvent.resultInformation?.subCode==(ReasonCode.RecognizeInitialSilenceTimedOut))
        if (recognizeFailedEvent.resultInformation?.subCode == 8510) {
          Logger.logMessage(
            MessageType.INFORMATION,
            "Recognition timed out for call connection id: " +
              eventResponse.callConnectionId
          );
          playSource.uri =
            callConfiguration.appBaseUri + callConfiguration.TimedoutAudio;

          //Play audio for time out
          await callConnectionMedia.playToAll(playSource, {
            operationContext: "ResponseToDtmf",
            loop: false,
          });
        }
      }
      if (eventResponse.kind == "PlayCompleted") {
        Logger.logMessage(
          MessageType.INFORMATION,
          "PlayCompleted event received for call connection id: " +
            eventResponse.callConnectionId
        );
        await callConnection.hangUp(true);
      }
      if (eventResponse.kind == "PlayFailed") {
        Logger.logMessage(
          MessageType.INFORMATION,
          "PlayFailed event received for call connection id: " +
            eventResponse.callConnectionId
        );
        await callConnection.hangUp(true);
      }
    });
    // return Results.Ok();
  }
  async function runSample(callConfiguration:CallConfiguration,callAutomationClient:CallAutomationClient) {
    try {
      var sourcePhoneNumber: PhoneNumberIdentifier = {
        phoneNumber: callConfiguration.sourcePhoneNumber,
      };
      var targetPhoneNumber: PhoneNumberIdentifier = {
        phoneNumber: callConfiguration.targetPhoneNumber,
      };

      // var createCallOption = new CreateCallOptions(callInvite, new Uri(callConfiguration.Value.CallbackEventUri));
      var callInviteOptions = new CallInvite(targetPhoneNumber, sourcePhoneNumber);
      var createCallOptions: CreateCallOptions = {
        sourceCallIdNumber: sourcePhoneNumber,
        sourceDisplayName: "Reminder App",
      };

      Logger.logMessage(
        MessageType.INFORMATION,
        "Performing CreateCall operation"
      );

      this.callConnection = await callAutomationClient.createCall(
        callInviteOptions,
        callConfiguration.appCallbackUrl,
        createCallOptions
      );

      Logger.logMessage(
        MessageType.INFORMATION,
        "Reponse from create call: " +
          this.callConnection +
          "CallConnection Id : " +
          this.callConnection.callConnectionProperties.callConnectionId
      );
    } catch (ex) {
      Logger.logMessage(
        MessageType.ERROR,
        "Failed to initiate the reminder call Exception -- > " + ex.getMessage()
      );
    }
    await this.deleteUser(
      callConfiguration.connectionString,
      callConfiguration.sourcePhoneNumber
    );
  }

  /// <summary>
  /// Fetch configurations from App Settings and create source identity
  /// </summary>
  /// <param name="appBaseUrl">The base url of the app.</param>
  /// <returns>The <c CallConfiguration object.</returns>
  async function initiateConfiguration(appBaseUrl: string) {
    var connectionString = configuration.ConnectionString;
    var sourcePhoneNumber = configuration.SourcePhoneNumber;
    var targetPhoneNumber = configuration.TargetPhoneNumber;
    var appBaseUri = appBaseUrl;
    var eventCallBackRoute = configuration.EventCallBackRoute;
    var appointmentReminderMenuAudio =
      configuration.AppointmentReminderMenuAudio;
    var appointmentConfirmedAudio = configuration.AppointmentConfirmedAudio;
    var appointmentCancelledAudio = configuration.AppointmentCancelledAudio;
    var invalidInputAudio = configuration.InvalidInputAudio;
    var timedoutAudio = configuration.TimedoutAudio;
    var ngrokExePath = configuration.NgrokExePath;
    return new CallConfiguration(
      connectionString,
      sourcePhoneNumber,
      targetPhoneNumber,
      appBaseUri,
      eventCallBackRoute,
      appointmentReminderMenuAudio,
      appointmentConfirmedAudio,
      appointmentCancelledAudio,
      invalidInputAudio,
      timedoutAudio,
      ngrokExePath
    );
  }
   function GetAudioForTone(
    toneDetected: DtmfTone,
    callConfiguration: CallConfiguration
  ) {
    let playSource: FileSource = { uri: "" };

    if (toneDetected == DtmfTone.One) {
      playSource.uri =
        callConfiguration.appBaseUri +
        callConfiguration.appointmentConfirmedAudio;
    } else if (toneDetected == DtmfTone.Two) {
      playSource.uri =
        callConfiguration.appBaseUri +
        callConfiguration.appointmentCancelledAudio;
    } // Invalid Dtmf tone
    else {
      playSource.uri =
        callConfiguration.appBaseUri + callConfiguration.invalidInputAudio;
    }

    return playSource;
  }
  // Api to initiate out bound call
   function ConvertTime(num: number) {
    let hours = Math.floor(num / 60).toString();
    if (hours.length === 1) {
      hours = "0" + hours;
    }
    let minutes = Math.floor(num % 60).toString();
    if (minutes.length === 1) {
      minutes = "0" + minutes;
    }
    let seconds = Math.floor((num % 60) % 60).toString();
    if (seconds.length === 1) {
      seconds = "0" + seconds;
    }
    let totalTime = `${hours}:${minutes}:${seconds}`;
    return Number(totalTime);
  }
 
  /// <summary>
  /// Create new user
  /// </summary>
  async function createUser(connectionString) {
    const client = new CommunicationIdentityClient(connectionString);
    const user = await client.createUser();
    return user.communicationUserId;
  }

  /// <summary>
  /// Delete the user
  /// </summary>
  async function deleteUser(connectionString: string, source: string) {
    const client = new CommunicationIdentityClient(connectionString);
    var user: CommunicationUserIdentifier = { communicationUserId: source };
    client.deleteUser(user);
  }

var program = function () {
  router.route("/api/call").post(async function (req: Request, res: Response) {
    Logger.logMessage(MessageType.INFORMATION, "Starting ACS Sample App");
    // Start Ngrok service
    const ngrokUrl = configuration.AppBaseUri;
    try {
      if (ngrokUrl) {
        Logger.logMessage(
          MessageType.INFORMATION,
          "Server started at:" + this.url
        );
        await runSample(this.callConfiguration,this.callAutomationClient);
      } else {
        Logger.logMessage(MessageType.ERROR, "Failed to start Ngrok service");
      }
    } catch (ex) {
      Logger.logMessage(
        MessageType.ERROR,
        "Failed to start Ngrok service : " + ex.message
      );
    }
    Logger.logMessage(
      MessageType.INFORMATION,
      "Press 'Ctrl + C' to exit the sample"
    );
    res.status(200).send("OK");
  });
  router.route("/api/callbacks").post(function (req: Request, res: Response) {
    callbacks(JSON.parse(req.body)[0],this.callConfiguration)
    res.status(200).send("OK");
  });

  router.route("/audio").get(function (req: Request, res: Response) {
    var fileName = "../audio/" + req.query.filename;
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
