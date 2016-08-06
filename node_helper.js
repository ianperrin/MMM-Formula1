
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
        this.constructorStandings = false;
    },

    // Subclass socketNotificationReceived received.
    socketNotificationReceived: function(notification, payload) {
        console.log(this.name + " received a notification: " + notification);
        if (notification === "CONFIG") {
            
            this.config = payload;
            if (!this.fetcherRunning && this.config.type === 'DRIVER') {
                this.fetchDriverStandings();
            } else if(!this.fetcherRunning && this.config.type === 'CONSTRUCTOR'){
                this.fetchConstructorStandings();
            }

            if (this.driverStandings) {
                this.sendSocketNotification('DRIVER_STANDINGS', this.driverStandings);
            }

            if (this.constructorStandings) {
                this.sendSocketNotification('CONSTRUCTOR_STANDINGS', this.constructorStandings);
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
    },

    /**
     * fetchConstructorStandings
     * Request constructor standings from the Ergast MRD API and broadcast it to the MagicMirror module if it's received.
     */
    fetchConstructorStandings: function() {
        console.log(this.name + " is fetching constructor standings");
        var self = this;
        this.fetcherRunning = true;
        ErgastAPI.getConstructorStandings(this.config.season, function(constructorStandings) {
            if (constructorStandings && constructorStandings.updated) {
                self.constructorStandings = constructorStandings;
                self.sendSocketNotification('CONSTRUCTOR_STANDINGS', constructorStandings);
            }

            setTimeout(function() {
                self.fetchConstructorStandings();
            }, self.config.reloadInterval);
        });
    }
});
