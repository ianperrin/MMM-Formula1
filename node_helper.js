/* MMM-Formula1
 * Node Helper
 *
 * By cirdan http://github.com/73cirdan/MMM-Formula1
 * Forked from: Ian Perrin http://github.com/ianperrin/MMM-Formula1
 * MIT Licensed.
 */

const Log = require("logger");
const NodeHelper = require("node_helper");
const axios = require("axios").default;

module.exports = NodeHelper.create({
  // Subclass start method.
  start() {
    Log.log(`Starting module: ${this.name}`);
    this.config = {};
  },

  // Subclass socketNotificationReceived received.
  socketNotificationReceived(notification, payload) {
    Log.log(`${this.name} received a notification: ${notification}`);
    if (notification === "CONFIG") {
      this.config = payload;
      // Clear existing timers
      if (this.timerId) {
        clearTimeout(this.timerId);
      }
      this.fetchApiData();
    }
  },

  /**
   * fetchStandings
   * Request driver or constructor standings from the Ergast MRD API and broadcast it to the MagicMirror module if it's received.
   * Request current race schedule from the Ergast MRD API and broadcast as an iCal
   */
  fetchApiData() {
    const season = this.config.season === "current" ? new Date().getFullYear() : this.config.season;
    var f1Url = "http://ergast.com/api/f1/" + season;

    if (this.config.loadDriver) this.invokeURL("DRIVER", f1Url + "/driverStandings.json");
    if (this.config.loadConstructor)
      this.invokeURL("CONSTRUCTOR", f1Url + "/constructorStandings.json");
    if (this.config.showSchedule) this.invokeURL("SCHEDULE", f1Url + ".json");

    const self = this;
    this.timerId = setTimeout(function () {
      self.fetchApiData();
    }, this.config.reloadInterval);
  },
  // call the api at ergast
  invokeURL(type, url) {
    const self = this;
    Log.log(`${self.name} is requesting the ${type} on url ` + url);

    axios
      .get(url)
      .then(function (response) {
        // handle success console.log(response);
        var data = null;
        if (type.includes("SCHEDULE")) {
          data = response.data.MRData.RaceTable.Races;
        } else {
          data = response.data.MRData.StandingsTable.StandingsLists[0];
        }
        self.sendSocketNotification(type, data);
        Log.log(`${self.name} is returning the ${type} for the season`);
        //Log.log(data);
      })
      .catch(function (error) {
        self.handleError(error, type);
      });
  },
  // handle the error on an axios request
  handleError(error, type) {
    if (!error) {
      console.log("Unknown Error: " + this.name);
    } else if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log("Error: " + this.name + ": " + error.response.status);
      console.log("Error: " + this.name + ": " + error.response.data);
      console.log("Error: " + this.name + ": " + error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.log("Error: " + this.name + ": " + error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("Error: " + this.name + ": " + error.message);
    }
    //console.log(error.config);
    this.sendSocketNotification(
      type + "_ERROR",
      this.name + " No F1 connection ($(type}), will retry"
    );
  }
});
