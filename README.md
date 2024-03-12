# MagicMirror Module: MMM-Formula1

A MagicMirror Module for displaying Formula 1 standings and race schedule.
Forked from Ian Perrin's take on this.This module combines standing and schedule in one module. Various options enable you to control the size of the module.

[![Platform](https://img.shields.io/badge/platform-MagicMirror-informational)](https://MagicMirror.builders)
[![License](https://img.shields.io/badge/license-MIT-informational)](https://raw.githubusercontent.com/73cirdan/MMM-Formula1/master/LICENSE)

## Example

![Example screenshot](screenshows/screenshot.png)

### The module displays the current Formula 1 schedule and standings from the selected season with the following information

- The flag for the driver or constructor.
- The drivers name (when the drivers standings are displayed).
- The constructor name.
- The current points total.
- The current number of wins.
- the schedule for the current race weekend, including free practice, sprint, quali and race time
- the track layout for the current race weekend
- the name and time for the race after this weekend
- constructor icon logos and higher resolution flags

### In addition you can configure the following options

- Which season to display the standings for `season`
- Whether to show the drivers `DRIVER` or constructors `CONSTRUCTOR` standings, Use `showStanding`, there are also modes for `BOTH` and `MIX`. With `BOTH` first driver and than constructor standings are shown in a table. With MIX the driver and constructor are shown in the same space, but after each other in time. Use `NONE` to show no standings.
- How many drivers/constructors to display in the standings table `maxRowsDriver` or `maxRowsConstructor`
- If you have a favourite driver/constructor not in "how many" range, you can add a `fanDriverCode` or `fanConstructorCode`. This driver and/or constructor is added to the standing.

- Whether to show the race weeking timing table schedule. `showSchedule`
- Whether to show the schedule without the next race information. `showNextRace`
## Installation

In your terminal, go to your MagicMirror's Module folder:

```bash
cd ~/MagicMirror/modules
```

Clone this repository:

```bash
git clone https://github.com/73cirdan/MMM-Formula1
```

Install dependencies:

```bash
cd ~/MagicMirror/modules/MMM-Formula1
npm install --production
```

Configure the module in your `config/config.js` file.

## Updating

If you want to update your MMM-Formula1 module to the latest version, use your terminal to go to your MMM-Formula1 module folder and type the following command:

```bash
git pull
```

(Re)install dependencies.

```bash
cd ~/MagicMirror/modules/MMM-Formula1
npm install --production
```

If you haven't changed the modules, this should work without any problems.
Type `git status` to see your changes, if there are any, you can reset them with `git reset --hard`. After that, git pull should be possible.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:

```javascript
modules: [
  {
    module: "MMM-Formula1",
    position: "top_right",
    header: "Formula 1",
    config: {
      // Optional configuration options - see https://github.com/73cirdan/MMM-Formula1#configuration-options
    }
  }
];
```

## Configuration options

The following properties can be configured:

| **Option**        | **Default**            | **Description**                                                                                                                                                                    | **Possible Values**                                                                                                          |
| ----------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `season`          | `current`              | _Optional_ - The season to display.                                                                                                                                                | `current` = Standings for the current season, or a year (greater than or equal to `1950`) = Standings for a specific season. |
| `showStanding`            | `MIX`               | _Optional_ - The type of standings to display.                                                                                                                                     | `DRIVER` only show driver standing, `CONSTRUCTOR` only show constructor standing, `BOTH` show both driver and constructor standing, `MIX` alternate between driver and constructor standing (30s each), `NONE` do not show standing. The race schedule is shown.                                                                                                     |
| `maxRowsDriver`         | `5`                | _Optional_ - The maximum number of drivers to show in the standings table.                                                                                            | a `number`.                                                                                                       |
| `maxRowsConstructor`         | `5`                | _Optional_ - The maximum number of constructors to show in the standings table.                                                                                            | a `number`.                                                                                                       |
| `showSchedule`        | `true`                | _Optional_ - Whether the show the upcoming Race Schedule and track layout. If showStanding is `NONE`, and showSchedule is false, the module will show the schedule anyway.                                                                                             | `true` or `false`.                                                                                                           |
| `fade`            | `false`                 | _Optional_ - Whether to fade the activities to black (Gradient).                                                                                                                   | `true` or `false`                                                                                                            |
| `fadePoint`       | `0.4`                  | _Optional_ - Where to start fade?                                                                                                                                                  | `0` (top of the list) - `1` (bottom of list)                                                                                 |
| `reloadInterval`  | `1800000` (30 minutes) | _Optional_ - How often does the data needs to be reloaded from the API? (Milliseconds). See the [Terms & Conditions](http://ergast.com/mrd/terms/) for responsible use of the API. It can take some time after the race for the data to be updated at the api endpoint, be patient. | `7500` - `86400000`                                                                                                          |
| `animationSpeed`  | `2500` (2.5 seconds)   | _Optional_ - The speed of the update animation. (Milliseconds).                                                                                                                    | `0` - `5000`                                                                                                                 |
| `grayscale`       | `false`                 | _Optional_ - Whether to show the flags, constructor icon and circuit layout in grayscale (`true`) or colour (`false`). In colour the circuit layout show the sectors also.                                                                                               | `true` or `false`                                                                                                            |
| `showNextRace`      | `true`                 | _Optional_ - Whether to show the name and time of the next race after the upcomming weekend.                                                                               | `true` or `false`                                                                                                            |
| `fanDriverCode`      | `empty`                 | _Optional_ - Whether to add the name of the driver to the driver standing list if it would fall out of the maxRowsDriver filter.                                                                               | `3 character code used for the driver`  This is the code you see in your screen when watching F1, like VER for Verstappen.                                                                                                          |
| `fanConstructorCode`      | `empty`                 | _Optional_ - Whether to add the name of the constructor to the constructor standing list if it would fall out of the maxRowsConstructor filter.                                                                               | for 2024 `red_bull`, `ferrari`, `mercedes`, `mclaren`, `aston_martin`, `sauber`, `haas`, `rb`, `williams`, `alpine`.                                                                                                            |

## Thanks

- ianperrins first version which led to this version. Major changes:
  - removed f1api from the package.json and rewrote node_helper
  - removed dev tools
  - rewrote nunjucks template to support different display options
  - removed ical dependency and possibility to use magicmirror calendar. The default upcomming weekend and next race are shown in what used to be the standing module
  - updated flags css
- track layouts by F1laps for the track vectors
  - found here on github
  - rotated some layout to use spcae more efficient (portrait layout)
  - thickened some lines
  - made a unicolor version for grayscale mode
- ergast api for the data
  - btw ergast announced to deprecate the api end of 2024. There is an alternative free api that will add schedule and standings to their api early in 2024.
  - See [more info here](https://openf1.org/?javascript#roadmap)

## Disclaimer

This an unofficial project and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V. 

