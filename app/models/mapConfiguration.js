//Dependencies
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

//Schema
var mapConfigSchema = new Schema({
	fleetId : Number,
	center: Schema.Types.Mixed,
	zoom: Number,
	cluster: Number,
	mapType: String,
	platforms: Schema.Types.Mixed,
	docks: Schema.Types.Mixed,
	anchorages: Schema.Types.Mixed,
	moorings: Schema.Types.Mixed
}); 

//Exports
module.exports = mongoose.model("mapConfiguration", mapConfigSchema); //Crea una collection en Mongo