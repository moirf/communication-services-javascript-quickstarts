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

  // public async processNotification(request: string) {
  //   try {
  //     let [callEvent, eventKey] = await this.extractEvent(request);

  //     if (callEvent != null) {
  //       var notificationCallback: NotificationCallback | undefined =
  //         this.notificationCallbacks.get(eventKey.toString());
  //       if (notificationCallback != null) {
  //         notificationCallback.callback(callEvent);
  //       }
  //     }
  //   } catch (ex) {
  //     Logger.logMessage(
  //       MessageType.INFORMATION,
  //       "Failed to process notification Exception: " + ex.message
  //     );
  //   }
  // }
  // public async extractEvent(content: string) {
  //   try {
  //     if (content) {
  //       var cloudEvent = JSON.parse(content)[0];
  //       var eventData = cloudEvent.data;
  //       // var callAutomationEvent:CallAutomationEvent;

  //       if(CallAutomationEvent.AddParticipantResponse==AddParticipantSucceeded){

  //       }
  //       if (

  //         cloudEvent.type ==
  //         callAutomationEvent.callConnectionState
  //         // CallAutomationEvent.CALL_CONNECTION_STATE_CHANGED_EVENT
  //       ) {
  //         const eventObj: CallConnectionStateChangedEvent = eventData;
  //         const eventKey: string = await this.buildEventKey(
  //           KnownCallingServerEventType.CALL_CONNECTION_STATE_CHANGED_EVENT,
  //           eventObj.callConnectionId
  //         );
  //         return [eventObj, eventKey];
  //       } else if (
  //         cloudEvent.type == KnownCallingServerEventType.TONE_RECEIVED_EVENT
  //       ) {
  //         const eventObj: ToneReceivedEvent = eventData;
  //         const eventKey: string = await this.buildEventKey(
  //           KnownCallingServerEventType.TONE_RECEIVED_EVENT,
  //           eventObj.callConnectionId
  //         );
  //         return [eventObj, eventKey];
  //       } else if (
  //         cloudEvent.type == KnownCallingServerEventType.PLAY_AUDIO_RESULT_EVENT
  //       ) {
  //         const eventObj: PlayOptions = eventData;
  //         const eventKey: string = await this.buildEventKey(
  //           callAutomationEvent.kind,
  //           eventObj.operationContext ? eventObj.operationContext:''
  //         );
  //         return [eventObj, eventKey];
  //       } else if (
  //         cloudEvent.type ==
  //         callAutomationEvent.kind
  //       ) {
  //         const eventObj: AddParticipantResult = eventData;
  //         const eventKey: string = await this.buildEventKey(
  //           callAutomationEvent.kind,
  //           eventObj.operationContext ? eventObj.operationContext:''
  //         );
  //         return [eventObj, eventKey];
  //       }
  //     }
  //   } catch (ex) {
  //     Logger.logMessage(
  //       MessageType.INFORMATION,
  //       "Failed to parse request content Exception: " + ex.message
  //     );
  //   }
  //   return [null, null];
  // }
}
