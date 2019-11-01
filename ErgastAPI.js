var http = require("http");
//var https = require("https");
//var querystring = require("querystring");
var extend = require("util")._extend;

var ErgastAPI = (function() {

    var self = this;

    // Private Properties
    var HOST = "ergast.com";
    var API = "/api/f1/";
    var PORT = 80;

    var standings = {
        driverStandings: {updated:false},
        constructorStandings: {updated:false}
    };

    var schedule = {updated:false};

    /// Private Methods

    /**
     * makeRequest
     * Makes a request to the Ergast Developer API server. It can be used for both the API requests as well as the oAuth requests.
     * @param  {Object} options request options.
     */
    function makeRequest(options) {

        var defaultOptions = {
            host: HOST,
            port: PORT,
            path: "/",
            method: "GET", // GET | POST
            parameters: {},
            body: "",
            callback: function(){},
            contentType: "application/json",
            agent: false,
            headers: { }
        };

        options = extend(defaultOptions, options);

        console.log("Make request: " + options.path + " (" + options.method + ")");

        // Update Content-Type header
        options.headers  = extend(options.headers, {
            "Content-Type" : options.contentType
        });

        // Encode body if contentType is json.
        if (options.contentType === "application/json") {
            options.body = JSON.stringify(options.body);
        }

        //console.log(options);

        var request = http.request(options, function(response) {
            response.setEncoding("utf8");

            var str = "";

            //another chunk of data has been recieved, so append it to `str`
            response.on("data", function (chunk) {
                str += chunk;
            });

            //the whole response has been recieved, so we just print it out here
            response.on("end", function () {
                if (response.statusCode === 200) {
                    if (str.length > 0) {
                        options.callback(JSON.parse(str));
                    } else {
                        options.callback({});
                    }
                } else if (response.statusCode === 401) {
                    // Unauthorized

                    console.log("Error performing request: Unauthorized. ");

                    options.callback();

                } else if (response.statusCode === 500) {
                    // Interal server error. This might be caused because the agreement is not properly set.
                    // Let's reset it ...
                    console.log("Error performing request (500): " + str);

                    options.callback();

                } else if (response.statusCode === 503) {
                    // Probably a message throttle issue ... lets wait a while before we contine...
                    console.log("Exceeded quota. Waiting for 5 seconds.");
                    setTimeout(function() {
                        options.callback();
                    }, 5000);

                } else {
                    console.log("Error performing request: " + response.statusCode);
                    console.log(str);
                    options.callback();
                }
            });

            response.on("error", function(e) {
                console.log("Error performing request to endpoint: /" + options.path);
                options.callback();
            });
        });

        request.end();
    }

    /**
     * makeApiRequest
     * Makes a request to the Ergast Developer JSON api.
     * @param  {options} options request options.
     */
    function makeApiRequest(options) {

        options = extend(options, {
            path: API + options.path
        });

        makeRequest(options);
    }

    /**
     * makeSimpleApiRequest
     * @param  {string}   endpoint The endpoint of the API.
     * @param  {Function} callback The callback after completion.
     */
    function makeSimpleApiRequest(endpoint, callback) {
        callback = callback || function() {};
        makeApiRequest({
            path: endpoint,
            callback: callback
        });
    }

    // F1

    /**
     * getStandings
     * Request the specified type standings from the specified Formula 1 season
     * @param  {string, int} season        The season to fetch.
     * @param  {string} type               The type of standings (driver or constructor).
     * @param  {Function} callback         The callback after the data is received.
     * http://ergast.com/api/f1/{season}/{type}.json
     */
    self.getStandings = function(season, type, callback) {
        makeSimpleApiRequest(season + "/" + type + ".json", function(data) {
            if (!data) {
                console.log("Error while fetching Formula1 standings.");
                callback(standings[type]);
                return;
            }

            if (Object.keys(data).length !== 0) {
                standings[type] = extend(standings[type], data);
                standings[type].updated = true;
            } else {
                standings[type].updated = false;
            }

            callback(standings[type]);
        });
    };

    /**
     * getSchedule
     * Request the race schedule for the specified Formula 1 season
     * @param  {string, int} season        The season to fetch.
     * @param  {Function} callback         The callback after the data is received.
     * http://ergast.com/api/f1/current.json
     */
    self.getSchedule = function(season, callback) {
        makeSimpleApiRequest(season + ".json", function(data) {
            if (!data) {
                console.log("Error while fetching race schedule.");
                callback(schedule);
                return;
            }

            if (Object.keys(data).length !== 0) {
                schedule = extend(schedule, data);
                schedule.updated = true;
            } else {
                schedule.updated = false;
            }

            callback(schedule);
        });
    };

    return self;
})();

module.exports = ErgastAPI;
