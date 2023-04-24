import { CallConfiguration } from "./CallConfiguration";
import { CommunicationIdentityClient } from "@azure/communication-identity";
import { Logger, MessageType } from "./Logger";
import { CommunicationUserIdentifier } from "@azure/communication-common";
import { AppointmentReminder } from "./AppointmentReminder";
import { CallAutomationClient } from "@azure/communication-call-automation";
var configuration = require("./config");
export class Program {
  url = "http://localhost:8080";
  serverPort = "8080";
  private static instance = new Program();
  static getInstance(): Program {
    if (this.instance == null) {
      this.instance = new Program();
    }
    return this.instance;
  }

  async main() {
    Logger.logMessage(MessageType.INFORMATION, "Starting ACS Sample App");
    // Start Ngrok service
    const ngrokUrl = configuration.AppBaseUri;
    // const ngrokUrl = await Program.startNgrokService();

    try {
      if (ngrokUrl) {
        Logger.logMessage(
          MessageType.INFORMATION,
          "Server started at:" + this.url
        );
        await this.runSample(ngrokUrl);
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
  }

  async runSample(ngrokUrl: string) {
    var appBaseUrl: string = ngrokUrl;
    var callConfiguration: CallConfiguration = await this.initiateConfiguration(
      appBaseUrl
    );
    var targetNumber: string = configuration.TargetPhoneNumber;
    var callAutomationClient: CallAutomationClient;
    try {
      if (targetNumber != null && targetNumber) {
        console.log("inside if block");
        var tasks = new Promise((resolve) =>
          new AppointmentReminder(callConfiguration).report(callConfiguration)
        );
        const results = await Promise.resolve(tasks);
      }
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
  async initiateConfiguration(appBaseUrl: string) {
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

  /// <summary>
  /// Create new user
  /// </summary>
  async createUser(connectionString) {
    const client = new CommunicationIdentityClient(connectionString);
    const user = await client.createUser();
    return user.communicationUserId;
  }

  /// <summary>
  /// Delete the user
  /// </summary>
  async deleteUser(connectionString: string, source: string) {
    const client = new CommunicationIdentityClient(connectionString);
    var user: CommunicationUserIdentifier = { communicationUserId: source };
    client.deleteUser(user);
  }
}
