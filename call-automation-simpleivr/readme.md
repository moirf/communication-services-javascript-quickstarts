---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
- azure-communication-callAutomation
---

# Call Automation - Simple IVR Solution

The purpose of this sample application is to demonstrate the usage of the Azure Communication Services - Call Automation SDK for building solutions related to Interactive Voice Response (IVR). The application accepts an incoming call when an callee dialed in to either ACS Communication Identifier or ACS acquired phone number. Application prompt the Dual-Tone Multi-Frequency (DTMF) tones to select, and then plays the appropriate audio file based on the key pressed by the callee. The application has been configured to accept tone-1 through tone-5, and if any other key is pressed, the callee will hear an invalid tone and the call will be disconnected.The application is a console based application build using Node.js.

# Design

![design](./data/SimpleIVRDesign.png)

## Prerequisites

- Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/)
- [Visual Studio code](https://code.visualstudio.com/)
- [Node.js](https://nodejs.org/en/) 14.17.3 and above
- Install the [Typescript Compiler](https://code.visualstudio.com/Docs/languages/typescript#_installing-the-typescript-compiler)
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You'll need to record your resource **connection string** for this sample.
- Get a phone number for your new Azure Communication Services resource. For details, see [Get a phone number](https://docs.microsoft.com/azure/communication-services/quickstarts/telephony-sms/get-phone-number?pivots=platform-azp)
- Download and install [Ngrok](https://www.ngrok.com/download). As the sample is run locally, Ngrok will enable the receiving of all the events.
- Generate Ngrok Url by using below steps
	- Open command prompt or powershell window on the machine using to run the sample.
	- Navigate to directory path where Ngrok.exe file is located. Then, run:
		- ngrok http {portNumber} (For e.g. ngrok http 8080)
	- Get Ngrok Url generated. Ngrok Url will be in the form of e.g.  "https://95b6-43-230-212-228.ngrok-free.app"


### Prerequisite check
- In a terminal or command window, run `node --version` to check that Node.js is installed.


## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you would like to clone the sample to.
2. git clone `https://github.com/moirf/communication-services-javascript-quickstarts`.
3. Navigate to `call-automation-simpleivr` folder.

### Configuring application

- Open the config.js file to configure the following settings

	- ConnectionString: Azure Communication Service resource's connection string.
	- ACSAlternatePhoneNumber: Phone number associated with the Azure Communication Service resource.For e.g. "+1425XXXAAAA"
	- ParticipantToAdd: Target phone number or communication user identifier to add in the call. For e.g. "+1425XXXAAAA" or "8:acs:e333a5b5-c1e4-4984-b752-447bf92d10b7_00000018-5d49-93c5-f883-084822004dc5" (Communication user identifier can be generated from the url :https://acs-sample-app.azurewebsites.net/)
	- BaseUri: Base url of the app. (For local devlopment replace the Ngrok url.For e.g. "https://95b6-43-230-212-228.ngrok-free.app")

### Run the Application

- Navigate to the directory containing the package.json file and use the following commands for installing all the dependencies:
	- npm install
- To run the sample, first run:
	- tsc .\server.ts
- This will generate server.js file, then run:
	- node .\server.js or npm run start
- Create webhook
- Start call using [Test App](https://acs-sample-app.azurewebsites.net/) 
	- Login to site using Resource connection string and test display name (For e.g. TestName) on Enter credentials page
	- Click on Start Call button and provide ACS CommunicationUserIdentifier on pop up window .
	- Click on Start button to initiate call.
	
### Create Webhook for Microsoft.Communication.IncomingCall event
IncomingCall is an Azure Event Grid event for notifying incoming calls to your Communication Services resource. To learn more about it, see [this guide](https://learn.microsoft.com/en-us/azure/communication-services/concepts/call-automation/incoming-call-notification). 
1. Navigate to your resource on Azure portal and select `Events` from the left side menu.
1. Select `+ Event Subscription` to create a new subscription. 
1. Filter for Incoming Call event. 
1. Choose endpoint type as web hook and provide the Ngrok url generated. Make sure to provide the exact api route that you programmed to receive the event previously. In this case, it would be <ngrok_url>/api/incomingCall.  

	![Event Grid Subscription for Incoming Call](./data/EventgridSubscription-IncomingCall.png)

1. Select create to start the creation of subscription and validation of your endpoint as mentioned previously. The subscription is ready when the provisioning status is marked as succeeded.


This subscription currently has no filters and hence all incoming calls will be sent to your application. To filter for specific phone number or a communication user, use the Filters tab.



4. Detailed instructions on publishing the app to Azure are available at [Publish a Web app](https://docs.microsoft.com/visualstudio/deployment/quickstart-deploy-to-azure?view=vs-2019).

**Note**: While you may use http://localhost for local testing, the sample when deployed will only work when served over https. The SDK [does not support http](https://docs.microsoft.com/azure/communication-services/concepts/voice-video-calling/calling-sdk-features#user-webrtc-over-https).

