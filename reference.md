# Reference

## General

| Variable        | Type                   | Flags    | Description                      |
| ----------------|------------------------| ---------------------|----------------------------------|
| `type`       | number                              | required | unused, for future use. Keep at 0 for now. |
| `english-name`        | string             |   optional           | |
| `japanese-name`         | string                |   optional            |  |
| `aliases`        | array of strings                   |   optional             | other names the waifu is known as. |
| `image`     | string                  |   optional                | a link to a picture of the waifu |
| `notes`     | array of strings                  | optional           | each element in the array is one bullet point or one point |
| `sources`     | array of strings                    | required           | each element in the array is one link to where this info came from. It can be a video or an article or book or etc. |
| `definitely-legal`   | boolean               |  optional                    | true if notes or other info states she's legal |
| `is-a-trap`   | boolean                    | optional         | unused |

## Birthday variables

if not legal based on birthday, then there will be a countdown displayed for when they become legal.

| Variable        | Type                   | Required/Optional    | Description                      |
| ----------------|------------------------| ---------------------|----------------------------------|
| `month`  | number                   | optional                 | |
| `day-of-month` | number     | optional             | |
| `year` | number | optional  |  |

## Appearence variables 

| Variable        | Type                   | Required/Optional    | Description                      |
| ----------------|------------------------| ---------------------|----------------------------------|
| `age-group-by-appearance`  | string | optional                    | can be child or teenager or adult  |
| `age-range-by-appearance` | array of 2 numbers      | optional                 | the first number is the start of the range and the 2nd is the end of the range. For example, ages 1 to 10 is [1, 10] |

## Story variables

| Variable        | Type                   | Required/Optional    | Description                      |
| ----------------|------------------------| ---------------------|----------------------------------|
| `age-in-show`  | number                 | optional                     | the age of the waifu during the story |
| `finally-legal-in-show`  | number                    | optional                     | the episode, movie, volume, etc. when they became of legal age |
