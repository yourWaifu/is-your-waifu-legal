//Warning make sure you are editing the ts file and not the js file

var legalAge = 18;

//units
let millisecond : number = 1;
let second : number = 1000 * millisecond;
let minute : number = 60 * second;
let hour : number = 60 * minute;
let day : number = 24 * hour;

var countdown : number = undefined;

function getCountdownHTML(countdownTime : number) : string {
	//sanity check
	if (countdownTime === undefined) return;

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
	if (waifu.hasOwnProperty("year") && waifu["year"] !== null) {
		let currentDate : Date = new Date();
		let age : number = currentDate.getFullYear() - waifu["year"];
		//take into count the month
		if (waifu.hasOwnProperty("month") && waifu["month"] !== null) {
			let month : number = waifu["month"];
			let currentMonth : number = currentDate.getMonth() + 1;
			if (
				(
					currentMonth < month
				) || (
					//take into count the day
					currentMonth === month &&
					waifu.hasOwnProperty("day") &&
					waifu["day"] !== null &&
					currentDate.getDay() < waifu["day"]
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
		} else {
			html += "Not legal<br>\n" +
				"Wait ";
			html += legalAge - age;
			html += " more years.<br>\n"
		}
	} else {
		html += "Year of birth is unknown. Sorry.<br>\n"
	}
	return html;
}

function getBirthDate(waifu : JSON, yearsOffset : number = 0) : Date {
	if (!waifu.hasOwnProperty("year") || waifu["year"] === null) {
		return new Date();
	}
	let year : number = waifu["year"] + yearsOffset;
	if (!waifu.hasOwnProperty("month") || waifu["month"] === null) {
		return new Date(year);
	} else if (!waifu.hasOwnProperty("day") || waifu["day"] === null) {
		return new Date(year, waifu["month"]);
	} else {
		return new Date(year, waifu["month"], waifu["day"]);
	}
}

function getDynamicDataHTML(waifu : JSON) : string {
	let html = getAgeHTML(waifu);
	html += getCountdownHTML(getBirthDate(waifu, legalAge).getTime());
	return html;
}

function onWaifuSearch() : void {
	let input : string = (<HTMLInputElement>document.getElementById("waifu-search")).value;
	let output : HTMLElement = document.getElementById("output");
	output.innerHTML = "";
	let request : XMLHttpRequest = new XMLHttpRequest();
	request.open("GET", "https://yourwaifu.dev/is-your-waifu-legal/waifus/" + input + ".json");
	request.responseType = "json";
	request.onerror = function(event) {
		console.log(event);
		output.innerHTML = "Something went wrong. Look at console for more info";
	};
	request.onload = function() {
		switch(this.status) {
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
				"</a>."
			return;
		default:
			output.innerHTML =
				"Error " + this.status.toString()
			return;
		}
		let data : JSON = this.response;
		let englishName : string = data.hasOwnProperty("english-name") ? data["english-name"] : "";
		let newHTML : string = "";
		newHTML += "<h1>"
		newHTML += englishName;
		newHTML += "</h1>\n"

		//display waifu image
		if (data.hasOwnProperty("image") && data["image"] !== null && data["image"] !== "") {
			newHTML += "<img src=\"";
			newHTML += data["image"];
			newHTML += "\" alt=\""
			newHTML += englishName;
			newHTML += "\"><br>\n";
		}

		// Calculate data
		newHTML += "<div id=\"dynamic-data\">\n"
		newHTML += getDynamicDataHTML(data);
		newHTML += "</div>\n"

		//make countdown
		if (countdown !== undefined) {
			clearInterval(countdown);
		}
		countdown = setInterval(function() {
			let countdownElement : HTMLElement = document.getElementById("dynamic-data");
			countdownElement.innerHTML = getDynamicDataHTML(data);
		}, 1 * second);

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