const LOG_LEVEL = 0;
import moment from "moment";
import * as symbols from "log-symbols"; 
import chalk from "chalk";
// 0 - debug,warn,error,success
// 1 - success,error,warn
// 2 - warn,error

function timestamp(){
	return moment().format("DD.MM.YYYY HH:MM:SS");
}

export function d(...messages){
	if(LOG_LEVEL > 0){
		return;
	}
	messages.unshift(symbols.info+" ["+timestamp()+"]:");
	console.log.apply(this,messages);
}

export function s(...messages){
	if(LOG_LEVEL > 1){
		return;
	}
	messages.unshift(symbols.success+" ["+timestamp()+"]:");
	console.log.apply(this,messages);
}
export function w(...messages){
	messages.unshift(symbols.warning+" ["+timestamp()+"]:");
	console.log.apply(this,messages);
}
export function e(...messages){
	messages.unshift(symbols.error+" ["+timestamp()+"]:");
	console.log.apply(this,messages);
}