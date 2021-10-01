/* Magic Mirror
 * Module: MMM-Formula1
 *
 * By Ian Perrin http://github.com/ianperrin/MMM-Formula1
 * MIT Licensed.
 */

Module.register("MMM-Formula1", {
	// Default module config.
	defaults: {
		season: "current",
		type: "DRIVER",
		maxRows: false,
		calendar: false,
		showConstructor: true,
		fade: true,
		fadePoint: 0.3,
		reloadInterval: 30 * 60 * 1000, // every 30 minutes
		animationSpeed: 2.5 * 1000, // 2.5 seconds
		grayscale: true,
		showFooter: true
	},

	// Store the Ergast data in an object.
	ergastData: null,

	// A loading boolean.
	loading: true,

	// Subclass getStyles method.
	getStyles: function () {
		return ["font-awesome.css", "MMM-Formula1.css"];
	},

	// Subclass getTranslations method.
	getTranslations: function () {
		return {
			en: "translations/en.json",
			nl: "translations/nl.json",
			de: "translations/de.json",
			id: "translations/id.json",
			sv: "translations/sv.json",
			da: "translations/da.json"
		};
	},

	// Subclass start method.
	start: function () {
		Log.info("Starting module: " + this.name);
		// Validate config options
		this.validateConfig();
		// Add custom filters
		this.addFilters();
		// Load nationalities & start polling
		var self = this;
		this.loadNationalities(function (response) {
			// Parse JSON string into object
			self.nationalities = JSON.parse(response);
			// Start helper and data polling
			self.sendSocketNotification("CONFIG", self.config);
		});
	},
	// Subclass socketNotificationReceived method.
	socketNotificationReceived: function (notification, payload) {
		Log.info(this.name + " received a notification: " + notification);
		if (["DRIVER_STANDINGS", "CONSTRUCTOR_STANDINGS"].indexOf(notification) >= 0) {
			this.ergastData = payload;
			this.loading = false;
			this.updateDom(this.config.animationSpeed);
		}
	},
	getTemplate: function () {
		return "templates\\mmm-formula1-standings.njk";
	},
	getTemplateData: function () {
		var templateData = {
			loading: this.loading,
			config: this.config,
			data: this.loading ? null : this.ergastData,
			identifier: this.identifier,
			timeStamp: this.dataRefreshTimeStamp
		};
		if (!this.loading && templateData.data && templateData.data.standings && templateData.data.standings.length > 0) {
			if (this.config.maxRows) {
				templateData.data.standings = templateData.data.standings.slice(0, this.config.maxRows);
			}
		}
		return templateData;
	},
	validateConfig: function () {
		// Validate module type
		var validTypes = ["DRIVER", "CONSTRUCTOR"];
		if (validTypes.indexOf(this.config.type.toUpperCase()) === -1) {
			this.config.type = "DRIVER";
		}
	},
	addFilters() {
		var env = this.nunjucksEnvironment();
		env.addFilter("getCodeFromNationality", this.getCodeFromNationality.bind(this));
		env.addFilter("getFadeOpacity", this.getFadeOpacity.bind(this));
	},
	getFadeOpacity: function (index, itemCount) {
		var fadeStart = itemCount * this.config.fadePoint;
		var fadeItemCount = itemCount - fadeStart + 1;
		if (this.config.fade && index > fadeStart) {
			return 1 - (index - fadeStart) / fadeItemCount;
		} else {
			return 1;
		}
	},
	getCodeFromNationality: function (nationality) {
		for (var i = 0, len = this.nationalities.length; i < len; i++) {
			if (this.nationalities[i].demonym === nationality) {
				return this.nationalities[i].code.toLowerCase();
			}
		}
		return "";
	},
	loadNationalities(callback) {
		var xobj = new XMLHttpRequest();
		var path = this.file("nationalities.json");
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
