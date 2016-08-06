
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
            if (!this.fetcherRunning) {
                this.fetchStandings();
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
     * fetchStandings
     * Request driver or constructor standings from the Ergast MRD API and broadcast it to the MagicMirror module if it's received.
     */
    fetchStandings: function() {
        console.log(this.name + " is fetching " + (this.config.type === 'DRIVER' ? 'driver' : 'constructor') + " standings");
        var self = this;
        this.fetcherRunning = true;
        var type = this.config.type === 'DRIVER' ? 'driverStandings' : 'constructorStandings';
        ErgastAPI.getStandings(this.config.season, type, function(standings) {
            if (standings && standings.updated) {
                self[type] = standings;
                self.sendSocketNotification(this.config.type + '_STANDINGS', standings);
            }

            setTimeout(function() {
                self.fetchStandings();
            }, self.config.reloadInterval);
        });
    }
});
