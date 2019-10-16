# Reference

## format
```md
## variable name

required or optional

possible types

description (optional)
```

# General

## type

required

number

unused, for future use. Keep at 0 for now.

## english-name

optional

string

## japanese-name

optional

string

## aliases

optional

array of strings

other names the waifu is known as.

## image

optional

string

a link to a picture of the waifu

## notes

optional

array of strings

each element in the array is one bullet point or one point.

## sources

required

array of strings

each element in the array is one link to where this info came from. It can be a video or an article or book or etc.

## definitely-legal

optional

boolean

true if notes or other info states she's legal

## is-a-trap

optional

boolean

unused

# Birthday variables

if not legal based on birthday, then there will be a countdown displayed for when they become legal.

## month

optional

number

the number of the month of the birthday

## day-of-month

optional

number

## year

optional

number

# Appearance variables

## age-group-by-appearance

optional

string

can child or teenager or adult

## age-range-by-appearance

optional

array of 2 numbers

the first number is the start of the range and the 2nd is the end of the range. For example, ages 1 to 10 is [1, 10]

# Story variables

## age-in-show

optional

number

the age of the waifu during the story

## finally-legal-in-show

optional

number

the episode, movie, volume, etc. when they became of legal age