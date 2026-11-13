---
title: Car Dependency Index:
accent: how many times more a car reaches
kicker: Layer · Car against public transport
lede: From the same doorstep, in the same time, how much can you reach by car and how much by public transport? The index reads as one ratio: 1 where the two are even, 2 where the car reaches twice as much.
date: 2026-08-02
layer: cardep
color: #a04640
---

![New York, opportunities by car divided by those by public transport, cell by cell](car-dependency/hero.webp) {wide}

## Two scores, compared

The layer starts from two opportunity scores for every cell: how many points of interest, of many kinds, can be reached **by car** within a time budget, and how many **by public transport** in the same time, added up with weights. Both are on the map as views of their own. Side by side, New York shows why the comparison matters: the car’s map is dark almost everywhere, while transit’s is paler throughout and fades further toward the city’s edges. The median resident reaches 6,615 by car and 3,972 by transit.

![New York, opportunities by car and by transit](car-dependency/car-transit.webp "Weighted counts of reachable places: scores, not metres or jobs.") {wide}

## From −1 to +1, or from 0 to infinity

The index divides one by the other: **car ÷ transit**. It is 1 where the two reach the same, 2 where a car reaches twice as much, ½ where transit does, and it grows without limit where transit reaches almost nothing. Read on a logarithmic scale, twice as much either way is the same distance from 1.

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

In Midtown Manhattan, the most populated cell within 1.5 km of Times Square, car and subway reach similar amounts: the ratio is 1.11. In the most populated cell between 22 and 30 km out, 26 km away, transit reaches 1,490 against the car’s 3,764: the car reaches 2.53 times as much.

**Two New York cells**

| Cell | By car | By transit | Car ÷ transit | Normalised |
| --- | ---: | ---: | ---: | ---: |
| Midtown · 6,087 res. | 7,433 | 6,670 | 1.11 | +0.05 |
| 26 km · 3,024 res. | 3,764 | 1,490 | 2.53 | +0.43 |

*The ratio from the published, rounded scores; the normalised column is the published index.*

![Six cities on one scale](car-dependency/six.webp) {wide}

## The picture across 22 cities

For the median resident the car reaches more than transit in 21 of 22 cities: almost everywhere the car is not competing with public transport, it is winning. The one exception is Nantes. The middle European city sits at 1.24, the middle North American one at 1.65; Tokyo’s median resident is at 2.64. The spread matters as much as the median: in Rome the tenth of residents most dependent on a car live where it reaches more than 4.10 times as much.

![Car ÷ transit, the residents of each city](car-dependency/cities.webp "Cities on their urban-centre boundary (GHS Urban Centre).")

> In 21 cities out of 22, the typical resident can reach more by car than by public transport.

- [Open New York](/atlas/new-york?layer=cardep)
- [Compare cities](/platforms/cardep/compare)
- [Car Dependency in Urban Accessibility · arXiv:2604.01019 ↗](https://arxiv.org/abs/2604.01019)
