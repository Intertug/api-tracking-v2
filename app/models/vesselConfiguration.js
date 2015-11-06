//Dependencies
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

//Schema
var vesselConfigSchema = new Schema({
	vesselId: Number,
	vesselName: String,
	image: String,
	callsign: String,
	IMO: String,
	flag: String,
	fleetId: Number,
	fleetName: String,
	dataSheet: String,
	yearBuild: Number,
	lastReport: String,
	labels: Schema.Types.Mixed
}); 

//Exports
module.exports = mongoose.model("vesselConfiguration", vesselConfigSchema); //Crea una collection en Mongo