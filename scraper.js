const express = require('express');
const cheerio = require('cheerio');
const cors = require('cors');
const { client, getWithRetry, ensurePrewarm } = require('./httpClient');

async function scrapeAnime(url,category,animeList = [], page = 1){
  try {
    await ensurePrewarm();
    const { data } = await getWithRetry(`${url}/${category}?page=${page}`, {
        headers: {
            Referer: `${url}/${category}?page=${page}`,
            Origin: url
        }
    });
    const $ = cheerio.load(data);
    const animeElements = $('.tab-content div.film_list-wrap > div.flw-item').toArray();

    for (const el of animeElements) {
    const poster = $(el).find('div > div.film-poster > img').attr('data-src');
    const href = $(el).find('a').attr('href');
    const animeId = href ? href.slice(1) : '';
    const { data: data2 } = await getWithRetry(`${url}/${animeId}`, {
            headers: {
                Referer: `${url}/${category}?page=${page}`,
                Origin: url
            },
    });

    const $$ = cheerio.load(data2); // Use a new $ variable to avoid clashing
    const aired = $$('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div:nth-child(3) > span.name').text().trim();
    const premiered = $$('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div:nth-child(4) > span.name').text().trim();
    const status = $$('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div:nth-child(6) > span.name').text().trim();
    const genres = [];

    $$('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div.item.item-list > a').each((i, el) => {
    const genre = $$(el).text().trim();
    if (genre) genres.push(genre);
    });
    const dataId = $(el).find("a[data-id]").attr("data-id")

    const studios = $$('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div:nth-child(9) > a').text().trim();
    const title = $(el).find('div.film-detail > h3 > a').text().trim();
    const type = $(el).find("div.fd-infor > span.fdi-item")
            .first()
            .text()
            .toUpperCase();
    const duration = $(el).find('div.film-detail > div > span.fdi-item.fdi-duration').text().trim();
    const description = $$('#ani_detail > div > div > div.anis-content > div.anisc-detail > div.film-description.m-hide > div').text().trim();
    animeList.push({ genres,dataId,aired,premiered,status,studios,description, poster, animeId, title, type, duration });
    }
    const nextPageExists = $('div.pre-pagination.mt-5.mb-5 > nav > ul > li.page-item.active').next().length > 0;

    if (nextPageExists) {
      return {"hasNextPage": true,animeList:animeList}; // Return the accumulated list
    } else {
      return {"hasNextPage": false,animeList:animeList}; // Return the accumulated list
    }
    
    }catch (error) {
    // Throw error to be handled by the caller
    throw new Error(`Failed to scrape the website: ${error.message}`);
  }
} 
const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

app.use(cors());

app.get('/', async (req, res) => {
  const queryKeys = Object.keys(req.query);
  const allowedQuery = ['category', 'page'];

  // Case 1: No query params - welcome message
  if (queryKeys.length === 0) {
    return res
      .status(200)
      .send('<h1>Welcome to hianime API</h1>');
  }

  // Case 2: category is missing, but other queries exist
  if (!req.query.category) {
    return res
      .status(400)
      .send('<h1>400 Bad Request</h1>');
  }

  // Case 3: Invalid query parameters
  const invalidKeys = queryKeys.filter(key => !allowedQuery.includes(key));
  if (invalidKeys.length > 0) {
    return res
      .status(404)
      .send(`<h1>404 Not Found</h1><p>No matching route for query parameter(s): ${invalidKeys.join(', ')}</p>`);
  }

  const category = req.query.category;
  const page = parseInt(req.query.page) || 1;

  if (!category) {
    return res.status(400).json({ error: 'Please provide a "category" query parameter.' });
  }

  const url = `https://hianime.to`;

  try {
    const data = await scrapeAnime(url, category, [], page); // Pass page correctly
    res.json({ category, page, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.get('/episodes', async (req, res) => {
  const dataId = req.query.dataId;

  if (!dataId) {
    return res.status(400).json({ error: 'Please provide a "dataId" query parameter.' });
  }

  const url = `https://hianime.to`;

  
    const { data } = await getWithRetry(
    `${url}/ajax/v2/episode/list/${dataId}`,
    { headers: { 'X-Requested-With': 'XMLHttpRequest', Referer: url, Origin: url, Accept: 'application/json, text/javascript, */*; q=0.01' } }
    );
    const $ = cheerio.load(data.html);
    const episodes = $("div.ss-list > a.ep-item")
    .map((_, element) => {
      const episode = {
        id: $(element).attr("data-id"),
        number: $(element).attr("data-number"),
        title: $(element).attr("title"),
        href: $(element).attr("href"),
      };
      return episode;
    })
    .get();

    res.json({ episodes });
 
});


app.get('/animeInfo', async (req, res) => {
  const animeId = req.query.animeId;

  if (!animeId) {
    return res.status(400).json({ error: 'Please provide a "animeId" query parameter.' });
  }

  const url = `https://hianime.to`;

  try {
    // Fetch the anime page
    await ensurePrewarm();
    const { data } = await getWithRetry(`${url}/${animeId}`, { headers: { Referer: `${url}/${animeId}`, Origin: url } });
    const $ = cheerio.load(data);

    // Scrape the 'Aired' date
    const aired = $('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div.item')
      .filter((i, el) => $(el).find('span.item-head').text().trim() === 'Aired:')
      .find('span.name')
      .text()
      .trim() || 'N/A'; // Default value if not found
      const poster = $("#ani_detail > div > div > div.anis-content > div.anisc-poster > div > img").attr('src');

    // Scrape the 'Premiered' date
    const premiered = $('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div.item')
      .filter((i, el) => $(el).find('span.item-head').text().trim() === 'Premiered:')
      .find('span.name')
      .text()
      .trim() || 'N/A';

    // Scrape the 'Status'
    const status = $('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div.item')
      .filter((i, el) => $(el).find('span.item-head').text().trim() === 'Status:')
      .find('span.name')
      .text()
      .trim() || 'N/A';

    // Scrape genres
    const genres = [];
    $('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div.item')
      .filter((i, el) => $(el).find('span.item-head').text().trim() === 'Genres:')
      .find('a')
      .each((i, el) => {
        const genre = $(el).text().trim();
        if (genre) genres.push(genre);
      });

    // Scrape studios
    const studios = $('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div.item')
      .filter((i, el) => $(el).find('span.item-head').text().trim() === 'Studios:')
      .find('a.name')
      .text()
      .trim() || 'N/A';

    // Scrape title
    const title = $('#ani_detail > div > div > div.anis-content > div.anisc-detail > h2').text().trim() || 'Unknown Title';

    // Scrape type
    const type = $('#ani_detail > div > div > div.anis-content > div.anisc-detail > div.film-stats > div > span.item').first().text().trim() || 'Unknown Type';  // Default to 'Unknown Type' if not found

    // Scrape duration
    const duration = $('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div.item')
      .filter((i, el) => $(el).find('span.item-head').text().trim() === 'Duration:')
      .find('span.name')
      .text()
      .trim() || 'N/A';

    // Scrape producers
    const producers = [];
    $('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div.item')
      .filter((i, el) => $(el).find('span.item-head').text().trim() === 'Producers:')
      .find('a')
      .each((i, el) => {
        const producer = $(el).text().trim();
        if (producer) producers.push(producer);
      });

    // Scrape description
    const description = $('#ani_detail > div > div > div.anis-content > div.anisc-detail > div.film-description.m-hide > div')
      .text()
      .trim() || 'No description available';

    // Construct the anime info object
    const animeInfo = {
      producers,
      genres,
      aired,
      premiered,
      status,
      studios,
      description,
      animeId,
      title,
      type,
      duration,
      poster
    };

    // Send the response
    res.json({ animeInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});






app.get('/search', async (req, res) => {
  
  const keyword = req.query.keyword;
  const page = req.query.page || 1;  // Default to page 1 if not provided

  if (!keyword) {
    return res.status(400).json({ error: 'Please provide a "keyword" query parameter.' });
  }

  
  let animeList = [];

  try {
    // Fetch the search results for the specified keyword and page
    let url;
let data;
let animeElements = [];
let $;

if (keyword.length === 1) {
url = `https://hianime.to/az-list/${keyword.toLowerCase()}?page=${page}`;
  await ensurePrewarm();
  const response = await getWithRetry(url, {
    headers: {
      Referer: url,
      Origin: 'https://hianime.to',
    },
  });

  data = response.data; // ✅ Extract HTML string
  $ = cheerio.load(data);
  animeElements = $('#main-wrapper > div > div.page-az-wrap > section > div.tab-content > div > div.film_list-wrap > div').toArray();

} else {
  url = `https://hianime.to/search?keyword=${keyword}&page=${page}`;
  await ensurePrewarm();
  const response = await getWithRetry(url, {
    headers: {
      Referer: url,
      Origin: 'https://hianime.to',
    },
  });

  data = response.data; // ✅ Extract HTML string
  $ = cheerio.load(data);
  animeElements = $('.tab-content div.film_list-wrap > div.flw-item').toArray();
}


      
    

    for (const el of animeElements) {
      const poster = $(el).find('div > div.film-poster > img').attr('data-src') || '';
      const href = $(el).find('a').attr('href');
      const animeId = href ? href.slice(1).replace('watch/', ''): ''; // Extract animeId from href

      // Extract fields directly from listing without per-item detail fetch
      const title = $(el).find('div.film-detail > h3 > a').text().trim() || 'N/A';
      const dataId = $(el).find("a[data-id]").attr("data-id") || 'N/A';

      // Add to the anime list
      animeList.push({ dataId, poster, animeId, title });
    }


    res.json({
      animeList
    });

  } catch (error) {
    console.error('Error during the scraping process:', error);
    return res.status(500).json({ error: 'Failed to scrape the website or fetch the data.' });
  }
});


app.get('/filter', async (req, res) => {
  const { typee, statuse, genree, page = 1 } = req.query;

  console.log({ typee, statuse, genree, page });

  // Base URL already includes ?sort=default
  const url = 'https://hianime.to/filter?sort=default';
  let queryParams = [`page=${page}`];

  if (typee && typee !== '') queryParams.push(`type=${typee}`);
  if (statuse && statuse !== '') queryParams.push(`status=${statuse}`);
  if (genree && genree !== '') queryParams.push(`genres=${genree}`);

  const finalUrl = `${url}&${queryParams.join('&')}`;
  console.log(finalUrl)
  let animeList = [];

  try {
    await ensurePrewarm();
    const { data } = await getWithRetry(finalUrl, {
      headers: { Referer: finalUrl, Origin: 'https://hianime.to' },
    });

    const $ = cheerio.load(data);
    const animeElements = $('#main-wrapper > div > div.page-search-wrap > section > div.block_area-content.block_area-list.film_list.film_list-grid > div.film_list-wrap > div').toArray();

    // Build a lightweight list without per-item detail fetches to avoid rate limits
    animeList = animeElements.map((el) => {
      const $el = $(el);
      const poster = $el.find('div > div.film-poster > img').attr('data-src') || '';
      const href = $el.find('a').attr('href');
      const animeId = href ? href.slice(1).replace('watch/', '') : '';
      const title = $el.find('div.film-detail > h3 > a').text().trim() || 'N/A';
      const dataId = $el.find('a[data-id]').attr('data-id') || 'N/A';
      return { dataId, poster, animeId, title };
    });

    const nextPageExists = $('div.pre-pagination.mt-5.mb-5 > nav > ul > li.page-item.active').next().length > 0;

    res.json({ hasNextPage: nextPageExists, animeList });

  } catch (error) {
    console.error('Error during the scraping process:', error.message);
    res.status(500).json({ error: 'Failed to scrape the website or fetch data.' });
  }
});





