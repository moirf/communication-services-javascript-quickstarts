
import { MessageType, Logger } from "./Logger";
import { CallConfiguration } from "./CallConfiguration";
import { NotificationCallback } from "./EventHandler/NotificationCallback";
import { EventDispatcher } from "./EventHandler/EventDispatcher";
import {
    ServerCallLocator,
    StartRecordingOptions,
    RecordingChannel,
    CallAutomationClient,
    CallConnection,
    CreateCallOptions,
    CreateCallResult,
    MediaStreamingConfiguration,
    MediaStreamingTransportType,
    MediaStreamingContentType,
    MediaStreamingAudioChannelType,
    CallConnectionProperties,
    CallAutomationEventParser,
    CallAutomationEvent,
    CallConnected
  } from "@azure/communication-call-automation";
  import { Request, Response, response } from "express";
  import * as fs from "fs";
  import { BlobDownloadResponseModel } from "@azure/storage-blob";
  import{ CommunicationIdentifier,
    CommunicationUserIdentifier,
    PhoneNumberIdentifier} from "@azure/communication-common";  
import { CloudEvent } from "@azure/eventgrid";
import {} from "@azure/messaging"
  
  var cfg = require("./Config");



// var builder = WebApplication.CreateBuilder(args);
// builder.Services.AddEndpointsApiExplorer();
// builder.Services.AddSwaggerGen();

//Fetch configuration and add call automation as singleton service
// var callConfigurationSection = builder.Configuration.GetSection(nameof(CallConfiguration));
// builder.Services.Configure<CallConfiguration>(callConfigurationSection);
// builder.Services.AddSingleton(new CallAutomationClient(callConfigurationSection["ConnectionString"]));

// var app = builder.Build();

// var sourceIdentity = await app.ProvisionAzureCommunicationServicesIdentity(callConfigurationSection["ConnectionString"]);


export class AppointmentReminder {
    callConfiguration: CallConfiguration;
    callAutomationClient: CallAutomationClient;
    callConnection: CreateCallResult;
    callAutomationEventParser: CallAutomationEventParser;
    callAutomationEvent: CallAutomationEvent;
    userIdentityRegex = new RegExp(
      "8:acs:[0-9a-fA-F]{8}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{12}_[0-9a-fA-F]{8}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{12}"
    );
    phoneIdentityRegex = new RegExp("^\\+\\d{10,14}$");
    maxRetryAttemptCount = 0;
    targetPhoneNumber = null;
    participant = null;
    retryAttemptCount = 1;
    toneReceivedEventComplete = false;
    playAudioTaskCompleted = false;
    playAudioTaskExecuted = false;

    constructor(callConfiguration: CallConfiguration) {
      this.callConfiguration = callConfiguration;
      this.callAutomationClient = new CallAutomationClient(
        this.callConfiguration.connectionString
      );
    }

// Api to initiate out bound call

public async call(callAutomationClient:CallAutomationClient,callConfiguration: CallConfiguration, logger:Logger ) 
{
    try {
        // Preparing request data
        var source: PhoneNumberIdentifier = {
            phoneNumber: callConfiguration.sourcePhoneNumber,
        };
        var target: CommunicationUserIdentifier[] = [
            {communicationUserId: callConfiguration.TargetPhoneNumber},
        ];
        var createCallOption: CreateCallOptions = {
            sourceCallIdNumber: source,
            sourceDisplayName?: source.toString(),
            // operationContext?: string,
            // azureCognitiveServicesEndpointUrl?: string,
            // mediaStreamingConfiguration?: MediaStreamingConfiguration
        };
  
        Logger.logMessage(
          MessageType.INFORMATION,
          "Performing CreateCall operation"
        );
       
         this.callConnection = await this.callAutomationClient.createCall(target,this.callConfiguration.appBaseUri,createCallOption);

        Logger.logMessage(
            MessageType.INFORMATION,
            "Reponse from create call: " +callConnection+
        "CallConnection Id : "+callConnection.callConnection.callConnectionId
          );
        }catch(e){
            Logger.logMessage(MessageType.ERROR,
                "Failure occured while creating/establishing the call. Exception -- >" +e.message);
        }
};

//api to handle call back events
public async callbacks(cloudEvents:CloudEvent<MessageEvent>[] , callAutomationClient:CallAutomationClient , callConfiguration:CallConfiguration , logger:Logger)
{
    cloudEvents.forEach(cloudEvent =>{
        Logger.logMessage(MessageType.INFORMATION,"Event received: "+JSON.stringify(cloudEvent));

        var event = this.callAutomationEventParser.parse(JSON.stringify(cloudEvent));
        var callConnection = callAutomationClient.getCallConnection(event.then.name);
        var callConnectionMedia = callConnection.getCallMedia();
        if (event.eventType==CallConnected)
        {
            //Initiate recognition as call connected event is received
            logger.LogInformation($"CallConnected event received for call connection id: {@event.CallConnectionId}");
            var recognizeOptions =
            new CallMediaRecognizeDtmfOptions(CommunicationIdentifier.FromRawId(callConfiguration.Value.TargetPhoneNumber), maxTonesToCollect: 1)
            {
                InterruptPrompt = true,
                InterToneTimeout = TimeSpan.FromSeconds(10),
                InitialSilenceTimeout = TimeSpan.FromSeconds(5),
                Prompt = new FileSource(new Uri(callConfiguration.Value.AppBaseUri + callConfiguration.Value.AppointmentReminderMenuAudio)),
                OperationContext = "AppointmentReminderMenu"
            };

            //Start recognition 
            await callConnectionMedia.StartRecognizingAsync(recognizeOptions);
        }
        if (@event is RecognizeCompleted { OperationContext: "AppointmentReminderMenu" })
        {
            // Play audio once recognition is completed sucessfully
            logger.LogInformation($"RecognizeCompleted event received for call connection id: {@event.CallConnectionId}");
            var recognizeCompletedEvent = (RecognizeCompleted)@event;
            var toneDetected = recognizeCompletedEvent.CollectTonesResult.Tones[0];
            var playSource = Utils.GetAudioForTone(toneDetected, callConfiguration);

            // Play audio for dtmf response
            await callConnectionMedia.PlayToAllAsync(playSource, new PlayOptions { OperationContext = "ResponseToDtmf", Loop = false });
        }
        if (@event is RecognizeFailed { OperationContext: "AppointmentReminderMenu" })
        {
            logger.LogInformation($"RecognizeFailed event received for call connection id: {@event.CallConnectionId}");
            var recognizeFailedEvent = (RecognizeFailed)@event;

            // Check for time out, and then play audio message
            if (recognizeFailedEvent.ReasonCode.Equals(ReasonCode.RecognizeInitialSilenceTimedOut))
            {
                logger.LogInformation($"Recognition timed out for call connection id: {@event.CallConnectionId}");
                var playSource = new FileSource(new Uri(callConfiguration.Value.AppBaseUri + callConfiguration.Value.TimedoutAudio));
                
                //Play audio for time out
                await callConnectionMedia.PlayToAllAsync(playSource, new PlayOptions { OperationContext = "ResponseToDtmf", Loop = false });
            }
        }
        if (@event is PlayCompleted { OperationContext: "ResponseToDtmf" })
        {
            logger.LogInformation($"PlayCompleted event received for call connection id: {@event.CallConnectionId}");
            await callConnection.HangUpAsync(forEveryone: true);
        }
        if (@event is PlayFailed { OperationContext: "ResponseToDtmf" })
        {
            logger.LogInformation($"PlayFailed event received for call connection id: {@event.CallConnectionId}");
            await callConnection.HangUpAsync(forEveryone: true);
        }
    })
   
    return Results.Ok();
}).Produces(StatusCodes.Status200OK);

// Configure the HTTP request pipeline.
// if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
// {
//     app.UseSwagger();
//     app.UseSwaggerUI();
// }

// app.UseStaticFiles(new StaticFileOptions
// {
//     FileProvider = new PhysicalFileProvider(
//            Path.Combine(builder.Environment.ContentRootPath, "audio")),
//     RequestPath = "/audio"
// });

// app.UseHttpsRedirection();
// app.Run();
}