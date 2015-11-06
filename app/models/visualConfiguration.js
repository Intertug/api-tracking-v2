//Dependencies
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

//Schema
var visualConfigSchema = new Schema({
	pageId: Number,
	logo: String,
	fleets: Schema.Types.Mixed,
	sio: Schema.Types.Mixed,
	alerts: Schema.Types.Mixed
}); 

//Exports
module.exports = mongoose.model("visualConfiguration", visualConfigSchema); //Crea una collection en Mongo