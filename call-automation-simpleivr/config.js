var config = module.exports = { ConnectionString:'',ACSAlternatePhoneNumber:'',ParticipantToAdd:'',BaseUri:'',MainMenuAudio:'',SalesAudio:'',MarketingAudio:'',CustomerCareAudio:'',AgentAudio:'',InvalidAudio:'',AllowedHosts:''};

config = { 'ConnectionString':'','ACSAlternatePhoneNumber':'','ParticipantToAdd':'','BaseUri':'','MainMenuAudio':'','SalesAudio':'','MarketingAudio':'','CustomerCareAudio':'','AgentAudio':'','InvalidAudio':'','AllowedHosts':''};



config.ConnectionString="",
config.ACSAlternatePhoneNumber="",
config.ParticipantToAdd="",
config.BaseUri="",
config.MainMenuAudio="/audio?filename=mainmenu.wav",
config.SalesAudio="/audio?filename=sales.wav",
config.MarketingAudio= "/audio?filename=marketing.wav",
config.CustomerCareAudio= "/audio?filename=customercare.wav",
config.AgentAudio= "/audio?filename=agent.wav",
config.InvalidAudio= "/audio?filename=invalid.wav",
config.AllowedHosts= "*"
module.exports = config;

