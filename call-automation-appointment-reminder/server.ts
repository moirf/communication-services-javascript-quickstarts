import { Program } from "./program";
import { AppointmentReminder } from "./AppointmentReminder";
import "./Routes";

var express = require("express"),
  app = express(),
  port = process.env.PORT || 8080;
var bodyParser = require("body-parser");
var routes = require("./Routes")();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/", routes);

app.listen(port, async () => {
  console.log(`Listening on port ${port}`);
  var program = Program.getInstance();
  program.main();
});
