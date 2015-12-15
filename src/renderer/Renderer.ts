
namespace JustinCredible.NintendoVsFrontend.Renderer {

	var browser = require("electron").remote.getCurrentWindow();

	export function main(): void {

		var outputDiv = document.getElementById("output");

		outputDiv.innerText += " | " + location.hash;

		browser.addListener("key-pressed", function app_keyPressed(key: string) {
			outputDiv.innerText = key;
		});
	}
}
