---
title: Car Dependency Index:
accent: can we live without a car?
kicker: Layer · Car against public transport
lede: How many opportunities can you reach by car and by public transport? Is a car always better, and are you giving up too much if you choose not to use a car?
date: 2026-11-18
layer: cardep
color: #a04640
---

We want to reach opportunities that are close by walking or biking, but also distant opportunities, such as jobs, monuments, unique restaurants or relatives living in another neighbourhood. To do so, we only have two choices: **public transport or private cars**. Too often, though, cities were built with an extensive use of cars in mind: if citzens live in an area with few services nearby and a scarce public transport, they will be forced to use a car to explore and live the city.

This is exactly what we map in Car Dependency Index. We measure the time needed to access each part of the city by car and by public transport, computing the isochrones of the two means of transport. Then, similarly to what we do for Citychrone, we integrate the total number of opportunities (all POIs of relevant categories) reachable, to obtain two **opportunity scores**. For the car scores, we also add parking time and a traffic correction based on the TomTom Traffic Index. Finally, we divide the two scores to see how many more times a car provides access than public transport, obtaining a CDI that can be a plain ratio or a normalised -1,1 measure.

The results we find confirm a **core-periphery divide**. In the peripheries and intermediate areas, especially those built in modern times and the suburban ones, we observe a strong car dependency. Historical, dense centers, or central business district with strong metro network connections, manage to get to a break even point in which the two means of transportation are equal. 

In very few cities we find considerable areas in which public transport is a better option than a car for people's mobility, and **the recipe consists in fast public transport and slow traffic**. For how we defined our metrics, when traffic accelerates the car dependency increases! That's what happens for cities like Vienna where public transport is good but cars can be fast too. Having a Car Dependency Index higher than 1 does not mean that we need a car: in the model we don't put economic incentives, a car's maintenance and other factors; an index close to 1.5 is already very good. Moreover, high opportunities can be sufficient without being comparable to car ones. 

Sometimes, having a car is a choice, or a luxury. But if a person lives in a car-dependent neighbourhood, having **a car is** a necessity and **an unavoidable cost**, that can increase socioeconomic inequalities.

![New York, opportunities by car divided by those by public transport, cell by cell](car-dependency/hero.webp) {wide}

## Public and private transport scores, compared

The layer starts from two opportunity scores for every cell: how many points of interest, of many kinds, can be reached **by car** within a time budget, and how many **by public transport** in the same time, added up with weights. Side by side, New York shows why the comparison matters: the car’s map is dark almost everywhere, while transit’s is paler throughout and fades further toward the city’s edges. The median resident reaches 6,615 by car and 3,972 by transit.

![New York, opportunities by car and by transit](car-dependency/car-transit.webp "Weighted counts of reachable places: scores, not metres or jobs.") {wide}

## A ratio or a normalised score

The index divides one score by the other: **car ÷ transit**. It is 1 where the two reach the same, 2 where a car reaches twice as much, ½ where transit does, and it grows without limit where transit reaches almost nothing.

Its normalised form, (car − transit) ÷ (car + transit), runs from −1 to +1 and says the same thing in other units. The site still offers it, a switch away, and the conversion is exact:

**The ratio and the normalised index**

| Car ÷ transit | Normalised | Reads as |
| --- | ---: | --- |
| ½ | −0.33 | transit reaches twice as much |
| 1 | 0 | even |
| 2 | +0.33 | a car reaches twice as much |
| 4 | +0.60 | four times as much |
| 10 | +0.82 | ten times as much |
| ∞ | +1 | transit reaches nothing |

*Normalised = (ratio − 1) ÷ (ratio + 1).*

## An example in numbers

In Midtown Manhattan, the most populated cell within 1.5 km of Times Square, car and subway reach similar amounts: the ratio is 1.11. A score close to 1 means that in practice many will prefer to use public transport. In the most populated cell between 22 and 30 km out, 26 km away, transit reaches 1,490 against the car’s 3,764: the car reaches 2.53 times as much.

**Two New York cells**

| Cell | By car | By transit | Car ÷ transit | Normalised |
| --- | ---: | ---: | ---: | ---: |
| Midtown · 6,087 res. | 7,433 | 6,670 | 1.11 | +0.05 |
| 26 km · 3,024 res. | 3,764 | 1,490 | 2.53 | +0.43 |

![Six cities on one scale](car-dependency/six.webp) {wide}

## The picture across 22 cities

For the median resident the car reaches more than transit in 21 of 22 cities: almost everywhere the car is not competing with public transport, it is winning. The one exception is Nantes. The middle European city sits at 1.24, the middle North American one at 1.65; Tokyo’s median resident is at 2.64; keep in mind that Tokyo's urban area is the biggest and its data are the most complex to map as there are many different providers. The spread matters as much as the median: in Rome the tenth of residents most dependent on a car live where it reaches more than 4.10 times as much.

![Car ÷ transit, the residents of each city](car-dependency/cities.webp "Cities on their urban-centre boundary (GHS Urban Centre).")


- [Open New York](/atlas/new-york?layer=cardep)
- [Compare cities](/platforms/cardep/compare)
- [Car Dependency in Urban Accessibility · arXiv:2604.01019 ↗](https://arxiv.org/abs/2604.01019)
