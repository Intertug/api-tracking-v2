//Dependencies
var express = require("express");
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

var sql = require('mssql');
 
var config = {
    user: '#',
    password: '#',
    server: '#',
    database: '#',
    connectionTimeout: 480000,
    requestTimeout: 480000
}

//Mongoose
var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/tracking");//Si no existe la base en Mongo la crea 

var mapConfiguration = require("./app/models/mapConfiguration");
var visualConfiguration = require("./app/models/visualConfiguration");
var vesselConfiguration = require("./app/models/vesselConfiguration");

//Routes
var router = express.Router();

router.use(function(req, res, next){
	console.log(req.url);
	next();
});

router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

router.get("/", function(req, res){
	res.json({message: "welcome!"});
});

//Helpers
function mathDate(date, days){

	var d = parseInt(date.split("-")[2]); 
	var	m = parseInt(date.split("-")[1]) - 1;
	var	y = parseInt(date.split("-")[0]);

    miliseconds = parseInt(35*24*60*60*1000);
    calendar = new Date(y, m, d);
    day = calendar.getDate();
    month = calendar.getMonth(); // between 0-11
    year = calendar.getFullYear();
    
    time = calendar.getTime();
    miliseconds = parseInt(days*24*60*60*1000);
    total = calendar.setTime(time+miliseconds);
    
    day = calendar.getDate();
    month = calendar.getMonth();
    year = calendar.getFullYear();
    if (month < 9)
    	if (day <= 9)
    		newDate = year+"-0"+(month+1)+"-0"+day;
    	else
    		newDate = year+"-0"+(month+1)+"-"+day;
    else
    	if (day <= 9)
    		newDate = year+"-"+(month+1)+"-0"+day;
 		else
 			newDate = year+"-"+(month+1)+"-"+day;

    return newDate;
}

//Insert and GET all Map Configurations
router.route("/mapConfiguration")
	.post(function(req, res){
		var config = new mapConfiguration();
		config.fleetId = req.body.fleetId;
		config.center = req.body.center;
		config.zoom = req.body.zoom;
		config.cluster = req.body.cluster;
		config.mapType = req.body.mapType;
		config.platforms = req.body.platforms;
		config.docks = req.body.docks;
		config.anchorages = req.body.anchorages;
		config.moorings = req.body.moorings;
		config.save(function(err){
			if (err) res.send(err);
			res.json({message: "Config created!"});
		});
	})
	.get(function(req, res){
		mapConfiguration.find(function(err, config){
			if(err) res.send(err);
			res.json(config);
		});
	});

//Insert and GET all Visual Configurations
router.route("/visualConfiguration")
	.post(function(req, res){
		var config = new visualConfiguration();
		config.pageId = req.body.pageId;
		config.logo = req.body.logo;
		config.fleets = req.body.fleets;
		config.sio = req.body.sio;
		config.alerts = req.body.alerts;
		config.save(function(err){
			if (err) res.send(err);
			res.json({message: "Config created!"});
		});
	})
	.get(function(req, res){
		visualConfiguration.find(function(err, config){
			if(err) res.send(err);
			res.json(config);
		});
	});

//Insert and GET all Vessel Configurations
router.route("/vesselConfiguration")
	.post(function(req, res){
		var config = new vesselConfiguration();
		config.vesselId = req.body.vesselId;
		config.vesselName = req.body.vesselName;
		config.image = req.body.image;
		config.callsign = req.body.callsign;
		config.IMO = req.body.IMO;
		config.flag = req.body.flag;
		config.fleetId = req.body.fleetId;
		config.fleetName = req.body.fleetName;
		config.dataSheet = req.body.dataSheet;
		config.yearBuild = req.body.yearBuild;
		config.lastReport = req.body.lastReport;
		config.labels = req.body.labels;
		config.save(function(err){
			if (err) res.send(err);
			res.json({message: "Config created!"});
		});
	})
	.get(function(req, res){
		vesselConfiguration.find(function(err, config){
			if(err) res.send(err);
			res.json(config);
		});
	});

//GET operational state
router.route("/operationalState/:vesselId/:dateId")
	.get(function(req, res){
		var connection = new sql.Connection(config, function(err) {
		    if (err) return console.log(err)

		 	var vesselId = req.params.vesselId;
		 	var dateId = req.params.dateId;
		    var request = new sql.Request(connection);
		    request.query("SELECT [vesselid],[vesselname], [Component], [State0],[State1],[State2],[State3],[State4],[State5],[Chk01],[Chk02],[Chk03] FROM [ITG-Sio].[dbo].[3100-ETLVesselsOpState] where TimeString = '"+dateId+"' and vesselid = "+vesselId, function(err, recordset) {
		        if (err) return console.log(err)
		        var data = {};
		    	data.vesselid = vesselId;
		    	data.state = {};
		        if (recordset.length > 0){
		        	recordset.forEach(function(elem, index){
		        		var state;
		        		var engine;
		        		if(elem.State1 == 1) state = "OffState";
		        		else if(elem.State2 == 1) state = "StandByState";
		        		else if(elem.State3 == 1) state = "NavigationState";
		        		else if(elem.State4 == 1) state = "OperationState";
		        		else state = "UnkownState";
		        		if (elem.Component == "ENG_PS"){ 
		        			data.state.port = state;
		        		}
		        		else {
		        			data.state.starboard = state;
		        		}
		        	});
		        }
		        else{
		        	data.state.message = "empty";
		        }
		        res.json(data);
		    });
		});
		 
		connection.on('error', function(err) {
		    console.log(err);
		});
	});

//GET fuel usage of vessel by month

/*router.route("/fuelUsage/:vesselId/:date1/:date2")
	.get(function(req, res){
		var connection = new sql.Connection(config, function(err) {
		    if (err) return console.log(err)

		    var vesselId = req.params.vesselId;
		    var date1 = req.params.date1;
		    var date2 = req.params.date2;
		    var diffDate = ((new Date(date2)) - (new Date(date1))) / (1000 * 60 * 60 * 24) + 1;
		    var date1Temp = date1;
		    var request = new sql.Request(connection);
		    var prp000 = [], prp001 = [], prp002 = [], prs000 = [], prs001 = [], prs002 = [], bow001 = [], bow002 = [], gep001 = [], gep002 = [], ges001 = [], ges002 = [];
		    var data = {};
		    data.vesselid = vesselId;
		    data.data = [];

		    while(date1Temp <= date2){
		    	
		    	var queryDate = date1Temp.split("-")[0] + date1Temp.split("-")[1] + date1Temp.split("-")[2];
			    request.query("SELECT [DataCode], [DataValue], [TimeString] FROM [ITG-Sio].[dbo].[2160-DAQOnBoardData] where vesselid = "+vesselId+" and DataCode in ('PRP000', 'PRP001', 'PRP002', 'PRS000', 'PRS001', 'PRS002', 'BOW001', 'BOW002', 'GEP001', 'GEP002', 'GES001', 'GES002') and TimeString like '"+queryDate+"' + '%'", function(err, recordset) {
			        if (err) return console.log(err)

			        var dateString;
			        recordset.forEach(function(elem, index){

			        	if (elem.DataCode == 'PRP000'){
			        		if (elem.DataValue > 400) prp000.push(1)
			        	}
			        	else if (elem.DataCode == 'PRP001') prp001.push(elem.DataValue)
			        	else if (elem.DataCode == 'PRP002') prp002.push(elem.DataValue)
			        	else if (elem.DataCode == 'PRS000'){ 
			        		if (elem.DataValue > 400) prs000.push(1)
			        	}
			        	else if (elem.DataCode == 'PRS001') prs001.push(elem.DataValue)
			        	else if (elem.DataCode == 'PRS002') prs002.push(elem.DataValue)
			        	else if (elem.DataCode == 'BOW001') bow001.push(elem.DataValue)
			        	else if (elem.DataCode == 'BOW002') bow002.push(elem.DataValue)
			        	else if (elem.DataCode == 'GEP001') gep001.push(elem.DataValue)
			        	else if (elem.DataCode == 'GEP002') gep002.push(elem.DataValue)
			        	else if (elem.DataCode == 'GES001') ges001.push(elem.DataValue)
			        	else if (elem.DataCode == 'GES001') ges002.push(elem.DataValue)
			        	dateString = elem.TimeString.substring(0,4) + "-" + elem.TimeString.substring(4,6) + "-" + elem.TimeString.substring(6,8);

			        });
					
					var temp = {}
			    	temp.CCPB = prp002.length == 0 ? 0 : parseFloat(((Math.max.apply(Math, prp002) - Math.min.apply(Math, prp002)) * 0.2641720512415584).toFixed(2));
			    	temp.CHPB = prp001.length == 0 ? 0 : parseFloat(((Math.max.apply(Math, prp001) - Math.min.apply(Math, prp001))).toFixed(2));
			    	temp.CCPE = prs002.length == 0 ? 0 : parseFloat(((Math.max.apply(Math, prs002) - Math.min.apply(Math, prs002)) * 0.2641720512415584).toFixed(2));
			    	temp.CHPE = prs001.length == 0 ? 0 : parseFloat(((Math.max.apply(Math, prs001) - Math.min.apply(Math, prs001))).toFixed(2));
			    	temp.CCBT = bow002.length == 0 ? 0 : parseFloat(((Math.max.apply(Math, bow002) - Math.min.apply(Math, bow002)) * 0.2641720512415584).toFixed(2));
			    	temp.CHBT = bow001.length == 0 ? 0 : parseFloat(((Math.max.apply(Math, bow001) - Math.min.apply(Math, bow001))).toFixed(2));
			    	temp.CCGB = gep002.length == 0 ? 0 : parseFloat(((Math.max.apply(Math, gep002) - Math.min.apply(Math, gep002)) * 0.2641720512415584).toFixed(2));
			    	temp.CHGB = gep001.length == 0 ? 0 : parseFloat(((Math.max.apply(Math, gep001) - Math.min.apply(Math, gep001))).toFixed(2));
			    	temp.CCGE = ges002.length == 0 ? 0 : parseFloat(((Math.max.apply(Math, ges002) - Math.min.apply(Math, ges002)) * 0.2641720512415584).toFixed(2));
			    	temp.CHGE = ges001.length == 0 ? 0 : parseFloat(((Math.max.apply(Math, ges001) - Math.min.apply(Math, ges001))).toFixed(2));
			    	temp.fuelTotal = parseFloat((temp.CCPB + temp.CCPE + temp.CCBT + temp.CCGB + temp.CCGE).toFixed(2));
			    	temp.date = dateString;

			    	data.data.push(temp);
			    	console.log(data.data.length, temp.date);
			    	
			    	if (diffDate == data.data.length){
			    		res.json(data);
			    	}
			    	temp = {};
			    	prp000 = [], prp001 = [], prp002 = [], prs000 = [], prs001 = [], prs002 = [], bow001 = [], bow002 = [], gep001 = [], gep002 = [], ges001 = [], ges002 = [];
			    
			    });
				date1Temp = mathDate(date1Temp, 1);
			}
		});
		 
		connection.on('error', function(err) {
		    console.log(err);
		});
	});
*/

//GET all variables of supervisory 
router.route("/supervisory/:vesselId")
	.get(function(req, res){
		sql.connect(config).then(function() {
			
			var request = new sql.Request();
			var vesselId = req.params.vesselId;
			var data = {};
			var count = 0;
			data.vesselid = vesselId;
			data.variables = {};
			var dataCodes = ["BOW000", "BOW001", "BOW002", "BOW003", "BOW004", "BOW107", "BOW407", "GEP000", "GEP001", "GEP002", 
							"GEP003", "GEP004", "GES000", "GES001", "GES002", "GES003", "GES004", "PRP000", "PRP001", "PRP002", 
							"PRP003", "PRP004", "PRP314", "PRP410", "PRS000", "PRS001", "PRS002", "PRS003", "PRS004", "PRS314", 
							"PRS410", "TFC000", "TFP000", "TFS000"]

			dataCodes.forEach(function(elem, index){

				request.query("SELECT TOP 1 [TimeString], [DataCode], [DataValue] FROM [ITG-Sio].[dbo].[2160-DAQOnBoardData] where DataCode = '"+elem+"' and vesselid = "+vesselId+" and TimeString LIKE (CONVERT(nvarchar(16), CONVERT(date, GETDATE()), 112) + '%') order by TimeString desc").then(function(recordset) {
					
					if (elem == "BOW000"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.bow000 = {
								label : "RPM Bowthruster",
								value : recordset[0].DataValue,
								units : "RPM"
							}
						}
					}
					else if (elem == "BOW001"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.bow001 = {
								label : "Horómetro Bowthruster",
								value : recordset[0].DataValue, 
								units : "Horas"
							}
						}
					}
					else if (elem == "BOW002"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.bow002 = {
								label : "Total Consumo combustible Bowthruster",
								value : recordset[0].DataValue,
								units : "Litros"
							}
						}
					}
					else if (elem == "BOW003"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.bow003 = {
								label : "Flujo Combustible Bowthruster",
								value : recordset[0].DataValue,
								units : "Litros"
							}
						}
					}
					else if (elem == "BOW004"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.bow004 = {
								label : "Carga Bowthruster",
								value : recordset[0].DataValue,
								units : "-"
							}
						}
					}
					else if (elem == "BOW107"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.bow107 = {
								label : "Presión de aire turbocargador Bowthruster",
								value : recordset[0].DataValue,
								units : "-"
							}
						}
					}
					else if (elem == "BOW407"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.bow407 = {
								label : "Presión refrigerante descarga bomba Bowthruster",
								value : recordset[0].DataValue,
								units : "-"
							}
						}
					}
					else if (elem == "GEP000"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.gep000 = {
								label : "RPM Generador Portside",
								value : recordset[0].DataValue,
								units : "RPM"
							}
						}
					}
					else if (elem == "GEP001"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.gep001 = {
								label : "Horómetro Generador Portside",
								value : recordset[0].DataValue,
								units : "Horas"
							}
						}
					}
					else if (elem == "GEP002"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.gep002 = {
								label : "Total Consumo combustible Generador Portside",
								value : recordset[0].DataValue,
								units : "Litros"
							}
						}
					}
					else if (elem == "GEP003"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.gep003 = {
								label : "Flujo Combustible Generador Portside",
								value : recordset[0].DataValue,
								units : "Litros"
							}
						}
					}
					else if (elem == "GEP004"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.gep004 = {
								label : "Carga Generador Portside",
								value : recordset[0].DataValue,
								units : "-"
							}
						}
					}
					else if (elem == "GES000"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.ges000 = {
								label : "RPM Generador Starboard",
								value : recordset[0].DataValue,
								units : "RPM"
							}
						}
					}
					else if (elem == "GES001"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.ges001 = {
								label : "Horómetro Generador Starboard",
								value : recordset[0].DataValue, 
								units : "Horas"
							}
						}
					}
					else if (elem == "GES002"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.ges002 = {
								label : "Total Consumo combustible Generador Starboard",
								value : recordset[0].DataValue,
								units : "Litros"
							}
						}
					}
					else if (elem == "GES003"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.ges003 = {
								label : "Flujo Combustible Generador Starboard",
								value : recordset[0].DataValue,
								units : "Litros"
							}
						}
					}
					else if (elem == "GES004"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.ges004 = {
								label : "Carga Generador Starboard",
								value : recordset[0].DataValue,
								units : "-"
							}
						}
					}
					else if (elem == "PRP000"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.prp000 = {
								label : "RPM Propulsor Portside",
								value : recordset[0].DataValue,
								units : "RPM"
							}
						}
					}
					else if (elem == "PRP001"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.prp001 = {
								label : "Horómetro Propulsor Portside",
								value : recordset[0].DataValue,
								units : "Horas"
							}
						}
					}
					else if (elem == "PRP002"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.prp002 = {
								label : "Total Consumo combustible Propulsor Portside",
								value : recordset[0].DataValue,
								units : "Litros"
							}
						}
					}
					else if (elem == "PRP003"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.prp003 = {
								label : "Flujo Combustible Propulsor Portside",
								value : recordset[0].DataValue,
								units : "Litros"
							}
						}
					}
					else if (elem == "PRP004"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.prp004 = {
								label : "Carga Propulsor Portside",
								value : recordset[0].DataValue,
								units : "-"
							}
						}
					}
					else if (elem == "PRP314"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.prp314 = {
								label : "Temperatura de aceite en motor Propulsor Portside",
								value : recordset[0].DataValue,
								units : "-"
							}
						}
					}
					else if (elem == "PRP410"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.prp410 = {
								label : "Temperatura refrigerante en motor Propulsor Portside",
								value : recordset[0].DataValue,
								units : "-"
							}
						}
					}
					else if (elem == "PRS000"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.prs000 = {
								label : "RPM Propulsor Starboard",
								value : recordset[0].DataValue,
								units : "RPM"
							}
						}
					}
					else if (elem == "PRS001"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.prs001 = {
								label : "Horómetro Propulsor Starboard",
								value : recordset[0].DataValue,
								units : "Horas"
							}
						}
					}
					else if (elem == "PRS002"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.prs002 = {
								label : "Total Consumo combustible Propulsor Starboard",
								value : recordset[0].DataValue,
								units : "Litros"
							}
						}
					}
					else if (elem == "PRS003"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.prs003 = {
								label : "Flujo Combustible Propulsor Starboard",
								value : recordset[0].DataValue,
								units : "Litros"
							}
						}
					}
					else if (elem == "PRS004"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.prs004 = {
								label : "Carga Propulsor Starboard",
								value : recordset[0].DataValue,
								units : "-"
							}
						}
					}
					else if (elem == "PRS314"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.prs314 = {
								label : "Temperatura de aceite en motor Propulsor Starboard",
								value : recordset[0].DataValue,
								units : "-"
							}
						}
					}
					else if (elem == "PRS410"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.prs410 = {
								label : "Temperatura refrigerante en motor Propulsor Starboard",
								value : recordset[0].DataValue,
								units : "-"
							}
						}
					}
					else if (elem == "TFC000"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.tfc000 = {
								label : "Medición en porcentage de transmisior Tanque de Combustible Diario Center",
								value : recordset[0].DataValue,
								units : "-"
							}
						}
					}
					else if (elem == "TFP000"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.tfp000 = {
								label : "Medición en porcentage de transmisior Tanque de Combustible Diario Portside",
								value : recordset[0].DataValue,
								units : "-"
							}
						}
					}
					else if (elem == "TFS000"){
						if (typeof(recordset[0].DataValue) == "number"){
							data.variables.tfs000 = {
								label : "Medición en porcentage de transmisior Tanque de Combustible Diario Starboard",
								value : recordset[0].DataValue,
								units : "-"
							}
						}
					}
					data.date = recordset[0].TimeString.substring(0,4) + "-" + recordset[0].TimeString.substring(4,6) + "-" + recordset[0].TimeString.substring(6,8) + " " + recordset[0].TimeString.substring(8,10) + ":" + recordset[0].TimeString.substring(10,12);
					count++;					
					if (count === dataCodes.length){
						res.json(data)
					}
					
				}).catch(function(err) {
					count++;
					if (count === dataCodes.length){
						res.json(data)
					}
					console.log(err)
				});

			});
		
		}).catch(function(err) {
			console.log(err);
		});
	});


//GET all alarms of a vessel
router.route("/alarmsLog/:vesselId")
	.get(function(req, res){
		var connection = new sql.Connection(config, function(err) {
		    if (err) return console.log(err)

		 	var vesselId = req.params.vesselId;
		    var request = new sql.Request(connection);
		    request.query("SELECT TOP 1000 [vesselid], [vesselname], [TimeString],[Latitude],[LatitudeNS],[Longitude],[LongitudeEW],[Speed] FROM [ITG-Sio].[dbo].[2150-DAQOnBoardGps] where vesselid = "+vesselId+" and Speed > 9 and TimeString LIKE (CONVERT(nvarchar(16), CONVERT(date, GETDATE()), 112) + '%')", function(err, recordset) {
		        if (err) return console.log(err)
		        var data = {};
		    	data.vesselid = vesselId;
		    	data.count = recordset.length;
		    	data.alarms = [];
		        if (recordset.length > 0){
		        	recordset.forEach(function(elem, index){
		        		data.alarms.push({
		        			id: index,
		        			message: "Supera velocidad máxima con: " + elem.Speed + ", en " + elem.Latitude + " " + elem.LatitudeNS + ", " + elem.Longitude + " " + elem.LongitudeEW,
		        			date: elem.TimeString.substring(0, 4) + "-" + elem.TimeString.substring(4, 6) + "-" + elem.TimeString.substring(6, 8) + " " + elem.TimeString.substring(8, 10) + ":" + elem.TimeString.substring(10, 12)
						});
		        	});
		        }
		        else{
		        	data.alarms.push({message: "empty"});
		        }
		        res.json(data);
		    });
		});
		 
		connection.on('error', function(err) {
		    console.log(err);
		});
	});

//GET, PUT, DELETE by id map config
router.route("/mapConfiguration/:fleetId")
	.get(function(req, res){
		mapConfiguration.findOne({fleetId: req.params.fleetId}, function(err, config){
			if (err) res.send(err);
			res.json(config);
		});
	})
	.put(function(req, res){
		mapConfiguration.findOne({fleetId: req.params.fleetId}, function(err, config){
			if (err) res.send(err);
			config.logo = req.body.logo;
			config.fleets = req.body.fleets;
			config.sio = req.body.sio;
			config.alerts = req.body.alerts;
			config.save(function(err){
				if (err) res.send(err);
				res.json({message: "Config updated!"})
			});
		});
	})
	.delete(function(req, res){
		mapConfiguration.remove({
			fleetId: req.params.fleetId
		}, function(err, config){
			if (err) res.send(err);
			res.json({message:"Removed!"});
		});
	});

//GET, PUT, DELETE by id vessel config
router.route("/vesselConfiguration/:vesselId")
	.get(function(req, res){
		vesselConfiguration.findOne({vesselId: req.params.vesselId}, function(err, config){
			if (err) res.send(err);
			res.json(config);
		});
	})
	.put(function(req, res){
		vesselConfiguration.findOne({vesselId: req.params.vesselId}, function(err, config){
			if (err) res.send(err);
			config.vesselId = req.body.vesselId;
			config.vesselName = req.body.vesselName;
			config.image = req.body.image;
			config.callsign = req.body.callsign;
			config.IMO = req.body.IMO;
			config.flag = req.body.flag;
			config.fleetId = req.body.fleetId;
			config.fleetName = req.body.fleetName;
			config.dataSheet = req.body.dataSheet;
			config.yearBuild = req.body.yearBuild;
			config.lastReport = req.body.lastReport;
			config.labels= req.body.labels;
			config.save(function(err){
				if (err) res.send(err);
				res.json({message: "Config updated!"})
			});
		});
	})
	.delete(function(req, res){
		vesselConfiguration.remove({
			vesselId: req.params.vesselId
		}, function(err, config){
			if (err) res.send(err);
			res.json({message:"Removed!"});
		});
	});

//GET, PUT, DELETE by id visual config
router.route("/visualConfiguration/:pageId")
	.get(function(req, res){
		visualConfiguration.findOne({pageId: req.params.pageId}, function(err, config){
			if (err) res.send(err);
			res.json(config);
		});
	})
	.put(function(req, res){
		visualConfiguration.findOne({pageId: req.params.pageId}, function(err, config){
			if (err) res.send(err);
			config.pageId = req.body.pageId;
			config.logo = req.body.logo;
			config.fleets = req.body.fleets;
			config.sio = req.body.sio;
			config.alerts = req.body.alerts;
			config.save(function(err){
				if (err) res.send(err);
				res.json({message: "Config updated!"})
			});
		});
	})
	.delete(function(req, res){
		visualConfiguration.remove({
			pageId: req.params.pageId
		}, function(err, config){
			if (err) res.send(err);
			res.json({message:"Removed!"});
		});
	});

//Router
app.use("/api", router);

//Server
app.listen(port);
console.log("Magic at " + port);
