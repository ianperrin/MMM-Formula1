
/* MMM-Formula1
 * Node Helper
 *
 * By Ian Perrin http://github.com/ianperrin/MMM-Formula1
 * MIT Licensed.
 */

var ErgastAPI = require("./ErgastAPI.js");
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
    // Subclass start method.
    start: function() {
        console.log("Starting module: " + this.name);
        this.config = {};
        this.fetcherRunning = false;
        this.driverStandings = false;
    },

    // Subclass socketNotificationReceived received.
    socketNotificationReceived: function(notification, payload) {
        console.log(this.name + " received a notification: " + notification);
        if (notification === "CONFIG") {
            
            this.config = payload;
            if (!this.fetcherRunning) {
                this.fetchDriverStandings();
            }

            if (this.driverStandings) {
                this.sendSocketNotification('DRIVER_STANDINGS', this.driverStandings);
            }
        }
    },

    /**
     * fetchDriverStandings
     * Request driver standings from the Ergast MRD API and broadcast it to the MagicMirror module if it's received.
     */
    fetchDriverStandings: function() {
        console.log(this.name + " is fetching driver standings");
        var self = this;
        this.fetcherRunning = true;
        ErgastAPI.getDriverStandings(this.config.season, function(driverStandings) {
            if (driverStandings && driverStandings.updated) {
                self.driverStandings = driverStandings;
                self.sendSocketNotification('DRIVER_STANDINGS', driverStandings);
            }

            setTimeout(function() {
                self.fetchDriverStandings();
            }, self.config.reloadInterval);
        });
    }
});
