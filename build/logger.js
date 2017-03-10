"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.d = d;
exports.s = s;
exports.w = w;
exports.e = e;

var _moment = require("moment");

var _moment2 = _interopRequireDefault(_moment);

var _logSymbols = require("log-symbols");

var symbols = _interopRequireWildcard(_logSymbols);

var _chalk = require("chalk");

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var LOG_LEVEL = 0;

// 0 - debug,warn,error,success
// 1 - success,error,warn
// 2 - warn,error

function timestamp() {
	return (0, _moment2.default)().format("DD.MM.YYYY HH:MM:SS");
}

function d() {
	if (LOG_LEVEL > 0) {
		return;
	}

	for (var _len = arguments.length, messages = Array(_len), _key = 0; _key < _len; _key++) {
		messages[_key] = arguments[_key];
	}

	messages.unshift(symbols.info + " [" + timestamp() + "]:");
	console.log.apply(this, messages);
}

function s() {
	if (LOG_LEVEL > 1) {
		return;
	}

	for (var _len2 = arguments.length, messages = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
		messages[_key2] = arguments[_key2];
	}

	messages.unshift(symbols.success + " [" + timestamp() + "]:");
	console.log.apply(this, messages);
}
function w() {
	for (var _len3 = arguments.length, messages = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
		messages[_key3] = arguments[_key3];
	}

	messages.unshift(symbols.warning + " [" + timestamp() + "]:");
	console.log.apply(this, messages);
}
function e() {
	for (var _len4 = arguments.length, messages = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
		messages[_key4] = arguments[_key4];
	}

	messages.unshift(symbols.error + " [" + timestamp() + "]:");
	console.log.apply(this, messages);
}