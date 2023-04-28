var config = module.exports = { ConnectionString:'',ACSAlternatePhoneNumber:'',ParticipantToAdd:'',BaseUri:'',MainMenuAudio:'',SalesAudio:'',MarketingAudio:'',CustomerCareAudio:'',AgentAudio:'',InvalidAudio:'',AllowedHosts:''};

config = { 'ConnectionString':'','ACSAlternatePhoneNumber':'','ParticipantToAdd':'','BaseUri':'','MainMenuAudio':'','SalesAudio':'','MarketingAudio':'','CustomerCareAudio':'','AgentAudio':'','InvalidAudio':'','AllowedHosts':''};



config.ConnectionString="",
config.ACSAlternatePhoneNumber="",
config.ParticipantToAdd="",
config.BaseUri="",
config.MainMenuAudio="/audio/mainmenu.wav",
config.SalesAudio="/audio/sales.wav",
config.MarketingAudio= "/audio/marketing.wav",
config.CustomerCareAudio= "/audio/customercare.wav",
config.AgentAudio= "/audio/agent.wav",
config.InvalidAudio= "/audio/invalid.wav",
config.AllowedHosts= "*"
module.exports = config;

