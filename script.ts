//Warning make sure you are editing the ts file and not the js file

var legalAge = 18;
let siteName = "Is Your Waifu Legal?";

//units
let millisecond : number = 1;
let second : number = 1000 * millisecond;
let minute : number = 60 * second;
let hour : number = 60 * minute;
let day : number = 24 * hour;

var countdown : number = undefined;

let months : Array<string> = [
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

function hasValue(data: JSON, key: string) : boolean {
	return data.hasOwnProperty(key) && data[key] !== null;
}

function hasYear(waifu : JSON) : boolean {
	return hasValue(waifu, "year");
}

function hasMonth(waifu : JSON) : boolean {
	return hasValue(waifu, "month");
}

function hasDay(waifu : JSON) : boolean {
	return hasValue(waifu, "day-of-month");
}

function getCountdownHTML(countdownTime : number) : string {
	//sanity check
	if (countdownTime === undefined) {
		return;
	}

	let currentDate : Date = new Date();
	let currentTime : number = currentDate.getTime();
	let difference : number = countdownTime - currentTime;
	let seconds : number = Math.floor((difference % minute) / second);
	let minutes : number = Math.floor((difference % hour) / minute);
	let hours : number = Math.floor((difference % day) / hour);
	let days : number = Math.floor(difference / day);
	//To do calculate years, take into account leap years.

	let html : string = "Countdown to 18th birthday: "
	html += days + " days ";
	html += hours + " hours ";
	html += minutes + " minutes ";
	html += seconds + " seconds<br>\n";
	return html;
}

function getAgeHTML(waifu : JSON) : string {
	let html : string = "";
	if (hasYear(waifu)) {
		let currentDate : Date = new Date();
		let age : number = currentDate.getFullYear() - waifu["year"];
		//take into count the month
		if (hasMonth(waifu)) {
			let month : number = waifu["month"];
			let currentMonth : number = currentDate.getMonth() + 1;
			if (
				(
					currentMonth < month
				) || (
					//take into count the day
					currentMonth === month &&
					waifu.hasOwnProperty("day-of-month") &&
					waifu["day-of-month"] !== null &&
					currentDate.getDay() < waifu["day-of-month"]
				)
			) {
				--age;
			}
		}
		html += "age: ";
		html += age.toString();
		html += " years old<br>\n"
		if (legalAge <= age) {
			html += "Looks legal to me.<br>\n"
			//stop timer
			if (countdown !== undefined) {
				clearInterval(countdown);
				//congrats, your waifu is now of legal age
			}
		} else {
			html += "Not legal<br>\n" +
				"Wait ";
			html += legalAge - age;
			html += " more years.<br>\n"

			//We need to start the timer before we can display it
			if (countdown === undefined) {
				countdown = setInterval(function() {
					let countdownElement : HTMLElement = document.getElementById("dynamic-data");
					countdownElement.innerHTML = getDynamicDataHTML(waifu);
				}, 1 * second);
			}

			html += getCountdownHTML(getBirthDate(waifu, legalAge).getTime());
		}
	} else if (hasValue(waifu, "definitely-legal") && waifu["definitely-legal"] === true) {
		html += "Definitely Legal<br>\n"
	} else {
		html += "Year of birth is unknown. Sorry.<br>\n"
	}
	return html;
}

function getBirthDate(waifu : JSON, yearsOffset : number = 0) : Date {
	if (!hasYear(waifu)) {
		return new Date();
	}
	let year : number = waifu["year"] + yearsOffset;
	if (!hasMonth(waifu)) {
		return new Date(year);
	} else if (!hasDay(waifu)) {
		return new Date(year, waifu["month"] - 1);
	} else {
		return new Date(year, waifu["month"], waifu["day-of-month"]);
	}
}

function getDynamicDataHTML(waifu : JSON) : string {
	return getAgeHTML(waifu);
}

function displayWaifuStats(name : string) : void {
	let input : string = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); //sanitize input for the url
	let output : HTMLElement = document.getElementById("output");
	output.innerHTML = "";

	//add search to history
	let parms : URLSearchParams = new URLSearchParams(window.location.search);
	let search : string = parms.get("q");
	let historyState : any = {"q":input};
	let query : string = "?q=" + input;
	if (search === null || search !== input) {
		history.pushState(historyState, "", query);
	} else {
		history.replaceState(historyState, "", query)
	}

	let request : XMLHttpRequest = new XMLHttpRequest();
	request.open("GET", "https://yourwaifu.dev/is-your-waifu-legal/waifus/" + input.toLowerCase() + ".json");
	request.responseType = "json";
	request.onerror = function(event) {
		console.log(event);
		output.innerHTML = "Something went wrong. Look at console for more info";
	};
	request.onload = function() {
		let newHTML : string = "";
		switch(this.status) {
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
			let error : string = "Error " + this.status.toString()
			output.innerHTML = error + "<br>\n" + newHTML;
			document.title = error + " - " + siteName;
			return;
		}

		//clear values before starting
		if (countdown !== undefined) {
			clearInterval(countdown);
			countdown = undefined;
		}

		let data : JSON = this.response;
		let englishName : string = data.hasOwnProperty("english-name") ? data["english-name"] : "";
		newHTML += "<h1>";
		newHTML += englishName;
		newHTML += "</h1>\n";
		document.title = englishName + " - " + siteName;

		//display waifu image
		if (data.hasOwnProperty("image") && data["image"] !== null && data["image"] !== "") {
			newHTML += "<img src=\"";
			newHTML += data["image"];
			newHTML += "\" alt=\""
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
		newHTML += "<br>\n"

		// Calculate data
		newHTML += "<div id=\"dynamic-data\">\n"
		newHTML += getDynamicDataHTML(data);
		newHTML += "</div>\n"

		//list notes and sources
		function createListHtml(jsonKey:string, displayName:string) {
			let html : string = "";
			if (!data.hasOwnProperty(jsonKey) || data[jsonKey] === null || data[jsonKey].length === 0) {
				return html;
			}
			html += "<br>"
			html += displayName;
			html += ":<br>\n<ul>\n";
			let values : Array<string> = data[jsonKey];
			values.forEach(function(value : string) {
				html += "<li>"
				html += value;
				html += "</li>\n";
			});
			html += "</ul>\n";
			return html;
		}

		newHTML += createListHtml("notes", "Notes");
		newHTML += createListHtml("sources", "Sources");

		output.innerHTML = newHTML;
	}
	request.send();
}

function onWaifuSearch() : void {
	displayWaifuStats((<HTMLInputElement>document.getElementById("waifu-search")).value);
}

//read query string values
window.onload = function () : void {
	let parms : URLSearchParams = new URLSearchParams(window.location.search);
	let search : string = parms.get("q");
	if (search !== null) {
		displayWaifuStats(search);
	}
}

window.onpopstate = function(event) : void {
	if (!hasValue(event.state, "q")) {
		return;
	}
	displayWaifuStats(event.state["q"]);
};