# hianime_api
Node.js hianime scraper (cheerio, axios, express, cors)

# Instructions on how to use this api<br><br>

The first step is to deploy this Node.js server (files scraper.js, package.json, etc.) on a platform such as Render, Railway, AWS, Microsoft Azure, Heroku, or similar. Once hosted, you can prefix this API routes with your domain URL, for example: https://your-domain.com/episodes?dataId=181881.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/codercoder61/hianime_api)

## To get animes by category (page is optional)<br>
/?category={category}[&page={page}]<br>
category can be one of the following ("subbed-anime" | "dubbed-anime" | "most-popular" | "movie" | "tv" | "special" | "ona" | "ova" | "top-airing")<br><br>
## To get anime episodes by anime dataId<br>
/episodes?dataId={dataId}<br><br>
## To get anime info by anime animeId<br>
/animeInfo?animeId={animeId}<br><br>
## To search anime (page is optional)<br>
/search?keyword={keyword}[&page={page}]<br><br>
## To get filtered anime (page, type, status and genre are optional)<br>
/filter?[type={type}&status={status}&genres={genres}&page={page}]<br>
### GENRE CAN BE ONE VALUE OF THE FOLLOWING <br>
All value=""<br>
Action value="1"<br>
Adventure value="2"<br>
Cars value="3"<br>
Comedy value="4"<br>
Dementia value="5"<br>
Demons value="6"<br>
Drama value="8"<br>
Ecchi value="9"<br>
Fantasy value="10"<br>
Game value="11"<br>
Harem value="35"<br>
Historical value="13"<br>
Horror value="14"<br>
Kids value="15"<br>
Magic value="16"<br>
Martial Arts value="17"<br>
Mecha value="18"<br>
Music value="19"<br>
Mystery value="7"<br>
Parody value="20"<br>
Samurai value="21"<br>
Romance value="22"<br>
School value="23"<br>
Sci-Fi value="24"<br>
Shoujo value="25"<br>
Shoujo Ai value="26"<br>
Shounen value="27"<br>
Shounen Ai value="28"<br>
Space value="29"<br>
Sports value="30"<br>
Super Power value="31"<br>
Vampire value="32"<br>
Police value="39"<br>
Psychological value="40"<br>
Thriller value="41"<br>
Seinen value="42"<br>
Josei value="43"<br>
Isekai value="44"<br>
Slice of Life value="36"<br>
Supernatural value="37"<br>
Military value="38"<br>
### TYPE CAN BE ONE VALUE OF THE FOLLOWING<br>
All value=""<br>
Movie value="1"<br>
TV value="2"<br>
OVA value="3"<br>
ONA value="4"<br>
Special value="5"<br>
Music value="6"<br>
### STATUS CAN BE ONE VALUE OF THE FOLLOWING<br>
All value=""<br>
Finished airing value="1"<br>
Currently airing value="2"<br>
Not yet aired value="3"<br><br>
## EPISODE SOURCE STREAMING URL <br>
For episode source (streaming url to embed in iframe) use https://megaplay.buzz/api (For this, episode id is needed, you can get it with this route "/episodes?dataId=****")

