// Import the dotenv package
require('dotenv').config();
const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');

const apiKey = process.env.OPENAI_API_KEY
const ghostApiKey = '6bac7159a9afc6d6c915eeae66'
const ghostApiUrl = `https://soundsirius.digitalpress.blog/ghost/api/content/posts/?key=${ghostApiKey}&limit=all`

const WORDPRESS_CATEGORIES = `Art
Basic Income
Business
Creativity
Culture
Economy
Education
Entertainment
Environment
Equality
Family
Fitness
Future
Health
History
Humor
Justice
Life
Love
Philosophy
Politics
Productivity
Psychology
Relationships
Science
Sexuality
Society
Wellness
World`.split('\n');

function convertMillis(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Convert to mm:ss format
  const formattedTime = `${minutes.toString().padStart(2, '0')}m${seconds.toString().padStart(2, '0')}s`;

  return formattedTime;
}

function browseTextContent(htmlContent) {
  // Load the HTML content with cheerio
  const $ = cheerio.load(htmlContent);

  // Initialize an array to store the content
  const contentArray = [];

  // Initialize variables for the current section
  let currentSection = 'Introduction'; // Default title for the first section
  let currentContent = [];

  // Flag to detect the first <h2> tag
  // let isFirstH2 = true;

  // Iterate through the elements
  $('p, h2').each(function () {
    const tag = $(this).get(0).tagName;
    const text = $(this).text();

    if (tag === 'h2') {
      // Start a new section
      // if (isFirstH2) {
      //   isFirstH2 = false;
      // }
      contentArray.push({ title: currentSection, content: currentContent });

      currentSection = text;
      currentContent = [];
    } else if (tag === 'p') {
      // Add content to the current section
      currentContent.push(text);
    }
  });

  // Add the last section to the array
  if (currentSection) {
    contentArray.push({ title: currentSection, content: currentContent });
  }

  // Output the content array
  // console.log(contentArray);
  return contentArray
}

async function sendToChatGPT(convo) {
  const start = performance.now();

  // Prepare the request payload
  const payload = {
    messages: convo,
    //  max_tokens: 1000,  // Adjust the token limit as needed
    temperature: 0.2,
    model: "gpt-3.5-turbo",
  };

  // Define the API endpoint
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    // console.log(response.data)

    const end = performance.now();
    console.log(`Total time taken: ${convertMillis(end - start)}`);
    return response.data.choices[0].message
  } catch (e) {
    console.error(e)
  }
}

async function fetchGhostData() {
  try {
    const response = await fetch(ghostApiUrl, {
      'Accept-Version': 'v5.0'
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch data. Status code: ${response.status}`);
    }

    const data = await response.json();
    // console.log(data); // Use the data as needed

    return data.posts;
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// const promptArticle = `
//   Modify the markdown document the following way:
//    - the h2 of the article should be formalized, use title capitalization, it should be a question, 7 or 8 words approx, include a mix of common, uncommon, power and emotional words,
//    - the sections of the article should be formalized, and should have 3 or 4 paragraphs each of 2 or 3 sentences (paragraphs shouldn't have a headline)
//   In your response, include only the markdown.
// `;

const promptArticle = `Formalize this article. In your response, include only the markdown.`;

(async () => {

  const files = await fetchGhostData()

  // Access command-line arguments
  const args = process.argv.slice(2);

  const arg1 = args[0] || 0
  const arg2 = args[1] || files.length

  // Process each file
  for (const file of files.slice(arg1, arg2)) {

    const startTime = performance.now();
    const textContent = browseTextContent(file.html)
    let mdContent = textContent.map((section) => {
      const title = section.title === 'Introduction' ? '' : `## ${section.title}`
      return '\n' + title + '\n' + (section.content.join('\n')).replace(/\n/g, '\n\n');
    }).join('\n')

    let conversation = []
    conversation = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: promptArticle },
      { role: 'assistant', content: mdContent },
    ]
    console.log('>> formalizing article...')
    let formalArticle = await sendToChatGPT(conversation)
    console.log(formalArticle.content)

    const endTime = performance.now();
    console.log(`Elapsed time: ${convertMillis(endTime - startTime)}`);

  }
})();