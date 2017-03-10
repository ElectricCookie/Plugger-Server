"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.getDefaultValue = getDefaultValue;
function getDefaultValue(type) {

	switch (type) {
		case "binary":
			return "false";
		case "variable1024":
			return "0";

	}
}