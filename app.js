require('dotenv').config();
var sleep = require('system-sleep');
const { EventHubClient, EventPosition } = require('@azure/event-hubs');

const client = EventHubClient.createFromConnectionString(process.env["EVENTHUB_CONNECTION_STRING"], process.env["EVENTHUB_NAME"]);

console.log(process.env["EVENTHUB_CONNECTION_STRING"] + "++++++" + process.env["EVENTHUB_NAME"]);

function genPayload() {
  //console.log(Math.random());
  var obj = {body : {}};
  obj.body.sensor = "AYKF3-" + Math.floor(Math.random() * (10) + 1);
  obj.body.temperature = 400 + Math.random() * 5 - Math.random() * 6;
  obj.body.pressure = 35000 - Math.random() * (Math.random()+96) ;
  obj.body.torque = 22 - Math.random() - (Math.random() * 2) ;
  obj.body.rotation = 60 - Math.random()* 2;
  //console.log("printing emptyjson",obj);
  return obj;
}

async function main() {
  // NOTE: For receiving events from Azure Stream Analytics, please send Events to an EventHub where the body is a JSON object.
  // const eventData = { body: { "message": "Hello World" }, partitionKey: "pk12345"};
  while(true) {
  const eventData = genPayload();
  //{ body: "Hello World", partitionKey: "pk12345"};
  const delivery = await client.send(eventData);
  console.log("message sent successfully.",eventData);
  sleep(10000);
  }
}

main().catch((err) => {
  console.log(err);
});

