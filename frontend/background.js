chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ color: "#3aa757" }, function () {
    console.log("The color is green.");
  });

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: "developer.chrome.com" }
          })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ]);
  });
});

// added by me
let active_tab_id = 0;

chrome.tabs.onActivated.addListener(tab => {
  chrome.tabs.get(tab.tabId, current_tab_info => {
    active_tab_id = tab.tabId;

    let url = current_tab_info.url;

    chrome.storage.sync.set({ currentUrl: url }, () => {
      console.log("set url as" + url);
      console.log(typeof url);
    });
    // makes sure it's a valid url (exclude chrome:extensions//)
    var expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
    var regex = new RegExp(expression);

    if (url && url.match(regex)) {
      //chrome.tabs.insertCSS(null, { file: './mystyles.css' });
      chrome.tabs.executeScript(null, { file: "./foreground.js" }, () =>
        console.log("i injected")
      );
    }
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  fetch("http://0.0.0.0:33507/", {
    method: "POST",
    body: JSON.stringify(request.array),
    headers: { "Content-type": "application/json; charset=UTF-8" }
  })
    // .then((response) => console.log(response))
    .then(response => response.json())
    .then(jsonResponse => {
      console.log(jsonResponse);
      sendResponse({ translatedText: jsonResponse });
    })
    .catch(err => console.log(err));
  return true; // to prevent message port from being closed
});

// provide a default value for blocked sites if not are set

// chrome.storage.sync.get("sites", data => {
//   var sitesArr = [
//     "https://www.news.google.com",
//     "https://www.aws.amazon.com",
//     "https://www.cloud.console.google.com",
//     "https://www.facebook.com",
//     "https://www.kit.snap.com",
//     "https://www.apple.com"
//   ];

//   if (typeof data.sites === "undefined" || data.sites.length <= 1) {
//     chrome.storage.sync.set({ sites: sitesArr }, () =>
//       console.log("did set storage to default")
//     );
//   } else {
//     console.log("storage already had a few blacklisted urls");
//   }
// });
