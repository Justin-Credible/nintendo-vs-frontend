
export function format(formatString: string, ...args: any[]): string {
    var i, reg;
    i = 0;

    for (i = 0; i < arguments.length - 1; i += 1) {
        reg = new RegExp("\\{" + i + "\\}", "gm");
        formatString = formatString.replace(reg, arguments[i + 1]);
    }

    return formatString;
}

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
