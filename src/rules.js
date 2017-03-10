import * as i from "immutable";
import * as log from "./logger";
export default function evaluateRules(options,callback){
	let { stores } = options;


	let rules = stores.Rules.getAll();

	let sceneStates = i.Map();


	let needed = rules.size;
	let done = 0;

	if(needed == 0){
		callback(null,i.List());
	}

	function next(){
			
		if(done == needed){

			let res = i.List();

			
			sceneStates.forEach((item,key) => {
				if(item.get("state")){
					res = res.push(key);
				}
			})


			
			return callback(null,res);
		}

		let rule = rules.get(done);


		evaluateRule(rules.get(done),(err,state) => {



			if(err != null){
				callback(err);
			}else{

				if(state != rule.get("state")){

				

					stores.Rules.setItem(rule.set("state",state),(err,res) =>{
						log.d("Updated rule status",err);
					});

				}

				if(state){

					rule.get("scenes").forEach((scene) => {

						if(sceneStates.get(scene) != null){
							if(sceneStates.get(scene).get("priority") > rule.get("priority")){
								return;
							}
						}

						sceneStates = sceneStates.set(scene,i.Map({
							priority: rule.get("priority"),
							state
						}));

					});

				}

				done++;
				next();

			}
		})

	}

	next();

	function applyAnd(conditions,callback){
		let needed = conditions.size;
		let done = 0;
		if(needed == 0){
			callback(null,false);
		}

		function next(){
			if(done == needed){
				return callback(null,true);
			}

			evaluateCondition(conditions.get(done),(err,state) => {
				if(err != null){
					callback(err);
				}else{
					if(!state){
						callback(null,false);
					}else{
						done++;
						next();	
					}
					
				}
			});

		}

		next();

	}

	function applyOr(conditions,callback){
		if(conditions == null){
			callback(null,false);
		}
		let needed = conditions.size;
		let done = 0;
		let foundTrue = false;

		if(needed == 0){
			callback(null,false);
		}

		function next(){
			if(done == needed){
				return callback(null,foundTrue);
			}

			evaluateCondition(conditions.get(done),(err,state) => {
				if(err != null){
					callback(err);
				}else{
					if(state){
						foundTrue = true;
					}
					done++;
					next();
				}
			});

		}

		next();

	}


	function evaluateCondition(condition,callback){

		let d = new Date();

		switch(condition.get("type")){

			case "AND":

				applyOr(condition.get("children"),callback);

			break;

			case "OR":

				applyOr(condition.get("children"),callback);



			break;

			case "SENSOR_VALUE":

				let sensor = stores.Sensors.getItem(condition.get("id"));

				if(sensor == null){
					callback(null,false);
				}else{
					callback(null,applyOperator({
						actual: formatSensorValue(sensor.get("type"),sensor.get("value")),
						compare: formatSensorValue(sensor.get("type"),condition.get("value")),
						operator: condition.get("operator"),
						allowNumbers: false
					}));
				}


			break;

			case "SCENE_STATE":

				let state = sceneStates.getItem(condition.get("id"));



				if(state == null){
					state = false;
				}else{
					state = state.get("state");
				}
				callback(null,applyOperator({
					actual: state,
					compare: condition.get("value") == "true",
					operator: condition.get("operator"),
					allowNumbers: false
				}));

			break;

			case "TIME":
				
				callback(null,applyOperator({
					actual: d.getHours()*60+d.getMinutes(),
					compare: parseInt(condition.get("value")),
					operator: condition.get("operator"),
					allowNumbers: true
				}));

			break;


			case "DATE":

				callback(null,applyOperator({
					actual: d.getDate(),
					compare: parseInt(condition.get("value")),
					operator: condition.get("operator"),
					allowNumbers: true
				}));

			break;


			case "YEAR":

				callback(null,applyOperator({
					actual: d.getYear(),
					compare: parseInt(condition.get("value")),
					operator: condition.get("operator"),
					allowNumbers: true
				}));

			break;

			case "DAY":

				callback(null,applyOperator({
					actual: d.getDay(),
					compare: parseInt(condition.get("value")),
					operator: condition.get("operator"),
					allowNumbers: true
				}));


			break;



		}

	}


	function applyOperator(options){

 		let { operator,compare,actual,allowNumbers } = options;

		if(allowNumbers){

			if(operator == "LT"){
				return compare < actual;
			}

			if(operator == "GT"){
				return actual > compare;
			}


		}

		if(operator == "IS"){
			return compare == actual;
		}

		if(operator == "IS_NOT"){
			return compare != actual;
		}

		return false;

	}

	function evaluateRule(rule,callback){


		evaluateCondition(rule.get("condition"),callback);


	}

}




function formatSensorValue(type,value){
	switch(type){
		case "NUMERIC":
			return parseFloat(value);
		break;
		case "BINARY":
			return value == "true";
		break;

	}
}