---
title: CityChrone++:
accent: the opportunities of moving by public transport
kicker: Layer · Opportunity
lede: How far public transport takes you, and how many people you can reach, at different times of the day.
date: 2026-11-15
layer: citychrone
color: #1A1F4E
---

CityChrone++ has the goal to map the velocity and utility of public transport across cities around the world. Opportunities are not only reached by proximity, but also by being able to reach distant places in the city: a unique service, a job, relatives or friends, monuments, or simply **exploring one's own city**. But citizens should be able to do this through sustainable transportation, so that public transport should ideally be available and efficient everywhere.

From each place, through the GTFS data of each individual city, we simulate possible trajectories by getting on the bus, metro and trams. The trajectories from one cell to the rest of the city generate the **isochrones**, maps of reaching times from one cell to any other in the city. Each cell has different isochrones: some will have the whole city within one hour of reach, and some will struggle to reach the city centre in less than two hours. This means that the average velocity that we have when we move is different from any place in the city: that's exactly what we map in the **velocity score**. We compute this for any hour, so that we can also see how the city velocity evolves during the day.

The isochrones also tell us who we can reach and how many people we can meet: this is what the **sociality score** maps. Summing the number of people living in reachable hexagons, we get a number that tells us how many exchanges we can have with different people. By doing the same but with all types of services, we can also compute the opportunity scores, that will be used in the Car Dependency Index layer and Close&Connected.

Average measures of each city are obtained by weighing by population; keep in mind, however, that if the centre of Tokyo has one of the fastest public transport in the world, its median will still be low if the considered area is very wide. The efficiency of public transport is very much dependent on where I live and a single metric will hardly describe the typical experience, as there is **no typical experience**.

![Tokyo, public transport velocity at 8:00, cell by cell](citychrone/hero.webp) {wide}

CityChrone gives every cell two scores for every hour of the day. **Velocity** says how quickly you get away from there by public transport, waits included. **Sociality** counts, with a weight, the people within reach.

- **4.9** the median Tokyo resident’s velocity at 8:00
- **6.3** in New York at 19:00, the peak of its day
- **3.1** in New York at 0:00, when service is thinnest but still the most active

## One city at four hours

![New York, public transport velocity](citychrone/hours.webp) {wide}

## A whole day in one curve

![The median resident’s velocity, hour by hour](citychrone/day.webp)

## Three cities at 8 in the morning

![Velocity at 8:00, one scale and one 36 km window](citychrone/three.webp) {wide}

## Try it: isochrones

On a city’s map, **Isochrones** picks a cell and colours the rest of the city by travel time, up to 120 minutes. Change the hour and watch the reachable area shrink.

- [Open Tokyo](/atlas/tokyo?layer=citychrone)
- [General scores for accessibility and inequality measures in urban areas · R. Soc. Open Sci. (2019) ↗](https://doi.org/10.1098/rsos.190979)
