import * as log from "./logger";
export default function SensorAdapter(ops){
	
	let { mqttClient, Sensors } = ops;

	mqttClient.subscribe("sensor/#");



	mqttClient.on("message",(topic,message) => {
		if(topic == "sensor/pir/"){
			Sensors.get("LtRaSVFnNyRDmr4H",(err,sensor) => {
				if(err != null){
					return log.e(err);
				}
				sensor.binary = message == "1";
				Sensors.update(sensor,(err) => {
					if(err != null){
						log.e(err);
					}
				})
			});
			
		}
	})

}