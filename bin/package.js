var fs = require("fs");
var packager = require("electron-packager")

var packageInfo = JSON.parse(fs.readFileSync("package.json", "utf8"));
var appPackageInfo = JSON.parse(fs.readFileSync("app/package.json", "utf8"));

var options = {
    dir: "app",
    platform: "win32",
    arch: "x64",
    icon: "app/icons/joystick.ico",
    name: appPackageInfo.name,
    "build-version": appPackageInfo.version,
    version: packageInfo.dependencies["electron"],
    out: "build",
    overwrite: true,
    "version-string": {
        FileDescription: appPackageInfo.name
    }
};

packager(options, function (r) {
    console.log("Done!", r);
});
