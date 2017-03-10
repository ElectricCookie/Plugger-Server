import express from "express";
import * as l from "./logger";
import * as WebSocket from "ws";
import * as bodyParser from "body-parser";
import { createServer } from "http";

const app = express();

app.use(bodyParser.json());
const server = createServer(app);

const wss = new WebSocket.Server({server});


l.d("Starting server on port 80");

export default function setup({ stores, events }){

	let storeItems = Object.keys(stores);

	wss.on("connection",(ws) => {

		for(let i = 0; i < storeItems.length; i++){

			let ns = stores[storeItems[i]];


			ws.send(JSON.stringify({

				messageType: "initalValues",
				namespace: storeItems[i],
				items: ns.getAll().toJS()

			}));

		}

		events.on("updated",({ ns, item }) => {
			ws.send(JSON.stringify({

				messageType: "updatedValue",
				namespace: ns,
				item: item.toJS()	

			}));
		});

	});

	app.get("/",(req,res) => {
		res.json({
			status: true,
			data: {

				endpoints: Object.keys(stores)

			}
		});
	})

	
	for(let i = 0; i < storeItems.length; i++){
		let ns = storeItems[i]
		app.get("/"+ns,(req,res) => {
			// Get all items
			res.json({
				status: true,
				data: stores[ns].getAll().toJS()
			});
		});

		app.get("/"+ns+"/:id",(req,res) => {

			let item = stores[ns].getItem(req.params.id);


			res.json({
				status: item != null,
				data: item.toJS(),
				error: item == null ? "itemNotFound" : null
			});

		});


		app.patch("/"+ns+"/:id",(req,res) => {

			stores[ns].setItem(req.body,(err,newItem) => {

				res.json({
					status: err == null,
					error: err
				});

			});

		});

		app.post("/"+ns,(req,res) => {

			stores[ns].createItem(req.body,(err,newItem) => {

				res.json({
					status: err == null,
					error: err
				});

			});

		});

		app.delete("/"+ns+"/:id",(req,res) => {


			stores[ns].deleteItem();

			res.json({
				status: true
			});

		});



	}


	server.listen(80);

}


