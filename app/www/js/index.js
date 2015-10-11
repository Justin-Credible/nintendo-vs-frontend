
var outputDiv = document.getElementById("output");

document.addEventListener("keydown", function document_keydown(ev) {
	outputDiv.innerText = ev.keyCode + "";
});