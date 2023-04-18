var config = module.exports = { ConnectionString: '', SourcePhoneNumber: '', TargetPhoneNumber: '', AppBaseUri: '', EventCallBackRoute: '', AppointmentReminderMenuAudio: '', AppointmentConfirmedAudio: '', AppointmentCancelledAudio: '', InvalidInputAudio: '', TimedoutAudio:'',NgrokExePath:''};

config = { 'ConnectionString': '', 'SourcePhoneNumber': '', 'TargetPhoneNumber': '', 'AppBaseUri': '', 'EventCallBackRoute': '', 'AppointmentReminderMenuAudio': '', 'AppointmentConfirmedAudio':'', 'AppointmentCancelledAudio':'', 'InvalidInputAudio':'', 'TimedoutAudio':'','NgrokExePath':''};


config.ConnectionString= "%Connection String%",
config.SourcePhoneNumber= "%Source Phone Number%",
config.TargetPhoneNumber= "%Target or Destination Phone number%",
config.AppBaseUri= "%App base uri%",
config.EventCallBackRoute= "/api/callbacks",
config.AppointmentReminderMenuAudio= "/audio/AppointmentReminderMenu.wav",
config.AppointmentConfirmedAudio= "/audio/AppointmentConfirmedAudio.wav",
config.AppointmentCancelledAudio= "/audio/AppointmentCancelledAudio.wav",
config.InvalidInputAudio= "/audio/InvalidInputAudio.wav",
config.TimedoutAudio= "/audio/TimedoutAudio.wav",
config.NgrokExePath="C:/"
module.exports = config;