const expect = require("chai").expect;
const moduleAlias = require("module-alias");
moduleAlias.addAlias("node_helper", "../../js/node_helper.js");
var Module = require("../node_helper.js");
var helper = new Module();
helper.setName("MMM-Formula1");

describe("Functions in node_helper.js", function () {});
