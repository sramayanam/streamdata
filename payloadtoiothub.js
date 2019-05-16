var SensorTag = require('sensortag');		// sensortag library
var util = require('util');

var async = require('async');

var Protocol = require('azure-iot-device-amqp').Amqp;
var Client = require('azure-iot-device').Client;
var ConnectionString = require('azure-iot-device').ConnectionString;
var Message = require('azure-iot-device').Message;
var connectionString = 'HostName=scrdataaidays.azure-devices.net;DeviceId=bluetoothdevices;SharedAccessKey=6VStArHKJQo7KvnlpS0XQtedYL1IhpAcEmXB/ptr/6k=';

var deviceId = ConnectionString.parse(connectionString).DeviceId;

var client = Client.fromConnectionString(connectionString, Protocol);

client.open(function (error, result) {
    if (error)
    {
        console.log("Connectivity error: %s...", error);
        return;
    }

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
                    var readings = { sensorId: sensorTag.id };
                    async.series([
                        function (callback)
                        {
                            sensorTag.readHumidity(function (error, temperature, humidity)
                            {
                                readings.humidity = humidity;
                                readings.temperatureFromHumidity = temperature;
                                
                                callback();
                            });
                        },
                        function (callback)
                        {
                            sensorTag.readIrTemperature(function (error, objectTemperature, ambientTemperature) 
                            {
                                readings.objectTemperature = objectTemperature;
                                readings.temperatureFromIr = ambientTemperature;
                                
                                callback();
                            });
                        },
                        function (callback)
                        {
                            sensorTag.readBarometricPressure(function (error, pressure)
                            {
                                readings.pressure = pressure;
                                
                                callback();
                            });
                        },
                        function (callback)
                        {
                            sensorTag.readLuxometer(function (error, lux){
                                readings.lux = lux;
                                
                                callback();
                            });
                        }
                    ], function()
                    {
                        readings.currentTime = new Date();
                        
                        var message = new Message(JSON.stringify(readings));

                        console.log("Printing Message.........",message);


		        client.sendEvent(message, function (error) {
                            if (error)
                            {
                                console.log(error.toString());
                            }
                            else
                            {
                                console.log("Data sent to IoT Hub  on %s...", readings.currentTime);
                            }
                        });		


                        
                    });
                }, 5000);
            });
        });
    });
});
