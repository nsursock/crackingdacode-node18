const axios = require('axios');
const cheerio = require('cheerio');

// Replace 'YOUR_ACCESS_TOKEN' with your actual Genius API access token
const GENIUS_API_TOKEN = 'ZVX5C0sSXjb5-ecV0DoRaJyMc6as9LCkOKALQA0PlfczDVK0fnyozlQMi6DdOHyX'

// Replace 'SEARCH_QUERY' with your actual search query
// const searchQuery = 'Mark Ronson, Just';
const searchQuery = 'Queen, Who Wants To Live Forever';
// const searchQuery = 'Robben Ford, Top of the Hill';

// Genius API endpoint for searching songs
const searchEndpoint = 'https://api.genius.com/search';

// Genius API endpoint for fetching lyrics by song ID
const lyricsEndpoint = 'https://api.genius.com/songs/';

// Set up headers with the Authorization token
const headers = {
  Authorization: `Bearer ${GENIUS_API_TOKEN}`,
};

// Set up the parameters for the search query
const searchParams = {
  q: searchQuery,
};

// Function to perform the API request to search for a song
const searchGeniusAPI = async () => {
  try {
    // Make a request to search for a song
    const searchResponse = await axios.get(searchEndpoint, { headers, params: searchParams });

    // Extract information from the search response
    const firstResult = searchResponse.data.response.hits[0].result;
    console.log(`First result title: ${firstResult.title}`);

    // Extract the URL of the lyrics page from the search result
    const lyricsUrl = firstResult.url;

    // Make a request to the lyrics page
    const lyricsPageResponse = await axios.get(lyricsUrl);

    // Use cheerio to load the HTML content
    const $ = cheerio.load(lyricsPageResponse.data);

    // Extract the lyrics based on the provided HTML structure
    let lyrics = $('div[data-lyrics-container="true"]').html(); // Use html() to get HTML, not text()

    // Replace <br /> with newlines
    lyrics = lyrics.replace(/<br\s*\/?>/g, "\n");

    // Remove all HTML tags
    lyrics = lyrics.replace(/<\/?[^>]+(>|$)/g, "");

    console.log('Lyrics:');
    console.log(lyrics);
  } catch (error) {
    // Handle errors
    console.error(`Error: ${error.response.status} - ${error.response.data.error}`);
  }
};

// Call the function
searchGeniusAPI();
