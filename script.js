//Warning make sure you are editing the ts file and not the js file
var legalAge = 18;
let siteName = "Is Your Waifu Legal?";
//units
let millisecond = 1;
let second = 1000 * millisecond;
let minute = 60 * second;
let hour = 60 * minute;
let day = 24 * hour;
var countdown = -1;
let months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];
function hasValue(data, key) {
    return data.hasOwnProperty(key) && data[key] !== null;
}
function hasYear(waifu) {
    return hasValue(waifu, "year");
}
function hasMonth(waifu) {
    return hasValue(waifu, "month");
}
function hasDay(waifu) {
    return hasValue(waifu, "day-of-month");
}
function getCountdownHTML(countdownTime) {
    //sanity check
    if (countdownTime === undefined) {
        return "";
    }
    let currentDate = new Date();
    let currentTime = currentDate.getTime();
    let difference = countdownTime - currentTime;
    let seconds = Math.floor((difference % minute) / second);
    let minutes = Math.floor((difference % hour) / minute);
    let hours = Math.floor((difference % day) / hour);
    let days = Math.floor(difference / day);
    //To do calculate years, take into account leap years.
    let html = "Countdown to 18th birthday: ";
    html += days + " days ";
    html += hours + " hours ";
    html += minutes + " minutes ";
    html += seconds + " seconds<br>\n";
    return html;
}
function getAgeHTML(waifu) {
    let html = "";
    if (hasYear(waifu)) {
        let currentDate = new Date();
        let age = currentDate.getFullYear() - waifu["year"];
        //take into count the month
        if (hasMonth(waifu)) {
            let month = waifu["month"];
            let currentMonth = currentDate.getMonth() + 1;
            if ((currentMonth < month) || (
            //take into count the day
            currentMonth === month &&
                waifu.hasOwnProperty("day-of-month") &&
                waifu["day-of-month"] !== null &&
                currentDate.getDay() < waifu["day-of-month"])) {
                --age;
            }
        }
        html += "age: ";
        html += age.toString();
        html += " years old<br>\n";
        if (legalAge <= age) {
            html += "Looks legal to me.<br>\n";
            //stop timer
            if (countdown !== -1) {
                clearInterval(countdown);
                //congrats, your waifu is now of legal age
            }
        }
        else {
            html += "Not legal<br>\n" +
                "Wait ";
            html += legalAge - age;
            html += " more years.<br>\n";
            //We need to start the timer before we can display it
            if (countdown === -1) {
                countdown = window.setInterval(function () {
                    let countdownElement = document.getElementById("dynamic-data");
                    if (countdownElement !== null) {
                        countdownElement.innerHTML = getDynamicDataHTML(waifu);
                    }
                }, 1 * second);
            }
            html += getCountdownHTML(getBirthDate(waifu, legalAge).getTime());
        }
    }
    else if (hasValue(waifu, "definitely-legal") && waifu["definitely-legal"] === true) {
        html += "Definitely Legal<br>\n";
    }
    else {
        html += "Year of birth is unknown. Sorry.<br>\n";
    }
    return html;
}
function getBirthDate(waifu, yearsOffset = 0) {
    if (!hasYear(waifu)) {
        return new Date();
    }
    let year = waifu["year"] + yearsOffset;
    if (!hasMonth(waifu)) {
        return new Date(year);
    }
    else if (!hasDay(waifu)) {
        return new Date(year, waifu["month"] - 1);
    }
    else {
        return new Date(year, waifu["month"], waifu["day-of-month"]);
    }
}
function getDynamicDataHTML(waifu) {
    return getAgeHTML(waifu);
}
function displayWaifuStats(name) {
    let input = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); //sanitize input for the url
    let foundOutput = document.getElementById("output");
    let output;
    if (foundOutput === null)
        return;
    else
        output = foundOutput;
    output.innerHTML = "";
    if (input === "")
        return;
    //add search to history
    let parms = new URLSearchParams(window.location.search);
    let search = parms.get("q");
    let historyState = { "q": input };
    let query = "?q=" + input;
    if (search === null || search !== input) {
        history.pushState(historyState, "", query);
    }
    else {
        history.replaceState(historyState, "", query);
    }
    let request = new XMLHttpRequest();
    request.open("GET", "https://yourwaifu.dev/is-your-waifu-legal/waifus/" + input.toLowerCase() + ".json");
    request.responseType = "json";
    request.onerror = function (event) {
        console.log(event);
        output.innerHTML = "Something went wrong. Look at console for more info";
    };
    request.onload = function () {
        let newHTML = "";
        switch (this.status) {
            case 200: //OK
                break;
            case 404:
                newHTML +=
                    "Could not find this person. Sorry.<br>\n" +
                        "Maybe you spelled her name wrong.<br>\n" +
                        "Maybe you forgot to enter her full name.<br>\n" +
                        "If you know her age, " +
                        "<a href=\"https://github.com/yourWaifu/is-your-waifu-legal#How-to-add-a-waifu-to-the-list\">" +
                        "please add her" +
                        "</a>.";
            default:
                let error = "Error " + this.status.toString();
                output.innerHTML = error + "<br>\n" + newHTML;
                document.title = error + " - " + siteName;
                return;
        }
        //clear values before starting
        if (countdown !== -1) {
            clearInterval(countdown);
            countdown = -1;
        }
        let data = this.response;
        let englishName = data.hasOwnProperty("english-name") ? data["english-name"] : "";
        newHTML += "<h1>";
        newHTML += englishName;
        newHTML += "</h1>\n";
        document.title = englishName + " - " + siteName;
        //display waifu image
        if (data.hasOwnProperty("image") && data["image"] !== null && data["image"] !== "") {
            newHTML += "<img class=\"waifu-image\" src=\"";
            newHTML += data["image"];
            newHTML += "\" alt=\"";
            newHTML += englishName;
            newHTML += "\"><br>\n";
        }
        //display birthday
        if (hasMonth(data)) {
            newHTML += months[Number(data["month"]) - 1] + " ";
        }
        if (hasDay(data)) {
            newHTML += data["day-of-month"].toString();
        }
        if (hasYear(data)) {
            if (hasMonth(data) || hasDay(data)) {
                newHTML += ", ";
            }
            newHTML += data["year"].toString();
        }
        newHTML += "<br>\n";
        // Calculate data
        newHTML += "<div id=\"dynamic-data\">\n";
        newHTML += getDynamicDataHTML(data);
        newHTML += "</div>\n";
        //list notes and sources
        function createListHtml(jsonKey, displayName) {
            let html = "";
            if (!data.hasOwnProperty(jsonKey) || data[jsonKey] === null || data[jsonKey].length === 0) {
                return html;
            }
            html += "<br>";
            html += displayName;
            html += ":<br>\n<ul>\n";
            let values = data[jsonKey];
            values.forEach(function (value) {
                html += "<li>";
                html += value;
                html += "</li>\n";
            });
            html += "</ul>\n";
            return html;
        }
        newHTML += createListHtml("notes", "Notes");
        newHTML += createListHtml("sources", "Sources");
        output.innerHTML = newHTML;
    };
    request.send();
}
function onWaifuSearch() {
    displayWaifuStats(document.getElementById("waifu-search").value);
}
//read query string values
window.onload = function () {
    let parms = new URLSearchParams(window.location.search);
    let search = parms.get("q");
    search = search !== null ? search : "";
    displayWaifuStats(search);
};
window.onpopstate = function (event) {
    if (!hasValue(event.state, "q")) {
        return;
    }
    displayWaifuStats(event.state["q"]);
};
