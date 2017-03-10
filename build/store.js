"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = createStore;

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _fs = require("fs");

var fs = _interopRequireWildcard(_fs);

var _logger = require("./logger");

var log = _interopRequireWildcard(_logger);

var _events = require("events");

var _immutable = require("immutable");

var i = _interopRequireWildcard(_immutable);

var _v = require("uuid/v1");

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var DATA_PATH = path.join(__dirname, "../data");

if (!fs.existsSync(DATA_PATH)) {
	fs.mkdirSync(DATA_PATH);
}

function createStore(options) {
	var store = options.store,
	    namespace = options.namespace,
	    events = options.events;


	var storageLocation = path.join(DATA_PATH, "/" + namespace + ".json");

	var items = void 0;

	if (fs.existsSync(storageLocation)) {
		items = i.fromJS(require(storageLocation));
	} else {
		items = i.List();
		save();
	}

	function save() {
		fs.writeFile(storageLocation, JSON.stringify(items.toJS(), null, 4), function () {
			log.d("Saved store: " + namespace);
		});
	}

	function getAll() {
		return items;
	}

	function getItem(id) {
		return items.find(function (item) {
			return item.get("id") == id;
		});
	}

	function setItem(newItem, callback) {

		if (newItem.toJS != null && item == getItem(newItem.get("id"))) {
			return callback(null, newItem);
		}

		var item = newItem.toJS != null ? newItem.toJS() : newItem;

		store.validate(namespace, "Item", item, function (err, item) {

			if (err != null) {
				return callback(err);
			}

			newItem = i.fromJS(item);

			items = items.map(function (item) {
				if (item.get("id") == newItem.get("id")) {
					return newItem;
				}
				return item;
			});

			events.emit("updated", { ns: namespace, item: newItem });
			save();

			callback(null, newItem);
		});
	}

	function createItem(item, callback) {

		if (item.toJS == null) {
			item = i.fromJS(item);
		}

		setItem(item.set("id", (0, _v2.default)()), callback);
		save();
	}

	function deleteItem(id) {
		items = items.filter(function (item) {
			return item.get("id") != id;
		});
		events.emit("deleted", { ns: namespace, id: id });
		save();
	}

	return {
		getAll: getAll,
		getItem: getItem,
		createItem: createItem,
		deleteItem: deleteItem,
		setItem: setItem,
		events: events
	};
}