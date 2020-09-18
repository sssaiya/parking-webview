const spot_type_data = [
  {
    key: "S",
    name: "Student",
    color: "F9F705",
    text: "S",
    text_color: "000000",
  },
  {
    key: "B",
    name: "Staff/Graduate Students",
    color: "3EBC03",
    text: "B",
    text_color: "FDFFFD",
  },
  {
    key: "A",
    name: "Faculty and Senior Staff",
    color: "EF0707",
    text: "A",
    text_color: "FDFFFD",
  },
  {
    key: "Accessible",
    name: "Accessible",
    color: "073FCF",
    text: "&#x267f;",
    text_color: "FFFFFF",
  },
  {
    key: "V",
    name: "Visitor",
    color: "1E2128",
    text: "V",
    text_color: "FDFFFD",
  },
  {
    key: "SR",
    name: "Residential Students",
    color: "070708",
    text: "SR",
    text_color: "F9F705",
  },
  {
    key: "D",
    name: "Discount",
    color: "1DDDDA",
    text: "D",
    text_color: "000000",
  },
  {
    key: "M",
    name: "Motorcycle",
    color: "F99405",
    text: "M",
    text_color: "000000",
  },
];

var urlParams = new URLSearchParams(window.location.search);
var lotsQuery = urlParams.get("lot");
const spotsQuery = urlParams.get("spots");
const selectedLotsFromQuery = lotsQuery.split(",");

const selectedSpotsFromQuery = spotsQuery.split(",");

let slider = document.getElementsByClassName("slider")[0];
let slides = document.getElementsByClassName("slides")[0];
makeAllCardsFromQuery();

async function makeAllCardsFromQuery() {
  for (var lotIndex = 0; lotIndex < selectedLotsFromQuery.length; lotIndex++) {
    let cardRef = document.createElement("a");
    cardRef.setAttribute("href", "#card-" + lotIndex);
    slider.appendChild(cardRef);

    let cardDiv = document.createElement("div");
    cardDiv.setAttribute("id", "card-" + lotIndex);
    console.log("making card for " + selectedLotsFromQuery[lotIndex]);
    var tempCard = document.getElementsByTagName("template")[0];
    var cardContext = tempCard.content.cloneNode(true);
    await makeLotCard(selectedLotsFromQuery[lotIndex], cardContext);
    cardDiv.appendChild(cardContext);
    slides.appendChild(cardDiv);
  }
}

async function makeLotCard(lotId, cardContext) {
  const url =
    "https://4pefyt8qv7.execute-api.us-west-2.amazonaws.com/dev/parking/v1.1/status/" +
    lotId;

  //Needed as readyStateChange event is called multiple times, 4 means its completed and response is downloaded
  let response = await makeRequest(url);
  var lotInfo = JSON.parse(response);
  const availability = lotInfo["Availability"];
  const lotName = lotInfo["LocationName"];
  const lotContext = lotInfo["LocationContext"];

  //Helps to add special message warning data is not live.
  var isHistoric;
  lotInfo["LocationProvider"] == "Historic"
    ? (isHistoric = true)
    : (isHistoric = false);

  var totalSpacesForThisSelection = 0;
  var numSpotsSelected = 0;

  // Get data (text and color) for spot types from query string
  var userSpotData = {};

  for (var i = 0; i <= 2; i++) {
    const selected = selectedSpotsFromQuery[i];
    if (selected) {
      const thisSpotData = makeSpotData(selected, availability);
      userSpotData[selected] = thisSpotData;
      totalSpacesForThisSelection += thisSpotData["total"];
      numSpotsSelected++;
    }
  }
  cardContext.querySelector(".lot_name").innerHTML = lotName;

  if (lotContext == undefined) {
    cardContext.querySelector(".lot_context").innerHTML = "&nbsp;";
  } else {
    cardContext.querySelector(".lot_context").innerHTML = lotContext;
  }
  cardContext.querySelector(
    ".total_spots"
  ).innerHTML = `~ ${totalSpacesForThisSelection} Spots Available`;

  if (isHistoric) {
    cardContext.querySelector(".is_historic").innerHTML =
      "⚠ No Live Data. Estimated availability shown.";
  } else {
    cardContext.querySelector(".is_historic").innerHTML = "&nbsp;";
  }
  var row = cardContext.querySelector(".row");
  if (numSpotsSelected <= 0) {
    row.innerHTML = "No Spot Types Provided";
  } else {
    var i = 0;
    var temp = document.getElementsByTagName("template")[1];
    Object.keys(userSpotData).forEach((key) => {
      let spotData = userSpotData[key];

      var clone = temp.content.cloneNode(true);
      let col = clone.childNodes[1];

      let progressDiv = col.childNodes[3];
      progressDiv.setAttribute("data-percent", spotData["percent"]);
      progressDiv.setAttribute("data-text", spotData["percentText"]);
      progressDiv.setAttribute("data-color", spotData["percentColor"]);

      progressDiv.style.setProperty("color", spotData["percentColor"]);

      let progressSVG = progressDiv.childNodes[1];
      progressSVG.childNodes[1].style.setProperty(
        "stroke",
        spotData["percentColor"]
      );

      let spotIconSpan = col.childNodes[5].childNodes[1];
      spotIconSpan.style.setProperty("background-color", spotData["color"]);

      let spotIconInnerText = spotIconSpan.childNodes[1];
      spotIconInnerText.style.setProperty("color", spotData["textColor"]); //only need one probably
      if (spotData["text"] == "&#x267f;") {
        //Add icon for accessible spots using fa icon
        spotIconInnerText.innerHTML = '<i class="fab fa-accessible-icon"></i>';
      } else spotIconInnerText.innerHTML = spotData["text"];

      row.appendChild(clone);
    });
    let width = Math.floor(100 / numSpotsSelected) - 1;
    let cols = document.getElementsByClassName("column");
    for (var i = 0; i < cols.length; i++) {
      cols[i].style.setProperty("width", `${width}%`);
    }
  }

  fillProgressBar();
  return cardContext;
}

function makeRequest(url) {
  return new Promise(function (resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText,
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText,
      });
    };
    xhr.send();
  });
}
function fillProgressBar() {
  var totalProgress, progress;
  const circles = document.querySelectorAll(".progress");
  for (var i = 0; i < circles.length; i++) {
    var style = getComputedStyle(circles[i].querySelector("circle"));
    //Gets circumference of each circle
    totalProgress = parseInt(style.getPropertyValue("stroke-dasharray"));
    progress = parseInt(circles[i].parentElement.getAttribute("data-percent"));

    if (progress == "NA") {
      //If NA means no spots of this type
      circles[i].querySelector(".bar").style["stroke-dashoffset"] = 0;
    } else {
      circles[i].querySelector(".bar").style["stroke-dashoffset"] =
        (totalProgress * progress) / 100;
    }
  }
}

function preventBehavior(e) {
  e.preventDefault();
}

document.addEventListener("touchmove", preventBehavior, { passive: false });

//Gets color, key
function getSpotTypeDataFromContext(spotType) {
  for (var i = 0; i < spot_type_data.length; i++) {
    if (spot_type_data[i].key == spotType) {
      return [
        spot_type_data[i].text,
        spot_type_data[i].color,
        spot_type_data[i].text_color,
      ];
    }
  }
}

function makeSpotData(selected, availability) {
  const spotTypeData = getSpotTypeDataFromContext(selected);
  var thisSpotData = {};
  thisSpotData["text"] = spotTypeData[0];
  thisSpotData["color"] = "#" + spotTypeData[1];
  thisSpotData["textColor"] = "#" + spotTypeData[2];
  thisSpotData["total"] = availability[selected]
    ? availability[selected]["Total"]
    : 0;

  thisSpotData["open"] = availability[selected]
    ? availability[selected]["Open"]
    : 0;

  if (thisSpotData["total"] == 0) {
    thisSpotData["percent"] = 0;
    thisSpotData["percentText"] = "N/A";
  } else {
    thisSpotData["percent"] =
      100 -
      Math.floor(
        100 *
          ((thisSpotData["total"] - thisSpotData["open"]) /
            thisSpotData["total"])
      );
    thisSpotData["percentText"] = thisSpotData["percent"].toString() + "%";
  }

  const percent = thisSpotData["percent"];

  if (percent == 0) {
    thisSpotData["percentColor"] = "#F0EFF4";
  } else if (percent < 30) {
    thisSpotData["percentColor"] = "#EB5757";
  } else if (percent < 60) {
    thisSpotData["percentColor"] = "#F2C94C";
  } else {
    thisSpotData["percentColor"] = "#27AE60";
  }
  return thisSpotData;
}
