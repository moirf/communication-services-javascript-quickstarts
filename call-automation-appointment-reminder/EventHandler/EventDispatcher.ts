import {
  CallAutomationEvent,AddParticipantResult,PlayOptions,AddParticipantSucceeded , AddParticipantFailed , CallConnected , CallDisconnected , CallTransferAccepted , CallTransferFailed , ParticipantsUpdated , RecordingStateChanged , PlayCompleted , PlayFailed , PlayCanceled , RecognizeCompleted , RecognizeCanceled , RecognizeFailed, CallAutomationEventParser
} from "@azure/communication-call-automation";
import { Logger, MessageType } from "../Logger";
import { NotificationCallback } from "./NotificationCallback";
// KnownCallingServerEventType,
//   CallConnectionStateChangedEvent,
//   ToneReceivedEvent,
//   PlayAudioResultEvent,
//   AddParticipantResultEvent,
export class EventDispatcher {
  private static instance: EventDispatcher;
  private notificationCallbacks: Map<string, NotificationCallback>;
  callAutomationEventParser:CallAutomationEventParser;

  constructor() {
    this.notificationCallbacks = new Map();
  }

  /// <summary>
  /// Get instace of EventDispatcher
  /// </summary>
  public static getInstance(): EventDispatcher {
    if (this.instance == null) {
      this.instance = new EventDispatcher();
    }
    return this.instance;
  }

  public async subscribe(
    eventType: string,
    eventKey: string,
    notificationCallback: NotificationCallback
  ): Promise<Boolean> {
    var eventId: string = await this.buildEventKey(eventType, eventKey);
    return (
      this.notificationCallbacks.set(eventId, notificationCallback) == null
    );
  }

  public async unsubscribe(eventType: string, eventKey: string) {
    var eventId: string = await this.buildEventKey(eventType, eventKey);
    this.notificationCallbacks.delete(eventId);
  }

  public async buildEventKey(
    eventType: string,
    eventKey: string
  ): Promise<string> {
    return eventType + "-" + eventKey;
  }

  public async processNotification(request: string) {
    try {
      let [callEvent, eventKey] = await this.extractEvent(request);

      if (callEvent != null) {
        var notificationCallback: NotificationCallback | undefined =
          this.notificationCallbacks.get(eventKey?.toString()!);
        if (notificationCallback != null) {
          notificationCallback.callback(callEvent);
        }
      }
    } catch (ex) {
      Logger.logMessage(
        MessageType.INFORMATION,
        "Failed to process notification Exception: " + ex.message
      );
    }
  }
  public async extractEvent(content: string) {
    try {
      if (content) {
        var cloudEvent = JSON.parse(content)[0];
        var eventData = cloudEvent.data;
        var event=this.callAutomationEventParser.parse(
          JSON.stringify(cloudEvent)
        );
        var eventResponse = await event.then((response) => response);
        if (
          cloudEvent.type == "CallConnected"
        ) {
          const eventObj: CallConnected = eventData;
          const eventKey: string = await this.buildEventKey(
            eventResponse.kind,
            eventObj.callConnectionId!
          );
          return [eventObj, eventKey];
        } else if (
          cloudEvent.type == "RecognizeCompleted"
        ) {
          const eventObj: RecognizeCompleted = eventData;
          const eventKey: string = await this.buildEventKey(
            eventResponse.kind,
            eventObj.callConnectionId!
          );
          return [eventObj, eventKey];
        } else if (
          cloudEvent.type == "PlayCompleted" || "PlayFailed" || "PlayCanceled"
        ) {
          const eventObj: PlayCompleted | PlayFailed | PlayCanceled= eventData;
          const eventKey: string = await this.buildEventKey(
            eventResponse.kind,
            eventObj.operationContext!
          );
          return [eventObj, eventKey];
        } else if (
          cloudEvent.type =="AddParticipantSucceeded" || "AddParticipantFailed"
        ) {
          const eventObj: AddParticipantSucceeded | AddParticipantFailed = eventData;
          const eventKey: string = await this.buildEventKey(
            eventResponse.kind,
            eventObj.operationContext!
          );
          return [eventObj, eventKey];
        }
      }
    } catch (ex) {
      Logger.logMessage(
        MessageType.INFORMATION,
        "Failed to parse request content Exception: " + ex.message
      );
    }
    return [null, null];
  }

}
