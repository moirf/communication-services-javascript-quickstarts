var express = require("express");
var router = express.Router();
import { Request, Response } from "express";
import { EventAuthHandler } from "./EventHandler/EventAuthHandler";
import { EventDispatcher } from "./EventHandler/EventDispatcher";
import { AppointmentReminder } from "./AppointmentReminder";
var fileSystem = require("fs");
var path = require("path");

var routes = function () {
  router.route("/api/call").post(function (req: Request, res: Response) {
    var param = req.query;
    var content = JSON.stringify(req.body);
    res.status(200).send("OK");
  });
  router.route("/api/callbacks").post(function (req: Request, res: Response) {
    EventDispatcher.getInstance().processNotification(
      decodeURIComponent(JSON.stringify(req.body))
    );
    res.status(200).send("OK");
  });

  router.route("/audio").get(function (req: Request, res: Response) {
    var fileName = "../audio/" + req.query.filename;
    var filePath = path.join(__dirname, fileName);
    var stat = fileSystem.statSync(filePath);

    res.writeHead(200, {
      "Content-Type": "audio/x-wav",
      "Content-Length": stat.size,
    });

    var readStream = fileSystem.createReadStream(filePath);
    // We replaced all the event handlers with a simple call to readStream.pipe()
    readStream.pipe(res);
  });

  return router;
};
module.exports = routes;
