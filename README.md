# hianime_api
Node.js hianime scraper (cheerio,axios,express,cors)

# Instructions on how to use this api

To get animes by categorie (page is optional)
/?category={category}[&page={page}]
category can be one of the following ("subbed-anime" | "dubbed-anime" | "most-popular" | "movie" | "tv" | "special" | "ona" | "ova" | "top-airing")

To get anime episodes by anime dataId
/episodes?dataId={dataId}

To get anime info by anime dataId
/animeInfo?dataId={dataId}

To get episode servers by episodeId
/servers?episodeId={episodeId}

To search anime (page is optional)
/search?keyword={keyword}[&page={page}]

To get filtered anime (page is optional)
/filter?[type={type}&status={status}&genres={genres}&page={page}]
# GENRE CAN BE ONE VALUE OF THE FOLLOWING 
All value=""
Action value="1"
Adventure value="2"
Cars value="3"
Comedy value="4"
Dementia value="5"
Demons value="6"
Drama value="8"
Ecchi value="9"
Fantasy value="10"
Game value="11"
Harem value="35"
Historical value="13"
Horror value="14"
Kids value="15"
Magic value="16"
Martial Arts value="17"
Mecha value="18"
Music value="19"
Mystery value="7"
Parody value="20"
Samurai value="21"
Romance value="22"
School value="23"
Sci-Fi value="24"
Shoujo value="25"
Shoujo Ai value="26"
Shounen value="27"
Shounen Ai value="28"
Space value="29"
Sports value="30"
Super Power value="31"
Vampire value="32"
Police value="39"
Psychological value="40"
Thriller value="41"
Seinen value="42"
Josei value="43"
Isekai value="44"
Slice of Life value="36"
Supernatural value="37"
Military value="38"
# TYPE CAN BE ONE VALUE OF THE FOLLOWING
 All value=""
Movie value="1"
TV value="2"
OVA value="3"
ONA value="4"
Special value="5"
Music value="6"
# Status CAN BE ONE VALUE OF THE FOLLOWING
All value=""
Finished airing value="1"
Currently airing value="2"
Not yet aired value="3"

# EPISODE SOURCE STREAMING URL 
For episode source (streaming url to embed in iframe) use https://megaplay.buzz/api

