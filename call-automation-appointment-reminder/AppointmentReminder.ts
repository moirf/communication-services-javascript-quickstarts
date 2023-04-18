
import { MessageType, Logger } from "./Logger";
import { CallConfiguration } from "./CallConfiguration";
import { NotificationCallback } from "./EventHandler/NotificationCallback";
import { EventDispatcher } from "./EventHandler/EventDispatcher";
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
    FileSource
  } from "@azure/communication-call-automation";
//   import { Request, Response, response } from "express";
//   import * as fs from "fs";
//   import { BlobDownloadResponseModel } from "@azure/storage-blob";
  import{ CommunicationIdentifier,
    CommunicationUserIdentifier,
    PhoneNumberIdentifier} from "@azure/communication-common";  
import { CloudEvent } from "@azure/eventgrid";
// import { eventNames } from "process";
// import { File } from "buffer";
import {TimeSpan} from './TimeSpan';
  
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
    public  GetAudioForTone( toneDetected:DtmfTone,  callConfiguration:CallConfiguration)
    {
        let playSource:FileSource={uri:""};

        if (toneDetected==(DtmfTone.One))
        {
            playSource.uri = callConfiguration.appBaseUri + callConfiguration.appointmentConfirmedAudio;
        }
        else if (toneDetected==(DtmfTone.Two))
        {
            playSource.uri = callConfiguration.appBaseUri + callConfiguration.appointmentCancelledAudio;
        }
        else // Invalid Dtmf tone
        {
            playSource.uri =callConfiguration.appBaseUri + callConfiguration.invalidInputAudio;
        }

        return playSource;
    }
// Api to initiate out bound call
public ConvertTime(num:number){
    let hours=Math.floor(num/60).toString();
    if(hours.length===1){
        hours='0'+hours;
    }
    let minutes= Math.floor(num % 60).toString();
    if(minutes.length===1){
        minutes='0'+minutes;
    }
    let seconds= Math.floor((num % 60)%60).toString();
    if(seconds.length===1){
        seconds='0'+seconds;
    }
    let totalTime=`${hours}:${minutes}:${seconds}`
    return Number(totalTime)

}
public async call(callAutomationClient:CallAutomationClient,callConfiguration: CallConfiguration, logger?:Logger ) 
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
            sourceDisplayName: source.toString(),
        };
  
        Logger.logMessage(
          MessageType.INFORMATION,
          "Performing CreateCall operation"
        );
       
         this.callConnection = await this.callAutomationClient.createCall(target,this.callConfiguration.appBaseUri,createCallOption);

        Logger.logMessage(
            MessageType.INFORMATION,
            "Reponse from create call: " +this.callConnection+
        "CallConnection Id : "+this.callConnection.callConnectionProperties.callConnectionId
          );
        }catch(e){
            Logger.logMessage(MessageType.ERROR,
                "Failure occured while creating/establishing the call. Exception -- >" +e.message);
        }
};

//api to handle call back events
public async callbacks(cloudEvents:CloudEvent<MessageEvent>[] , callAutomationClient:CallAutomationClient , callConfiguration:CallConfiguration , logger:Logger)
{
    cloudEvents.forEach(async cloudEvent =>{
        Logger.logMessage(MessageType.INFORMATION,"Event received: "+JSON.stringify(cloudEvent));

        var event = this.callAutomationEventParser.parse(JSON.stringify(cloudEvent));
        var callConnection = callAutomationClient.getCallConnection(event.then.name);
        var callConnectionMedia = callConnection.getCallMedia();
        var eventResponse=await event.then(response=>(response))
        if (eventResponse.kind=="CallConnected")
        {
            var target: CommunicationUserIdentifier = {communicationUserId: callConfiguration.TargetPhoneNumber}
            //Initiate recognition as call connected event is received
            Logger.logMessage(MessageType.INFORMATION,"CallConnected event received for call connection id: "+eventResponse.callConnectionId);
            var date=Date.now().toString();
            var recognizeOptions:CallMediaRecognizeDtmfOptions =
            {
                interToneTimeoutInSeconds: this.ConvertTime(10),
                // interToneTimeoutInSeconds: TimeSpan.fromSeconds(10) as unknown as number,
                maxTonesToCollect: 1,
                stopDtmfTones: DtmfTone[5],
                kind: "callMediaRecognizeDtmfOptions",                
                recognizeInputType:RecognizeInputType.Dtmf,
                targetParticipant: target
            };
            //Start recognition 
            await callConnectionMedia.startRecognizing(recognizeOptions);
        }
        if (eventResponse.kind=="RecognizeCompleted")
        {
            // Play audio once recognition is completed sucessfully
            Logger.logMessage(MessageType.INFORMATION,"RecognizeCompleted event received for call connection id: "+eventResponse.callConnectionId);
            var recognizeCompletedEvent:RecognizeCompleted = eventResponse;
            var toneDetected= (recognizeCompletedEvent?.collectTonesResult?.tones ? recognizeCompletedEvent?.collectTonesResult?.tones[0] :undefined) as DtmfTone;
            var playSource = this.GetAudioForTone(toneDetected, callConfiguration);
            // Play audio for dtmf response
            await callConnectionMedia.playToAll(playSource, {operationContext : "ResponseToDtmf", loop : false });
        }
        if (eventResponse.kind=="RecognizeFailed")
        {
            Logger.logMessage(MessageType.INFORMATION,"RecognizeFailed event received for call connection id: "+eventResponse.callConnectionId);
            var recognizeFailedEvent = eventResponse;
            let playSource:FileSource={uri:""};
            // Check for time out, and then play audio message
            // if (recognizeFailedEvent.resultInformation?.subCode==(ReasonCode.RecognizeInitialSilenceTimedOut))
            if (recognizeFailedEvent.resultInformation?.subCode==8510)
            {
                Logger.logMessage(MessageType.INFORMATION,"Recognition timed out for call connection id: "+eventResponse.callConnectionId);
                playSource.uri = callConfiguration.appBaseUri + callConfiguration.TimedoutAudio;
                
                //Play audio for time out
                await callConnectionMedia.playToAll(playSource, { operationContext : "ResponseToDtmf", loop : false });
            }
        }
        if (eventResponse.kind=="PlayCompleted")
        {
            Logger.logMessage(MessageType.INFORMATION,"PlayCompleted event received for call connection id: "+eventResponse.callConnectionId);
            await callConnection.hangUp(true);
        }
        if (eventResponse.kind=="PlayFailed" )
        {
            Logger.logMessage(MessageType.INFORMATION,"PlayFailed event received for call connection id: "+eventResponse.callConnectionId);
            await callConnection.hangUp(true);
        }
    })
    // return Results.Ok();
}
//     return Results.Ok();
// }).Produces(StatusCodes.Status200OK);




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