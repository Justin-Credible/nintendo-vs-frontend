
/**
 * Used to clean out the coin counter stats from the configuration files.
 * This is useful when comparing config files so you can focus on the actual
 * changes to key bindings etc.
 */

var fs = require("fs");

var sideAConfigs = fs.readdirSync("./side-a");
var sideBConfigs = fs.readdirSync("./side-b");

sideAConfigs = sideAConfigs.map(function (value) {
    if (value.indexOf(".cfg") > -1) {
        return "side-a/" + value;
    }
    else {
        return null;
    }
});

sideBConfigs = sideBConfigs.map(function (value) {
    if (value.indexOf(".cfg") > -1) {
        return "side-b/" + value;
    }
    else {
        return null;
    }
});

var configs = sideAConfigs.concat(sideBConfigs);

for (configPath of configs) {

    if (!configPath) {
        continue;
    }

    var contents = fs.readFileSync(configPath, { encoding: "utf8" });

    var result = contents.replace(/coins index="(\d)" number="\d+"/g, 'coins index="$1" number="0"');

    fs.writeFileSync(configPath, result, "utf8");
}
