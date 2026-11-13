---
title: The 15-minute city:
accent: how close is what you need
kicker: Layer · Proximity
lede: Nine categories of everyday service, cell by cell, on foot and by bicycle, read against the threshold the idea is named after. From Paris to Houston, the same question gets opposite answers.
date: 2026-08-04
layer: fifteen
color: #b94e3b
---

![Bogotá, the average walk to nine everyday services, cell by cell](15-minute-city/hero.webp) {wide}

For every cell of about 200 metres the layer asks one question: how long does it take, from here, to reach the nearest pharmacy, school, supermarket, park? It answers nine times, once per category, and twice more, on foot and by bicycle. Times run on the real street network from OpenStreetMap, so a river with no bridge, a rail yard with no crossing or a highway with no pavement cost what they cost in practice.

- **97%** of Paris’s residents reach the services within 15 minutes on foot, on average
- **82%** in Bogotá, a city of 9.8 million
- **11%** in Houston, where the median resident is 31:18 away on foot

## Reading the map

White sits at 15 minutes. Blue is quicker, red slower, and the scale keeps darkening past half an hour instead of stopping there. A colour means the same number of minutes in every city and for every category, so moving from Bogotá to Houston, or from healthcare to groceries, shows a difference rather than a new scale.

![Six cities, six continents, one scale](15-minute-city/six.webp "Paris and Tokyo are almost entirely blue. In Houston blue survives in a few islands of a city measured in half hours. Where OpenStreetMap is less complete, times grow for that reason too, which is worth keeping in mind when reading Nairobi.") {wide}

## One city, two lives

An average hides almost everything. Take two cells in Rome. The first is the most populated within 2 km of the centre, 1,549 residents: its furthest service is 7:48 away. The second is the most populated between 12 and 16 km out, 1,438 residents 15 km from the centre: here the furthest category, culture, takes 40:36 on foot.

**Minutes on foot, category by category** Two cells in Rome, values from the layer file

| Category | Centre · 1,549 res. | 15 km · 1,438 res. |
| --- | ---: | ---: |
| Outdoor activities | 2:54 | 13:42 |
| Supplies | 2:48 | 5:30 |
| Transport | 3:48 | 6:54 |
| Physical activity | 5:06 | 8:24 |
| Eating | 3:42 | 8:30 |
| Services | 3:06 | 7:36 |
| Learning | 5:54 | 21:36 |
| Healthcare | 7:48 | 27:54 |
| Culture | 6:24 | 40:36 |

*Open them on the map: [the central cell](/atlas/rome?layer=fifteen&cell=891e8050c37ffff) and [the outer one](/atlas/rome?layer=fifteen&cell=891e8055dd3ffff).*

## Not every service is equally close

The same resident lives at very different distances depending on what they are looking for, and the gap between cities changes from one category to the next. In Paris the median resident walks 9:36 to healthcare, in Houston 42:12.

![The median resident’s walk, by category](15-minute-city/categories.webp "Hover a dot for the exact value.")

## From the compact city to the suburb

Counting people rather than cells is what makes cities of different shapes comparable. The curves below rise with the minutes: at 15 minutes Paris already has 97% of its residents, Tokyo 86%. Sydney sits halfway, at 58%. In cities built around the car the curve flattens: Phoenix reaches 23%, Houston 11%, and in Houston not even 30 minutes covers half the residents (46%).

![Residents within N minutes on foot](15-minute-city/curves.webp "These are the five published points, joined by a line: between two points the data says nothing.")

Widen the view to all 440 cities of over a million residents and the picture by continent is stark. The middle European city has 87% of its residents within 15 minutes; the middle North American one, 31%.

![Residents within 15 minutes on foot, cities of over a million](15-minute-city/world.webp "Cities on their urban-centre boundary (GHS Urban Centre). 48 cities of over a million are left out, as everywhere on the site: fewer than 10,000 residents covered, or a median walk over 60 minutes, a sign of data too thin to compare. A share near zero can also reflect incomplete OpenStreetMap mapping.")

- [Open Bogotá](/atlas/bogota?layer=fifteen)
- [Compare cities](/stats)
- [A universal framework for inclusive 15-minute cities · Nature Cities (2024) ↗](https://doi.org/10.1038/s44284-024-00119-4)
