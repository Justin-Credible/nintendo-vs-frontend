
namespace JustinCredible.NintendoVsFrontend.Renderer {

	var browser = require("electron").remote.getCurrentWindow();

	export function main(): void {

		var outputDiv = document.getElementById("output");

		browser.addListener("key-pressed", function app_keyPressed(key: string) {
			outputDiv.innerText = key;
		});
	}
}
