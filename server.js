//Dependencies
var express = require("express");
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

var sql = require('mssql');
 
var config = {
    user: 'SioPlatformUsr',
    password: 'S10Pl@tf0rm',
    server: '192.168.120.10',
    database: 'ITG-Sio'
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
	console.log("something happened");
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

//GET all alarms of a vessel
router.route("/alarmsLog/:vesselId")
	.get(function(req, res){
		var connection = new sql.Connection(config, function(err) {
		    if (err) return console.log(err)

		 	var vesselId = req.params.vesselId;
		    var request = new sql.Request(connection);
		    request.query("SELECT TOP 100 [vesselid], [vesselname], [TimeString],[Latitude],[LatitudeNS],[Longitude],[LongitudeEW],[Speed] FROM [ITG-Sio].[dbo].[2150-DAQOnBoardGps] where vesselid = "+vesselId+" and Speed > 9 and TimeString LIKE (CONVERT(nvarchar(16), CONVERT(date, GETDATE()), 112) + '%')", function(err, recordset) {
		        if (err) return console.log(err)
		        var data = {};
		    	data.vesselid = vesselId;
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
