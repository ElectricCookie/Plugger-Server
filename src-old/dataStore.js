import { EventEmitter } from "events";	
import * as path from "path";
import DataStore from "nedb";
import * as log from "./logger";


export default function createDataStore(parameters){

	let events = new EventEmitter();

	let { namespace,store} = parameters

	log.d("Creating DB for: "+namespace);

	let db = new DataStore({ 
		filename: path.join(__dirname,"../dbs/"+namespace+".db"),
		autoload: true
	});

	function create(data,callback){
		// Validate data passed
		store.validate(namespace,"Create",data,(err,data) => {
			// Check for errors
			if(err != null){ return callback(err) }
			// Insert data into db
			db.insert(data,(err,newDoc) => {
				// Check for errors
				if(err != null){ return callback(err) }
				// Callback
				callback(null,newDoc);
				// Notify listeners
				
				events.emit("created",newDoc);
			});
		});
	}

	function getAll(callback){
		// Fina all documents
		db.find({},(err,docs) => {
			// Check for errors
			if(err != null){ return callback(err) }
			// Validate that these docs are valid.
			store.validate(namespace,"GetAll",{ items: docs },(err,docs) => {
				// Check for errors
				if(err != null){ return callback(err) }
				// callback
				callback(null,docs);
				// Notifiy listeners
				events.emit("getAll",docs);
			});
		});
	}

	function get(id,callback){
		db.findOne({ _id: id },(err,doc) => {
			// Check for errors
			if(err != null){ return callback(err) }
				// Make sure doc is valid
				store.validate(namespace,"Get",doc,(err,doc) => {
					// Check for errors
					if(err != null){ return callback(err) }
					// Callback
					callback(null,doc);
					// Notify listeners
					events.emit("get",doc);
				});
		});
	}

	function update(doc,callback){

		store.validate(namespace,"Update",doc,(err,values) => {
			if(err != null){ return callback(err) }

			db.update({ _id: doc._id },doc,(err,op) => {

				if(err != null){ return callback(err) }

				db.findOne({ _id: doc._id },(err,doc) => {

					if(err != null){ return callback(err) }
					callback(null,doc);

					events.emit("updated",doc);

				});

				
			});
		
		});
	}

	function remove(id,callback){
		db.remove({_id: id},(err,ops) => {
			if(err != null){ return callback(err) }

			callback(null,ops);
			events.emit("deleted",id);
		})
	}
	

	return {
		events,
		create,
		update,
		db,
		get,
		getAll,
		remove,
	};


}