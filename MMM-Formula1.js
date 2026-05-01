/*
 * MagicMirror²
 * Module: MMM-Formula1
 *
 * By Cirdan, Ian Perrin http://github.com/ianperrin/MMM-Formula1
 * MIT Licensed.
 */

Module.register("MMM-Formula1", {
  // Default module configuration options.
  defaults: {
    showStanding: "MIX", // Default display type (MIX: drivers and constructors)
    loadDriverStandings: true, // Load driver standings data if required by showStanding config
    loadConstructorStandings: false, // Load constructor standings data if required by showStanding config
    showDriverProfiles: true, // Load driver profile  data
    showSchedule: true, // Show the race schedule
    fade: false, // Apply fade effect in standings list
    fadePoint: 0.3, // Fade effect starts at this point in the standings list
    reloadInterval: 30 * 60 * 1000, // Interval to reload data (30 minutes)
    screenRefreshInterval: 150 * 1000, // Interval to refresh the screen (30 seconds)
    animationSpeed: 2.5 * 1000, // Animation speed (2.5 seconds)
    grayscale: false, // Enable grayscale for flag colors
    showNextRace: true // Show the next race when displaying the schedule
  },

  // Store data for driver, constructor, and schedule in local variables.
  dataDriverStandings: null,
  dataConstructorStandings: null,
  slicedDriverStandings: null,
  slicedConstructorStandings: null,
  dataSchedule: null,
  dataDriverProfiles: [],
  endpoint: "/modules/MMM-Formula1/", // Base endpoint for API calls
  driverStandingsErrorCount: 0, // Track missing data for driver standings
  constructorStandingsErrorCount: 0, // Track missing data for constructor standings
  scheduleErrorCount: 0, // Track missing data for schedule
  driverProfilesErrorCount: 0, // Track missing data for driver profiless
  loading: true, // Loading state for the module

  // Get the external script(s) needed for the module.
  getScripts() {
    return ["MMM-Formula1-utils.js"]; // Add the utility script
  },

  // Get the stylesheets needed for the module.
  getStyles() {
    return ["font-awesome.css", "MMM-Formula1.css"]; // Font-awesome and custom CSS
  },

  // Get translation files for different languages.
  getTranslations() {
    return {
      en: "translations/en.json",
      nl: "translations/nl.json",
      de: "translations/de.json",
      id: "translations/id.json",
      it: "translations/it.json",
      sv: "translations/sv.json",
      da: "translations/da.json",
      fr: "translations/fr.json",
      tr: "translations/tr.json",
      pt: "translations/pt-br.json"
    };
  },

  // Start the module and validate the config.
  start() {
    Log.info(`Starting module: ${this.name}`);
    this.validateConfig(); // Check the configuration validity

    // Load nationalities data (via API) and initialize filters
    var self = this;
    var filePath = self.endpoint + "nationalities.json";
    MMMFormula1Utils.loadNationalities(filePath)
      .then(function (nationalitiesMap) {
        self.nationalities = nationalitiesMap; // Store nationalities map
        self.addFilters(); // Add custom Nunjucks filters
      })
      .catch(function (error) {
        Log.error("Error loading nationalities:", error); // Log error if nationalities loading fails
      });

    // Start polling for data (via helper) and send configuration to socket.
    this.sendSocketNotification("CONFIG", this.config);

    // If the showStanding config is "MIX", update the DOM periodically.
    if (this.config.showStanding === "MIX") {
      this.scheduledTimer = setInterval(function () {
        self.updateDom(self.config.animationSpeed); // Periodic DOM updates
      }, this.config.screenRefreshInterval);
    }
  },
  // Handle socket notifications (received from the MagicMirror server).
  socketNotificationReceived(notification, payload) {
    Log.info(`${this.name} received a notification: ${notification}`);

    // Data processors mapped to each notification type
    const dataProcessors = {
      DRIVERSTANDINGS: this.processDriverStandingsData,
      CONSTRUCTORSTANDINGS: this.processConstructorStandingsData,
      SCHEDULE: this.processScheduleData,
      DRIVER_PROFILE: this.processDriverProfileData,
      DRIVERSTANDINGS_ERROR: () => this.increaseErrorCount("driverStandings"),
      CONSTRUCTORSTANDINGS_ERROR: () => this.increaseErrorCount("constructorStandings"),
      SCHEDULE_ERROR: () => this.increaseErrorCount("schedule"),
      DRIVERPROFILES_ERROR: () => this.increaseErrorCount("driverProfiles"),
      SEASON_DRIVERS_ERROR: () =>
        Log.error(
          `${this.name}: Failed to load driver list, birthday card data impaired: ${payload}`
        )
    };

    // Check if the notification exists in the dataProcessors map and call the corresponding function
    if (dataProcessors[notification]) {
      dataProcessors[notification].call(this, payload);
    } else {
      Log.error(`${this.name}: Notification not understood: ${notification}`);
    }

    // Update loading state and refresh the DOM once data is received (or error occurs).
    this.loading = false;
    this.updateDom(this.config.animationSpeed);
  },

  /***           process Handlers               ***/

  // Process the driver standings data and reset error count
  processDriverStandingsData(payload) {
    this.dataDriverStandings = payload;
    this.slicedDriverStandings = MMMFormula1Utils.processStandingsWithFanData(
      payload,
      "DriverStandings",
      this.config
    );

    const todayStr = new Date().toDateString();

    // Keep only today's profiles
    this.dataDriverProfiles = this.dataDriverProfiles.filter(
      (p) => new Date(p.timestamp).toDateString() === todayStr
    );

    // Create a Set for fast lookup
    const existingCodes = new Set(this.dataDriverProfiles.map((p) => p.code));

    // Find birthday drivers and fetch missing profiles
    MMMFormula1Utils.findBirthdayDrivers(this.dataDriverStandings).forEach((ds) => {
      if (!existingCodes.has(ds.Driver.code)) {
        this.sendSocketNotification("DRIVER_PROFILE", ds);
      }
    });

    this.driverStandingsErrorCount = 0; // Reset error count
  },

  // Process the constructor standings data and reset error count
  processConstructorStandingsData(payload) {
    this.dataConstructorStandings = payload;
    this.slicedConstructorStandings = MMMFormula1Utils.processStandingsWithFanData(
      payload,
      "ConstructorStandings",
      this.config
    );
    this.constructorStandingsErrorCount = 0; // Reset error count
  },

  // Process the schedule data and reset error count
  processScheduleData(payload) {
    this.dataSchedule = MMMFormula1Utils.processScheduleForNextRace(
      payload,
      config.locale,
      config.timeFormat
    );
    this.scheduleErrorCount = 0; // Reset error count
  },
  // Process the driver profile data and reset error count
  processDriverProfileData(newDriverProfile) {
    this.dataDriverProfiles = MMMFormula1Utils.processDriverProfiles(
      this.dataDriverProfiles,
      newDriverProfile
    );
    this.driverProfileErrorCount = 0; // Reset error count
  },

  // Dynamically access the error count property based on the type
  increaseErrorCount(type) {
    const errorCountProperty = `${type}ErrorCount`;
    this[errorCountProperty]++;
  },

  // Define the template file used for rendering the module.
  getTemplate() {
    return "templates\\mmm-formula1-standings.njk"; // Use the Nunjucks template for standings
  },

  // Use the header to inform users about stale data.
  getHeader() {
    return (
      this.data.header +
      (this.driverStandingsErrorCount > 0 ? " (D:" + this.driverStandingsErrorCount + ")" : "") + // Show driver data error count
      (this.constructorStandingsErrorCount > 0
        ? " (C:" + this.constructorStandingsErrorCount + ")"
        : "") + // Show constructor data error count
      (this.driverProfileErrorCount > 0 ? " (P:" + this.driverProfileErrorCount + ")" : "") + // Show profile data error count
      (this.scheduleErrorCount > 0 ? " (S:" + this.scheduleErrorCount + ")" : "") // Show schedule data error count
    );
  },

  // Prepare the template data to be passed to Nunjucks.
  getTemplateData() {
    const hasBirthday = !!(this.dataDriverProfiles && this.dataDriverProfiles.length);

    const templateData = {
      loading: this.loading, // Whether the module is still loading data
      config: this.config, // Current module configuration
      dataDriverProfiles: this.dataDriverProfiles,
      hasBirthday: hasBirthday,
      dataD: this.slicedDriverStandings, // Driver standings data
      dataC: this.slicedConstructorStandings, // Constructor standings data
      dataS: this.dataSchedule, // Schedule data
      endpointconstructors: this.endpoint + "constructors/", // Endpoint for constructor data
      endpointtracks: this.endpoint + (this.config.grayscale ? "tracks" : "trackss"), // Endpoint for track data
      identifier: this.identifier // Unique identifier for the module
      //timeStamp: this.dataRefreshTimeStamp // Last data refresh timestamp
    };
    return templateData;
  },

  // Check for errors in the configuration and fix if necessary.
  validateConfig() {
    let configType = this.config.showStanding.toUpperCase(); // Normalize the standing type config
    const validTypes = ["NONE", "DRIVER", "CONSTRUCTOR", "BOTH", "MIX"];

    // Default to MIX if an invalid config value is provided
    if (!validTypes.includes(configType)) {
      this.config.showStanding = "MIX";
    }

    // Set flags for loading driver and constructor data based on showStanding config
    this.config.loadDriverStandings = ["DRIVER", "BOTH", "MIX"].includes(configType);
    this.config.loadConstructorStandings = ["CONSTRUCTOR", "BOTH", "MIX"].includes(configType);

    // Ensure there is something to show if no data is configured to be displayed
    if (
      !this.config.showSchedule &&
      !this.config.loadDriverStandings &&
      !this.config.loadConstructorStandings
    ) {
      this.config.showSchedule = true; // Default to showing schedule if nothing else is enabled
    }

    // deprecation check
    if (this.config.season)
      Log.warn(
        `Starting module: ${this.name}.config.season: config option is deprecated and no longer used`
      );
  },

  // Add custom Nunjucks filters to the template engine.
  addFilters() {
    const env = this.nunjucksEnvironment(); // Get the Nunjucks environment
    env.addFilter("getCodeFromNationality", (nationality) => {
      return MMMFormula1Utils.getCodeFromNationality(this.nationalities, nationality); // Get nationality code
    });
    env.addFilter("getFadeOpacity", this.getFadeOpacity.bind(this)); // Add fade opacity filter
    env.addFilter("showStanding", (showType) =>
      MMMFormula1Utils.shouldShowStanding(
        this.config.showStanding.toUpperCase(),
        showType,
        new Date().getSeconds()
      )
    );
    env.addFilter("translate", this.translate.bind(this)); // Add translation filter
  },

  // Used to calculate fade effect in the standings list based on configuration.
  getFadeOpacity(index, itemCount) {
    const fadeStart = itemCount * this.config.fadePoint;
    const fadeItemCount = itemCount - fadeStart + 1;
    if (this.config.fade && index > fadeStart) {
      return 1 - (index - fadeStart) / fadeItemCount; // Apply fade effect
    }
    return 1; // No fade for items before the fade point
  }
});
