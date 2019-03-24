/* Magic Mirror
 * Module: MMM-Formula1
 *
 * By Ian Perrin http://github.com/ianperrin/MMM-Formula1
 * MIT Licensed.
 */

Module.register("MMM-Formula1",{

    // Default module config.
    defaults: {
        season: 'current',
        type: 'DRIVER',
        maxRows: false,
        calendar: false,
        fade: true,
        fadePoint: 0.3,
        reloadInterval: 30 * 60 * 1000,       // every 30 minutes
        animationSpeed: 2.5 * 1000,           // 2.5 seconds
        grayscale: true,
        showFooter: true,
    },

    // Store the Ergast data in an object.
    ergastData: {DRIVER: null, CONSTRUCTOR: null},

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
                nl: "translations/nl.json",
                de: "translations/de.json",
                id: "translations/id.json",
                sv: "translations/sv.json"
        };
    },

    // Subclass start method.
    start: function() {
        Log.info("Starting module: " + this.name);
        this.sendSocketNotification("CONFIG", this.config);
    },

    // Subclass socketNotificationReceived method.
    socketNotificationReceived: function(notification, payload) {
        Log.info(this.name + " received a notification: " + notification);
        if (notification === "DRIVER_STANDINGS") {
            this.ergastData.DRIVER = payload.MRData;
            this.loading = false;
            this.updateDom(this.config.animationSpeed);
        } else if(notification === "CONSTRUCTOR_STANDINGS"){
            this.ergastData.CONSTRUCTOR = payload.MRData;
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

        if ( (this.config.type === 'DRIVER' && this.ergastData.DRIVER.StandingsTable.StandingsLists.length === 0)
                || (this.config.type != 'DRIVER' && this.ergastData.CONSTRUCTOR.StandingsTable.StandingsLists.length === 0) ) {
            var noDataWrapper = document.createElement("div");
            noDataWrapper.innerHTML = this.translate("NO DATA");
            noDataWrapper.className = "small dimmed light";
            return noDataWrapper;
        }

        var tableWrapper = document.createElement("table");
        tableWrapper.className = "small align-left";

        tableWrapper.appendChild(this.createHeaderRow());

        // Add row to table for each driver in the standings.
        var standings = this.config.type === 'DRIVER' ? this.ergastData.DRIVER.StandingsTable.StandingsLists[0].DriverStandings : this.ergastData.CONSTRUCTOR.StandingsTable.StandingsLists[0].ConstructorStandings;
        var rowsToDisplay = (this.config.maxRows) ? Math.min(this.config.maxRows, standings.length) : standings.length;
        for (i = 0; i < rowsToDisplay; i++) {
            var standing = standings[i];

            var driver;
            if(this.config.type === 'DRIVER'){
                driver = [standing.Driver.givenName, standing.Driver.familyName].join(" ");
            }
            var countryCode = this.getCodeFromNationality(standing[this.config.type === 'DRIVER' ? 'Driver' : 'Constructor'].nationality);
            var constructor = this.config.type === 'DRIVER' ? standing.Constructors.map(function(elem){
                                                                    return elem.name;
                                                                }).join("/") : standing.Constructor.name;
            var points = standing.points;
            var wins = standing.wins;

            var dataRow = this.createDataRow(driver,
                                                countryCode,
                                                constructor,
                                                points,
                                                wins);

            // Create fade effect.
            if (this.config.fade && this.config.fadePoint < 1) {
                if (this.config.fadePoint < 0) {
                    this.config.fadePoint = 0;
                }
                var startingPoint = rowsToDisplay * this.config.fadePoint;
                var steps = rowsToDisplay - startingPoint;
                if (i >= startingPoint) {
                    var currentStep = i - startingPoint;
                    dataRow.style.opacity = 1 - (1 / steps * currentStep);
                }
            }

            tableWrapper.appendChild(dataRow);

        }

        // Add season and round indicator
        if (this.config.showFooter) {
            var footerTr = document.createElement('tr');
            var footerTd =  document.createElement("td");
            footerTd.className = "xsmall align-right";
            footerTd.colSpan = tableWrapper.rows[0].cells.length;
            footerTd.innerHTML = "Season: " + this.ergastData[this.config.type].StandingsTable.StandingsLists[0].season + ", Round: " + this.ergastData[this.config.type].StandingsTable.StandingsLists[0].round;
            footerTr.appendChild(footerTd);
            tableWrapper.appendChild(footerTd);
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

        var flagTd =  document.createElement("td");
        tr.appendChild(flagTd);

        if(this.config.type === 'DRIVER'){
            var driverTd =  document.createElement("td");
            driverTd.innerHTML = this.translate("DRIVER");
            tr.appendChild(driverTd);
        }

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
     * @param  {string} countryCode           the 2-digit country code for the drivers nationality
     * @param  {string} constructor           the name of the constructor
     * @param  {number} points                the number of points
     * @param  {number} wins                  the number of wins
     * @return {dom object}                   the table row (tr)
     */
    createDataRow: function(driver, countryCode, constructor, points, wins) {
        var tr = document.createElement("tr");
        tr.className = "normal";

        var flagCell = document.createElement("td");
        flagCell.className = "symbol light";
            var flagDiv =  document.createElement("div");
            flagDiv.classList.add("flag", "flag-" + countryCode.toLowerCase());
            if (this.config.grayscale) flagDiv.classList.add("grayscale");
            flagCell.appendChild(flagDiv);
        tr.appendChild(flagCell);

        if(this.config.type === 'DRIVER'){
            var driverCell = document.createElement("td");
            driverCell.className = "title bright";
            driverCell.innerHTML = driver;
            tr.appendChild(driverCell);
        }

        var constructorCell = document.createElement("td");
        constructorCell.className = this.config.type === 'DRIVER' ? "title light" : "title bright";
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

    getCodeFromNationality: function(nationality) {
        for(var i = 0, len = this.nationalities.length; i < len; i++) {
            if (this.nationalities[i].demonym === nationality)
                return this.nationalities[i].code;
        }
        return "";
    },

    nationalities: [
        {demonym : "Andorran", code : "AD" },
        {demonym : "Emirian", code : "AE" },
        {demonym : "Afghani", code : "AF" },
        {demonym : "Antiguan", code : "AG" },
        {demonym : "Anguillan", code : "AI" },
        {demonym : "Albanian", code : "AL" },
        {demonym : "Armenian", code : "AM" },
        {demonym : "Angolan", code : "AO" },
        {demonym : "Antarctic", code : "AQ" },
        {demonym : "Argentine", code : "AR" },
        {demonym : "Samoan", code : "AS" },
        {demonym : "Austrian", code : "AT" },
        {demonym : "Australian", code : "AU" },
        {demonym : "Arubian", code : "AW" },
        {demonym : "Ålandic", code : "AX" },
        {demonym : "Azerbaijani", code : "AZ" },
        {demonym : "Bosnian", code : "BA" },
        {demonym : "Barbadian", code : "BB" },
        {demonym : "Bangladeshi", code : "BD" },
        {demonym : "Belgian", code : "BE" },
        {demonym : "Burkinabe", code : "BF" },
        {demonym : "Bulgarian", code : "BG" },
        {demonym : "Bahrainian", code : "BH" },
        {demonym : "Burundian", code : "BI" },
        {demonym : "Beninese", code : "BJ" },
        {demonym : "Barthélemois", code : "BL" },
        {demonym : "Bermudan", code : "BM" },
        {demonym : "Bruneian", code : "BN" },
        {demonym : "Bolivian", code : "BO" },

        {demonym : "Brazilian", code : "BR" },
        {demonym : "Bahameese", code : "BS" },
        {demonym : "Bhutanese", code : "BT" },

        {demonym : "Motswana", code : "BW" },
        {demonym : "Belarusian", code : "BY" },
        {demonym : "Belizean", code : "BZ" },
        {demonym : "Canadian", code : "CA" },
        {demonym : "Cocossian", code : "CC" },
        {demonym : "Congolese", code : "CD" },
        {demonym : "Central African", code : "CF" },
        {demonym : "Congolese", code : "CG" },
        {demonym : "Swiss", code : "CH" },
        {demonym : "Ivorian", code : "CI" },
        {demonym : "Cook Islander", code : "CK" },
        {demonym : "Chilean", code : "CL" },
        {demonym : "Cameroonian", code : "CM" },
        {demonym : "Chinese", code : "CN" },
        {demonym : "Colombian", code : "CO" },
        {demonym : "Costa Rican", code : "CR" },
        {demonym : "Cuban", code : "CU" },
        {demonym : "Cape Verdean", code : "CV" },
        {demonym : "Curaçaoan", code : "CW" },
        {demonym : "Christmas Islander", code : "CX" },
        {demonym : "Cypriot", code : "CY" },
        {demonym : "Czech", code : "CZ" },
        {demonym : "German", code : "DE" },
        {demonym : "Djiboutian", code : "DJ" },
        {demonym : "Danish", code : "DK" },
        {demonym : "Dominican", code : "DM" },
        {demonym : "Dominican", code : "DO" },
        {demonym : "Algerian", code : "DZ" },
        {demonym : "Ecuadorean", code : "EC" },
        {demonym : "Estonian", code : "EE" },
        {demonym : "Egyptian", code : "EG" },
        {demonym : "Western Saharan", code : "EH" },
        {demonym : "Eritrean", code : "ER" },
        {demonym : "Spanish", code : "ES" },
        {demonym : "Ethiopian", code : "ET" },
        {demonym : "Finnish", code : "FI" },
        {demonym : "Fijian", code : "FJ" },
        {demonym : "Falkland Islander", code : "FK" },
        {demonym : "Micronesian", code : "FM" },
        {demonym : "Faroese", code : "FO" },
        {demonym : "French", code : "FR" },
        {demonym : "Gabonese", code : "GA" },
        {demonym : "British", code : "GB" },
        {demonym : "Grenadian", code : "GD" },
        {demonym : "Georgian", code : "GE" },
        {demonym : "French Guianese", code : "GF" },

        {demonym : "Ghanaian", code : "GH" },
        {demonym : "Gibralterian", code : "GI" },
        {demonym : "Greenlander", code : "GL" },
        {demonym : "Gambian", code : "GM" },
        {demonym : "Guinean", code : "GN" },
        {demonym : "Guadeloupean", code : "GP" },
        {demonym : "Equatorial Guinean", code : "GQ" },
        {demonym : "Greek", code : "GR" },

        {demonym : "Guatemalan", code : "GT" },
        {demonym : "Guamanian", code : "GU" },
        {demonym : "Guinean", code : "GW" },
        {demonym : "Guyanese", code : "GY" },
        {demonym : "Hong Konger", code : "HK" },

        {demonym : "Honduran", code : "HN" },
        {demonym : "Croatian", code : "HR" },
        {demonym : "Haitian", code : "HT" },
        {demonym : "Hungarian", code : "HU" },
        {demonym : "Indonesian", code : "ID" },
        {demonym : "Irish", code : "IE" },
        {demonym : "Israeli", code : "IL" },
        {demonym : "Manx", code : "IM" },
        {demonym : "Indian", code : "IN" },

        {demonym : "Iraqi", code : "IQ" },
        {demonym : "Iranian", code : "IR" },
        {demonym : "Icelander", code : "IS" },
        {demonym : "Italian", code : "IT" },

        {demonym : "Jamaican", code : "JM" },
        {demonym : "Jordanian", code : "JO" },
        {demonym : "Japanese", code : "JP" },
        {demonym : "Kenyan", code : "KE" },
        {demonym : "Kyrgyzstani", code : "KG" },
        {demonym : "Cambodian", code : "KH" },
        {demonym : "I-Kiribati", code : "KI" },
        {demonym : "Comoran", code : "KM" },
        {demonym : "Kittian", code : "KN" },
        {demonym : "North Korean", code : "KP" },
        {demonym : "South Korean", code : "KR" },
        {demonym : "Kuwaiti", code : "KW" },
        {demonym : "Caymanian", code : "KY" },
        {demonym : "Kazakhstani", code : "KZ" },
        {demonym : "Laotian", code : "LA" },
        {demonym : "Lebanese", code : "LB" },
        {demonym : "Saint Lucian", code : "LC" },
        {demonym : "Liechtensteiner", code : "LI" },
        {demonym : "Sri Lankan", code : "LK" },
        {demonym : "Liberian", code : "LR" },
        {demonym : "Mosotho", code : "LS" },
        {demonym : "Lithunian", code : "LT" },
        {demonym : "Luxembourger", code : "LU" },
        {demonym : "Latvian", code : "LV" },
        {demonym : "Libyan", code : "LY" },
        {demonym : "Moroccan", code : "MA" },
        {demonym : "Monacan", code : "MC" },
        {demonym : "Monegasque", code : "MC" },
        {demonym : "Moldovan", code : "MD" },
        {demonym : "Montenegrin", code : "ME" },

        {demonym : "Malagasy", code : "MG" },
        {demonym : "Marshallese", code : "MH" },
        {demonym : "Macedonian", code : "MK" },
        {demonym : "Malian", code : "ML" },
        {demonym : "Myanmarese", code : "MM" },
        {demonym : "Mongolian", code : "MN" },
        {demonym : "Macanese", code : "MO" },
        {demonym : "Northern Mariana Islander", code : "MP" },
        {demonym : "Martinican", code : "MQ" },
        {demonym : "Mauritanian", code : "MR" },
        {demonym : "Montserratian", code : "MS" },
        {demonym : "Maltese", code : "MT" },
        {demonym : "Mauritian", code : "MU" },
        {demonym : "Maldivan", code : "MV" },
        {demonym : "Malawian", code : "MW" },
        {demonym : "Mexican", code : "MX" },
        {demonym : "Malaysian", code : "MY" },
        {demonym : "Mozambican", code : "MZ" },
        {demonym : "Namibian", code : "NA" },
        {demonym : "New Caledonian", code : "NC" },
        {demonym : "Nigerien", code : "NE" },
        {demonym : "Norfolk Islander", code : "NF" },
        {demonym : "Nigerian", code : "NG" },
        {demonym : "Nicaraguan", code : "NI" },
        {demonym : "Dutch", code : "NL" },
        {demonym : "Norwegian", code : "NO" },
        {demonym : "Nepalese", code : "NP" },
        {demonym : "Nauruan", code : "NR" },
        {demonym : "Niuean", code : "NU" },
        {demonym : "New Zealander", code : "NZ" },
        {demonym : "Omani", code : "OM" },
        {demonym : "Panamanian", code : "PA" },
        {demonym : "Peruvian", code : "PE" },
        {demonym : "French Polynesian", code : "PF" },
        {demonym : "Papua New Guinean", code : "PG" },
        {demonym : "Filipino", code : "PH" },
        {demonym : "Pakistani", code : "PK" },
        {demonym : "Polish", code : "PL" },
        {demonym : "Saint-Pierrais", code : "PM" },
        {demonym : "Pitcairn Islander", code : "PN" },
        {demonym : "Puerto Rican", code : "PR" },
        {demonym : "Palestinian", code : "PS" },
        {demonym : "Portuguese", code : "PT" },
        {demonym : "Palauan", code : "PW" },
        {demonym : "Paraguayan", code : "PY" },
        {demonym : "Qatari", code : "QA" },

        {demonym : "Romanian", code : "RO" },
        {demonym : "Serbian", code : "RS" },
        {demonym : "Russian", code : "RU" },
        {demonym : "Rwandan", code : "RW" },
        {demonym : "Saudi Arabian", code : "SA" },
        {demonym : "Solomon Islander", code : "SB" },
        {demonym : "Seychellois", code : "SC" },
        {demonym : "Sudanese", code : "SD" },
        {demonym : "Swedish", code : "SE" },
        {demonym : "Singaporean", code : "SG" },
        {demonym : "Saint Helenian", code : "SH" },
        {demonym : "Slovenian", code : "SI" },

        {demonym : "Slovakian", code : "SK" },
        {demonym : "Sierra Leonean", code : "SL" },
        {demonym : "Sanmarinese", code : "SM" },
        {demonym : "Senegalese", code : "SN" },
        {demonym : "Somali", code : "SO" },
        {demonym : "Surinamer", code : "SR" },
        {demonym : "Sudanese", code : "SS" },
        {demonym : "São Tomean", code : "ST" },
        {demonym : "Salvadorean", code : "SV" },

        {demonym : "Syrian", code : "SY" },
        {demonym : "Swazi", code : "SZ" },
        {demonym : "Turks and Caicos Islander", code : "TC" },
        {demonym : "Chadian", code : "TD" },

        {demonym : "Togolese", code : "TG" },
        {demonym : "Thai", code : "TH" },
        {demonym : "Tajikistani", code : "TJ" },
        {demonym : "Tokelauan", code : "TK" },
        {demonym : "Timorese", code : "TL" },
        {demonym : "Turkmen", code : "TM" },
        {demonym : "Tunisian", code : "TN" },
        {demonym : "Tongan", code : "TO" },
        {demonym : "Turkish", code : "TR" },
        {demonym : "Trinidadian", code : "TT" },
        {demonym : "Tuvaluan", code : "TV" },
        {demonym : "Taiwanese", code : "TW" },
        {demonym : "Tanzanian", code : "TZ" },
        {demonym : "Ukrainian", code : "UA" },
        {demonym : "Ugandan", code : "UG" },

        {demonym : "American", code : "US" },
        {demonym : "Uruguayan", code : "UY" },
        {demonym : "Uzbekistani", code : "UZ" },

        {demonym : "Saint Vincentian", code : "VC" },
        {demonym : "Venezuelan", code : "VE" },
        {demonym : "Virgin Islander", code : "VG" },
        {demonym : "Virgin Islander", code : "VI" },
        {demonym : "Vietnamese", code : "VN" },
        {demonym : "Ni-Vanuatu", code : "VU" },
        {demonym : "Wallisian", code : "WF" },
        {demonym : "Samoan", code : "WS" },
        {demonym : "Yemeni", code : "YE" },
        {demonym : "Mahoran", code : "YT" },
        {demonym : "South African", code : "ZA" },
        {demonym : "Zambian", code : "ZM" },
        {demonym : "Zimbabwean", code : "ZW" }
    ]

});
