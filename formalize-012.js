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

const promptArticle = `
  Formalize the html this way:
   - for each section, find a formal h2 title based on the paragraphs and 2 or 3 focus keywords for the section
    (except for the first one which is the introduction),
   - make formal each paragraph,
    
  Response should be a json with this format: { sections: [{ title: <h2>s, content: [ <p>s ], keywords: [keywords] }] }
  `;

  // - title should use title capitalization, 
  //   - title should be a question, 7 to 8 words long,
  //   - title should include a mix of common, uncommon, power and emotional words
// Sections: the sections of the article should have the same structure than the original article 
// (special case: don't forget to formalize the introduction, i.e. the one before the first h2),
//  - title: the <h2>s of the article should be formalized, use title capitalization, it should be a question, 7 or 8 words long, include a mix of common, uncommon, power and emotional words,
//  - paragraphs: the paragraphs in each section should have a formal tone.
//this format: article: [{ title: <h2>s, section: [ <p>s ] }]

const promptRest = `
  ## categories
   Determine five categories for the article chosen among the following ones: ${WORDPRESS_CATEGORIES},
  ## keywords
   Find two or three focus keyword for the article,
  ## music
  Find one song and 1 to 3 cover(s) for the article (genre should be jazz, blues, soul, pop, rock, funk or electronic).
  ## title
  Find a formal title for the article: 
   - result should use title capitalization, 
   - result should be a question, 10 to 12 words long,
   - result should include a mix of common, uncommon, power and emotional words (20-30% of common words, 10-20% of uncommon words, 10-15% of emotional words, at least 1 power word)
  ## description
  Write a formal description (generate a response of 150-160 characters but don't mention 'challenge' and 'solution' explicitly) that:
   - identifies a challenge in the article and,
   - hints at a solution mentioned.
  
   Response of should be a json similar to this: 
    { 
      categories: [],
      keywords: [],
      music: {
        "track": track,
        "artist": artist,
        "covers": [artist(s)]
      },
      metadata: { title: title, description: description }
  }
`;
// article: [{ title: h2, section: [ <p>s ] }],

const promptTitle = `
  Formalize the title: use title capitalization, it should be a question, 10 to 12 words long, include a mix of common, uncommon, power and emotional words.
`;

const promptParagraph = `
  Formalize this paragraph.
`;

// const promptArticle = `Revise this article to adopt a more formal tone. In your response, include only the markdown.`;

(async () => {

  const files = await fetchGhostData()

  // Access command-line arguments
  const args = process.argv.slice(2);

  const arg1 = args[0] || 0
  const arg2 = args[1] || files.length

  // Process each file
  for (const file of files.slice(arg1, arg2)) {

    const startTime = performance.now();
    let textContent = browseTextContent(file.html)

    let mdContent = textContent.map((section) => {
      const title = section.title === 'Introduction' ? '' : `## ${section.title}`
      return '\n' + title + '\n' + (section.content.join('\n')).replace(/\n/g, '\n\n');
    }).join('\n')

    let conversation = []
    // let prompt = `# Do the following tasks: ${promptArticle}`

    conversation = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: promptRest },
      { role: 'assistant', content: mdContent },
    ]
    let rest = await sendToChatGPT(conversation)
    console.log(rest.content)

    // Define the words you want to check for
    const wordsToCheckFor = ["serious music insight", "Disclosure:", "ibb-widget-root"];
    textContent = textContent.map(section => {
      if (section.title === 'Introduction') {
        section.content = section.content.filter(content => {
          // Check if the content does not include any of the words to be removed
          return !wordsToCheckFor.some(word => content.includes(word));
        });
      }
      return section;
    });
    console.log(textContent);

    let htmlContent = textContent.slice(0,2).map((section) => {
      const title = section.title === 'Introduction' ? '' : wrapWithTag(section.title, 'h2')
      return title + section.content.map(content => wrapWithTag(content, 'p')).join('\n') + '\n'
    }).join('\n')

    conversation = [
      // { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: promptArticle },
      { role: 'assistant', content: htmlContent },
    ]
    let article = await sendToChatGPT(conversation)
    console.log(article.content)

    // const jsonContent = browseTextContent(article.content)
    let finalContent = await Promise.all(JSON.parse(article.content).sections.map(async (section, index) => {
      const title = section.title === 'Introduction' ? '' : `## ${section.title}`

      let markdown = ''
      if (index !== 0) { // skip introduction

        const photo = await getRandomUnsplashImage(section.keywords)

        if (index % 2 === 1) { // right aside
          markdown += '\n' + title + '\n' + `
<aside class="md:-mr-56 md:float-right w-full md:w-2/3 md:px-8">
  <figure>
    <img x-intersect.once="$el.src = $el.dataset.src" class="rounded-lg" alt="${photo.alt}" data-user="${photo.user}" data-src="${photo.url}&auto=format&fit=crop&q=80&w=800&h=600">
    <figcaption class="text-center">${photo.user} on Unsplash</figcaption>
  </figure>
</aside>`
        } else { // left aside
          markdown += '\n' + title + '\n' + `
<aside class="md:-ml-56 md:float-left w-full md:w-2/3 md:px-8">
  <figure>
    <img x-intersect.once="$el.src = $el.dataset.src" class="rounded-lg" alt="${photo.alt}" data-user="${photo.user}" data-src="${photo.url}&auto=format&fit=crop&q=80&w=800&h=600">
    <figcaption class="text-center">${photo.user} on Unsplash</figcaption>
  </figure>
</aside>`
        }
      }
      markdown += '\n' + (section.content.join('\n')).replace(/\n/g, '\n\n');
      return markdown;
    }))

    // create md file
    const splitTitle = splitHeadlineBalanced(JSON.parse(rest.content).metadata.title);
    const feat = await getRandomUnsplashImage(JSON.parse(rest.content).keywords)
    let frontmatter = `---
title: "${splitTitle[0]}"
title2: "${splitTitle[1]}"
description: "${JSON.parse(rest.content).metadata.description.replace(/"/g, '')}"
author: Nicolas Sursock
date: ${new Date(file.published_at).toISOString().slice(0, -5) + 'Z'}
featured: ${feat.url}&auto=format&fit=crop
alt: ${feat.alt}
photographer: ${feat.user}
tags: [${JSON.parse(rest.content).categories},formal]
layout: layouts/post.njk
track: ${JSON.parse(rest.content).music.track}
versions: 
  - artist: ${JSON.parse(rest.content).music.artist}
    link: /todo.html`

    JSON.parse(rest.content).music.covers.forEach((artist) => {
      frontmatter +=
        ` 
  - artist: ${artist}
    link: /todo.html`
    })
    frontmatter +=
      `
---`


    const filePath = `./src/formal/${JSON.parse(rest.content).keywords.map(createSlug).join('-')}.md`
    try {
      fs.writeFileSync(filePath, frontmatter + finalContent.join('\n'), 'utf-8');
      console.log(`Content has been successfully written to ${filePath}`);
    } catch (err) {
      console.error('Error writing to the file:', err);
    }

    const endTime = performance.now();
    console.log(`Elapsed time: ${convertMillis(endTime - startTime)}`);

  }
})();

function wrapWithTag(text, tagName) {
  return `<${tagName}>${text}</${tagName}>`;
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

  // // Define the words you want to check for
  // const wordsToCheckFor = ["serious music insight", "Disclosure:", "ibb-widget-root"];

  // $('p, blockquote').filter(function () {
  //   const paragraphText = $(this).text().toLowerCase(); // Convert to lowercase for case-insensitive matching
  //   return wordsToCheckFor.some(word => paragraphText.includes(word));
  // }).remove();

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
    temperature: 0.7,
    // stream: true,
    model: "gpt-4",
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

async function getRandomUnsplashImage(query) {

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?client_id=${process.env.UNSPLASH_ACCESS_KEY}&topics=${query}&orientation=landscape`);
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