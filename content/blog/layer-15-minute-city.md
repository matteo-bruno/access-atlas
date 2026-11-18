---
title: The 15-minute city:
accent: vibrant neighbourhoods
kicker: Layer · Proximity
lede: What is the actual time you need to go from where you are in the city to the closest services of different kinds.
date: 2026-11-13
layer: fifteen
color: #b94e3b
---

Do we have a neighbourhood around us that invites us to walk to access its services? Can we meet new people in the street or in a square? Is our neighbourhood built with services within reach just by walking? The 15-minute city proposes a solution for creating **healthy and active neighbourhoods**, reducing the need of cars and creating inclusive cities. This does not mean we will be confined to our surroundings: accessibility has also other layers, to live in close proximity but also to be connected to the rest of the city. These are covered in other layers in the Atlas.

Proximity has always been there in the cities that were built before the advent of cars. The re-discovering of proximity, in more recent times, has also a long history: **Jane Jacobs**, in 1961, advocated for **vibrant neighbourhoods** with short blocks, mixed uses, mixed building conditions, and a sufficient density. Put these four conditions together and you will get a 15-minute neighbourhood! When Carlos Moreno proposed this concept in 2016, although the idea was not entirely new to urban planners, it was put in such simple and powerful terms that it became hard to ignore. The need for sustainable urban solutions and a more egalitarian society has boosted this new urban planning concept that promises inclusive urban places for everybody.

This project, 15-minute city, maps the cities around the world to understand exactly how feasible it is to live in this kind of places, and if actual cities are already built in this way. When we mapped this, we found that **many cities are already 15-minute cities**: especially those historical cities that are dense enough and built before the extensive use of cars. But keep in mind that a city average is not sufficient: the experience of living in a city is personal and cities that are very 15-minute-like **can be also very unequal**, and large chunks of population can live in areas deprived of proximity services. We base these analysis entirely on open data, so unfortunately some cities are better covered than others. However, for case studies the open data can be replaced by official data, and the categories can be refined to understand any aspect of urban proximity.

For every cell of about 200 metres, 15-minute city shows the answer to this question: how long does it take, from here, to reach the nearest pharmacy, school, supermarket, park? Nine categories are mapped, and the times show the average time to reach the nearest 20 amenities of each category, on foot and by bicycle. However, the quality, safety and pleasantness of the walk are not included, and the bike access is a best case scenario if roads were completely accessible by bike. Density is the key: when the city has sufficiently dense areas, the services can survive and a healthy neighbourhood can thrive.

![Bogotá, the average walk to nine everyday services](15-minute-city/hero.webp) {wide}

- **97%** of Paris’s residents reach the services within 15 minutes on foot, on average
- **82%** in Bogotá, with a median experience of 10 minutes
- **11%** in Houston, where the median resident is 31:18 away on foot

## Reading the map

15-minute areas are in blue, white is close, and red are less accessible. A colour means the same number of minutes in every city and for every category, so moving from Bogotá to Houston, or from healthcare to groceries, tells you the difference.

![Six cities from six continents](15-minute-city/six.webp "Paris and Tokyo are almost entirely blue. In Houston blue areas are only found in a few islands in the suburban landscape. Where OpenStreetMap is less complete, times can be less reliable, which is worth keeping in mind when reading Nairobi.") {wide}

## Unequal experiences

An average hides almost everything. Take two cells in Rome. The first is the most populated within 2 km of the centre, 1,549 residents: its furthest service is 7:48 away. The second is a peripheral place, 1,621 residents 15 km East from the centre: here the furthest category, culture, takes 40:36 on foot.

**Minutes on foot, category by category** Two cells in Rome, central and peripheral

| Category | Centre · 1,549 res. | 15 km · 1,438 res. |
| --- | ---: | ---: |
| Outdoor activities | 2:54 | 9:42 |
| Supplies | 2:48 | 12:18 |
| Moving | 3:48 | 8:36 |
| Physical exercise | 5:06 | 15:18 |
| Eating | 3:42 | 18:00 |
| Services | 3:06 | 20:36 |
| Learning | 5:54 | 23:06 |
| Healthcare | 7:48 | 33:42 |
| Cultural activities | 6:24 | 31:36 |

## Not every service is equally close

The same resident lives at very different distances depending on what they are looking for, and the gap between cities changes from one category to the next. In Paris the median resident walks 9:36 to healthcare, in Houston 42:12.

![The median resident’s walk, by category](15-minute-city/categories.webp)

## From the compact city to the suburb

We count people and offer population weighted measures to make cities comparable. The curves below rise with the minutes: at 15 minutes Paris already has 97% of its residents, Tokyo 86%. Sydney sits halfway, at 58%. In cities built around the car the curve flattens: Phoenix reaches 23%, Houston 11%, and in Houston not even 30 minutes covers half the residents (46%).

![Residents within N minutes on foot](15-minute-city/curves.webp "See the complete curves in Stats.")

Widen the view to all 440 cities of over a million residents and the differences emerge by continent. An average European city has 87% of its residents within 15 minutes; the median North American one, 31%. However, when comparing the data, remember that in some areas, especially in developing countries, open data can be incomplete.

![Residents within 15 minutes on foot, cities of over a million](15-minute-city/world.webp "Cities on their urban-centre boundary (GHS Urban Centre). 48 cities of over a million are left out, as everywhere on the site: fewer than 10,000 residents covered, or a median walk over 60 minutes, a sign of data too thin to compare. A share near zero can also reflect incomplete OpenStreetMap mapping.")

- [Open Bogotá](/atlas/bogota?layer=fifteen)
- [Compare cities](/stats)
- [A universal framework for inclusive 15-minute cities · Nature Cities (2024) ↗](https://doi.org/10.1038/s44284-024-00119-4)
