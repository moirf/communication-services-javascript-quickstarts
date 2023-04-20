import { EventAuthHandler } from "./EventHandler/EventAuthHandler";

export class CallConfiguration {
  TimedoutAudio: "";
  public connectionString: string;
  public sourcePhoneNumber: string;
  public targetPhoneNumber: string;
  public appBaseUri: string;
  public eventCallBackRoute: string;
  public appointmentReminderMenuAudio: string;
  public appointmentConfirmedAudio: string;
  public appointmentCancelledAudio: string;
  public invalidInputAudio: string;
  public timedoutAudio: string;
  public ngrokExePath:string;

  constructor(
    connectionString: string,
    sourcePhoneNumber: string,
    targetPhoneNumber: string,
    appBaseUri: string,
    eventCallBackRoute: string,
    appointmentReminderMenuAudio: string,
    appointmentConfirmedAudio: string,
    appointmentCancelledAudio: string,
    invalidInputAudio: string,
    timedoutAudio: string,
    ngrokExePath:string
  ) {
    this.connectionString= connectionString;
    this.sourcePhoneNumber= sourcePhoneNumber;
    this.targetPhoneNumber= targetPhoneNumber
    this.appBaseUri= appBaseUri,
    this.eventCallBackRoute= eventCallBackRoute,
    this.appointmentReminderMenuAudio= appointmentReminderMenuAudio,
    this.appointmentConfirmedAudio= appointmentConfirmedAudio,
    this.appointmentCancelledAudio= appointmentCancelledAudio,
    this.invalidInputAudio= invalidInputAudio,
    this.timedoutAudio= timedoutAudio,
    this.ngrokExePath=ngrokExePath
    var eventhandler: EventAuthHandler = EventAuthHandler.getInstance();
    // this.appCallbackUrl =
    // appBaseUri +
    //   "/api/outboundcall/callback?" +
    //   eventhandler.getSecretQuerystring();
    // this.audioFileUrl = appBaseUrl + "/audio?filename=" + this.audioFileName;
  }
}
