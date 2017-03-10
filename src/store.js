import * as path from "path";
import * as fs from "fs";
import * as log from "./logger";
import { EventEmitter } from "events"
import * as i from "immutable";
import id from "uuid/v1";

const DATA_PATH = path.join(__dirname,"../data");


if(!fs.existsSync(DATA_PATH)){
	fs.mkdirSync(DATA_PATH)
}	

export default function createStore(options){


	let { store, namespace, events } = options;

	let storageLocation = path.join(DATA_PATH,"/"+namespace+".json");



	let items;

	if(fs.existsSync(storageLocation)){
		items = i.fromJS(require(storageLocation));
	}else{
		items = i.List();	
		save();
	}




	function save(){
		fs.writeFile(storageLocation,JSON.stringify(items.toJS(),null,4),() => {
			log.d("Saved store: "+namespace);
		});

	}


	function getAll(){
		return items;
	}


	function getItem(id){
		return items.find((item) => { return item.get("id") == id });
	}


	function setItem(newItem,callback){

		
		
		if(newItem.toJS != null && item == getItem(newItem.get("id"))){
			return callback(null,newItem);
		}

		
		let item = newItem.toJS != null ? newItem.toJS() : newItem;


		store.validate(namespace,"Item",item,(err,item) => {

			if(err != null){ return callback(err) }

			newItem = i.fromJS(item);

			items = items.map((item) => {
				if(item.get("id") == newItem.get("id")){
					return newItem;
				}
				return item;
			});

			events.emit("updated",{ ns: namespace, item: newItem });
			save();

			callback(null,newItem);
		});

		
	}


	function createItem(item,callback){

		if(item.toJS == null){
			item = i.fromJS(item);
		}

		setItem(item.set("id",id()),callback);
		save();
	}

	function deleteItem(id){
		items = items.filter((item) => {
			return item.get("id") != id;
		})
		events.emit("deleted",{ ns: namespace, id: id });
		save();
	}


	return {
		getAll,
		getItem,
		createItem,
		deleteItem,
		setItem,
		events
	}

}