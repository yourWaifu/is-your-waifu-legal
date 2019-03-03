//Warning make sure you are editing the ts file and not the js file
var legalAge = 18;
//units
var millisecond = 1;
var second = 1000 * millisecond;
var minute = 60 * second;
var hour = 60 * minute;
var day = 24 * hour;
var countdown = undefined;
function getCountdownHTML(countdownTime) {
    //sanity check
    if (countdownTime === undefined)
        return;
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
    if (waifu.hasOwnProperty("year") && waifu["year"] !== null) {
        var currentDate = new Date();
        var age = currentDate.getFullYear() - waifu["year"];
        //take into count the month
        if (waifu.hasOwnProperty("month") && waifu["month"] !== null) {
            var month = waifu["month"];
            var currentMonth = currentDate.getMonth() + 1;
            if ((currentMonth < month) || (
            //take into count the day
            currentMonth === month &&
                waifu.hasOwnProperty("day") &&
                waifu["day"] !== null &&
                currentDate.getDay() < waifu["day"])) {
                --age;
            }
        }
        html += "age: ";
        html += age.toString();
        html += " years old<br>\n";
        if (legalAge <= age) {
            html += "Looks legal to me.<br>\n";
        }
        else {
            html += "Not legal<br>\n" +
                "Wait ";
            html += legalAge - age;
            html += " more years.<br>\n";
        }
    }
    else {
        html += "Year of birth is unknown. Sorry.<br>\n";
    }
    return html;
}
function getBirthDate(waifu, yearsOffset) {
    if (yearsOffset === void 0) { yearsOffset = 0; }
    if (!waifu.hasOwnProperty("year") || waifu["year"] === null) {
        return new Date();
    }
    var year = waifu["year"] + yearsOffset;
    if (!waifu.hasOwnProperty("month") || waifu["month"] === null) {
        return new Date(year);
    }
    else if (!waifu.hasOwnProperty("day") || waifu["day"] === null) {
        return new Date(year, waifu["month"]);
    }
    else {
        return new Date(year, waifu["month"], waifu["day"]);
    }
}
function getDynamicDataHTML(waifu) {
    var html = getAgeHTML(waifu);
    html += getCountdownHTML(getBirthDate(waifu, legalAge).getTime());
    return html;
}
function onWaifuSearch() {
    var input = document.getElementById("waifu-search").value;
    var output = document.getElementById("output");
    output.innerHTML = "";
    var request = new XMLHttpRequest();
    request.open("GET", "https://yourwaifu.dev/is-your-waifu-legal/waifus/" + input + ".json");
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
        // Calculate data
        newHTML += "<div id=\"dynamic-data\">\n";
        newHTML += getDynamicDataHTML(data);
        newHTML += "</div>\n";
        //make countdown
        if (countdown !== undefined) {
            clearInterval(countdown);
        }
        countdown = setInterval(function () {
            var countdownElement = document.getElementById("dynamic-data");
            countdownElement.innerHTML = getDynamicDataHTML(data);
        }, 1 * second);
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
