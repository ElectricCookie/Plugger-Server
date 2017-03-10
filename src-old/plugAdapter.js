let queue = [];
import * as log from "./logger";
import { exec  } from "child_process";
const sendLocation = "/home/pi/raspberry-remote/send";


export default function register(opts){

	let { app } = opts;


	const map = {

		"pW0azM4hugyfeuUh": {
			homeCode: "11111",
			deviceNumber: "2"
		},
		"YmcNCEmYWgjAKAls": {
			homeCode: "01111",
			deviceNumber: "1"
		},
		"acryAW2m1sfz7UNR": {
			homeCode: "01111",
			deviceNumber: "3"	
		}
	}

	app.on("applyDevice",(doc) => {
		if(map[doc._id] != null){
			let item = map[doc._id];


			queue.push({
				homeCode: item.homeCode,
				deviceNumber: item.deviceNumber,
				state: doc.binary ? 1 : 0
			});

		}
		

	});

}

setInterval(function() {
  var item, query;
  if (queue.length !== 0) {
	item = queue[0];
	query = sendLocation + " " + item.homeCode + " " + item.deviceNumber + " " + item.state;
	exec(query);
	log.s(query);
	return queue.shift();
  }
}, 300);