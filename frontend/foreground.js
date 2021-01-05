var translatedNodes = [];
var translatedText = [];

function handleText(node) {
  if (Math.random() < 0.005 && node.textContent.trim().split(" ").length > 3) {
    console.log(node.textContent);
    translatedText.push(node.textContent);
    translatedNodes.push(node);
  }
}

// don't include links, try to skip stuff not on the page
function walk(node) {
  if (node.nodeType === 3) {
    handleText(node);
  }
  node = node.firstChild;
  while (node) {
    const { tagName } = node;
    if (
      tagName !== "SCRIPT" &&
      tagName !== "STYLE" &&
      tagName !== "NOSCRIPT" &&
      tagName !== "CITE" &&
      node.parentNode.tagName !== "A"
    ) {
      walk(node);
    }
    node = node.nextSibling;
  }
}

walk(document.getRootNode());
console.log(translatedNodes);

console.log("about to send message?");
chrome.runtime.sendMessage({ array: translatedText }, function (response) {
  console.log(response.translatedText);
  for (var i = 0; i < translatedNodes.length; i++) {
    translatedNodes[i].textContent = response.translatedText[i];
  }
});
