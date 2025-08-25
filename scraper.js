const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

async function scrapeAnime(url,category,animeList = [], page = 1){
  try {
    const { data } = await axios.get(`${url}/${category}?page=${page}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    });
    const $ = cheerio.load(data);
    const animeElements = $('.tab-content div.film_list-wrap > div.flw-item').toArray();

    for (const el of animeElements) {
    const poster = $(el).find('div > div.film-poster > img').attr('data-src');
    const href = $(el).find('a').attr('href');
    const animeId = href ? href.slice(1) : '';
    const { data: data2 } = await axios.get(`${url}/${animeId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
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
const PORT = 3000;
app.use(cors());

app.get('/', async (req, res) => {
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

  
    const { data } = await axios.get(
    `${url}/ajax/v2/episode/list/${dataId}`
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
    const { data } = await axios.get(`${url}/${animeId}`);
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
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  });

  data = response.data; // ✅ Extract HTML string
  $ = cheerio.load(data);
  animeElements = $('#main-wrapper > div > div.page-az-wrap > section > div.tab-content > div > div.film_list-wrap > div').toArray();

} else {
  url = `https://hianime.to/search?keyword=${keyword}&page=${page}`;
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
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

      // Fetch the detailed anime data from its individual page
      const { data: data2 } = await axios.get(`https://hianime.to/${animeId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', // Ensure headers for subsequent requests
        },
      });

      const $$ = cheerio.load(data2); // Load the detailed page content

      // Extract additional fields such as the title
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
    const { data } = await axios.get(finalUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });

    const $ = cheerio.load(data);
    const animeElements = $('#main-wrapper > div > div.page-search-wrap > section > div.block_area-content.block_area-list.film_list.film_list-grid > div.film_list-wrap > div').toArray();

    const fetchDetailsPromises = animeElements.map(async (el) => {
      const poster = $(el).find('div > div.film-poster > img').attr('data-src') || '';
      const href = $(el).find('a').attr('href');
      const animeId = href ? href.slice(1).replace('watch/', '') : '';

      try {
        const { data: data2 } = await axios.get(`https://hianime.to/${animeId}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        });

        const $$ = cheerio.load(data2);
        const title = $(el).find('div.film-detail > h3 > a').text().trim() || 'N/A';
        const dataId = $(el).find("a[data-id]").attr("data-id") || 'N/A';
        const aired = $$('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div:nth-child(3) > span.name').text().trim();
        const premiered = $$('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div:nth-child(4) > span.name').text().trim();
        const status = $$('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div:nth-child(6) > span.name').text().trim();
        const genres = [];

        $$('#ani_detail > div > div > div.anis-content > div.anisc-info-wrap > div.anisc-info > div.item.item-list > a').each((i, el) => {
          const genre = $$(el).text().trim();
          if (genre) genres.push(genre);
        });

        const description = $$('#ani_detail > div > div > div.anis-content > div.anisc-detail > div.film-description.m-hide > div').text().trim();

        return { dataId, poster, animeId, title, aired, premiered, status, genres, description };

      } catch (err) {
        console.warn(`Failed to fetch details for ${animeId}`);
        return null;
      }
    });

    const animeDetails = await Promise.all(fetchDetailsPromises);
    animeList = animeDetails.filter(item => item !== null);

    const nextPageExists = $('div.pre-pagination.mt-5.mb-5 > nav > ul > li.page-item.active').next().length > 0;

    res.json({ hasNextPage: nextPageExists, animeList });

  } catch (error) {
    console.error('Error during the scraping process:', error.message);
    res.status(500).json({ error: 'Failed to scrape the website or fetch data.' });
  }
});







app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
