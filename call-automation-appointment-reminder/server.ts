import { Program } from "./program";
// import {AppointmentReminder}from"./AppointmentReminder";

var express = require("express"),
  app = express(),
  port = process.env.PORT || 9007;
var bodyParser = require("body-parser");
// var appointmentReminder = require("./AppointmentReminder")();
// var routes = require('./Routes');
var routes = require("./Routes");
// routes(app);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use("/", AppointmentReminder);
app.use("/", routes);

app.listen(port, async () => {
  console.log(`Listening on port ${port}`);
  var program = Program.getInstance();
  program.main();
});
