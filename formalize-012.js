// Import the dotenv package
require('dotenv').config();
const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');
const cloudinary = require('cloudinary');
// import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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
   - Identify 1 long tail keyword (at least 4 words long) for the section.
   - Provide an image prompt for dall-e to illustrate this section with a photorealistic picture.

Please note:
- Titles should use title capitalization.
- Titles should be presented as questions and contain 7 to 8 words.
- Titles should include a mix of common, uncommon, powerful, and emotional words.
- Sections should contain 4 or 5 paragraphs, each 180 words long.
- Paragraphs should consist of 3 or 4 sentences, each spanning 40 to 50 words.

**Output:** Your response should be in JSON format (not markdown) as follows:

{
  "sections": [
    {
      "title": "",
      "content": [],
      "keywords": [],
      "prompt": ""
    }
  ]
}
`;

const promptRest = `
## categories
Determine five categories for the chosen article from the following options: ${WORDPRESS_CATEGORIES}.

## keywords
Identify 1 long tail keyword (at least 4 words long) for the article.

## music
Find one song and 2 to 3 covers for the article in the jazz, blues, soul, pop, rock, funk, or electronic genres.

## title
Find a formal title for the article with the following characteristics:
- The title should use title capitalization.
- It should be a question and contain 10 to 12 words.
- The title should incorporate a mixture of common, uncommon, powerful, and emotional words, with the mix consisting of 20-30% common words, 10-20% uncommon words, 10-15% emotional words, and at least 1 power word.

## description
Compose a formal meta description for search engines that:
- Identifies a challenge in the article.
- Hints at a solution without explicitly mentioning 'challenge' and 'solution.'
- The response should be 160-180 characters long.
- Don't start with the word 'explore'.

## prompt
Provide an image prompt for dall-e to illustrate the article with a photorealistic image.

**Output:** The response should be in JSON format (not markdown) similar to the following:

{ 
  "categories": [],
  "keywords": [],
  "music": {
    "track": "",
    "artist": "",
    "covers": [artist(s)]
  },
  "metadata": {
    "title": "",
    "description": "",
    "prompt": ""
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

  // try {
  //   let photo = await getDallEImage('a photorealistic picture of 2 friends playing basketball on the computer')
  //   photo = await cloudinary.v2.uploader
  //     .upload(photo?.url, {
  //       folder: 'crackingdacode',
  //       resource_type: 'image'
  //     })
  //   console.log(photo.secure_url);
  //   console.log(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/fetch/w_350,h_200,f_webp/${photo.secure_url}`)
  //   console.log(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/fetch/w_700,h_400,f_webp/${photo.secure_url}`)
  // } catch (error) {
  //   console.error(error.message);
  // } finally {
  //   return
  // }


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
      { role: 'system', content: 'You are an experienced music critic who has a huge record library.' },
      { role: 'user', content: promptRest },
      { role: 'assistant', content: mdContent },
    ]
    let rest = await sendToChatGPT(conversation)

    // rest.content = removeFirstAndLastLines(rest.content)
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
      { role: 'system', content: 'You are an experienced editor who takes text input and rewrites for a more formal tone.' },
      { role: 'user', content: promptArticle },
      { role: 'assistant', content: pureContent },
    ]
    let article = await sendToChatGPT(conversation)

    // article.content = removeFirstAndLastLines(article.content)
    console.log(article.content)

    // const jsonContent = browseTextContent(article.content)
    let finalContent = await Promise.all(JSON.parse(article.content).sections.map(async (section, index) => {
      const title = section.title === 'Introduction' ? '' : `## ${section.title}`

      let markdown = ''
      if (index !== 0) { // skip introduction

        // const photo = await getRandomUnsplashImage(section.keywords)
        // const photo = await getDallEImage(section.prompt + ', digital art')
        let photo = await getDallEImage(section.prompt)
        photo = await cloudinary.v2.uploader
          .upload(photo?.url, {
            folder: 'crackingdacode',
            resource_type: 'image'
          })

        // avoid too many requests 429
        setTimeout(() => console.log('>> waiting 2 seconds'), 2000);

        if (index % 2 === 1) { // right aside
          markdown += '\n' + title + '\n' + `
<aside class="md:-mr-56 md:float-right w-full md:w-2/3 md:px-8">
  <img x-intersect.once="$el.src = isMobile() ? 
  $el.dataset.src.replace('/upload/', '/upload/w_480/h_275/f_webp/') :
  $el.dataset.src.replace('/upload/', '/upload/w_700/h_400/f_webp/')"
  class="rounded-lg" alt="${section.prompt}" data-src="${photo?.secure_url}">
</aside>
`
        } else { // left aside
          markdown += '\n' + title + '\n' + `
<aside class="md:-ml-56 md:float-left w-full md:w-2/3 md:px-8">
  <img x-intersect.once="$el.src = isMobile() ? 
  $el.dataset.src.replace('/upload/', '/upload/w_480/h_275/f_webp/') :
  $el.dataset.src.replace('/upload/', '/upload/w_700/h_400/f_webp/')"
  class="rounded-lg" alt="${section.prompt}" data-src="${photo?.secure_url}">
</aside>
`
        }

        //         if (index % 2 === 1) { // right aside
        //           markdown += '\n' + title + '\n' + `
        // <aside class="md:-mr-56 md:float-right w-full md:w-2/3 md:px-8">
        //   <figure>
        //     <img x-intersect.once="$el.src = $el.dataset.src" class="rounded-lg" alt="${photo.alt}" data-user="${photo.user}" data-src="${photo.url}&auto=format&fit=crop&q=80&w=800&h=600">
        //     <figcaption class="text-center">${photo.user} on Unsplash</figcaption>
        //   </figure>
        // </aside>
        // `
        //         } else { // left aside
        //           markdown += '\n' + title + '\n' + `
        // <aside class="md:-ml-56 md:float-left w-full md:w-2/3 md:px-8">
        //   <figure>
        //     <img x-intersect.once="$el.src = $el.dataset.src" class="rounded-lg" alt="${photo.alt}" data-user="${photo.user}" data-src="${photo.url}&auto=format&fit=crop&q=80&w=800&h=600">
        //     <figcaption class="text-center">${photo.user} on Unsplash</figcaption>
        //   </figure>
        // </aside>
        // `
        //         }
      }
      markdown += '\n' + (section.content.join('\n')).replace(/\n/g, '\n\n');
      return markdown;
    }))

    // avoid too many requests 429
    setTimeout(() => console.log('>> waiting 5 seconds'), 5000);

    // create md file
    const splitTitle = splitHeadlineBalanced(JSON.parse(rest.content).metadata.title);
    // const feat = await getRandomUnsplashImage(JSON.parse(rest.content).keywords)
    let photo = await getDallEImage(JSON.parse(rest.content).metadata.prompt, true)
    photo = await cloudinary.v2.uploader
      .upload(photo?.url, {
        folder: 'crackingdacode',
        resource_type: 'image'
      })
    // const photo = await getDallEImage(JSON.parse(rest.content).metadata.prompt + ', digital art', true)
    let frontmatter = `---
title: "${splitTitle[0]}"
title2: "${splitTitle[1]}"
description: "${JSON.parse(rest.content).metadata.description.replace(/"/g, '')}"
author: Nicolas Sursock
date: ${new Date(file.published_at).toISOString().slice(0, -5) + 'Z'}
`
      // featured: ${feat.url}&auto=format&fit=crop
      // alt: ${feat.alt}
      // photographer: ${feat.user}
      + `
featured: ${photo?.secure_url}
alt: ${JSON.parse(rest.content).metadata.prompt}
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

function removeFirstAndLastLines(inputString) {
  // Split the string into an array of lines
  const str = inputString.includes('json') ? inputString.split('json')[1] : inputString
  const lines = str.split('\n');

  // console.log(str)

  // Check if there are at least 2 lines to remove
  if (lines.length >= 2) {
    // Remove the first line (index 0) and the last line (index lines.length - 1)
    if (!lines[0].includes('{')) lines.shift(); // Remove the first line
    lines.pop();   // Remove the last line
  }

  // Join the remaining lines back into a single string
  const resultString = lines.join('\n');

  return resultString;
}

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
    response_format: { type: "json_object" },
    model: "gpt-4-1106-preview",
    // model: "gpt-3.5-turbo",
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
  // const payload = {
  //   model: "dall-e-2",
  //   prompt: prompt,
  //   n: 1,
  //   size: hero ? "1024x1024" : "512x512"
  // };

  const payload = {
    model: "dall-e-3",
    prompt: prompt,
    size: "1792x1024",
    quality: "hd"
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

    console.log(response.data)

    const end = performance.now();
    console.log(`Total time taken: ${convertMillis(end - start)}`);
    return response.data.data[0];
  } catch (e) {
    console.error(e.message)
  } finally {
    console.log(prompt);
  }
}

function createSlug(input) {
  return input
    .toLowerCase()                // Convert to lowercase
    .replace(/[^\w\s-]/g, '')     // Remove special characters
    .replace(/[\s]+/g, '-')      // Replace spaces with hyphens
    .trim();                     // Trim any leading/trailing spaces
}