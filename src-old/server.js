



/*


let plugDevices;
let scenes;
let sensors;
let rules;
let colorDevices;



	plugDevices = createRestHandler("PlugDevices");
	scenes = createRestHandler("Scenes");
	rules = createRestHandler("Rules");
	colorDevices = createRestHandler("ColorDevices");
	sensors = createRestHandler("Sensors");


	registerArtNet(colorDevices);
	registerPlugDevices(plugDevices);


	scenes.events.on("updated",() => {
		applyScenes();
	});


});



let app = express();


function evaluateCondition(condition,callback){
	let comparisonValue;

		switch(condition.type){

			case "TIME":

				let dt = new Date();
				let secs = dt.getSeconds() + (60 * dt.getMinutes()) + (60 * 60 * dt.getHours());

				comparisonValue = parseInt(condition.value);

				if(condition.operator == "IS"){
					return callback(null,comparisonValue == secs);
				}

				if(condition.operator == "IS_NOT"){
					return callback(null,comparisonValue != secs);
				}

				if(condition.operator == "GREATER"){
					return callback(null,comparisonValue > secs);
				}

				if(condition.operator == "SMALLER"){
					return callback(null,comparisonValue < secs);
				}

				return callback(null,false);


			break;


			case "SENSOR_VALUE":


				sensors.get(condition.id,(err,sensor) => {
					if(err != null){
						return callback(err);
					}
				
					if(sensor.type == "boolean"){


						comparisonValue = condition.value == "true";

						sensor.value = sensor.value == "true";


						if(condition.operator == "IS"){

							return callback(null,sensor.value == comparisonValue);
						}

						if(condition.operator == "IS_NOT"){
							return callback(null,sensor.value != comparisonValue);
						}						

						return callback(null,false);
					}else if(sensor.type == "nr"){

						comparisonValue = parseFloat(condition.value);

						if(condition.operator == "IS"){
							return callback(null, sensor.value == comparisonValue);
						}

						if(condition.operator == "IS_NOT"){
							return callback(null,sensor.value != comparisonValue);
						}	

						if(condition.operator == "SMALLER"){
							return callback(null,sensor.value < comparisonValue);
						}	

						if(condition.operator == "GREATER"){
							return callback(null,sensor.value > comparisonValue);
						}	

					}

				});

			break;

			case "SCENE_NOT_ACTIVE":


				scenes.get(condition.id,(err,scene) => {
					if(err != null){
						return callback(err);
					}

			
					callback(null,!scene.active);
				})

			break;


			case "SCENE_ACTIVE":


				scenes.get(condition.id,(err,scene) => {
					if(err != null){
						return callback(err);
					}


					callback(null,scene.active);
				})

			break;

		}	
}


function evaluateRule(rule,callback){

	let active = true;

	utils.processArray(rule.conditions,(condition,done) => {

		evaluateCondition(condition,(err,state) => {

			if(!state){
				active = false;
			}

			done(err);
		});
	},(err) => {
		callback(err,active);
	});
}


setInterval(() => {
	

	rules.getAll((err,ruleItems) => {
		if(err != null){
			return console.error(chalk.red("Error occured"),err);
		}

		ruleItems = ruleItems.items

		utils.processArray(ruleItems,(rule,done) => {

			evaluateRule(rule,(err,result) => {

				if(err != null){
					return done(err);
				}

				let newState;

				if(rule.mode == "ACTIVATE" && result){
					newState = true;
				}

				if(rule.mode == "DEACTIVATE" && !result){
					newState = false;
				}

				if(rule.mode == "BIND"){
					newState = result;
				}

				if(rule.mode == "BIND_INVERSE"){
					newState  = !result;
				}

				// Only apply if there's a change


				if(newState == null){
					return done(null);
				}



				if(newState == rule.lastState){
					return done(null);
				}


				rules.db.update({ _id: rule._id },{ $set: { lastState: newState } },(err,op) => {
					if(err != null){	
						return done(err);
					}
					// if newstate apply scene



					scenes.db.update({_id: rule.targetScene},{ $set: { active: newState }},(err,op) => {
						scenes.events.emit("updated",op);
						done(err);


					});
			

				});

				

			});

		},(err) => {

			if(err != null){
				return console.error(err);
			}

		});

	});

},500);



function applyScenes(){


	scenes.getAll((err,sceneItems) => {

		if(err != null){
			return console.error(err);
		}

		sceneItems = sceneItems.items;

		plugDevices.getAll((err,plugDeviceItems) => {

			if(err != null){
				return console.error(err);
			}

			plugDeviceItems = plugDeviceItems.items;

			let plugDeviceKeys = [];
			for (var i = 0; i < plugDevices.length; i++) {
				plugDeviceKeys.push(plugDevices[i]._id);

			};



			colorDevices.getAll((err,colorDeviceItems) => {

				if(err != null){
					return console.error(err);
				}

				colorDeviceItems = colorDeviceItems.items;

				let colorDeviceKeys = [];

				for (var i = 0; i < colorDeviceItems.length; i++) {
					colorDeviceKeys.push(colorDeviceItems[i]._id);
				};

				// Loaded everything lets get going.


				sceneItems = sceneItems.filter((scene) => {
					return scene.active;
				}).sort((a,b) => {
					return a.priority-b.priority;
				});


				for (var i = 0; i < sceneItems.length; i++) {
					let scene = sceneItems[i];

					for (var i = 0; i < scene.deviceStates.length; i++) {
						let state = scene.deviceStates[i];

						let found = false;
						// Find plugdevice

						for (var i = 0; i < plugDeviceItems.length; i++) {
							let plugDevice = plugDeviceItems[i];
							if(plugDevice._id == state.device){
								plugDevice.modified = true;
								found = true;
								plugDevice.value = state.value == "true";	
								break;
							}
						};


						if(found){
							continue;
						}

						for (var i = 0; i < colorDeviceItems.length; i++) {
							let colorDevice = colorDeviceItems[i];
							if(colorDevice._id == state.device){

								colorDevice.modified = true;
								found = true;

								let split = state.value.split(",");


								colorDevice.red = parseInt(split[0]);
								colorDevice.green = parseInt(split[1]);
								colorDevice.blue = parseInt(split[2]);
								colorDevice.white = parseInt(split[3]);
								break;
							}

						};




					};

				};



				for (var i = 0; i < colorDeviceItems.length; i++) {
					let colorDevice = colorDeviceItems[i];

					if(colorDevice.modified){
						colorDevices.update(colorDevice,(err,op) => {
							console.log(err,op);
						})
					}



				};


				for (var i = 0; i < plugDeviceItems.length; i++) {
					let plugDevice = plugDeviceItems[i];

					if(plugDevice.modified){
						plugDevices.update(plugDevice,(err,op) => {
							console.log(err,op);
						});
					}

					

				};




			})

		});


	});


}


app.use(bodyParser.json());

app.listen(80);

*/