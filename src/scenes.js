import * as i from "immutable";
import { getDefaultValue } from "./devices";
import * as log from "./logger";
export default function applyScenes(options){
	let { stores, targetScenes } = options;

	let devices = stores.Devices.getAll();

	devices = devices.map((device) => {

		let defaultV = getDefaultValue(device.get("type"));

		if(defaultV != device.get("value")){
			return device.set("value",defaultV)
		}
		return device;
	});


	let scenes = stores.Scenes.getAll().sort((aI,bI) => {

		let a = aI.get("priority");
		let b = bI.get("priority");

		return a < b ? 1 : a > b ? -1 : 0;

	});


	let deviceStates = i.List();


	scenes = scenes.map((scene) => {
		let isActive = targetScenes.includes(scene.get("id"));
		if(isActive != scene.get("active")){
			scene = scene.set("active",isActive);
				stores.Scenes.setItem(scene,(err) => {
				log.d("Updated scene "+scene.get("title"));
			});
		}

		

		if(scene.get("active")){
			applyScene(scene);
		}

		return scene;

	});




	devices.forEach((item) => {

		let stored = stores.Devices.getItem(item.get("id"))

		if(stored.get("value") != item.get("value")){

			stores.Devices.setItem(stored.set("value",item.get("value")),(err,item) => {
				log.d("Updated device!",err,item);
			});

		}

	});


	function applyScene(scene){

		scene.get("deviceStates").forEach((deviceState) => {
			devices = devices.map((device) => {
				if(device.get("id") == deviceState.get("id") && device.get("value") != deviceState.get("value")){
					device = device.set("value",deviceState.get("value")) ;
					return device;
				}
				return device;
			})
		});

	}

}

