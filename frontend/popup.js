// let changeColor = document.getElementById("changeColor");

// chrome.storage.sync.get("color", function(data) {
//   changeColor.style.backgroundColor = data.color;
//   changeColor.setAttribute("value", data.color);
// });

var linkParis = document.getElementById("link-Paris");
openCity(linkParis, "Paris"); // open city Paris so it is pre-selected

linkParis.onclick = function (element) {
  openCity(linkParis, "Paris");
};

var linkLondon = document.getElementById("link-London");
linkLondon.onclick = function (element) {
  openCity(linkLondon, "London");
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

function prevAll(element) {
  var result = [];
  while ((element = element.previousElementSibling)) {
    result.push(element);
  }
  return result;
}

var sheet = document.createElement("style"),
  rangeInput = document.querySelector(".range input"),
  prefs = ["webkit-slider-runnable-track", "moz-range-track", "ms-track"];

document.body.appendChild(sheet);

var getTrackStyle = function (el) {
  var curVal = el.value,
    val = ((curVal - 1) * 100) / 6,
    style = "";

  // Set active label
  var rangeLabels = document.querySelector(".range-labels li");
  // rangeLabels.classList.remove("active selected");
  rangeLabels.classList.remove("active");
  rangeLabels.classList.remove("selected");

  var fullRangeLabels = document.querySelector(".range-labels");
  var curLabel = fullRangeLabels.querySelector("li:nth-child(" + curVal + ")");

  curLabel.classList.add("active");
  curLabel.classList.add("selected");
  var children = prevAll(curLabel);
  for (var i = 0; i < children.length; i++) {
    children[i].classList.add("selected");
  }
  // curLabel.prevAll().addClass("selected");

  // Change background gradient
  for (var i = 0; i < prefs.length; i++) {
    style +=
      ".range {background: linear-gradient(to right, #37adbf 0%, #37adbf " +
      val +
      "%, #fff " +
      val +
      "%, #fff 100%)}";
    style +=
      ".range input::-" +
      prefs[i] +
      "{background: linear-gradient(to right, #37adbf 0%, #37adbf " +
      val +
      "%, #b2b2b2 " +
      val +
      "%, #b2b2b2 100%)}";
  }

  return style;
};

rangeInput.addEventListener("input", function () {
  sheet.textContent = getTrackStyle(this);
});

// Change input value on label click
var rangeLabels = document.querySelector(".range-labels li");
rangeLabels.onclick = function (element) {
  var index = element.index();

  rangeInput.val(index + 1).trigger("input");
};
