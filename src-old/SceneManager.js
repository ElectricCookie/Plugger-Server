import * as log from "./logger";
import * as utils from "./utils";


export default function SceneManager(parameters){

	let { scenes, rules, devices, sensors, applyDevice, restoreDevice } = parameters;


	sensors.events.on("updated",checkScenes);


	function getConditionParameters(condition,callback){

		let checkValue;
		let actual;
		let allowNumber = false;

		switch(condition.type){

	
			case "DEVICE_STATE":

				devices.get(condition.id,(err,device) => {
					if(err != null || device == null){ return callback(err); }

					switch(device.type){


						case "VARIABLE_1024":
							checkValue = parseInt(condition.value);
							actual = device.variable1024;
							allowNumber = true;
						break;

						case "RGB":

							checkValue = parseInt(condition.value);
							actual =  device.red << 16 + device.green << 16 + device.blue;
							allowNumber = true;
						break;

						case "BINARY":

							checkValue = condition.value == "true";
							actual = device.binary;

						break;


					}

					
					callback(null,{
						actual,
						allowNumber,
						checkValue
					});

				});

			break;			

			case "SENSOR_VALUE":

				sensors.get(condition.id,(err,sensor) => {

					if(err != null || sensor == null){ return callback(err); }

					


					switch(sensor.type){

						case "BINARY":

							checkValue = condition.value == "true";
							actual = sensor.binary;



						break;

						case "INT1024":

							checkValue = parseFloat(condition.value);
							allowNumber = true;
							actual = sensor.int1024;

						break;

						default: 
							return callback("Unknown Sensor Type");
						break;

					}

					callback(null,{
						actual,
						allowNumber,
						checkValue
					});

				});

			break;

			case "TIME":
				let d = new Date();
				checkValue = parseInt(condition.value);
				actual = d.getHours()*60+d.getMinutes();
				allowNumber = true;
				callback(null,{
						actual,
						allowNumber,
						checkValue
					});

			break;


			case "SCENE_STATE":

				scenes.get(condition.id,(err,scene) => {
					if(err != null || scene == null){
						return callback(err);
					}

					checkValue = condition.value == "true";
					actual = scene.active;

					callback(null,{
						actual,
						allowNumber,
						checkValue
					});

				});

			break;


			default:

				return callback("Invalid Condition type");

			break;

		}

	}

	function checkCondition(condition,callback){
		getConditionParameters(condition,(err,ops) => {
			if(err != null){
				return callback(err);
			}

			let { checkValue, actual, allowNumber } = ops;

			if(condition.operator == "IS" && actual == checkValue){
				return callback(null,true);
			}

			if(condition.operator == "IS_NOT" && actual != checkValue){
				return callback(null,true);
			}

			if(allowNumber){
				if(condition.operator == "GREATER" && checkValue < actual){
					return callback(null,true);
				}

				if(condition.operator == "LESS" && checkValue > actual){
					return callback(null,true);
				}
			}

			return callback(null,false);

		});
	}

	function checkRule(rule,callback){

		let results = [];

		utils.processArray(rule.conditions,(condition,done) => {



			checkCondition(condition,(err,state) => {
				if(err == null){
					results.push(state);
				}
				done(err);
			});
		},(err) => {
			if(err != null){
				log.e(err);
			}
			if(rule.operatorMode == "AND"){
				callback(err,results.indexOf(false) == -1);
			}
			if(rule.operatorMode == "OR"){
				callback(err,results.indexOf(true) != -1);
			}

		});


	}
		

	function checkScenes(){

		scenes.getAll((err,sceneItems) => {

			if(err != null){
				log.e(err);
				return;
			}

			sceneItems  = sceneItems.items;

			rules.getAll((err,ruleItems) => {


				if(err != null){
					log.e(err);
					return;
				}
				ruleItems = ruleItems.items;	

				let activeScenes = [];

				utils.processArray(ruleItems,(rule,done) => {
					
					checkRule(rule,(err,active) => {
						let newState;

						if(err != null){
							done(e);
						}

						if(rule.mode == "BIND"){
							newState = active;
						}

						if(rule.mode == "BIND_INVERSE"){
							newState = !active;
						}

						if(rule.mode == "ACTIVATE" && active){
							newState = true;
						}

						if(rule.mode == "DEACTIVATE" && !active){
							newState = false;
						}

						if(newState != null && newState != rule.lastState){
							log.s("Updating scene "+newState);
							scenes.get(rule.targetScene,(err,scene) => {
								if(err != null){
									return done(err);
								}
								scene.active = newState;
								scenes.update(scene,(err,ops) => {
									done(err);
										
								})
							});
							rule.lastState = newState;
							rules.update(rule,(err,ops) => {
								if(err != null)
									log.e(err)
							})
							
						}

					});


				},(err) => {
					if(err != null){
						log.e(err);	
					}
					
				});
			});
		});
	}


	scenes.events.on("updated",(scene) => {
		
		scenes.getAll((err,items) => {
			if(err != null){
				return log.e(err);
			}

			items = items.items;

			devices.getAll((err,deviceItems) => {
				deviceItems = deviceItems.items;


				items.sort((a,b) => {
					return a.priority-b.priority;
				});

				items.map((item) => {


					if(item.active){


						item.deviceStates.map((state) => {

							deviceItems.map((device) => {
								if(state._id == device._id){
									for (var i = 0; i < Object.keys(state).length; i++) {
										let key =  Object.keys(state)[i];
										device[key] = state[key];
									};
									device.updated = true;
								}
							});

						})

					}

				});

				deviceItems.map((device) => {
					if(device.updated){
						applyDevice(device);
					}else{
						restoreDevice(device._id);
					}
				});


			});


		});
	})

	


	setInterval(checkScenes,2000);
	





}