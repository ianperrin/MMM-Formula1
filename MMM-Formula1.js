/* Magic Mirror
 * Module: MMM-Formula1
 *
 * By Ian Perrin http://github.com/ianperrin/MMM-Formula1
 * MIT Licensed.
 */

Module.register("MMM-Formula1",{

    // Default module config.
    defaults: {
        fade: true,
        fadePoint: 0.4,
        reloadInterval: 30 * 60 * 1000,       // every 30 minutes
        animationSpeed: 2.5 * 1000,           // 2.5 seconds
    },

    // Store the strava data in an object.
    ergastData: null,

    // A loading boolean.
    loading: true,

    // Subclass getStyles method.
    getStyles: function() {
        return ['font-awesome.css','MMM-Formula1.css'];
    },

    // Subclass getTranslations method.
    getTranslations: function() {
        return {
                en: "translations/en.json",
                nl: "translations/nl.json"
        };
    },

    // Subclass start method.
    start: function() {
        Log.info("Starting module: " + this.name);
        this.sendSocketNotification("CONFIG", this.config);
    },

    // Subclass socketNotificationReceived method.
    socketNotificationReceived: function(notification, payload) {
        Log.info(this.name + " received a notification:" + notification);
        if (notification === "DRIVER_STANDINGS") {
            this.ergastData = payload.MRData;
            this.loading = false;
            this.updateDom(this.config.animationSpeed);
        }
    },

    // Override dom generator.
    getDom: function() {

        if (this.loading) {
            var loadingWrapper = document.createElement("div");
            loadingWrapper.innerHTML = this.translate("LOADING");
            loadingWrapper.className = "small dimmed light";
            return loadingWrapper;
        }

        var tableWrapper = document.createElement("table");
        tableWrapper.className = "small";

        tableWrapper.appendChild(this.createHeaderRow());

        // Add row to table for each driver in the standings.
        var driverStandings = this.ergastData.StandingsTable.StandingsLists[0].DriverStandings;
        for (i = 0; i < driverStandings.length; i++) {
            var driverStanding = driverStandings[i];
           
            var driver = [driverStanding.Driver.givenName, driverStanding.Driver.familyName].join(" ");
            var constructor = driverStanding.Constructors[0].name;
            var points = driverStanding.points;
            var wins = driverStanding.wins;
                                                           
            var dataRow = this.createDataRow(driver, 
                                                constructor,
                                                points,
                                                wins);

            // Create fade effect.
            if (this.config.fade && this.config.fadePoint < 1) {
                if (this.config.fadePoint < 0) {
                    this.config.fadePoint = 0;
                }
                var startingPoint = driverStandings.length * this.config.fadePoint;
                var steps = driverStandings.length - startingPoint;
                if (i >= startingPoint) {
                    var currentStep = i - startingPoint;
                    dataRow.style.opacity = 1 - (1 / steps * currentStep);
                }
            }

            tableWrapper.appendChild(dataRow);

        }

        return tableWrapper;

    },

    /**
     * createHeaderRow
     * This method creates a table row for the headings.
     * @return {dom object}                    the table row (tr)
     */
    createHeaderRow: function() {
        var tr = document.createElement('tr');
        tr.className = "normal";

        var driverTd =  document.createElement("td");
        driverTd.innerHTML = this.translate("DRIVER");
        tr.appendChild(driverTd);

        var constructorTd =  document.createElement("td");
        constructorTd.innerHTML = this.translate("CONSTRUCTOR");
        tr.appendChild(constructorTd);

        tr.appendChild(this.createHeaderRowIconCell("line-chart"));    // Points
        tr.appendChild(this.createHeaderRowIconCell("trophy"));        // Wins

        return tr;
    },

    /**
     * createHeaderRowIconCell
     * This method creates a table cell containing the supplied font awesome icon.
     * @param  {string} icon                the font awesome icon. (without 'fa-')
     * @return {dom object}                    the table cell (td)
     */
    createHeaderRowIconCell: function(icon) {

        var td =  document.createElement("td");
        td.className = "light symbol align-right stat";
        var tdIcon =  document.createElement("span");
        tdIcon.className = "fa fa-" + icon;
        td.appendChild(tdIcon);

        return td;
    },

    /**
     * createDataRow
     * This method creates a table row with stats for an activity.
     * @param  {string} driver                the name of the driver
     * @param  {string} constructor           the name of the constructor
     * @param  {number} points                the number of points
     * @param  {number} wins                  the number of wins
     * @return {dom object}                   the table row (tr)
     */
    createDataRow: function(driver, constructor, points, wins) {
        var tr = document.createElement("tr");
        tr.className = "normal";
        
        var driverCell = document.createElement("td");
        driverCell.className = "title bright";
        driverCell.innerHTML = driver;
        tr.appendChild(driverCell);

        var constructorCell = document.createElement("td");
        constructorCell.className = "title light";
        constructorCell.innerHTML = constructor;
        tr.appendChild(constructorCell);

        tr.appendChild(this.createDataRowStatCell(points)); 
        tr.appendChild(this.createDataRowStatCell(wins)); 

        return tr;
    },

    /**
     * createDataRowStatCell
     * This method creates a table cell containing the supplied HTML.
     * @param  {string} innerHTML            the contents of the cell
     * @return {dom object}                    the table cell (td)
     */
    createDataRowStatCell: function(innerHTML) {

        var td =  document.createElement("td");
        td.className = "bright align-right stat";
        td.innerHTML = innerHTML;

        return td;
    },

});
