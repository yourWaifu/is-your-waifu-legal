//Warning make sure you are editing the ts file and not the js file
var legalAge = 18;
//units
var millisecond = 1;
var second = 1000 * millisecond;
var minute = 60 * second;
var hour = 60 * minute;
var day = 24 * hour;
var countdown = undefined;
var months = [
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
        return;
    }
    var currentDate = new Date();
    var currentTime = currentDate.getTime();
    var difference = countdownTime - currentTime;
    var seconds = Math.floor((difference % minute) / second);
    var minutes = Math.floor((difference % hour) / minute);
    var hours = Math.floor((difference % day) / hour);
    var days = Math.floor(difference / day);
    //To do calculate years, take into account leap years.
    var html = "Countdown to 18th birthday: ";
    html += days + " days ";
    html += hours + " hours ";
    html += minutes + " minutes ";
    html += seconds + " seconds<br>\n";
    return html;
}
function getAgeHTML(waifu) {
    var html = "";
    if (hasYear(waifu)) {
        var currentDate = new Date();
        var age = currentDate.getFullYear() - waifu["year"];
        //take into count the month
        if (hasMonth(waifu)) {
            var month = waifu["month"];
            var currentMonth = currentDate.getMonth() + 1;
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
            if (countdown !== undefined) {
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
            if (countdown === undefined) {
                countdown = setInterval(function () {
                    var countdownElement = document.getElementById("dynamic-data");
                    countdownElement.innerHTML = getDynamicDataHTML(waifu);
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
function getBirthDate(waifu, yearsOffset) {
    if (yearsOffset === void 0) { yearsOffset = 0; }
    if (!hasYear(waifu)) {
        return new Date();
    }
    var year = waifu["year"] + yearsOffset;
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
    var input = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); //sanitize input for the url
    var output = document.getElementById("output");
    output.innerHTML = "";
    var request = new XMLHttpRequest();
    request.open("GET", "https://yourwaifu.dev/is-your-waifu-legal/waifus/" + input.toLowerCase() + ".json");
    request.responseType = "json";
    request.onerror = function (event) {
        console.log(event);
        output.innerHTML = "Something went wrong. Look at console for more info";
    };
    request.onload = function () {
        switch (this.status) {
            case 200: //OK
                break;
            case 404:
                output.innerHTML =
                    "Could not find this person. Sorry.<br>\n" +
                        "Maybe you spelled her name wrong.<br>\n" +
                        "Maybe you forgot to enter her full name.<br>\n" +
                        "If you know her age, " +
                        "<a href=\"https://github.com/yourWaifu/is-your-waifu-legal#How-to-add-a-waifu-to-the-list\">" +
                        "please add her" +
                        "</a>.";
                return;
            default:
                output.innerHTML =
                    "Error " + this.status.toString();
                return;
        }
        //clear values before starting
        if (countdown !== undefined) {
            clearInterval(countdown);
            countdown = undefined;
        }
        var data = this.response;
        var englishName = data.hasOwnProperty("english-name") ? data["english-name"] : "";
        var newHTML = "";
        newHTML += "<h1>";
        newHTML += englishName;
        newHTML += "</h1>\n";
        //display waifu image
        if (data.hasOwnProperty("image") && data["image"] !== null && data["image"] !== "") {
            newHTML += "<img src=\"";
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
            var html = "";
            if (!data.hasOwnProperty(jsonKey) || data[jsonKey] === null || data[jsonKey].length === 0) {
                return html;
            }
            html += "<br>";
            html += displayName;
            html += ":<br>\n<ul>\n";
            var values = data[jsonKey];
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
    var parms = new URLSearchParams(window.location.search);
    var search = parms.get("q");
    if (search !== null) {
        displayWaifuStats(search);
    }
};
