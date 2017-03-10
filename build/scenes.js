"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = applyScenes;

var _immutable = require("immutable");

var i = _interopRequireWildcard(_immutable);

var _devices = require("./devices");

var _logger = require("./logger");

var log = _interopRequireWildcard(_logger);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function applyScenes(options) {
	var stores = options.stores,
	    targetScenes = options.targetScenes;


	var devices = stores.Devices.getAll();

	devices = devices.map(function (device) {

		var defaultV = (0, _devices.getDefaultValue)(device.get("type"));

		if (defaultV != device.get("value")) {
			return device.set("value", defaultV);
		}
		return device;
	});

	var scenes = stores.Scenes.getAll().sort(function (aI, bI) {

		var a = aI.get("priority");
		var b = bI.get("priority");

		return a < b ? 1 : a > b ? -1 : 0;
	});

	var deviceStates = i.List();

	scenes = scenes.map(function (scene) {
		var isActive = targetScenes.includes(scene.get("id"));
		if (isActive != scene.get("active")) {
			scene = scene.set("active", isActive);
			stores.Scenes.setItem(scene, function (err) {
				log.d("Updated scene " + scene.get("title"));
			});
		}

		if (scene.get("active")) {
			applyScene(scene);
		}

		return scene;
	});

	devices.forEach(function (item) {

		var stored = stores.Devices.getItem(item.get("id"));

		if (stored.get("value") != item.get("value")) {

			stores.Devices.setItem(stored.set("value", item.get("value")), function (err, item) {
				log.d("Updated device!", err, item);
			});
		}
	});

	function applyScene(scene) {

		scene.get("deviceStates").forEach(function (deviceState) {
			devices = devices.map(function (device) {
				if (device.get("id") == deviceState.get("id") && device.get("value") != deviceState.get("value")) {
					device = device.set("value", deviceState.get("value"));
					return device;
				}
				return device;
			});
		});
	}
}