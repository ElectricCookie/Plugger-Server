"use strict";

var _logger = require("./logger");

var log = _interopRequireWildcard(_logger);

var _store = require("./store");

var _store2 = _interopRequireDefault(_store);

var _sureJs = require("sure-js");

var _sureJs2 = _interopRequireDefault(_sureJs);

var _fs = require("fs");

var fs = _interopRequireWildcard(_fs);

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _rules = require("./rules");

var _rules2 = _interopRequireDefault(_rules);

var _scenes = require("./scenes");

var _scenes2 = _interopRequireDefault(_scenes);

var _glob = require("glob");

var _glob2 = _interopRequireDefault(_glob);

var _connector = require("./connector");

var _connector2 = _interopRequireDefault(_connector);

var _events = require("events");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var stores = {};
var events = new _events.EventEmitter();
var store = new _sureJs2.default();

function createStores() {

	var toCreate = ["Devices", "Rules", "Scenes", "Sensors"];

	for (var i = 0; i < toCreate.length; i++) {
		var namespace = toCreate[i];

		stores[namespace] = (0, _store2.default)({
			namespace: namespace,
			store: store,
			events: events
		});
	};
}

// Read all schemas in the schemas directory
function populateStore(callback) {
	(0, _glob2.default)(path.join(__dirname, "../schemas/*.sjs"), function (err, files) {
		if (err != null) return callback(err);
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			log.d("Adding schema: ", file);
			store.parseSchema(fs.readFileSync(file).toString());
		};
		callback();
	});
}

populateStore(function () {
	createStores();

	(0, _connector2.default)({ stores: stores, events: events });

	setInterval(function () {

		(0, _rules2.default)({
			stores: stores
		}, function (err, targetScenes) {

			(0, _scenes2.default)({
				targetScenes: targetScenes,
				stores: stores
			});
		});
	}, 1000);
});