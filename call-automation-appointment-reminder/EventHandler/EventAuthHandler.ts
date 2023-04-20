import { Logger, MessageType } from "../Logger";
var configuration = require("../config");

export class EventAuthHandler {
  public static eventAuthHandler: EventAuthHandler;
  constructor() {}

  public static getInstance(): EventAuthHandler {
    if (this.eventAuthHandler == null) {
      this.eventAuthHandler = new EventAuthHandler();
    }
    return this.eventAuthHandler;
  }
}
