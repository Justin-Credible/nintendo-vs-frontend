
/*globals Buffer, __dirname*/


// Native Node Modules
var exec = require("child_process").exec;
var del = require("del");
var fs = require("fs");
var stream = require("stream");

// Gulp & Gulp Plugins
var gulp = require("gulp");
var gutil = require("gulp-util");
var rename = require("gulp-rename");
var ts = require("gulp-typescript");
var tslint = require("gulp-tslint");
var sass = require("gulp-sass");
var sourcemaps = require("gulp-sourcemaps");
var templateCache = require("gulp-angular-templatecache");

// Other Modules
var runSequence = require("run-sequence");
var bower = require("bower");
// var sh = require("shelljs")
// var async = require("async");
// var xpath = require("xpath");
// var XmlDom = require("xmldom").DOMParser;
// var karma = require("karma").server;


var paths = {
    ts: ["./src/**/*.ts"],
    templates: ["./src/renderer/**/*.html"],
    shell_ts: ["./src/shell/**/*.ts"],
    renderer_ts: ["./src/renderer/**/*.ts"],
    sassIndex: "./src/renderer/Styles/Index.scss",
};

/**
 * Used to determine if the gulp operation was launched for a debug or release build.
 * This is controlled by the scheme parameter, if no scheme is provided, it will default
 * to debug. For example, to specify release build for the ts task you"d use:
 * 
 * gulp ts --scheme release
 */
function isDebugScheme() {
    return gutil.env.scheme === "release" ? false : true;
}

/**
 * A custom reporter for the TypeScript linter reporter function. This was copied
 * and modified from gulp-tslint.
 */
function logTsError(message, level) {
    var prefix = "[" + gutil.colors.cyan("gulp-tslint") + "]";

    if (level === "error") {
        gutil.log(prefix, gutil.colors.red("error"), message);
    } else if (level === "warn") {
        gutil.log(prefix, gutil.colors.yellow("warn"), message);
    } else {
        gutil.log(prefix, message);
    }
}

/**
 * A custom reporter for the TypeScript linter so we can pass "warn" instead of
 * "error" to be recognized by Visual Studio Code's pattern matcher as warnings
 * instead of errors. This was copied and modified from gulp-tslint.
 */
var tsLintReporter = function(failures, file) {
    failures.forEach(function(failure) {
        // line + 1 because TSLint's first line and character is 0
        logTsError("(" + failure.ruleName + ") " + file.path +
            "[" + (failure.startPosition.line + 1) + ", " +
            (failure.startPosition.character + 1) + "]: " +
            failure.failure, "warn");
    });
};

/**
 * A custom reporter for the sass compilation task so we can control the formatting
 * of the message for our custom problem matcher in Visual Studio Code.
 */
var sassReporter = function (failure) {
    var file = failure.message.split("\n")[0];
    var message = failure.message.split("\n")[1];

    console.log("[sass] [" + failure.name.toLowerCase() + "] " + file + ":" + message);
}

/**
 * Helper used to pipe an arbitrary string value into a file.
 * 
 * http://stackoverflow.com/a/23398200/4005811
 */
function string_src(filename, str) {
    var src = new stream.Readable({ objectMode: true });

    src._read = function () {
        this.push(new gutil.File({ cwd: "", base: "", path: filename, contents: new Buffer(str) }));
        this.push(null);
    };

    return src;
}

/**
 * The default task downloads Cordova plugins, Bower libraries, TypeScript definitions,
 * and then compiles the SASS into CSS and builds the TypeScript source code.
 */
gulp.task("default", function (cb) {
    runSequence("plugins", "libs", "tsd", "sass", "ts", cb);
});

/**
 * The watch task will watch for any changes in the TypeScript files and re-execute the
 * ts gulp task if they change. The "ionic serve" command will also invoke this task to
 * refresh the browser window during development.
 */
gulp.task("watch", function() {
    gulp.watch(paths.ts, ["sass", "ts"]);
});

/**
 * Performs linting of the TypeScript source code.
 */
gulp.task("lint", function (cb) {
    var filesToLint = paths.ts;

    return gulp.src(filesToLint)
    .pipe(tslint())
    .pipe(tslint.report(tsLintReporter));
});

/**
 * Uses the tsd command to restore TypeScript definitions to the typings
 * directories and rebuild the tsd.d.ts typings bundle for both the shell
 * and renderer source.
 */
gulp.task("tsd", function (cb) {
    runSequence("tsd:shell", "tsd:renderer", cb);
});

/**
 * Uses the tsd command to restore TypeScript definitions to the typings
 * directory and rebuild the tsd.d.ts typings bundle (for the shell source).
 */
gulp.task("tsd:shell", function (cb) {

    // First reinstall any missing definitions to the typings directory.
    exec("tsd reinstall --config tsd-shell.json", function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);

        if (err) {
            cb(err);
            return;
        }

        // Rebuild the src/shell/tsd.d.ts bundle reference file.
        exec("tsd rebundle --config tsd-shell.json", function (err, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            cb(err);
        });
    });
});

/**
 * Uses the tsd command to restore TypeScript definitions to the typings
 * directory and rebuild the tsd.d.ts typings bundle (for the renderer source).
 */
gulp.task("tsd:renderer", function (cb) {

    // First reinstall any missing definitions to the typings directory.
    exec("tsd reinstall --config tsd-renderer.json", function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);

        if (err) {
            cb(err);
            return;
        }

        // Rebuild the src/renderer/tsd.d.ts bundle reference file.
        exec("tsd rebundle --config tsd-renderer.json", function (err, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            cb(err);
        });
    });
});

/**
 * Used to generate the app/build-vars.json file which contains information about
 * the build (such as version number, timestamp, and build scheme).
 * 
 * The version number is taken from the config.xml file.
 */
gulp.task("ts:vars", function (cb) {

    var packageInfo = JSON.parse(fs.readFileSync("app/package.json", "utf8"));

    exec("git rev-parse --short HEAD", function (err, stdout, stderr) {

        var commitShortSha = err ? "unknown" : stdout.replace("\n", "");

        // Create the structure of the buildVars variable.
        var buildVars = {
            commitShortSha: commitShortSha,
            debug: isDebugScheme(),
            buildTimestamp: (new Date()).toUTCString(),
            version: packageInfo.version
        }

        // Serialize to JSON.
        var buildVarsJson = JSON.stringify(buildVars);

        // Write the file out to disk for the shell.
        fs.writeFileSync("app/build-vars.json", buildVarsJson, { encoding: "utf8" });

        // Generate a JavaScript version for the renderer.
        var buildVarsJs = "window.buildVars = " + buildVarsJson;

        // Write the file out to disk for the renderer.
        fs.writeFileSync("app/www/js/build-vars.js", buildVarsJs, { encoding: "utf8" });

        cb();
    });
});

/**
 * Used to copy the entire TypeScript source into the app/www/js/src directory
 * so that it can be used for debugging purposes.
 * 
 * This will only copy the files if the build scheme is not set to release.
 */
gulp.task("ts:src", ["ts:src-read-me"], function (cb) {

    if (!isDebugScheme()) {
        cb();
        return;
    }

    return gulp.src(paths.renderer_ts)
        .pipe(gulp.dest("app/www/js/src"));
});

/**
 * Used to add a readme file to app/src and www/js/app/src to explain what the
 * directories are for.
 * 
 * This will only copy the files if the build scheme is not set to release.
 */
gulp.task("ts:src-read-me", function (cb) {

    if (!isDebugScheme()) {
        cb();
        return;
    }

    var infoMessage = "This directory contains a copy of the TypeScript source files for debug builds; it can be safely deleted and will be regenerated via the gulp ts task.\n\nTo omit this directory create a release build by specifying the scheme:\ngulp ts --scheme release";

    return string_src("readme.txt", infoMessage)
        .pipe(gulp.dest("app/www/js/src"));
});

/**
 * Used to perform compliation of the TypeScript source in the src directory and
 * output the JavaScript to the shell and renderer directories. Compilation parameters
 * are located in src/shell/tsconfig.json and src/renderer/tsconfig.json respectively.
 * 
 * It will also delegate to the vars and src tasks to copy in the original source
 * which can be used for debugging purposes. This will only occur if the build scheme
 * is not set to release.
 */
gulp.task("ts", ["ts:vars", "ts:src"], function (cb) {
    exec("tsc -p src/shell", function (err1, stdout1, stderr1) {
        console.log(stdout1);
        console.log(stderr1);

        exec("tsc -p src/renderer", function (err2, stdout2, stderr2) {
            console.log(stdout2);
            console.log(stderr2);
            cb(err1 || err2);
        });
    });
});

/**
 * Used to concatenate all of the HTML templates into a single JavaScript module.
 */
gulp.task("templates", function() {
    return gulp.src(paths.templates)
        .pipe(templateCache({
            "filename": "templates.js",
            "root": "",
            "module": "templates",
            standalone: true
        }))
        .pipe(gulp.dest("./app/www/js"));
});

/**
 * Used to perform compilation of the SASS styles in the styles directory (using
 * Index.scss as the root file) and output the CSS to app/www/css/bundle.css.
 */
gulp.task("sass", function (cb) {

    var sassConfig = {
        outputStyle: isDebugScheme() ? "nested" : "compressed",
        errLogToConsole: false
    };

    return gulp.src(paths.sassIndex)
        .pipe(sourcemaps.init())
        .pipe(sass(sassConfig).on("error", sassReporter))
        .pipe(rename("bundle.css"))
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest("./app/www/css"));
});

/**
 * Used to download all of the bower dependencies as defined in bower.json and place
 * the consumable pieces in the app/www/lib directory. Also runs an 'npm install' in
 * the app directory to download libraries specific to the shell source.
 */
gulp.task("libs", function(cb) {
    exec("bower-installer", function (err1, stdout1, stderr1) {
        console.log(stdout1);
        console.log(stderr1);

        exec("npm install", { cwd: "app" }, function (err2, stdout2, stderr2) {
            console.log(stdout2);
            console.log(stderr2);
            cb(err1 || err2);
        });
    });
});

/**
 * Used to perform a file clean-up of the project. This removes all files and directories
 * that don"t need to be committed to source control by delegating to several of the clean
 * sub-tasks.
 */
gulp.task("clean", ["clean:node", "clean:bower", "clean:libs", "clean:ts", "clean:tsd", "clean:templates", "clean:sass"]);

/**
 * Removes the node_modules directory.
 */
gulp.task("clean:node", function (cb) {
    del([
        "node_modules"
    ], cb);
});

/**
 * Removes the bower_components directory.
 */
gulp.task("clean:bower", function (cb) {
    del([
        "bower_components"
    ], cb);
});

/**
 * Removes the www/lib directory.
 */
gulp.task("clean:libs", function (cb) {
    del([
        "app/www/lib"
    ], cb);
});

/**
 * Removes files related to TypeScript compilation.
 */
gulp.task("clean:ts", function (cb) {
    del([
        "app/build-vars.json",
        "app/shell",

        "app/www/js/build-vars.js",
        "app/www/js/bundle.js",
        "app/www/js/bundle.js.map",
        "app/www/js/src"
    ], cb);
});

/**
 * Removes files related to TypeScript definitions.
 */
gulp.task("clean:tsd", function (cb) {

    // TODO: These patterns don't actually remove the sub-directories
    // located in the typings directories, they leave the directories
    // but remove the *.d.ts files. The following glob should work for
    // remove directories and preserving the custom directory, but they
    // don't for some reason and the custom directory is always removed:
    // "typings/**"
    // "!typings/custom/**"

    del([
        "src/shell/tsd.d.ts",
        "typings/shell/**/*.d.ts",
        "!typings/shell/custom/*.d.ts",
        // "typings/**",
        // "!typings/shell/custom/**",

        "src/renderer/tsd.d.ts",
        "typings/renderer/**/*.d.ts",
        "!typings/renderer/custom/*.d.ts",
        // "typings/**",
        // "!typings/custom/**",

    ], cb);
});

/**
 * Removes the generated templates JavaScript from the templates target.
 */
gulp.task("clean:templates", function (cb) {
    del([
        "www/js/templates.js"
    ]).then(function () {
        cb();
    });
});

/**
 * Removes the generated css from the SASS target.
 */
gulp.task("clean:sass", function (cb) {
    del([
        "app/www/css/bundle.css",
        "app/www/css/bundle.css.map"
    ], cb);
});
