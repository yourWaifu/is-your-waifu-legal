//Warning make sure you are editing the ts file and not the js file
var legalAge = 18;
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
        if (data.hasOwnProperty("image") && data["image"] !== null) {
            newHTML += "<img src=\"";
            newHTML += data["image"];
            newHTML += "\" alt=\"";
            newHTML += englishName;
            newHTML += "\"><br>\n";
        }
        // Calculate age
        if (data.hasOwnProperty("year") && data["year"] !== null) {
            var currentDate = new Date();
            var age = currentDate.getFullYear() - data["year"];
            //take into count the month
            if (data.hasOwnProperty("month") && data["month"] !== null) {
                var month = data["month"];
                var currentMonth = currentDate.getMonth();
                if ((currentMonth < month) || (
                //take into count the day
                currentMonth === month &&
                    data.hasOwnProperty("day") &&
                    data["day"] !== null &&
                    currentDate.getDay() < data["day"])) {
                    --age;
                }
            }
            newHTML += "age: ";
            newHTML += age.toString();
            newHTML += " years old<br>\n";
            if (legalAge <= age) {
                newHTML += "Looks legal to me.<br>\n";
            }
            else {
                newHTML += "Not legal<br>\n" +
                    "Wait ";
                newHTML += legalAge - age;
                newHTML += " more years.";
            }
        }
        else {
            newHTML += "Year of birth is unknown. Sorry.";
        }
        output.innerHTML = newHTML;
    };
    request.send();
}
