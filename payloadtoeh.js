var SensorTag = require('sensortag');		// sensortag library
var util = require('util');

var async = require('async');

var Protocol = require('azure-iot-device-amqp').Amqp;


const { EventHubClient, EventPosition } = require('@azure/event-hubs');
const EVENTHUB_CONNECTION_STRING="Endpoint=sb://srramstreaminghubns.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=JAZlFaFEeTIGjfYWbZAq+xsI3kewglpAFjVx5kHG5KE=";
const EVENTHUB_NAME="streamiotdata";
const client = EventHubClient.createFromConnectionString(EVENTHUB_CONNECTION_STRING,EVENTHUB_NAME);



SensorTag.discoverAll(function (sensorTag) {
        console.log("Connecting to %s...", sensorTag.id);
        
        sensorTag.on('disconnect', function() {
            console.log("Disconnected from %s!", sensorTag.id);
            process.exit(0);
        });
        
        sensorTag.connectAndSetUp(function (error) { 
            console.log("Connected to %s...", sensorTag.id);
            
            async.series([
                function (callback)
                {
                    console.log("Starting IR temperatures sensor for %s...", sensorTag.id);
                    sensorTag.enableIrTemperature(callback);
                },
                
                function (callback)
                {
                    console.log("Starting humidity sensor for %s...", sensorTag.id);
                    sensorTag.enableHumidity(callback);
                },
                
                function (callback)
                {
                    console.log("Starting pressure sensor for %s...", sensorTag.id);
                    sensorTag.enableBarometricPressure(callback);
                },
                
                function (callback)
                {
                    console.log("Starting light intensity sensor for %s...", sensorTag.id);
                    sensorTag.enableLuxometer(callback);
                }
            ], function () {
                setInterval(function () {
                    var readings = {body : {}};
	        	readings.body.sensorTag = sensorTag.id;	
                    async.series([
                        function (callback)
                        {
                            sensorTag.readHumidity(function (error, temperature, humidity)
                            {
                                readings.body.humidity = humidity;
                                readings.body.temperatureFromHumidity = temperature;
                                
                                callback();
                            });
                        },
                        function (callback)
                        {
                            sensorTag.readIrTemperature(function (error, objectTemperature, ambientTemperature) 
                            {
                                readings.body.objectTemperature = objectTemperature;
                                readings.body.temperatureFromIr = ambientTemperature;
                                
                                callback();
                            });
                        },
                        function (callback)
                        {
                            sensorTag.readBarometricPressure(function (error, pressure)
                            {
                                readings.body.pressure = pressure;
                                
                                callback();
                            });
                        },
                        function (callback)
                        {
                            sensorTag.readLuxometer(function (error, lux){
                                readings.body.lux = lux;
                                
                                callback();
                            });
                        }

                    ], function()
                    {
                        readings.body.currentTime = new Date();
//                        readings.partitionKey = "pk12345"; 
                        var message = JSON.stringify(readings);

                        console.log("Printing Message.........",message);




			async function ehsend() {
				await client.send(readings);
				console.log("message sent successfully.",readings);

			}
			ehsend().catch((err) => {
			  console.log(err);
			});
                        
                    });
                }, 5000);
            });
        });
    });
