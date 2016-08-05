# MagicMirror Module: MMM-Formula1
A MagicMirror Module for displaying the driver standings from the current Formula 1 season.

## Example

![](.github/example.png)

### The module displays the driver standings from the current Formula 1 season including:
* The drivers name.
* The drivers constructor.
* The drivers current points total.
* The drivers current number of wins.

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
            <td><b>Optional</b> - How often does the data needs to be reloaded from the API? (Milliseconds). See <a href="http://strava.github.io/api/#rate-limiting">Strava documentation</a> for API rate limits<br>
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
