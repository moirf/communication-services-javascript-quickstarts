import { Program } from "./program";
import "./AppointmentReminder";
var express = require("express"),
  app = express(),
  port = process.env.PORT || 9007;
var bodyParser = require("body-parser");
var appointmentReminder = require("./AppointmentReminder")();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/", appointmentReminder);

app.listen(port, async () => {
  console.log(`Listening on port ${port}`);
  var program = Program.getInstance();
  program.main();
});
