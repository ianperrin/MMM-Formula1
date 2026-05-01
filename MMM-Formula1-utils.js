/*
 * MagicMirror²
 * Module: MMM-Formula1-utils.js
 *
 * By Cirdan, Ian Perrin http://github.com/ianperrin/MMM-Formula1
 * MIT Licensed.
 */

/* ---------------- Helper Functions ---------------- */

// Only leave the top n positions and add the fan's position if needed.
function sliceStandings(standings, maxRows, fanPosition) {
  if (!standings?.length || !maxRows) return [];
  let sliced = standings.slice(0, maxRows);
  if (fanPosition?.position > maxRows) {
    sliced = [...sliced, fanPosition];
  }
  return sliced;
}

// Formats the given date and time.
function formatDateAndTime(dateTime, timeFormat = 24, locale = "en") {
  if (!dateTime?.date) return null;

  const date = new Date(dateTime.date + (dateTime.time ? "T" + dateTime.time : ""));

  const dateStr = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(date);

  if (!dateTime.time) {
    return `${dateStr} <i class="small fa fa-hourglass"></i>`;
  }

  const options = {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: timeFormat !== 24
  };

  return new Intl.DateTimeFormat(locale, options).format(date);
}

// Finds the fan's driver position or constructor position from standings based on `isDriver`
function findFan(standings, isDriver, fanCode) {
  if (!fanCode) return null;
  fanCode = String(fanCode);

  if (isDriver) {
    return standings.find((s) => s.Driver?.code.toUpperCase() === fanCode.toUpperCase()) || null;
  } else {
    return (
      standings.find((s) => s.Constructor?.constructorId.toLowerCase() === fanCode.toLowerCase()) ||
      null
    );
  }
}

// Finds the next race round by comparing the race date with yesterday's date.
function findNextRound(dates, yesterday) {
  for (let i = 0; i < dates.length; i++) {
    const aDate = new Date(dates[i].date);
    if (aDate > new Date(yesterday)) {
      return dates[i].round;
    }
  }
  return null;
}

// Helper function to check if a driver already exists in the profiles list
function profileExists(profiles, driverId) {
  return profiles.some((profile) => profile.driverId === driverId);
}

/* ---------------- Nunjuck Helper Functions ---------------- */

// Formats and processes the schedule data for display purposes.
function processScheduleForDisplay(schedule, currentRound, locale = "en", timeFormat = 24) {
  const currentRace = schedule[currentRound - 1];
  const nextRace = schedule[currentRound];

  return {
    season: schedule[0].season,
    round: currentRound,
    raceName: currentRace.raceName,
    circuitImage: MMMFormula1Utils.circuitImages[currentRace.Circuit.circuitId],
    circuitName: currentRace.Circuit.circuitName,
    raceDate: formatDateAndTime(currentRace, timeFormat, locale),
    qualifyingDate: formatDateAndTime(currentRace.Qualifying, timeFormat, locale),
    pract1Date: formatDateAndTime(currentRace.FirstPractice, timeFormat, locale),
    pract2Date: formatDateAndTime(currentRace.SecondPractice, timeFormat, locale),
    pract3Date: formatDateAndTime(currentRace.ThirdPractice, timeFormat, locale),
    sprintQualifyingDate: formatDateAndTime(currentRace.SprintQualifying, timeFormat, locale),
    sprintDate: formatDateAndTime(currentRace.Sprint, timeFormat, locale),
    nextRaceDate: nextRace ? formatDateAndTime(nextRace, timeFormat, locale) : null,
    nextRaceName: nextRace ? nextRace.raceName : null
  };
}

// Function to build the driver profile object
function buildDriverCard(standing, OF_driver, RH_driver) {
  const year = new Date().getFullYear();
  const dob = new Date(standing?.Driver?.dateOfBirth);
  const age = year - dob.getFullYear();

  // Return the driver profile object
  return {
    driverId: standing?.Driver.driverId,
    name: RH_driver?.name,
    code: standing?.Driver.code,
    nationality: standing?.Driver.nationality,
    year,
    age,
    position: standing?.Driver.position || "-",
    points: standing?.points || "-",
    team: standing?.Constructors?.[0]?.name || "N/A",
    team_id: standing?.Constructors?.[0]?.constructorId || "N/A",
    // Open F1 Stats Fields
    team_colour: "#" + (OF_driver?.team_colour || "FFFFFF"),
    number: OF_driver?.driver_number,
    image: OF_driver?.headshot_url || null,
    // Racing Hub Stats Fields
    total_race_wins: RH_driver?.total_race_wins || 0,
    total_podiums: RH_driver?.total_podiums || 0,
    total_championship_wins: RH_driver?.total_championship_wins || 0,
    total_race_entries: RH_driver?.total_race_entries || 0,
    total_race_laps: RH_driver?.total_race_laps || 0,
    total_fastest_laps: RH_driver?.total_fastest_laps || 0,
    total_driver_of_the_day: RH_driver?.total_driver_of_the_day || 0,
    total_grand_slams: RH_driver?.total_grand_slams || 0,
    best_championship_position: RH_driver?.best_championship_position || "-",
    best_starting_grid_position: RH_driver?.best_starting_grid_position || "-",
    best_race_result: RH_driver?.best_race_result || "-",
    timestamp: standing?.timestamp
  };
}

/* ---------------- Core Data Processing ---------------- */

// Determines if a particular standing should be displayed based on configuration.
function shouldShowStanding(configType, showType, currentSecond) {
  const validTypes = ["DRIVER", "CONSTRUCTOR"];
  if (configType === "MIX") {
    const isFirstHalf = 60 - currentSecond > 30;
    return showType === "DRIVER" ? isFirstHalf : !isFirstHalf;
  }
  return validTypes.includes(configType) && configType === showType;
}

// Function to lookup the code for a given nationality from a map
function getCodeFromNationality(nationalityMap, nationality) {
  return nationalityMap[nationality] || "";
}

// Function to find a Driver with birthday is today and returen a list of DriverStanding object for each driver having a birthday
function findBirthdayDrivers(standings) {
  if (!standings?.DriverStandings) return null;

  const today = new Date();

  // Build lookup from standings
  const standingsMap = {};
  standings.DriverStandings.forEach((d) => {
    standingsMap[d.Driver.permanentNumber] = d;
  });

  const birthdayDrivers = [];
  // Iterate through the standingsMap
  Object.values(standingsMap).forEach((driver) => {
    const dob = new Date(driver.Driver.dateOfBirth); // Assuming "dateOfBirth" is part of the driver object
    var isBirthday = dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();

    if (!isBirthday) return; // Skip if not birthday

    console.warn("Birthday found: " + driver.Driver.code);
    birthdayDrivers.push(driver); // Add driver to the list if it's their birthday
  });

  return birthdayDrivers;
}

// Function to build a dataset for the Driver profile view
function processDriverProfiles(profiles, newProfile) {
  if (!newProfile) return null;
  if (!profiles) profiles = [];

  const EG_driver = newProfile?.Driver;
  const OF_driver = newProfile?.openF1;
  const RH_driver = newProfile?.careerHighlights;

  // Check if the newProfile already exists in the profiles list based on unique driverId
  if (profileExists(profiles, EG_driver.driverId)) {
    console.warn("Profile already exists, not adding.");
    return profiles; // Return the original profiles array if the profile already exists
  }

  // Build and add the new profile card to the profiles list
  const newDriverProfile = buildDriverCard(newProfile, OF_driver, RH_driver);
  profiles.push(newDriverProfile);

  return profiles;
}

// Processes the standings (drivers/constructors) and adds fan-specific data.
// It slices the standings or adds the fan's position if needed.
function processStandingsWithFanData(payload, type, config) {
  if (!payload?.[type]) return payload;

  const isDriver = type === "DriverStandings";
  const fanCode = isDriver ? config.fanDriverCode : config.fanConstructorCode;
  const maxRows = isDriver ? config.maxRowsDriver : config.maxRowsConstructor;

  const fanPosition = findFan(payload[type], isDriver, fanCode);
  const slicedStandings = sliceStandings(payload[type], maxRows, fanPosition);

  return {
    ...payload,
    [type]: slicedStandings
  };
}

// Prepares the schedule data specifically for the next race.
// Determines the current race and the next race based on yesterday's date.
function processScheduleForNextRace(schedule, locale = "en", timeFormat = 24) {
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })();

  const currentRound = findNextRound(schedule, yesterday);
  if (!currentRound) return null;

  return processScheduleForDisplay(schedule, currentRound, locale, timeFormat);
}

/* ---------------- Async Methods ---------------- */

// Utility to load nationalities and return them in a map.
// It fetches the nationality data from a given file and constructs a lookup map.
async function loadNationalities(file) {
  try {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
    const data = await response.json();
    const nationalitiesMap = {};
    for (const entry of data) {
      nationalitiesMap[entry.demonym] = entry.code.toLowerCase();
    }
    return nationalitiesMap;
  } catch (error) {
    console.error("Error loading nationalities:", error);
    return {};
  }
}

/* ---------------- Export ---------------- */
// Circuit images for each Grand Prix location.
const circuitImages = {
  bahrain: "/bahrain.svg",
  jeddah: "/jeddah.svg",
  albert_park: "/australia.svg",
  suzuka: "/japan.svg",
  shanghai: "/china.svg",
  miami: "/miami.svg",
  imola: "/imola.svg",
  monaco: "/monaco.svg",
  villeneuve: "/canada.svg",
  catalunya: "/spain.svg",
  red_bull_ring: "/austria.svg",
  silverstone: "/greatbritain.svg",
  hungaroring: "/hungary.svg",
  spa: "/belgium.svg",
  zandvoort: "/netherlands.svg",
  monza: "/italy.svg",
  baku: "/azerbaijan.svg",
  marina_bay: "/singapore.svg",
  americas: "/usa.svg",
  rodriguez: "/mexico.svg",
  interlagos: "/brazil.svg",
  vegas: "/vegas.svg",
  losail: "/qatar.svg",
  madring: "/madring.svg",
  yas_marina: "/abudhabi.svg"
};

const MMMFormula1Utils = {
  shouldShowStanding,
  getCodeFromNationality,
  findBirthdayDrivers,
  processDriverProfiles,
  processStandingsWithFanData,
  processScheduleForNextRace,
  loadNationalities,
  circuitImages
};

// Node / Vitest export
if (typeof module !== "undefined" && module.exports) {
  module.exports = MMMFormula1Utils;
}

// Optional browser fallback for MagicMirror
if (typeof window !== "undefined") {
  window.MMMFormula1Utils = MMMFormula1Utils;
}
