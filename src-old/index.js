import * as net from "net";
import * as log from "./logger";
import { EventEmitter } from "events";
import createStore from "./dataStore";
import Store from "sure-js";

const TCP_PORT = 1337;


class Server extends EventEmitter{
		
	constructor(){
		super();
		setupStores();
	}


	setupStores(){
		
		log.d("Setting up schema stores...");

		this.store = new Store();
		this.stores = {};

		glob(path.join(__dirname,"../schemas/*.sjs"),(err,files) => {
			for (var i = 0; i < files.length; i++) {
				let file = files[i];
				log.d("Adding schema: ",file);
				this.store.parseSchema(fs.readFileSync(file).toString());

			};
	
			let namespaces = ["Devices","Sensors","Rules","Scenes"];
			
			for (var i = 0; i < namespaces.length; i++) {
				let namespace = namespaces[i];
				this.stores[namespace] = this.setupStore(namespace);
			};

			this.emit("storesReady");

		});

	}

	setupStore(namespace){

		createStore({
			store: this.store,
			namespace
		});

	}

	setupTcp(){
		this.server = net.createServer(this.handleConnection);
	}

	handleConnection(socket){

		// Possible = android,artnet
		let deviceType = null;

		socket.on("data",(data) => {

			if(deviceType == null){
				data = data.toString();
				if(data.indexOf("clientType") != -1){

					data = data.split(":");

					if(data.length == 2){

						switch(data[1]){
							case "client":
							case "controller":
								clientType = data[1];
							break;
							default:
								socket.close();
							break;
						}

					}else{
						socket.close();
					}
				}else{
					socket.close();
				}

			}else{
				if(deviceType == "client"){

					data = data.toString();

					try{
						data = JSON.parse(data);
					}catch(e){
						log.e(e)
						return;
					}
					
					switch(data.action){
						
					}

				}else if(deviceType == "controller"){
					
				}
			}

			

		})

	}


}