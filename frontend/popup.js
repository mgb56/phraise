let changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", function(data) {
  changeColor.style.backgroundColor = data.color;
  changeColor.setAttribute("value", data.color);
});

changeColor.onclick = function(element) {
  let color = element.target.value;
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.executeScript(tabs[0].id, {
      code: 'document.body.style.backgroundColor = "' + color + '";'
    });
  });
};

function openCity(evt, cityName) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(cityName).style.display = "block";
  evt.className += " active";
}

document.addEventListener("DOMContentLoaded", function() {
  var linkParis = document.getElementById("link-Paris");
  // onClick's logic below:
  linkParis.addEventListener("click", function() {
    openCity(linkParis, "Paris");
  });

  var linkLondon = document.getElementById("link-London");
  // onClick's logic below:
  linkLondon.addEventListener("click", function() {
    openCity(linkLondon, "London");
  });

  var linkTokyo = document.getElementById("link-Tokyo");
  // onClick's logic below:
  linkTokyo.addEventListener("click", function() {
    openCity(linkTokyo, "Tokyo");
  });
});
