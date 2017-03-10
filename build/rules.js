"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = evaluateRules;

var _immutable = require("immutable");

var i = _interopRequireWildcard(_immutable);

var _logger = require("./logger");

var log = _interopRequireWildcard(_logger);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function evaluateRules(options, callback) {
	var stores = options.stores;


	var rules = stores.Rules.getAll();

	var sceneStates = i.Map();

	var needed = rules.size;
	var done = 0;

	if (needed == 0) {
		callback(null, i.List());
	}

	function next() {

		if (done == needed) {
			var _ret = function () {

				var res = i.List();

				sceneStates.forEach(function (item, key) {
					if (item.get("state")) {
						res = res.push(key);
					}
				});

				return {
					v: callback(null, res)
				};
			}();

			if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
		}

		var rule = rules.get(done);

		evaluateRule(rules.get(done), function (err, state) {

			if (err != null) {
				callback(err);
			} else {

				if (state != rule.get("state")) {

					stores.Rules.setItem(rule.set("state", state), function (err, res) {
						log.d("Updated rule status", err);
					});
				}

				if (state) {

					rule.get("scenes").forEach(function (scene) {

						if (sceneStates.get(scene) != null) {
							if (sceneStates.get(scene).get("priority") > rule.get("priority")) {
								return;
							}
						}

						sceneStates = sceneStates.set(scene, i.Map({
							priority: rule.get("priority"),
							state: state
						}));
					});
				}

				done++;
				next();
			}
		});
	}

	next();

	function applyAnd(conditions, callback) {
		var needed = conditions.size;
		var done = 0;
		if (needed == 0) {
			callback(null, false);
		}

		function next() {
			if (done == needed) {
				return callback(null, true);
			}

			evaluateCondition(conditions.get(done), function (err, state) {
				if (err != null) {
					callback(err);
				} else {
					if (!state) {
						callback(null, false);
					} else {
						done++;
						next();
					}
				}
			});
		}

		next();
	}

	function applyOr(conditions, callback) {
		if (conditions == null) {
			callback(null, false);
		}
		var needed = conditions.size;
		var done = 0;
		var foundTrue = false;

		if (needed == 0) {
			callback(null, false);
		}

		function next() {
			if (done == needed) {
				return callback(null, foundTrue);
			}

			evaluateCondition(conditions.get(done), function (err, state) {
				if (err != null) {
					callback(err);
				} else {
					if (state) {
						foundTrue = true;
					}
					done++;
					next();
				}
			});
		}

		next();
	}

	function evaluateCondition(condition, callback) {

		var d = new Date();

		switch (condition.get("type")) {

			case "AND":

				applyOr(condition.get("children"), callback);

				break;

			case "OR":

				applyOr(condition.get("children"), callback);

				break;

			case "SENSOR_VALUE":

				var sensor = stores.Sensors.getItem(condition.get("id"));

				if (sensor == null) {
					callback(null, false);
				} else {
					callback(null, applyOperator({
						actual: formatSensorValue(sensor.get("type"), sensor.get("value")),
						compare: formatSensorValue(sensor.get("type"), condition.get("value")),
						operator: condition.get("operator"),
						allowNumbers: false
					}));
				}

				break;

			case "SCENE_STATE":

				var state = sceneStates.getItem(condition.get("id"));

				if (state == null) {
					state = false;
				} else {
					state = state.get("state");
				}
				callback(null, applyOperator({
					actual: state,
					compare: condition.get("value") == "true",
					operator: condition.get("operator"),
					allowNumbers: false
				}));

				break;

			case "TIME":

				callback(null, applyOperator({
					actual: d.getHours() * 60 + d.getMinutes(),
					compare: parseInt(condition.get("value")),
					operator: condition.get("operator"),
					allowNumbers: true
				}));

				break;

			case "DATE":

				callback(null, applyOperator({
					actual: d.getDate(),
					compare: parseInt(condition.get("value")),
					operator: condition.get("operator"),
					allowNumbers: true
				}));

				break;

			case "YEAR":

				callback(null, applyOperator({
					actual: d.getYear(),
					compare: parseInt(condition.get("value")),
					operator: condition.get("operator"),
					allowNumbers: true
				}));

				break;

			case "DAY":

				callback(null, applyOperator({
					actual: d.getDay(),
					compare: parseInt(condition.get("value")),
					operator: condition.get("operator"),
					allowNumbers: true
				}));

				break;

		}
	}

	function applyOperator(options) {
		var operator = options.operator,
		    compare = options.compare,
		    actual = options.actual,
		    allowNumbers = options.allowNumbers;


		if (allowNumbers) {

			if (operator == "LT") {
				return compare < actual;
			}

			if (operator == "GT") {
				return actual > compare;
			}
		}

		if (operator == "IS") {
			return compare == actual;
		}

		if (operator == "IS_NOT") {
			return compare != actual;
		}

		return false;
	}

	function evaluateRule(rule, callback) {

		evaluateCondition(rule.get("condition"), callback);
	}
}

function formatSensorValue(type, value) {
	switch (type) {
		case "NUMERIC":
			return parseFloat(value);
			break;
		case "BINARY":
			return value == "true";
			break;

	}
}