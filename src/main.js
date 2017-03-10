import * as log from "./logger";
import createStore from "./store";
import Store from "sure-js";
import * as fs from "fs";
import * as path from "path";
import evaluateRules from "./rules";
import applyScenes from "./scenes";
import glob from "glob";
import connector from "./connector";

import { EventEmitter } from "events";

const stores = {};
const events = new EventEmitter();
const store = new Store();



function createStores(){


	let toCreate = ["Devices","Rules","Scenes","Sensors"];

	for (var i = 0; i < toCreate.length; i++) {
		let namespace = toCreate[i];

		stores[namespace] = createStore({
			namespace,
			store,
			events
		});
	};


}

// Read all schemas in the schemas directory
function populateStore(callback){
	glob(path.join(__dirname,"../schemas/*.sjs"),(err,files) => {
		if(err != null)  return callback(err);
		for (var i = 0; i < files.length; i++) {
			let file = files[i];
			log.d("Adding schema: ",file);
			store.parseSchema(fs.readFileSync(file).toString());
		};
		callback();
	});

}


populateStore(() => {
	createStores();

	connector({ stores, events })
	
	setInterval(() => {

		evaluateRules({
			stores
		},(err,targetScenes) => {

			applyScenes({
				targetScenes,
				stores
			})


		});

	},1000);



	

});