// Import the dotenv package
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const { send } = require('vite');

const apiKey = process.env.OPENAI_API_KEY

const tags = `Art
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

const promptTitle = `
  make the following headline formal, 
  use title capitalization, 
  should be a question, 
  7 or 8 words approx,
  include a mix of common, uncommon, power and emotional words: `

const promptTitle2 = `
  find a formal title for the following article,
  use title capitalization, 
  should be a question, 
  10 or 12 words,
  include a mix of common, uncommon, power and emotional words 
  (20-30% of common words, 10-20% of uncommon words, 10-15% of emotional words, at least 1 power word): `

// const promptDescription = `make the following description formal, approx 17 words, 155 characters max: `
//const promptDescription2 = `find a formal description for the following article (1 or 2 sentences, approx 17 words): `
const promptDescription2 = `write a description that identifies a challenge in the following article and 
  hints at a solution mentioned (generate a response with a meta description 
    of 150-160 characters but don't mention 'challenge' and 'solution' explicitly): `

const promptMusic = `find one song and 1 to 3 cover(s) 
(genre should be jazz, blues, soul, pop, rock, funk or electronic) for the following article 
(output should be json in this format like this example
  {
    "track": track,
    "artist": artist,
    "covers": [artist(s)]
  }
  ): `

const promptTags = `here are categories: ${tags}. Find five for the following article
  (categories should start with an uppercase letter) 
  and show them in a json format only using the name 'categories' with a lowercase c letter: `
// console.log(promptTags)

const promptKeyword = `find two or three focus keyword (only one word) 
  (output should be json with the array of keywords) for the following article: `

const promptParagraph = `make the following paragraph formal, 2 or 3 sentences: `

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

function extractMusicMeta(html) {
  const $ = cheerio.load(html);
  const songInfo = $('.rg_embed_link a').text();

  const matches = /“(.+)” by (.+)/.exec(songInfo);
  if (matches && matches.length >= 3) {
    const songName = matches[1];
    const artistName = matches[2];
    return { track: songName, artist: artistName };
  }

  return {}; // Return null if the pattern is not found
}

function convertMillis(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Convert to mm:ss format
  const formattedTime = `${minutes.toString().padStart(2, '0')}m${seconds.toString().padStart(2, '0')}s`;

  return formattedTime;
}

async function sendToChatGPT(convo) {
  const start = performance.now();

  // Prepare the request payload
  const payload = {
    messages: convo,
    //  max_tokens: 1000,  // Adjust the token limit as needed
    temperature: 0.7,
    model: "gpt-3.5-turbo",
  };

  // Define the API endpoint
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  // Send a POST request to the GPT-3 API
  const response = await fetch(apiUrl, {
    method: 'POST',
    // timeout: 10 * 1000,
    body: JSON.stringify(payload),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()
  // console.log(data)

  const end = performance.now();
  console.log(`Total time taken: ${convertMillis(end - start)}`); /* for prompt 
    ${convo.find(item => item.role === 'user').content}`);*/
  return data.choices[0].message
}

const ghostApiKey = '6bac7159a9afc6d6c915eeae66'
const ghostApiUrl = `https://soundsirius.digitalpress.blog/ghost/api/content/posts/?key=${ghostApiKey}&limit=all`

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

function splitHeadlineBalanced(headline) {
  const words = headline.split(' ');
  const totalWords = words.length;

  if (totalWords < 2) {
    return [headline]; // Can't split if there are less than 2 words
  }

  const middle = Math.ceil(totalWords / 2);
  const firstPart = words.slice(0, middle).join(' ');
  const secondPart = words.slice(middle).join(' ');

  return [firstPart.replace(/"/g, ''), secondPart.replace(/"/g, '')];
}

async function getRandomUnsplashImage(query) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  // console.log(`https://api.unsplash.com/photos/random?client_id=${accessKey}&topics=${query}&orientation=landscape`)

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?client_id=${accessKey}&topics=${query}&orientation=landscape`);
    if (!response.ok) {
      throw new Error(`Failed to fetch random image: ${response.statusText}`);
    }

    const data = await response.json();
    // console.log(data)
    return { url: data.urls.raw, alt: data.alt_description, user: data.user.name };
  } catch (error) {
    console.error('Error fetching random image:', error);
    return null;
  }
}

function createSlug(input) {
  return input
    .toLowerCase()                // Convert to lowercase
    .replace(/[^\w\s-]/g, '')     // Remove special characters
    .replace(/[\s]+/g, '-')      // Replace spaces with hyphens
    .trim();                     // Trim any leading/trailing spaces
}

(async () => {

  const files = await fetchGhostData()

  // Access command-line arguments
  const args = process.argv.slice(2);

  const arg1 = args[0] || 0
  const arg2 = args[1] || files.length

  // Process each file
  for (const file of files.slice(arg1, arg2)) {

    let conversation = []
    //    console.log(file);

    const startTime = performance.now();

    // extract song information
    const { track, artist } = extractMusicMeta(file.html)

    const textContent = browseTextContent(file.html)
    // return
    // console.log(file.meta_title, file.slug, content.length)

    // if (file.html.includes('Back to Bedlam'))
    //   console.log(file.meta_title, file.slug, file.published_at)


    // // formalize metadata
    // conversation = [
    //   { role: 'system', content: 'You are a helpful assistant.' },
    //   { role: 'user', content: promptTitle },
    //   { role: 'assistant', content: file.meta_title },
    // ]
    // let formalTitle = await sendToChatGPT(conversation)
    // // console.log(formalTitle.content)

    // conversation = [
    //   // { role: 'system', content: 'You are a helpful assistant.' },
    //   { role: 'user', content: promptDescription },
    //   { role: 'assistant', content: file.meta_description },
    // ]
    // let formalDescription = await sendToChatGPT(conversation)
    // // console.log(formalDescription.content)


    // formalize main content
    const start = performance.now();

    let formalContent = await Promise.all(textContent.map(async (section) => {
      // Start measuring the performance for this section
      const sectionStart = performance.now();

      conversation = [
        { role: 'user', content: promptTitle },
        { role: 'assistant', content: section.title },
      ];
      let formalSectionTitle = await sendToChatGPT(conversation);

      let formalParagraphs = await Promise.all(section.content.map(async (paragraph) => {
        // Start measuring the performance for this paragraph
        const paragraphStart = performance.now();

        conversation = [
          { role: 'user', content: promptParagraph },
          { role: 'assistant', content: paragraph },
        ];
        let formalParagraph = await sendToChatGPT(conversation);

        // Calculate and log the time taken for this paragraph
        const paragraphEnd = performance.now();
        console.log(`>>> Time taken for paragraph: ${convertMillis(paragraphEnd - paragraphStart)}`);

        return formalParagraph.content;
      }));

      // Calculate and log the time taken for this section
      const sectionEnd = performance.now();
      console.log(`>> Time taken for section: ${convertMillis(sectionEnd - sectionStart)}`);

      return { title: formalSectionTitle.content, content: formalParagraphs };
    }));

    // Calculate and log the overall time taken
    const end = performance.now();
    console.log(`> Total time taken: convertMillis(${end - start})`);
    // // console.log(formalContent);


    // ----------------------------------------------------------------
    // switch for formal or not
    const mainContent = formalContent
    // ----------------------------------------------------------------


    // find categories
    let contentToWrite = mainContent.map((section) => {
      return section.title + ' ' + section.content.join(' ');
    }).join(' ')

    let contentToWriteMarkdown = mainContent.map((section) => {
      const title = section.title === 'Introduction' ? '' : `## ${section.title}`
      return '\n' + title + '\n' + (section.content.join('\n')).replace(/\n/g, '\n\n');
    }).join('\n')

    conversation = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: promptTags },
      { role: 'assistant', content: contentToWrite },
    ]
    console.log('>> determining tags...')
    let fiveTags = await sendToChatGPT(conversation)
    // console.log(fiveTags.content)

    conversation = [
      // { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: promptKeyword },
      { role: 'assistant', content: contentToWrite },
    ]
    console.log('>> finding focus keywords...')
    let keyword = await sendToChatGPT(conversation)
    console.log(keyword.content)

    conversation = [
      // { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: promptTitle2 },
      { role: 'assistant', content: contentToWrite },
    ]
    console.log('>> generating title...')
    let titleGenerated = await sendToChatGPT(conversation)
    // console.log(keyword.content)

    conversation = [
      // { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: promptDescription2 },
      { role: 'assistant', content: contentToWrite },
    ]
    console.log('>> generating description...')
    let descriptionGenerated = await sendToChatGPT(conversation)
    // console.log(keyword.content)

    conversation = [
      // { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: promptMusic },
      { role: 'assistant', content: contentToWrite },
    ]
    console.log('>> finding music...')
    let musicFound = await sendToChatGPT(conversation)
    console.log(musicFound.content)

    // create md file
    const splitTitle = splitHeadlineBalanced(titleGenerated.content)
    console.log('>> retrieving featured image...')
    const featuredInfo = await getRandomUnsplashImage(JSON.parse(keyword.content).keywords)
    let frontmatter = `---
title: "${splitTitle[0]}"
title2: "${splitTitle[1]}"
description: "${descriptionGenerated.content.replace(/"/g, '')}"
author: Nicolas Sursock
date: ${new Date(file.published_at).toISOString().slice(0, -5) + 'Z'}
featured: ${featuredInfo.url}&auto=format&fit=crop
alt: ${featuredInfo.alt}
photographer: ${featuredInfo.user}
tags: [${JSON.parse(fiveTags.content).categories},formal]
layout: layouts/post.njk
track: ${JSON.parse(musicFound.content).track}
versions: 
  - artist: ${JSON.parse(musicFound.content).artist}
    link: /todo.html
`
    JSON.parse(musicFound.content).covers.forEach((coverArtist) => {
      frontmatter +=
        ` 
  - artist: ${coverArtist}
    link: /todo.html
`
    })
    frontmatter +=
      `---

`

    const filePath = `./src/formal/${JSON.parse(keyword.content).keywords.map(createSlug).join('-')}.md`
    try {
      fs.writeFileSync(filePath, frontmatter + contentToWriteMarkdown, 'utf-8');
      console.log(`Content has been successfully written to ${filePath}`);
    } catch (err) {
      console.error('Error writing to the file:', err);
    }

    const endTime = performance.now();

    const elapsedTime = endTime - startTime;
    console.log(`Elapsed time: ${convertMillis(elapsedTime)}`);

  }

})();