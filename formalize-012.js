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
Your task is to revise the document provided in the following way:

1. For each section, formalize paragraphs.
2. For each section except the introduction:
   - Formalize h2 headings.
   - Identify a long tail keyword (at least 4 words long) for the section.
   - Provide an image prompt for dall-e to illustrate this section (not a url).

Please note:
- Titles should use title capitalization.
- Titles should be presented as questions and contain 7 to 8 words.
- Titles should include a mix of common, uncommon, powerful, and emotional words.
- Sections should contain 3 or 4 paragraphs, each 150 words long.
- Paragraphs should consist of 2 or 3 sentences, each spanning 40 to 50 words.

**Output:** Your response should be in JSON format as follows:

{
  "sections": [
    {
      "title": "<h2>",
      "content": ["<p>"],
      "keywords": ["keywords"],
      "prompt": "prompt"
    }
  ]
}
`;

const promptRest = `
## Categories
Determine five categories for the chosen article from the following options: ${WORDPRESS_CATEGORIES}.

## Keywords
Identify a long tail keyword (at least 4 words long) for the article.

## Music
Find one song and 1 to 3 covers for the article in the jazz, blues, soul, pop, rock, funk, or electronic genres.

## Title
Find a formal title for the article with the following characteristics:
- The title should use title capitalization.
- It should be a question and contain 10 to 12 words.
- The title should incorporate a mixture of common, uncommon, powerful, and emotional words, with the mix consisting of 20-30% common words, 10-20% uncommon words, 10-15% emotional words, and at least 1 power word.

## Description
Compose a formal description that:
- Identifies a challenge in the article.
- Hints at a solution without explicitly mentioning 'challenge' and 'solution.'
- The response should be 150-160 characters long.

## Prompt
Provide an image prompt for dall-e to illustrate the article (not a url).

**Output:** The response should be in JSON format similar to the following:

{ 
  "categories": [],
  "keywords": [],
  "music": {
    "track": "track",
    "artist": "artist",
    "covers": ["artist(s)"]
  },
  "metadata": {
    "title": "title",
    "description": "description",
    "prompt": "prompt"
  }
}
`;

// const promptTitle = `
//   Formalize the title: use title capitalization, it should be a question, 10 to 12 words long, include a mix of common, uncommon, power and emotional words.
// `;

// const promptParagraph = `
//   Formalize this paragraph.
// `;

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
      { role: 'system', content: 'You are a helpful assistant and an experienced musician.' },
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
    // console.log(textContent);

    // let htmlContent = textContent.slice(0,2).map((section) => {
    //   const title = section.title === 'Introduction' ? '' : wrapWithTag(section.title, 'h2')
    //   return title + section.content.map(content => wrapWithTag(content, 'p')).join('\n') + '\n'
    // }).join('\n')

    let pureContent = textContent.map((section) => {
      const title = section.title === 'Introduction' ? '' : `## ${section.title}`
      return '\n' + title + '\n' + (section.content.join('\n')).replace(/\n/g, '\n\n');
    }).join('\n')

    conversation = [
      { role: 'system', content: 'You are an experienced copywriter who takes text input and rewrites for a more formal tone.' },
      { role: 'user', content: promptArticle },
      { role: 'assistant', content: pureContent },
    ]
    let article = await sendToChatGPT(conversation)
    console.log(article.content)

    // const jsonContent = browseTextContent(article.content)
    let finalContent = await Promise.all(JSON.parse(article.content).sections.map(async (section, index) => {
      const title = section.title === 'Introduction' ? '' : `## ${section.title}`

      let markdown = ''
      if (index !== 0) { // skip introduction

        const photo = await getRandomUnsplashImage(section.keywords)
        // const photo = await getDallEImage(section.prompt + ', digital art')

//         if (index % 2 === 1) { // right aside
//           markdown += '\n' + title + '\n' + `
// <aside class="md:-mr-56 md:float-right w-full md:w-2/3 md:px-8">
//   <img x-intersect.once="$el.src = $el.dataset.src" class="rounded-lg" alt="${section.prompt}" data-src="${photo.url}">
// </aside>
// `
//         } else { // left aside
//           markdown += '\n' + title + '\n' + `
// <aside class="md:-ml-56 md:float-left w-full md:w-2/3 md:px-8">
//   <img x-intersect.once="$el.src = $el.dataset.src" class="rounded-lg" alt="${section.prompt}" data-src="${photo.url}">
// </aside>
// `
//         }

        if (index % 2 === 1) { // right aside
          markdown += '\n' + title + '\n' + `
<aside class="md:-mr-56 md:float-right w-full md:w-2/3 md:px-8">
  <figure>
    <img x-intersect.once="$el.src = $el.dataset.src" class="rounded-lg" alt="${photo.alt}" data-user="${photo.user}" data-src="${photo.url}&auto=format&fit=crop&q=80&w=800&h=600">
    <figcaption class="text-center">${photo.user} on Unsplash</figcaption>
  </figure>
</aside>
`
        } else { // left aside
          markdown += '\n' + title + '\n' + `
<aside class="md:-ml-56 md:float-left w-full md:w-2/3 md:px-8">
  <figure>
    <img x-intersect.once="$el.src = $el.dataset.src" class="rounded-lg" alt="${photo.alt}" data-user="${photo.user}" data-src="${photo.url}&auto=format&fit=crop&q=80&w=800&h=600">
    <figcaption class="text-center">${photo.user} on Unsplash</figcaption>
  </figure>
</aside>
`
        }
      }
      markdown += '\n' + (section.content.join('\n')).replace(/\n/g, '\n\n');
      return markdown;
    }))

    // create md file
    const splitTitle = splitHeadlineBalanced(JSON.parse(rest.content).metadata.title);
    const feat = await getRandomUnsplashImage(JSON.parse(rest.content).keywords)
    // const photo = await getDallEImage(JSON.parse(rest.content).metadata.prompt + ', digital art', true)
    let frontmatter = `---
title: "${splitTitle[0]}"
title2: "${splitTitle[1]}"
description: "${JSON.parse(rest.content).metadata.description.replace(/"/g, '')}"
author: Nicolas Sursock
date: ${new Date(file.published_at).toISOString().slice(0, -5) + 'Z'}
featured: ${feat.url}&auto=format&fit=crop
alt: ${feat.alt}
photographer: ${feat.user}
` +
// featured: ${photo.url}
// alt: ${JSON.parse(rest.content).metadata.prompt}
`tags: [${JSON.parse(rest.content).categories},formal]
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


    // const filePath = `./src/formal/${file.slug}.md`
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

  let isFinalParaReached = false;

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
      if (text.includes('If you liked that post or more generally my blog'))
        isFinalParaReached = true;
      // Add content to the current section
      if (!isFinalParaReached)
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
    temperature: 0.7,
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
    console.error(e.message)
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
      `https://api.unsplash.com/photos/random?client_id=${process.env.UNSPLASH_ACCESS_KEY}&query=${query}&orientation=landscape`);
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

async function getDallEImage(prompt, hero = false) {
  const start = performance.now();

  // Prepare the request payload
  const payload = {
    prompt: prompt,
    n: 1,
    size: hero ? "1024x1024" : "256x256"
   };

  // Define the API endpoint
  const apiUrl = 'https://api.openai.com/v1/images/generations ';

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(prompt, response.data)

    const end = performance.now();
    console.log(`Total time taken: ${convertMillis(end - start)}`);
    return response.data.data[0];
  } catch (e) {
    console.error(e.message)
  }
}

function createSlug(input) {
  return input
    .toLowerCase()                // Convert to lowercase
    .replace(/[^\w\s-]/g, '')     // Remove special characters
    .replace(/[\s]+/g, '-')      // Replace spaces with hyphens
    .trim();                     // Trim any leading/trailing spaces
}