/* MMM-Formula1
 * Node Helper
 *
 * By Ian Perrin http://github.com/ianperrin/MMM-Formula1
 * MIT Licensed.
 */

var ErgastAPI = require("./ErgastAPI.js");
const NodeHelper = require("node_helper");
var ical;
var raceScheduleDB = false;

module.exports = NodeHelper.create({
	// Subclass start method.
	start: function () {
		console.log("Starting module: " + this.name);
		this.config = {};
		this.fetcherRunning = false;
		this.driverStandings = false;
		this.constructorStandings = false;
	},

	// Subclass socketNotificationReceived received.
	socketNotificationReceived: function (notification, payload) {
		console.log(this.name + " received a notification: " + notification);
		if (notification === "CONFIG") {
			this.config = payload;

			if (this.config.calendar) {
				ical = require("ical-generator");
				this.fetchSchedule();
				this.expressApp.get("/" + this.name + "/schedule.ics", this.serverSchedule);
			}

			if (!this.fetcherRunning) {
				this.fetchStandings();
			}

			if (this.driverStandings) {
				this.sendSocketNotification("DRIVER_STANDINGS", this.driverStandings);
			}

			if (this.constructorStandings) {
				this.sendSocketNotification("CONSTRUCTOR_STANDINGS", this.constructorStandings);
			}
		}
	},

	/**
	 * fetchStandings
	 * Request driver or constructor standings from the Ergast MRD API and broadcast it to the MagicMirror module if it's received.
	 */
	fetchStandings: function () {
		console.log(this.name + " is fetching " + (this.config.type === "DRIVER" ? "driver" : "constructor") + " standings");
		var self = this;
		this.fetcherRunning = true;
		var type = this.config.type === "DRIVER" ? "driverStandings" : "constructorStandings";
		ErgastAPI.getStandings(this.config.season, type, function (standings) {
			if (standings && standings.updated) {
				self[type] = standings;
				self.sendSocketNotification(self.config.type + "_STANDINGS", standings);
			}

			setTimeout(function () {
				self.fetchStandings();
			}, self.config.reloadInterval);
		});
	},

	/**
	 * fetchSchedule
	 * Request current race schedule from the Ergast MRD API and broadcast as an iCal
	 */
	fetchSchedule: function () {
		console.log(this.name + " is fetching the race schedule");
		var self = this;
		//this.fetcherRunning = true;
		ErgastAPI.getSchedule(this.config.season, function (raceSchedule) {
			if (raceSchedule && raceSchedule.updated) {
				raceScheduleDB = raceSchedule;
				self.sendSocketNotification("RACE_SCHEDULE", raceSchedule);
			}

			setTimeout(function () {
				self.fetchSchedule();
			}, self.config.reloadInterval);
		});
	},

	/**
	 * serverSchedule
	 * Publish race schedule as an iCal
	 */
	serverSchedule: function (req, res) {
		console.log("Serving the race schedule iCal");
		var cal = ical({ domain: "localhost", name: "Formula1 Race Schedule" });
		if (raceScheduleDB.updated && raceScheduleDB.MRData.RaceTable.Races) {
			var races = raceScheduleDB.MRData.RaceTable.Races;
			for (var i = 0; i < races.length; i++) {
				// Parse date/time
				var utcDate = races[i].date + "T" + races[i].time;
				var startDate = Date.parse(utcDate);
				if (startDate && !isNaN(startDate)) {
					// Create Event
					cal.createEvent({
						start: new Date(startDate),
						end: new Date(startDate),
						summary: races[i].raceName,
						location: races[i].Circuit.circuitName,
						url: races[i].url
					});
				}
			}
		}
		cal.serve(res);
	}
});
