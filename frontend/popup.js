// Slider
(function () {
  "use strict";

  var RS = function (conf) {
    this.input = null;
    this.inputDisplay = null;
    this.slider = null;
    this.sliderWidth = 0;
    this.sliderLeft = 0;
    this.pointerWidth = 0;
    this.pointerR = null;
    this.pointerL = null;
    this.activePointer = null;
    this.selected = null;
    this.scale = null;
    this.step = 0;
    this.tipL = null;
    this.tipR = null;
    this.timeout = null;
    this.valRange = false;

    this.values = {
      start: null,
      end: null
    };
    this.conf = {
      target: null,
      values: null,
      set: null,
      range: false,
      width: null,
      scale: true,
      labels: true,
      tooltip: true,
      step: null,
      disabled: false,
      onChange: null
    };

    this.cls = {
      container: "rs-container",
      background: "rs-bg",
      selected: "rs-selected",
      pointer: "rs-pointer",
      scale: "rs-scale",
      noscale: "rs-noscale",
      tip: "rs-tooltip"
    };

    for (var i in this.conf) {
      if (conf.hasOwnProperty(i)) this.conf[i] = conf[i];
    }

    this.init();
  };

  RS.prototype.init = function () {
    if (typeof this.conf.target === "object") this.input = this.conf.target;
    else
      this.input = document.getElementById(this.conf.target.replace("#", ""));

    if (!this.input) return console.log("Cannot find target element...");

    this.inputDisplay = getComputedStyle(this.input, null).display;
    this.input.style.display = "none";
    this.valRange = !(this.conf.values instanceof Array);

    if (this.valRange) {
      if (
        !this.conf.values.hasOwnProperty("min") ||
        !this.conf.values.hasOwnProperty("max")
      )
        return console.log("Missing min or max value...");
    }
    return this.createSlider();
  };

  RS.prototype.createSlider = function () {
    this.slider = createElement("div", this.cls.container);
    this.slider.innerHTML = '<div class="rs-bg"></div>';
    this.selected = createElement("div", this.cls.selected);
    this.pointerL = createElement("div", this.cls.pointer, ["dir", "left"]);
    this.scale = createElement("div", this.cls.scale);

    if (this.conf.tooltip) {
      this.tipL = createElement("div", this.cls.tip);
      this.tipR = createElement("div", this.cls.tip);
      this.pointerL.appendChild(this.tipL);
    }
    this.slider.appendChild(this.selected);
    this.slider.appendChild(this.scale);
    this.slider.appendChild(this.pointerL);

    if (this.conf.range) {
      this.pointerR = createElement("div", this.cls.pointer, ["dir", "right"]);
      if (this.conf.tooltip) this.pointerR.appendChild(this.tipR);
      this.slider.appendChild(this.pointerR);
    }

    this.input.parentNode.insertBefore(this.slider, this.input.nextSibling);

    if (this.conf.width)
      this.slider.style.width = parseInt(this.conf.width) + "px";
    this.sliderLeft = this.slider.getBoundingClientRect().left;
    this.sliderWidth = this.slider.clientWidth;
    this.pointerWidth = this.pointerL.clientWidth;

    if (!this.conf.scale) this.slider.classList.add(this.cls.noscale);

    return this.setInitialValues();
  };

  RS.prototype.setInitialValues = function () {
    this.disabled(this.conf.disabled);

    if (this.valRange) this.conf.values = prepareArrayValues(this.conf);

    this.values.start = 0;
    this.values.end = this.conf.range ? this.conf.values.length - 1 : 0;

    if (this.conf.set && this.conf.set.length && checkInitial(this.conf)) {
      var vals = this.conf.set;

      if (this.conf.range) {
        this.values.start = this.conf.values.indexOf(vals[0]);
        this.values.end = this.conf.set[1]
          ? this.conf.values.indexOf(vals[1])
          : null;
      } else this.values.end = this.conf.values.indexOf(vals[0]);
    }
    return this.createScale();
  };

  RS.prototype.createScale = function (_resize) {
    this.step = this.sliderWidth / (this.conf.values.length - 1);

    for (var i = 0, iLen = this.conf.values.length; i < iLen; i++) {
      var span = createElement("span"),
        ins = createElement("ins");

      span.appendChild(ins);
      this.scale.appendChild(span);

      span.style.width = i === iLen - 1 ? 0 : this.step + "px";

      if (!this.conf.labels) {
        if (i === 0 || i === iLen - 1) ins.innerHTML = this.conf.values[i];
      } else ins.innerHTML = this.conf.values[i];

      ins.style.marginLeft = (ins.clientWidth / 2) * -1 + "px";
    }
    return this.addEvents();
  };

  RS.prototype.updateScale = function () {
    this.step = this.sliderWidth / (this.conf.values.length - 1);

    var pieces = this.slider.querySelectorAll("span");

    for (var i = 0, iLen = pieces.length; i < iLen; i++)
      pieces[i].style.width = this.step + "px";

    return this.setValues();
  };

  RS.prototype.addEvents = function () {
    var pointers = this.slider.querySelectorAll("." + this.cls.pointer),
      pieces = this.slider.querySelectorAll("span");

    createEvents(document, "mousemove touchmove", this.move.bind(this));
    createEvents(
      document,
      "mouseup touchend touchcancel",
      this.drop.bind(this)
    );

    for (var i = 0, iLen = pointers.length; i < iLen; i++)
      createEvents(pointers[i], "mousedown touchstart", this.drag.bind(this));

    for (var i = 0, iLen = pieces.length; i < iLen; i++)
      createEvents(pieces[i], "click", this.onClickPiece.bind(this));

    window.addEventListener("resize", this.onResize.bind(this));

    return this.setValues();
  };

  RS.prototype.drag = function (e) {
    e.preventDefault();

    if (this.conf.disabled) return;

    var dir = e.target.getAttribute("data-dir");
    if (dir === "left") this.activePointer = this.pointerL;
    if (dir === "right") this.activePointer = this.pointerR;

    return this.slider.classList.add("sliding");
  };

  RS.prototype.move = function (e) {
    if (this.activePointer && !this.conf.disabled) {
      var coordX = e.type === "touchmove" ? e.touches[0].clientX : e.pageX,
        index = coordX - this.sliderLeft - this.pointerWidth / 2;

      index = Math.round(index / this.step);

      if (index <= 0) index = 0;
      if (index > this.conf.values.length - 1)
        index = this.conf.values.length - 1;

      if (this.conf.range) {
        if (this.activePointer === this.pointerL) this.values.start = index;
        if (this.activePointer === this.pointerR) this.values.end = index;
      } else this.values.end = index;

      return this.setValues();
    }
  };

  RS.prototype.drop = function () {
    this.activePointer = null;
  };

  RS.prototype.setValues = function (start, end) {
    var activePointer = this.conf.range ? "start" : "end";

    if (start && this.conf.values.indexOf(start) > -1)
      this.values[activePointer] = this.conf.values.indexOf(start);

    if (end && this.conf.values.indexOf(end) > -1)
      this.values.end = this.conf.values.indexOf(end);

    if (this.conf.range && this.values.start > this.values.end)
      this.values.start = this.values.end;

    this.pointerL.style.left =
      this.values[activePointer] * this.step - this.pointerWidth / 2 + "px";

    if (this.conf.range) {
      if (this.conf.tooltip) {
        this.tipL.innerHTML = this.conf.values[this.values.start];
        this.tipR.innerHTML = this.conf.values[this.values.end];
      }
      this.input.value =
        this.conf.values[this.values.start] +
        "," +
        this.conf.values[this.values.end];
      this.pointerR.style.left =
        this.values.end * this.step - this.pointerWidth / 2 + "px";
    } else {
      if (this.conf.tooltip)
        this.tipL.innerHTML = this.conf.values[this.values.end];
      this.input.value = this.conf.values[this.values.end];
    }

    if (this.values.end > this.conf.values.length - 1)
      this.values.end = this.conf.values.length - 1;
    if (this.values.start < 0) this.values.start = 0;

    this.selected.style.width =
      (this.values.end - this.values.start) * this.step + "px";
    this.selected.style.left = this.values.start * this.step + "px";

    return this.onChange();
  };

  RS.prototype.onClickPiece = function (e) {
    if (this.conf.disabled) return;

    var idx = Math.round((e.clientX - this.sliderLeft) / this.step);

    if (idx > this.conf.values.length - 1) idx = this.conf.values.length - 1;
    if (idx < 0) idx = 0;

    if (this.conf.range) {
      if (idx - this.values.start <= this.values.end - idx) {
        this.values.start = idx;
      } else this.values.end = idx;
    } else this.values.end = idx;

    this.slider.classList.remove("sliding");

    return this.setValues();
  };

  RS.prototype.onChange = function () {
    var _this = this;

    if (this.timeout) clearTimeout(this.timeout);

    this.timeout = setTimeout(function () {
      if (_this.conf.onChange && typeof _this.conf.onChange === "function") {
        return _this.conf.onChange(_this.input.value);
      }
    }, 500);
  };

  RS.prototype.onResize = function () {
    this.sliderLeft = this.slider.getBoundingClientRect().left;
    this.sliderWidth = this.slider.clientWidth;
    return this.updateScale();
  };

  RS.prototype.disabled = function (disabled) {
    this.conf.disabled = disabled;
    this.slider.classList[disabled ? "add" : "remove"]("disabled");
  };

  RS.prototype.getValue = function () {
    return this.input.value;
  };

  RS.prototype.destroy = function () {
    this.input.style.display = this.inputDisplay;
    this.slider.remove();
  };

  var createElement = function (el, cls, dataAttr) {
      var element = document.createElement(el);
      if (cls) element.className = cls;
      if (dataAttr && dataAttr.length === 2)
        element.setAttribute("data-" + dataAttr[0], dataAttr[1]);

      return element;
    },
    createEvents = function (el, ev, callback) {
      var events = ev.split(" ");

      for (var i = 0, iLen = events.length; i < iLen; i++)
        el.addEventListener(events[i], callback);
    },
    prepareArrayValues = function (conf) {
      var values = [],
        range = conf.values.max - conf.values.min;

      if (!conf.step) {
        console.log("No step defined...");
        return [conf.values.min, conf.values.max];
      }

      for (var i = 0, iLen = range / conf.step; i < iLen; i++)
        values.push(conf.values.min + i * conf.step);

      if (values.indexOf(conf.values.max) < 0) values.push(conf.values.max);

      return values;
    },
    checkInitial = function (conf) {
      if (!conf.set || conf.set.length < 1) return null;
      if (conf.values.indexOf(conf.set[0]) < 0) return null;

      if (conf.range) {
        if (conf.set.length < 2 || conf.values.indexOf(conf.set[1]) < 0)
          return null;
      }
      return true;
    };

  window.rSlider = RS;
})();

var tabSettings = document.getElementById("tab-Settings");
openTab(tabSettings, "Settings"); // pre-select Settings

tabSettings.onclick = function (_element) {
  openTab(tabSettings, "Settings");
};

var tabBlock = document.getElementById("tab-Block");
tabBlock.onclick = function (_element) {
  openTab(tabBlock, "Block");
};

function openTab(evt, cityName) {
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

// Dropdowns
var languages = {
  Afrikaans: "af",
  Albanian: "sq",
  Amharic: "am",
  Arabic: "ar",
  Armenian: "hy",
  Azerbaijani: "az",
  Basque: "eu",
  Belarusian: "be",
  Bengali: "bn",
  Bosnian: "bs",
  Bulgarian: "bg",
  Catalan: "ca",
  Cebuano: "ceb",
  "Chinese (Simplified)": "zh-CN",
  "Chinese (Traditional)": "zh-TW",
  Corsican: "co",
  Croatian: "hr",
  Czech: "cs",
  Danish: "da",
  Dutch: "nl",
  English: "en",
  Esperanto: "eo",
  Estonian: "et",
  Finnish: "fi",
  French: "fr",
  Frisian: "fy",
  Galician: "gl",
  Georgian: "ka",
  German: "de",
  Greek: "el",
  Gujarati: "gu",
  "Haitian Creole": "ht",
  Hausa: "ha",
  Hawaiian: "haw",
  Hebrew: "he",
  Hindi: "hi",
  Hmong: "hmn",
  Hungarian: "hu",
  Icelandic: "is",
  Igbo: "ig",
  Indonesian: "id",
  Irish: "ga",
  Italian: "it",
  Japanese: "ja",
  Javanese: "jv",
  Kannada: "kn",
  Kazakh: "kk",
  Khmer: "km",
  Kinyarwanda: "rw",
  Korean: "ko",
  Kurdish: "ku",
  Kyrgyz: "ky",
  Lao: "lo",
  Latin: "la",
  Latvian: "lv",
  Lithuanian: "lt",
  Luxembourgish: "lb",
  Macedonian: "mk",
  Malagasy: "mg",
  Malay: "ms",
  Malayalam: "ml",
  Maltese: "mt",
  Maori: "mi",
  Marathi: "mr",
  Mongolian: "mn",
  "Myanmar (Burmese)": "my",
  Nepali: "ne",
  Norwegian: "no",
  "Nyanja (Chichewa)": "ny",
  "Odia (Oriya)": "or",
  Pashto: "ps",
  Persian: "fa",
  Polish: "pl",
  "Portuguese (Portugal, Brazil)": "pt",
  Punjabi: "pa",
  Romanian: "ro",
  Russian: "ru",
  Samoan: "sm",
  Scots: "gd",
  Serbian: "sr",
  Sesotho: "st",
  Shona: "sn",
  Sindhi: "sd",
  "Sinhala (Sinhalese)": "si",
  Slovak: "sk",
  Slovenian: "sl",
  Somali: "so",
  Spanish: "es",
  Sundanese: "su",
  Swahili: "sw",
  Swedish: "sv",
  "Tagalog (Filipino)": "tl",
  Tajik: "tg",
  Tamil: "ta",
  Tatar: "tt",
  Telugu: "te",
  Thai: "th",
  Turkish: "tr",
  Turkmen: "tk",
  Ukrainian: "uk",
  Urdu: "ur",
  Uyghur: "ug",
  Uzbek: "uz",
  Vietnamese: "vi",
  Welsh: "cy",
  Xhosa: "xh",
  Yiddish: "yi",
  Yoruba: "yo",
  Zulu: "zu"
};

var languageDropdown = document.getElementById("languageDropdown");
languageDropdown.onclick = () => {
  document.getElementById("languageSelection").classList.toggle("show");
};

var languageSearch = document.getElementById("languageSearch");
languageSearch.onkeyup = () => {
  var input, filter, a, i;
  input = document.getElementById("languageSearch");
  filter = input.value.toUpperCase();
  div = document.getElementById("languageSelection");
  a = div.getElementsByTagName("a");
  for (i = 0; i < a.length; i++) {
    txtValue = a[i].textContent || a[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      a[i].style.display = "";
    } else {
      a[i].style.display = "none";
    }
  }
};

var languageSelection = document.getElementById("languageSelection");
for (var lang in languages) {
  var entry = document.createElement("a");
  entry.innerHTML = lang;
  entry.href = "#" + lang;
  languageSelection.appendChild(entry);
}

// Close dropdown if clicked outside
document.getElementById("Settings").onclick = (e) => {
  if (
    languageSelection.classList.contains("show") &&
    e.target != languageDropdown &&
    e.target != languageSearch
  ) {
    languageSelection.classList.remove("show");
  }
};

// only updateSettings() if slider value changes
var settingsValsCache = {};

// Create sliders
var samplingRateSlider;
chrome.storage.sync.get(["samplingRateVal"], function (result) {
  var samplingRateInitVal;
  if (
    typeof result.samplingRateVal === "undefined" ||
    result.samplingRateVal == null
  ) {
    samplingRateInitVal = "low";
  } else {
    samplingRateInitVal = result.samplingRateVal;
  }
  samplingRateSlider = new rSlider({
    target: "#samplingRateSlider",
    values: ["low", "medium", "high"],
    range: false,
    tooltip: true,
    scale: false,
    labels: false,
    width: 400,
    set: [samplingRateInitVal]
  });
  settingsValsCache["samplingRateVal"] = samplingRateInitVal;
  samplingRateSlider.onChange = () => {
    updateSettings();
  };
});

var phraseLengthSlider;
chrome.storage.sync.get(
  ["phraseLengthVal1", "phraseLengthVal2"],
  function (result) {
    var phraseLengthInitVal1;
    var phraseLengthInitVal2;
    if (
      typeof result.phraseLengthVal1 === "undefined" ||
      result.phraseLengthVal1 == null
    ) {
      phraseLengthInitVal1 = "short";
    } else {
      phraseLengthInitVal1 = result.phraseLengthVal1;
    }
    if (
      typeof result.phraseLengthVal2 === "undefined" ||
      result.phraseLengthVal2 == null
    ) {
      phraseLengthInitVal2 = "long";
    } else {
      phraseLengthInitVal2 = result.phraseLengthVal2;
    }

    phraseLengthSlider = new rSlider({
      target: "#phraseLengthSlider",
      values: ["short", "average", "long"],
      range: true,
      tooltip: true,
      scale: false,
      labels: false,
      width: 400,
      set: [phraseLengthInitVal1, phraseLengthInitVal2]
    });
    settingsValsCache["phraseLengthVal1"] = phraseLengthInitVal1;
    settingsValsCache["phraseLengthVal2"] = phraseLengthInitVal2;
    phraseLengthSlider.onChange = () => {
      updateSettings();
    };
    // phraseLengthSlider is invisible at first
    var phraseLengthContainer = document.getElementById(
      "phraseLengthContainer"
    );
    for (var child of phraseLengthContainer.childNodes) {
      if (child.tagName !== "INPUT" && child.nodeName !== "#text") {
        if (child.style.opacity === "0") {
          child.style.opacity = "1";
        } else {
          child.style.opacity = "0";
        }
      }
    }
  }
);

function setLanguage(text) {
  chrome.storage.sync.set({ currentLanguage: text }, function () {
    chrome.extension
      .getBackgroundPage()
      .console.log("selectedLanguage is set to " + text);
  });
  var currentLanguageText = document.getElementById("currentLanguageText");
  currentLanguageText.innerHTML = text;
}

// Save Settings
var updateSettings = () => {
  var samplingRateVal = samplingRateSlider.getValue();
  // advanced options was not clicked
  if (typeof phraseLengthSlider === "undefined" || phraseLengthSlider == null) {
    chrome.storage.sync.set({ samplingRateVal: samplingRateVal }, function () {
      chrome.extension
        .getBackgroundPage()
        .console.log("samplingRateVal is set to " + samplingRateVal);
    });
    chrome.extension.getBackgroundPage().console.log("got here");
    setLanguage();
    return;
  }

  var phraseLengthVals = phraseLengthSlider.getValue();
  var phraseLengthVal1 = phraseLengthVals.substring(
    0,
    phraseLengthVals.search(",")
  );
  var phraseLengthVal2 = phraseLengthVals.substring(
    phraseLengthVals.search(",") + 1,
    phraseLengthVals.length
  );

  // set settings values for persistence
  if (
    settingsValsCache["samplingRateVal"] !== samplingRateVal ||
    settingsValsCache["phraseLengthVal1"] !== phraseLengthVal1 ||
    settingsValsCache["phraseLengthVal2"] !== phraseLengthVal2
  )
    chrome.storage.sync.set(
      {
        samplingRateVal: samplingRateVal,
        phraseLengthVal1: phraseLengthVal1,
        phraseLengthVal2: phraseLengthVal2
      },
      function () {
        chrome.extension
          .getBackgroundPage()
          .console.log(
            `samplingRateVal set to ${samplingRateVal}, phraseLengthVal1 set to ${phraseLengthVal1}, phraseLengthVal2 set to ${phraseLengthVal2}`
          );
        settingsValsCache["samplingRateVal"] = samplingRateVal;
        settingsValsCache["phraseLengthVal1"] = phraseLengthVal1;
        settingsValsCache["phraseLengthVal2"] = phraseLengthVal2;
      }
    );
};

var languageEntries = document.querySelectorAll("#languageSelection > a");
for (var entry of languageEntries) {
  entry.onclick = (function (text) {
    return function () {
      setLanguage(text);
      languageSelection.classList.toggle("show");
      // reset input placeholder and show all options
      languageSearch.value = "";
      var a = languageSelection.getElementsByTagName("a");
      for (i = 0; i < a.length; i++) {
        a[i].style.display = "";
      }
    };
  })(entry.innerHTML);
}

chrome.storage.sync.get(["currentLanguage"], function (result) {
  var currentLanguage;
  if (
    typeof result.currentLanguage === "undefined" ||
    result.currentLanguage == null
  ) {
    chrome.extension
      .getBackgroundPage()
      .console.log("currentLanguage not found");
    currentLanguage = "Spanish";
  } else {
    chrome.extension.getBackgroundPage().console.log("currentLanguage found");
    currentLanguage = result.currentLanguage;
  }
  var currentLanguageText = document.getElementById("currentLanguageText");
  currentLanguageText.innerHTML = currentLanguage;
});

// Advanced Options
var advancedOptions = document.getElementById("advancedOptions");
var firstTime = true;
var phraseLengthSlider;
var clickAdvancedOptions = () => {
  // toggle phraseLengthSlider visibility
  var phraseLengthContainer = document.getElementById("phraseLengthContainer");
  for (var child of phraseLengthContainer.childNodes) {
    if (child.tagName !== "INPUT" && child.nodeName !== "#text") {
      if (child.style.opacity === "0") {
        child.style.opacity = "1";
      } else {
        child.style.opacity = "0";
      }
    }
  }
};
advancedOptions.onclick = clickAdvancedOptions;

// Blocking
const updateBlockedSitesDropdown = (sites) => {
  $("#DDLActivites").empty();
  for (site of sites) {
    $("#DDLActivites").append("<option>" + site + "</option>");
  }
  $("#DDLActivites").selectpicker("refresh");
};

// this keeps track of the blocked sites so we don't have to get it from storage each time
var blockSitesCache;

var unblockSelectedSitesButton = document.getElementById("unblockCurrent");
unblockSelectedSitesButton.style.visibility = "hidden";

var blockMultipleSites = document.getElementById("DDLActivites");

blockMultipleSites.onchange = () => {
  chrome.extension.getBackgroundPage().console.log(blockMultipleSites);
  var selectedItem = $(".selectpicker").val();
  if (selectedItem && selectedItem.length > 0) {
    unblockSelectedSitesButton.style.visibility = "visible";
  } else {
    unblockSelectedSitesButton.style.visibility = "hidden";
  }

  chrome.extension.getBackgroundPage().console.log(selectedItem);
};

const didClickUnblockSitesButton = () => {
  chrome.extension.getBackgroundPage().console.log("did press button");
  var item = document.getElementById("DDLActivites");
  var sitesToUnblock = [];
  chrome.extension.getBackgroundPage().console.log(item);
  for (var inputChild of item.childNodes) {
    if (inputChild.selected === true) {
      sitesToUnblock.push(inputChild.value);
    }
  }
  chrome.extension.getBackgroundPage().console.log(sitesToUnblock);
  // TODO: cache the list of options so we don't have to re-retrieve it
  chrome.storage.sync.get(["sites"], (data) => {
    var oldSites = data["sites"];
    var newSites = [];
    for (var site of oldSites) {
      if (sitesToUnblock.includes(site)) {
        // don't add it because we don't want to keep blocking it
      } else {
        newSites.push(site);
      }
    }
    blockSitesCache = newSites;
    updateBlockedSitesDropdown(blockSitesCache);
    chrome.storage.sync.set({ sites: newSites });
  });
};

unblockSelectedSitesButton.onclick = didClickUnblockSitesButton;

chrome.storage.sync.get(["sites", "currentUrl"], (data) => {
  chrome.extension
    .getBackgroundPage()
    .console.log("init call to storage returns: ");
  chrome.extension.getBackgroundPage().console.log(data);
  blockSitesCache = data["sites"];
  updateBlockedSitesDropdown(blockSitesCache);
});

// get the block button and add an onclick function to it
var blockCurrentButton = document.getElementById("blockCurrent");

blockCurrentButton.onclick = () => {
  chrome.storage.sync.get(["currentUrl", "sites"], (data) => {
    var currUrl = data["currentUrl"];
    var blockedArr = data["sites"];

    if (typeof blockedArr === "undefined") {
      blockedArr = [];
    }

    if (blockedArr.includes(currUrl)) {
      return;
    }

    blockedArr.push(currUrl);
    blockedArr.sort();
    blockSitesCache = blockedArr;
    updateBlockedSitesDropdown(blockSitesCache);
    chrome.storage.sync.set({ sites: blockedArr });
  });
};
