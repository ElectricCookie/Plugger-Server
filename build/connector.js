"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = setup;

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _logger = require("./logger");

var l = _interopRequireWildcard(_logger);

var _ws = require("ws");

var WebSocket = _interopRequireWildcard(_ws);

var _bodyParser = require("body-parser");

var bodyParser = _interopRequireWildcard(_bodyParser);

var _http = require("http");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

app.use(bodyParser.json());
var server = (0, _http.createServer)(app);

var wss = new WebSocket.Server({ server: server });

l.d("Starting server on port 80");

function setup(_ref) {
	var stores = _ref.stores,
	    events = _ref.events;


	var storeItems = Object.keys(stores);

	wss.on("connection", function (ws) {

		for (var i = 0; i < storeItems.length; i++) {

			var ns = stores[storeItems[i]];

			ws.send(JSON.stringify({

				messageType: "initalValues",
				namespace: storeItems[i],
				items: ns.getAll().toJS()

			}));
		}

		events.on("updated", function (_ref2) {
			var ns = _ref2.ns,
			    item = _ref2.item;

			ws.send(JSON.stringify({

				messageType: "updatedValue",
				namespace: ns,
				item: item.toJS()

			}));
		});
	});

	app.get("/", function (req, res) {
		res.json({
			status: true,
			data: {

				endpoints: Object.keys(stores)

			}
		});
	});

	var _loop = function _loop(i) {
		var ns = storeItems[i];
		app.get("/" + ns, function (req, res) {
			// Get all items
			res.json({
				status: true,
				data: stores[ns].getAll().toJS()
			});
		});

		app.get("/" + ns + "/:id", function (req, res) {

			var item = stores[ns].getItem(req.params.id);

			res.json({
				status: item != null,
				data: item.toJS(),
				error: item == null ? "itemNotFound" : null
			});
		});

		app.patch("/" + ns + "/:id", function (req, res) {

			stores[ns].setItem(req.body, function (err, newItem) {

				res.json({
					status: err == null,
					error: err
				});
			});
		});

		app.post("/" + ns, function (req, res) {

			stores[ns].createItem(req.body, function (err, newItem) {

				res.json({
					status: err == null,
					error: err
				});
			});
		});

		app.delete("/" + ns + "/:id", function (req, res) {

			stores[ns].deleteItem();

			res.json({
				status: true
			});
		});
	};

	for (var i = 0; i < storeItems.length; i++) {
		_loop(i);
	}

	server.listen(80);
}