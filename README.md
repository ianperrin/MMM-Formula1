# MagicMirror Module: MMM-Formula1
A MagicMirror Module for displaying Formula 1 standings and race schedule.

## Example

![](.github/example.png)

### The module displays the standings from the current Formula 1 season including:
* The flag for the driver or constructor.
* The drivers name (when the drivers standings are displayed).
* The constructor name.
* The current points total.
* The current number of wins.

### In addition you can configure the following options
* Which season to display the standings for `season`
* Whether to show the drivers or constructors standings `type`
* How many drivers/constructors to display in the standings table `maxRows`
* Display the upcoming race schedule using the standard [calendar](https://github.com/MichMich/MagicMirror/tree/develop/modules/default/calendar) module


## Installation

In your terminal, go to your MagicMirror's Module folder:
````
cd ~/MagicMirror/modules
````

Clone this repository:
````
git clone https://github.com/ianperrin/MMM-Formula1.git
````

Configure the module in your `config/config.js` file.

## Updating

If you want to update your MMM-Formula1 module to the latest version, use your terminal to go to your MMM-Formula1 module folder and type the following command:

````
git pull
```` 

If you haven't changed the modules, this should work without any problems. 
Type `git status` to see your changes, if there are any, you can reset them with `git reset --hard`. After that, git pull should be possible.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
    {
        module: 'MMM-Formula1',
        position: 'top_right',
        header: 'F1 Standings',
        config: {
            // Optional configuration options - see https://github.com/ianperrin/MMM-Formula1#configuration-options
        }
    },
]
````

## Configuration options

The following properties can be configured:


<table width="100%">
    <!-- why, markdown... -->
    <thead>
        <tr>
            <th>Option</th>
            <th width="100%">Description</th>
        </tr>
    <thead>
    <tbody>
        <tr>
            <td><code>season</code></td>
            <td><b>Optional</b> - The season to display.<br>
                <br><b>Possible values:</b><code>1950</code> - <code>2016</code>
                <br><b>Default value:</b> <code>'current'</code>
            </td>
        </tr>
        <tr>
            <td><code>type</code></td>
            <td><b>Optional</b> - The type of standings to display.<br>
                <br><b>Possible values:</b><code>'DRIVER'</code> or <code>'CONSTRUCTOR'</code>
                <br><b>Default value:</b> <code>'DRIVER'</code>
            </td>
        </tr>
        <tr>
            <td><code>maxRows</code></td>
            <td><b>Optional</b> - The maximum number of drivers/constructors to show in the standings table.<br>
                <br><b>Possible values:</b> <code>false</code> or a <code>number</code>.
                <br><b>Default value:</b> <code>false</code>
            </td>
        </tr>
        <tr>
            <td><code>calendar</code></td>
            <td><b>Optional</b> - Whether the module should publish the upcoming Race Schedule as an ical.<br>
                <br><b>Possible values:</b> <code>true</code> or <code>false</code>.
                <br><b>Default value:</b> <code>false</code>
            </td>
        </tr>
        <tr>
            <td><code>fade</code></td>
            <td><b>Optional</b> - Whether to fade the activities to black. (Gradient)<br>
                <br><b>Possible values:</b> <code>true</code> or <code>false</code>
                <br><b>Default value:</b> <code>false</code>
            </td>
        </tr>
        <tr>
            <td><code>fadePoint</code></td>
            <td><b>Optional</b> - Where to start fade?<br>
                <br><b>Possible values:</b> <code>0</code> (top of the list) - <code>1</code> (bottom of list)
                <br><b>Default value:</b> <code>0.4</code>
            </td>
        </tr>
        <tr>
            <td><code>reloadInterval</code></td>
            <td><b>Optional</b> - How often does the data needs to be reloaded from the API? (Milliseconds). See the <a href="http://ergast.com/mrd/terms/">Terms &amp; Conditions</a> for responsible use of the API.<br>
                <br><b>Possible values:</b> <code>7500</code> - <code>86400000</code>
                <br><b>Default value:</b> <code>1800000</code> (30 minutes)
            </td>
        </tr>
        <tr>
            <td><code>animationSpeed</code></td>
            <td><b>Optional</b> - The speed of the update animation. (Milliseconds)<br>
                <br><b>Possible values:</b><code>0</code> - <code>5000</code>
                <br><b>Default value:</b> <code>2500</code> (2.5 seconds)
            </td>
        </tr>
    </tbody>
</table>

### Displaying the Race Schedule
Stop your Magic Mirror (your exact method may vary)
````
pm2 stop mm
````
Install `ical-generator` in your MMM-Formula1 module directory.
````
cd ~/MagicMirror/modules/MMM-Formula1
npm install ical-generator
````
Set the `calendar` option for your MMM-Formula1 module to true.
````
        config: {
            // Optional configuration options - see https://github.com/ianperrin/MMM-Formula1#configuration-options
            calendar: true,
        }
```` 
Add the Formula 1 Race Schedule calendar to the `calendar` module to your configuration (`config/config.js`).
```
{
    symbol: ' flag-checkered',
    url: 'http://localhost:8080/MMM-Formula1/schedule.ics',
}
```
Restart your Magic Mirror
Start your Magic Mirror (your exact method may vary)
````
pm2 start mm
````
