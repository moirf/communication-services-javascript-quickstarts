var config = module.exports = { ConnectionString: '', SourcePhoneNumber: '', TargetPhoneNumber: '', AppBaseUri: '', EventCallBackRoute: '', AppointmentReminderMenuAudio: '', AppointmentConfirmedAudio: '', AppointmentCancelledAudio: '', InvalidInputAudio: '', TimedoutAudio:''};

config = { 'ConnectionString': '', 'SourcePhoneNumber': '', 'TargetPhoneNumber': '', 'AppBaseUri': '', 'EventCallBackRoute': '', 'AppointmentReminderMenuAudio': '', 'AppointmentConfirmedAudio':'', 'AppointmentCancelledAudio':'', 'InvalidInputAudio':'', 'TimedoutAudio':''};


config.ConnectionString= "endpoint=https://acs-app-validations.communication.azure.com/;accesskey=F7/3U887zz4Ur5CZwhQmGLml8y9uWVb6ir4kqI2K4FyGtShWFxdYBLBf4ZxtJ41P6C5KUC2sZpfayCOtl9DMbw==",
config.SourcePhoneNumber= "+18332197422",
config.TargetPhoneNumber= "+916300132858",
config.AppBaseUri= "https://95b6-43-230-212-228.ngrok-free.app",
config.EventCallBackRoute= "/api/callbacks",
config.AppointmentReminderMenuAudio= "/audio?filename=AppointmentReminderMenu.wav",
config.AppointmentConfirmedAudio= "/audio?filename=AppointmentConfirmedAudio.wav",
config.AppointmentCancelledAudio= "/audio?filename=AppointmentCancelledAudio.wav",
config.InvalidInputAudio= "/audio?filename=InvalidInputAudio.wav",
config.TimedoutAudio= "/audio?filename=TimedoutAudio.wav",
module.exports = config;