
//#region String Manipulation

/**
 * Used to format a string by replacing values with the given arguments.
 * Arguments should be provided in the format of {x} where x is the index
 * of the argument to be replaced corresponding to the arguments given.
 * 
 * For example, the string t = "Hello there {0}, it is {1} to meet you!"
 * used like this: Utilities.format(t, "dude", "nice") would result in:
 * "Hello there dude, it is nice to meet you!".
 * 
 * @param str The string value to use for formatting.
 * @param ... args The values to inject into the format string.
 */
export function format(formatString: string, ...args: any[]): string {
    var i, reg;
    i = 0;

    for (i = 0; i < arguments.length - 1; i += 1) {
        reg = new RegExp("\\{" + i + "\\}", "gm");
        formatString = formatString.replace(reg, arguments[i + 1]);
    }

    return formatString;
}

/**
 * Used to determine if a string ends with a specified string.
 * 
 * @param str The string to check.
 * @param suffix The value to check for.
 * @returns True if str ends with the gtiven suffix, false otherwise.
 */
export function endsWith(str: string, suffix: string): boolean {

    if (str == null || str === "") {
        return false;
    }

    if (suffix == null || suffix === "") {
        return true;
    }

    return (str.substr(str.length - suffix.length) === suffix);
}

//#endregion

//#region Shell Specific

export function canLaunchSpec(sideASpec: Interfaces.GameSpecification, sideBSpec: Interfaces.GameSpecification, side: string, specToCheck: Interfaces.GameSpecification): boolean {

    if (side == null || specToCheck == null) {
        // Ensures both parameters are provided.
        return false;
    }
    else if (sideASpec != null && sideBSpec != null) {
        // If both sides are running a game, then another game can't be launched.
        return false;
    }
    else if ((side === "A" && sideASpec != null) || (side === "B" && sideBSpec != null)) {
        // If the side that is checking has a game running, then another game can't be launched.
        return false;
    }
    else if (sideASpec == null && sideBSpec == null) {
        // If neither side is running a game, then we can launch.
        return true;
    }
    else {
        // Otherwise we need to check if the requested spec is compatible with the
        // currently executing spec on the other side.

        let activeSpec: Interfaces.GameSpecification;

        // Grab the spec for the other side.
        switch (side) {
            case "A":
                activeSpec = sideBSpec;
                break;
            case "B":
                activeSpec = sideASpec;
                break;
        }

        // Sanity check - this shouldn't be possible based on the conditionals above.
        if (activeSpec == null) {
            console.error("Could not locate an active spec to compare!");
            return false;
        }

        if (activeSpec.type === "dual-screen") {
            return false;
        }
        else if (activeSpec.type === "single-screen" && specToCheck.type === "dual-screen") {
            return false;
        }
        else if (activeSpec.type === "single-screen" && specToCheck.type === "single-screen") {
            return true;
        }
        else {
            console.warn("Unhandled case when checking if a specification was launchable.");
            return false;
        }
    }
}

//#endregion
