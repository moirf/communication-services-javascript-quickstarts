var config = module.exports = { ConnectionString: '', SourcePhoneNumber: '', TargetPhoneNumber: '', AppBaseUri: '', EventCallBackRoute: '', AppointmentReminderMenuAudio: '', AppointmentConfirmedAudio: '', AppointmentCancelledAudio: '', InvalidInputAudio: '', TimedoutAudio:'',NgrokExePath:''};

config = { 'ConnectionString': '', 'SourcePhoneNumber': '', 'TargetPhoneNumber': '', 'AppBaseUri': '', 'EventCallBackRoute': '', 'AppointmentReminderMenuAudio': '', 'AppointmentConfirmedAudio':'', 'AppointmentCancelledAudio':'', 'InvalidInputAudio':'', 'TimedoutAudio':'','NgrokExePath':''};


config.ConnectionString= "endpoint=https://acs-app-validations.communication.azure.com/;accesskey=F7/3U887zz4Ur5CZwhQmGLml8y9uWVb6ir4kqI2K4FyGtShWFxdYBLBf4ZxtJ41P6C5KUC2sZpfayCOtl9DMbw==",
config.SourcePhoneNumber= "+18332197422",
config.TargetPhoneNumber= "+916300132858",
config.AppBaseUri= "https://95b6-43-230-212-228.ngrok-free.app",
config.EventCallBackRoute= "/api/callbacks",
config.AppointmentReminderMenuAudio= "/audio/AppointmentReminderMenu.wav",
config.AppointmentConfirmedAudio= "/audio/AppointmentConfirmedAudio.wav",
config.AppointmentCancelledAudio= "/audio/AppointmentCancelledAudio.wav",
config.InvalidInputAudio= "/audio/InvalidInputAudio.wav",
config.TimedoutAudio= "/audio/TimedoutAudio.wav",
config.NgrokExePath="C:/"
module.exports = config;