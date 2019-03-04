# Documentation
Creating different fields on creating a waifu profile involves filling out different characters in order to get display the information

[Type Field](https://github.com/yourWaifu/is-your-waifu-legal/wiki/Documentation#type-field) 

[English Name Field](https://github.com/yourWaifu/is-your-waifu-legal/wiki/Documentation#english-name-field) 

[Aliases Field](https://github.com/yourWaifu/is-your-waifu-legal/wiki/Documentation#aliases-field) 

[Image Field](https://github.com/yourWaifu/is-your-waifu-legal/wiki/Documentation#image-field) 

[Japanese Name Field](https://github.com/yourWaifu/is-your-waifu-legal/wiki/Documentation#japanese-name-field) 

[Year Field](https://github.com/yourWaifu/is-your-waifu-legal/wiki/Documentation#year-field) 

[Definitely Legal Field](https://github.com/yourWaifu/is-your-waifu-legal/wiki/Documentation#definitely-legal-field) 

[Month Field](https://github.com/yourWaifu/is-your-waifu-legal/wiki/Documentation#month-field) 

[Day of Month Field](https://github.com/yourWaifu/is-your-waifu-legal/wiki/Documentation#day-of-month-field)

[Notes Field](https://github.com/yourWaifu/is-your-waifu-legal/wiki/Documentation#notes-field)

[Sources Field](https://github.com/yourWaifu/is-your-waifu-legal/wiki/Documentation#sources-field)

[Final Result](https://github.com/yourWaifu/is-your-waifu-legal/wiki/Documentation#final-result)

## Type Field
Information not yet provided

Example:
![JSON File Format](https://i.imgur.com/5OjvSi7.png)

## English Name Field
Type the English translated version of the waifu's name.

Example:
![JSON File Format](https://i.imgur.com/pNKO3hF.png)

## Aliases Field
Type alternative names that the waifu goes by.

Example:
![JSON File Format](https://i.imgur.com/EFNqGYG.png)

## Image Field
Displays waifu image from a Wiki site link such as Fandom.com

Example:
![JSON File Format](https://i.imgur.com/g9PPJR1.png)

## Japanese Name Field
Name is in its Kanji form. This can be found on Anime Wikis or MyAnimeList.net

Example:
![JSON File Format](https://i.imgur.com/WmwfOJr.png)

## Year Field
Type in the year the Waifu was born. (Can calculate their age from the time period they are in, if referenced)

Example:
![JSON](https://i.imgur.com/op9NkCI.png)

## Definitely Legal Field
If the waifu's age can't be determined due to they don't explicit say their age or does acts that adults normally do then this field will be used. 

__*Note*__: If you can't determine the year of when they were born use this field to substitute the Year Field.

___"definitely-legal" : true,___ __or__ ___"definitely-legal" : false,___

Should look like this:
![JSON File Format](https://i.imgur.com/ZflBVpi.png)

__*Note*__ : We used _true_ in this scenario but also works for *false* as well

## Month Field
The month the waifu was born. Should range from 1-12 in the Calendar.

Example:
![JSON File Format](https://i.imgur.com/TXDvwr7.png)

## Day of Month Field
The day waifu was born.

Example:
![JSON File Format](https://i.imgur.com/B5RJR6F.png)

## Notes Field
Write notes such as Spoilers or Fun Facts.

Example #1:
![JSON File Format](https://i.imgur.com/sbVx9uA.png)
Example #2:
![JSON File Format](https://i.imgur.com/WcvQKXT.png)

## Sources Field
Link the Wiki site if found. Alternatively can provide the image location if it was not used from the Wiki.

Example:
![JSON File Format](https://i.imgur.com/vovdwLS.png)

## Final Result
JSON file should _roughly_ look like this:

![JSON End Result](https://i.imgur.com/0cxOotW.png)

_Or Like This_

![JSON End Result](https://i.imgur.com/oawUDG2.png)
