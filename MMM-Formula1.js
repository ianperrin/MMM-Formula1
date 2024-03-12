/* MagicMirror²
 * Module: MMM-Formula1
 *
 * By Ian Perrin http://github.com/ianperrin/MMM-Formula1
 * MIT Licensed.
 */

Module.register("MMM-Formula1", {
	// Default module config.
	defaults: {
		season: "current",
		maxRowsDriver: 5,
		maxRowsConstructor: 5,
		showStanding: "MIX",
		loadDriver: true,	// is set automatically is DRIVER, MIX, BOTH is used in showStanding
		loadConstructor: false, // is set automatically is CONSTRUCTOR, MIX, BOTH is used in showStanding
		showSchedule: true,		// to show timing of the raceweekend, racemap, nextrace
		fade: false,		// effect, only for driver or constructor tables, fade to black in the list
		fadePoint: 0.3,
		reloadInterval: 30 * 60 * 1000, // every 30 minutes, calling the api for new data
		screenRefreshInterval: 30 * 1000, // every 30 seconds , only used when showStanding=MIX 
		animationSpeed: 2.5 * 1000, // 2.5 seconds
		grayscale: false,		// used for the flag colors.
		showNextRace: true,	// When showing the raceweekend schedule, also show the next race
	},

	// Store the Ergast data in an object.
	dataDriver: null,
	dataConstructor: null,
	dataSchedule: null,
	endpoint: "/modules/MMM-Formula1/",
	nodatacountD: 0,
	nodatacountC: 0,
	nodatacountS: 0,
	loading: true, // A loading boolean.

	circuitImages: { 
	 bahrain: "/bahrain.svg",
	 jeddah: "/jeddah.svg",
	 albert_park: "/australia.svg",
	 suzuka: "/japan.svg",
	 shanghai: "/china.svg",
	 miami: "/miami.svg", 
	 imola: "/imola.svg", 
	 monaco: "/monaco.svg",
	 villeneuve: "/canada.svg",
	 catalunya: "/spain.svg",
	 red_bull_ring: "/austria.svg",
	 silverstone: "/greatbritain.svg",
	 hungaroring: "/hungary.svg",
	 spa: "/belgium.svg",
	 zandvoort: "/netherlands.svg",
	 monza: "/italy.svg",
	 baku: "/azerbaijan.svg",
	 marina_bay: "/singapore.svg",
	 americas: "/usa.svg",
	 rodriguez: "/mexico.svg",
	 interlagos: "/brazil.svg",
	 vegas: "/vegas.svg",
	 losail: "/qatar.svg",
	 yas_marina: "/abudhabi.svg"
	},

	// Subclass getStyles method.
	getStyles() {
		return ["font-awesome.css", "MMM-Formula1.css"];
	},

	// Subclass getTranslations method.
	getTranslations() {
		return {
			en: "translations/en.json",
			nl: "translations/nl.json",
			de: "translations/de.json",
			id: "translations/id.json",
			it: "translations/it.json",
			sv: "translations/sv.json",
			da: "translations/da.json",
			fr: "translations/fr.json"
		};
	},

	// Subclass start method.
	start() {
		Log.info(`Starting module: ${this.name}`);
		// Validate config options
		this.validateConfig();
		// Add custom filters
		this.addFilters();
		// Load nationalities & start polling
		const self = this;
		this.loadNationalities(function (response) {
			// Parse JSON string into object
			self.nationalities = JSON.parse(response);
			// Start helper and data polling
			self.sendSocketNotification("CONFIG", self.config);
		});
		if (this.config.showStanding === "MIX") {
			this.scheduledTimer = setInterval(function() {
				self.updateDom(self.config.animationSpeed);
            		}, this.config.screenRefreshInterval);
		}
	},
	// Subclass socketNotificationReceived method.
	socketNotificationReceived(notification, payload) {
		Log.info(`${this.name} received a notification: ${notification}-${payload}`);

		switch(notification) {
			case "DRIVER": 			this.prepareDriver(payload);break;
			case "CONSTRUCTOR": 		this.prepareConstructor(payload);break;
			case "SCHEDULE": 		this.prepareData(payload);break;
			case "DRIVER_ERROR": 		this.nodatacountD++;break; // if available use stale data
			case "CONSTRUCTOR_ERROR": 	this.nodatacountC++;break;
			case "SCHEDULE_ERROR": 		this.nodatacountS++;break;
			default:			Console.log("${this.name}: Notification not understood ${notification}");break;
		}
		// all responses, some data or even errors wil end loading and start showing (possible with missing data)
		this.loading = false;
		this.updateDom(this.config.animationSpeed);
	},
	getTemplate() {
		return "templates\\mmm-formula1-standings.njk";
	},
        // use the header to inform the user about stale data
        getHeader: function()
        {
                return this.data.header +
			 (this.nodatacountD>0?' (D:' + this.nodatacountD + ')':'') +
			 (this.nodatacountC>0?' (C:' + this.nodatacountC + ')':'') +
			 (this.nodatacountS>0?' (S:' + this.nodatacountS + ')':'') ;
        },
	getTemplateData() {
		const templateData = {
			loading: this.loading,
			config: this.config,
			dataD: this.dataDriver,
			dataC: this.dataConstructor,
			dataS: this.dataSchedule,
			endpointconstructors: this.endpoint+"/constructors/",
			endpointtracks: this.endpoint+(this.config.grayscale?"tracks":"trackss"),
			identifier: this.identifier,
			timeStamp: this.dataRefreshTimeStamp
		};
		return templateData;
	},
	prepareDriver(payload) {
		if (payload &&
		    payload.DriverStandings &&
		    payload.DriverStandings.length > 0 &&
		    this.config.maxRowsDriver) {
			
			//check for fandriver, save fandriver before slice if fandriver not part of result
			fandriverpos = this.findFanDriverPosition(payload.DriverStandings);
			payload.DriverStandings = payload.DriverStandings.slice(0, this.config.maxRowsDriver);
			if (fandriverpos && fandriverpos.position > this.config.maxRowsDriver) {
				payload.DriverStandings.push(fandriverpos);
			}
		}
		this.nodatacountD = 0;
		this.dataDriver = payload;
	},
	prepareConstructor(payload) {
		if (payload &&
		    payload.ConstructorStandings &&
		    payload.ConstructorStandings.length > 0 &&
		    this.config.maxRowsConstructor) {
			
			//check for fanconstructor, save constructor before slice if constructor not part of result
			fanconstructorpos = this.findFanConstructorPosition(payload.ConstructorStandings);
			payload.ConstructorStandings = payload.ConstructorStandings.slice(0, this.config.maxRowsConstructor);
			if (fanconstructorpos && fanconstructorpos.position > this.config.maxRowsConstructor) {
				payload.ConstructorStandings.push(fanconstructorpos);
			}
		}
		this.nodatacountC = 0;
		this.dataConstructor = payload;
	},
	prepareData( schedule ) {
  		var yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");
		var templateScheduleData = null;

		currentround = this.findNextRound ( schedule, yesterday );
		
		// if null, no races are scheduled, dont display
		if (currentround) {
		   templateScheduleData = {
			season: 	schedule[0].season,
			round: 		currentround,
			raceName: 	schedule[currentround-1].raceName,
			nextRaceName: 	schedule[currentround].raceName,
			circuitName: 	schedule[currentround-1].Circuit.circuitName,
			circuitImage: 	this.circuitImages[schedule[currentround-1].Circuit.circuitId],
			raceDate: 	this.formatDateAndTime( schedule[currentround-1]),
			nextRaceDate: 	this.formatDateAndTime( schedule[currentround]),
			qualifyingDate: this.formatDateAndTime( schedule[currentround-1].Qualifying), 
			pract1Date: 	this.formatDateAndTime( schedule[currentround-1].FirstPractice), 
			pract2Date: 	this.formatDateAndTime( schedule[currentround-1].SecondPractice), 
			pract3Date: 	this.formatDateAndTime( schedule[currentround-1].ThirdPractice), 
			sprintDate: 	this.formatDateAndTime( schedule[currentround-1].Sprint), 
			identifier: 	this.identifier,
			timeStamp:	this.dataRefreshTimeStamp
		   };
		}
		this.nodatacountS = 0;
		this.dataSchedule = templateScheduleData;
	},
	// Transform geo race time to local time, fill missing fields with hourglass.
	formatDateAndTime (dateTime) {
		
		if (!dateTime) { return null; }

		const waitingfortime = "<i class=\"small fa fa-hourglass\"></i>";
		if (dateTime.date && dateTime.time ) {
			if (config.timeFormat = 24) {
				return moment( dateTime.date +"T"+ dateTime.time).format("DD MMM HH:mm");
			} else {
				return moment( dateTime.date +"T"+ dateTime.time).format("DD MMM hh:mm A");
			}
		}
		if (dateTime.date) {
			return moment( dateTime.date ).format("DD MMM") + waitinfortime;
		}
		return waitingfortime;
	},
	// Find out which position a fan has 
	findFanDriverPosition (standings) {
		
		if (!this.config.fanDriverCode) { return null; }
		for (var i=0; i<standings.length ; i++) {
			if (standings[i].Driver.code === this.config.fanDriverCode.toUpperCase()) {
				return standings[i];
			}
		}
		return null;
	},
	// Find out which position a constructor has 
	findFanConstructorPosition (standings) {

		if (!this.config.fanConstructorCode) { return null; }

		for (var i=0; i<standings.length ; i++) {
			if (standings[i].Constructor.constructorId === this.config.fanConstructorCode.toLowerCase()) {
				return standings[i];
			}
		}
		return null;
	},
	// finds the first date in a sorted array of date after yesterday
	findNextRound: function(dates, yesterday) {
		
		var i =0;
		var round=null;
		while (!round && i<dates.length) {
			var aDate = moment(dates[i].date, "YYYY-MM-DD", true);
  			if (aDate.isAfter(yesterday)) {
				round = dates[i].round;
  			}
			i++;
		}
		return round;
	},
	// check config and correct if needed
	validateConfig() {
		// Validate module type
		configType = this.config.showStanding.toUpperCase();
		const validTypes = ["NONE", "DRIVER", "CONSTRUCTOR", "BOTH", "MIX"];
		if (validTypes.indexOf(configType) === -1) {
			this.config.showStanding = configType = "MIX";
		}
		switch (configType) {
			case "DRIVER":
				this.config.loadDriver = true; break;
			case "CONSTRUCTOR":
				this.config.loadConstructor = true; break;
			case "BOTH":
			case "MIX":	
				this.config.loadDriver = true;
				this.config.loadConstructor = true; break;
			default:
				this.config.loadDriver = false;
				this.config.loadConstructor = false; break;
		}
		// If nothing to show, make sure there is someting to show;
		if (!this.config.schedule &&
		    !this.config.loadDriver &&
		    !this.config.loadConstructor) {
		    this.config.showSchedule = true;
		}
	},
	// Filters are methods called from the nunjucks template
	addFilters() {
		const env = this.nunjucksEnvironment();
		env.addFilter("getCodeFromNationality", this.getCodeFromNationality.bind(this));
		env.addFilter("getFadeOpacity", this.getFadeOpacity.bind(this));
		env.addFilter("showStanding", this.showStanding.bind(this));
		env.addFilter("translate", this.translate.bind(this));
	},
	// used to fade to black in the Driver or Constructor list, use config.fade = true
	getFadeOpacity(index, itemCount) {
		const fadeStart = itemCount * this.config.fadePoint;
		const fadeItemCount = itemCount - fadeStart + 1;
		if (this.config.fade && index > fadeStart) {
			return 1 - (index - fadeStart) / fadeItemCount;
		}
		return 1;
	},
	// used to show the flags
	getCodeFromNationality(nationality) {
		for (let i = 0, len = this.nationalities.length; i < len; i++) {
			if (this.nationalities[i].demonym === nationality) {
				return this.nationalities[i].code.toLowerCase();
			}
		}
		return "";
	},
	// used to decide which part of the template should show
	showStanding(showType) {
		configType = this.config.showStanding.toUpperCase();
		switch (configType) {
			case "DRIVER":  
			case "CONSTRUCTOR":
				return (configType===showType);
			case "BOTH":
				const validTypes = ["DRIVER", "CONSTRUCTOR"];
				return (validTypes.indexOf(showType) === -1?false:true); 
			case "MIX":	
				const sec = moment().second();
				infirsthalf= (60-sec>30);  // show Driver in first half of minute, Cons in 2nd
				if (showType==="DRIVER" && infirsthalf) {
					return true;
				} else if (showType==="CONSTRUCTOR" && !infirsthalf) {
					return true;
				}
				return false;
			default: break;
		}
		return false;
	},
	// used for the flags
	loadNationalities(callback) {
		const xobj = new XMLHttpRequest();
		const path = this.file("nationalities.json");
		xobj.overrideMimeType("application/json");
		xobj.open("GET", path, true);
		xobj.onreadystatechange = function () {
			if (xobj.readyState === 4 && xobj.status === 200) {
				callback(xobj.responseText);
			}
		};
		xobj.send(null);
	}
});
