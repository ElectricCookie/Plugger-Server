import chalk from "chalk";
import { Buffer } from "buffer";

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


console.log(Math.floor(Number(10).map(0,1024,0,255)));

export default function register(params){

	let  { Devices, mqttClient, app } = params;
	//console.log(mqttClient);

	app.on("applyDevice",(device) => {
		console.log(device._id);
		try{
			switch(device._id){
				case "3ZtjSHJzgHxk6Db5":
		
					mqttClient.publish("rgb-1/0",String(device.red),{ retain: true });
					mqttClient.publish("rgb-1/1",String(device.green),{ retain: true });
					mqttClient.publish("rgb-1/2",String(device.blue),{ retain: true });

				break;

				case "pZ5TyG6fjt2nTYgr":
					mqttClient.publish("rgb-1/3",String(Math.floor(device.variable1024.map(0,1024,0,255))),{ retain: true });
				break;

				case "Ba2NtGOrueIKkLNK":
					mqttClient.publish("rgb-1/7",String(Math.floor(device.variable1024.map(0,1024,0,255))),{ retain: true });
				break;

				case "Q4x3tDq90tZd6G5U":
				
					mqttClient.publish("rgb-1/4",String(device.red),{ retain: true });
					mqttClient.publish("rgb-1/5",String(device.green),{ retain: true });
					mqttClient.publish("rgb-1/6",String(device.blue),{ retain: true });

				break;
			}
		
		}catch(e){
			console.error(e);
		}
		
	});

}

