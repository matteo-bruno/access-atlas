---
title: CityChrone++:
accent: the city hour by hour
kicker: Layer · Opportunity
lede: How far public transport takes you from every cell, and how many people it puts within reach. Two scores, twenty-four hours.
date: 2026-08-03
layer: citychrone
color: #1A1F4E
---

![Tokyo, public transport velocity at 8:00, cell by cell](citychrone/hero.webp) {wide}

CityChrone gives every cell two scores for every hour of the day. **Velocity** says how quickly you get away from there by public transport, waits included. **Sociality** counts, with a weight, the people within reach. Neither is a time nor an exact number of people: they are scores, and the site calls them that.

Transit runs on the operators’ real timetables (GTFS). A line every fifteen minutes and a line twice a day look the same on a network map; here they do not.

- **4.9** the median Tokyo resident’s velocity at 8:00, against 4.1 in Paris
- **6.3** in New York at 19:00, the peak of its day
- **3.1** in New York at 0:00, when service is thinnest

## One city at four hours

![New York, public transport velocity](citychrone/hours.webp) {wide}

## A whole day in one curve

Every city has a day of its own. New York’s median resident goes from 3.1 at 0:00 to 6.3 at 19:00. The band around New York’s curve is the middle half of its residents: where it widens, the city splits between the well served and the rest.

![The median resident’s velocity, hour by hour](citychrone/day.webp)

## Three cities at 8 in the morning

![Velocity at 8:00, one scale and one 36 km window](citychrone/three.webp) {wide}

## Try it: isochrones

On a city’s map, **Isochrones** picks a cell and colours the rest of the city by travel time, up to 120 minutes. Change the hour and watch the reachable area shrink.

- [Open Tokyo](/atlas/tokyo?layer=citychrone)
- [General scores for accessibility and inequality measures in urban areas · R. Soc. Open Sci. (2019) ↗](https://doi.org/10.1098/rsos.190979)
