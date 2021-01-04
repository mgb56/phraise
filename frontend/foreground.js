var translatedNodes = [];
var translatedText = [];

function handleText(node) {
  if (Math.random() < 0.05 && node.textContent.trim().split(" ").length > 3) {
    console.log(node.textContent);
    translatedText.push(node.textContent);
    translatedNodes.push(node);
  }
}

function walk(node) {
  if (node.nodeType === 3) {
    handleText(node);
  }
  node = node.firstChild;
  while (node) {
    const { tagName } = node;
    if (tagName !== "SCRIPT" && tagName !== "STYLE") {
      walk(node);
    }
    node = node.nextSibling;
  }
}

console.log("got here");
walk(document.getRootNode());
console.log(translatedNodes);

console.log("about to send message?");
chrome.runtime.sendMessage({ array: translatedText }, function (response) {
  console.log(response.translatedText);
  for (var i = 0; i < translatedNodes.length; i++) {
    translatedNodes[i].textContent = response.translatedText[i];
  }
});
