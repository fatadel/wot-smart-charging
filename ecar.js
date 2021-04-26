// create a node-wot servient
const Servient = require('@node-wot/core').Servient
const HttpServer = require('@node-wot/binding-http').HttpServer

// create Servient add HTTP binding with port configuration
let servient = new Servient();
servient.addServer(new HttpServer({
    // port: 8081 // (default 8080)
}));

let soc;
let driving;
let status;

function driveCar() {
    console.log("Driving...");
    driving = true;
    status = false;
    setTimeout(function(){
        //  code after time
        let decStep = 0.25;
        soc -= 1;
        if (soc <= 0) {
            driving = false;
            soc = 0.0;
            console.log("Battery drained :-(");
        } else {
            // keep on driving ?
            if (driving) {
                driveCar();
            }
        }
        console.log("Charging status decreased by " + decStep + " -> " + soc);
    }, 250);
}

function stopCar() {
    console.log("STOP driving!");
    driving = false;
}

function chargeCar() {
    console.log("Charging...");
    status = "charging";
    driving = false;
    setTimeout(function(){
        //  code after time
        let incStep = 0.25;
        soc += incStep;
        if (soc >= 100) {
            soc = 100.0;
            status = "stopCharging";
            console.log("Battery fully charged :-)");
        } else {
            // keep on charging ?
            if (status) {
                chargeCar();
            }
        }
        console.log("Charging status increased by " + incStep + " -> " + soc);
    }, 250);
}

function stopCharging() {
    console.log("STOP charging!");
    status = false;
}

servient.start().then((WoT) => {
    WoT.produce({
        title: "eCar",
        description: "eCarThing",
        properties: {
            soc: {
                type: "number",
                description: "Current chargingStatus in % (0 ... 100%)",
                observable: true,
                readOnly: true,
                minimum: 0.0,
                maximum: 100.0
            },
            driving: {
                type: "boolean",
                description: "Is car driving around",
                observable: true,
                readOnly: true
            },
            status: {
                type: "string",
                description: "Is car charging",
                observable: true,
                readOnly: true
            }
        },
        actions: {
            startDriving: {
                description: "Starting to drive"
            },
            stopDriving: {
                description: "Stopping to drive"
            },
            startCharging: {
                description: "Starting to charge"
            },
            stopCharging: {
                description: "Stopping to charge"
            }
        }
    }).then((thing) => {
        console.log("Produced " + thing.getThingDescription().title);
        // init property values
        soc = 85.25;
        driving = false;
        status = "notReadyToCharge";
		// set property handlers (using async-await)
		thing.setPropertyReadHandler("soc", async () => soc);
        thing.setPropertyReadHandler("driving", async () => driving);
        thing.setPropertyReadHandler("status", async () => status);


		// set action handlers (using async-await)
		thing.setActionHandler("startDriving", async (params, options) => {
            driveCar();
		});
		thing.setActionHandler("stopDriving", async (params, options) => {
            stopCar();
		});
        thing.setActionHandler("startCharging", async (params, options) => {
            chargeCar();
		});
        thing.setActionHandler("stopCharging", async (params, options) => {
            stopCharging();
		});

        // expose the thing
        thing.expose().then(() => {
            console.info(thing.getThingDescription().title + " ready");
            console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            thing.readProperty("status").then((c) => {
                console.log("eCar status is " + c);
            });
        });

        // after 5s change status
        setTimeout(function(){
            status = "readyToCharge";
            thing.readProperty("status").then((c) => {
                console.log("eCar status is " + c);
            });
        }, 5000); 
    });
});

// turn off messages from core package
const debug = console.debug
console.debug = (package,...args) => {
 if(package !== "[core]" && 
 package !== "[binding-mqtt]" && 
 package !== "[core/content-senders]"&& 
 package !== "[core/helpers]" && 
 package !== "[binding-http]" && 
 package !== "[core/consumed-thing]" && 
 package !== "[core/servient]"&& 
 package !== "[core/exposed-thing]"){
    debug(package,...args)
 }
}