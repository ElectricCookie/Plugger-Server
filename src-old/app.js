import * as bodyParser from "body-parser";
import * as fs from "fs";
import * as log from "./logger";
import * as path from "path";
import express from "express";
import glob from "glob";
import Store from "sure-js";
import { EventEmitter } from "events";
import SceneManager from "./SceneManager";
import RgbAdapter from "./rgbAdapter";
import SensorAdapter from "./sensorAdapter";
import PlugAdapter from "./plugAdapter";
import createStore from "./dataStore";


const TCP_PORT = 80;

class App extends EventEmitter{

	constructor(){
		super();
		this.stores = {};
		this.store = new Store();
		this.readSchemas();
		this.createWebServer();
		
		this.once("storesReady",this.setupSceneManager);
		this.once("storesReady",() => {
			RgbAdapter({
				Devices: this.stores.Devices,
				mqttClient: this.mqttClient,
				app: this
			});

			PlugAdapter({
				app: this
			});
		});
		this.once("storesReady",() => {
			this.stores.Devices.getAll((err,devices) => {
				if(err != null){
					return log.e(err);
				}
				devices.items.map((device) => {
					this.applyDevice(device);
				});

				
			});
			this.stores.Devices.events.on("updated", (d) => {
				log.s("Updated device");
				this.emit("applyDevice",d);
			})
		});

		this.modifiedDevices = [];


		
	}


	applyDevice(device){

		if(this.modifiedDevices.indexOf(device._id) == -1){
			this.modifiedDevices.push(device._id);
		}

		this.emit("applyDevice",device);
	}

	restoreDevice(id){

		if(this.modifiedDevices.indexOf(id) == -1){
			return;
		}

		this.modifiedDevices.splice(this.modifiedDevices.indexOf(id),1);

		this.stores.Devices.get(id,(err,device) => {
			if(err != null || device == null){
				return log.e(err);
			}
			this.emit("applyDevice",device);
		})

	}

	readSchemas(){
		
	}


	setupSceneManager(){
		SceneManager({
			scenes: this.stores.Scenes,
			rules: this.stores.Rules,
			devices: this.stores.Devices,
			sensors: this.stores.Sensors,
			applyDevice: this.applyDevice.bind(this),
			restoreDevice: this.restoreDevice.bind(this)
		})
	}



	setupStores(){
		


		this.stores.Devices.events.on("updated",(device) => {

			this.stores.Scenes.getAll((err,scenes) => {
				if(err != null){
					return log.e(err);
				}
				scenes.items.map((scene) => {
					let changed = false;
					scene.deviceStates = scene.deviceStates.filter((item) => {
						if(item._id == device._id && device.type != item.type){
							changed = true;
							return false;
						}else{
							return true;
						}
					});


					if(changed){
						this.stores.Scenes.update(scene,(err) => {
							if(err != null){
								log.e(err);
							}
						})
					}


				});
			});

		});	

		this.emit("storesReady");

	}

	setupStore(namespace){

		return createStore({
			namespace,
			store: this.store,
		});
	}
}



export default new App();