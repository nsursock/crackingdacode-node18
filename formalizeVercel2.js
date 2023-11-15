require('dotenv').config();
const path = require('path');
const yaml = require('js-yaml');
const axios = require('axios');
const fs = require('fs');
const matter = require('gray-matter');
const cheerio = require('cheerio');

const apiKey = process.env.OPENAI_API_KEY
const unsplashAPIKey = process.env.UNSPLASH_ACCESS_KEY;

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
2. For each section including the introduction (first section):
   - Find a title based on the content of the section.
   - Identify 1 long tail keyword (at least 4 words long) for the section.
   - Provide an image prompt for dall-e to illustrate this section with a photorealistic picture.
3. Try to find transitions between sections; they should be maximum 2 sentences long.
4. Identify 1 long tail keyword (at least 4 words long) for the article and try to incorporate it in each section naturally.

Please note:
- Titles should use title capitalization.
- Titles should be presented as questions and contain 7 to 8 words.
- Titles should include a mix of common, uncommon, powerful, and emotional words.
- Titles should be a question.
- Sections should contain 4 or 5 paragraphs.
- Paragraphs should consist of 3 or 4 sentences.
- Do not finish a section by explaining what the section is about.

**Output:** Your response should be in JSON format (not markdown) as follows:

  {
    "keyword": long tail keyword,
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
Determine one main category for the chosen article from the following options: ${WORDPRESS_CATEGORIES}.
Determine four secondary categories for the chosen article from the following options: ${WORDPRESS_CATEGORIES}.
Put the main one first in the array.

## keywords
Identify 1 long tail keyword (at least 4 words long) for the article. Do not use the word impact.

## title
Find a formal title for the article with the following characteristics:
- The title should use title capitalization.
- It should be a question and contain 10 to 12 words.
- The title should incorporate a mixture of common, uncommon, powerful, and emotional words, with the mix consisting of 20-30% common words, 10-20% uncommon words, 10-15% emotional words, and at least 1 power word.

## description
Compose a formal meta description for search engines that:
- Identifies a challenge in the article and hints at a solution.
- Response should be without explicitly mentioning 'challenge' and 'solution.'
- The response should be around 180 characters long.
- Don't start with the word 'explore'.

## variations
Find 4 variations for the title and description.

## prompt
Provide an image prompt for dall-e to illustrate the article with a photorealistic image.

## lantern
Write four formal sentences to sell the article to skeptics (around 15-20 words each).

## comments
Generate ten positive formal comments for the article.

**Output:** The response should be in JSON format (not markdown) similar to the following:

{ 
  "categories": [],
  "keywords": [],
  "metadata": {
    "title": "",
    "description": "",
    "prompt": "",
    "variations": { titles: [{text: ...}, ...], descriptions: [{text: ...}, ...] },
    "misc": {
      "lantern": [{text: ...}, ...],
      "comments": [{text: ...}, ...],
    }
  },
}
`;

const promptMusic =
  `Write a 150-200 words formal critic of the following song (response should be text without a title of 3 or 4 paragraphs): `

// ----------------------------------------------------------------

const directory = './src/blog/';
const files = fs.readdirSync(directory);

(async () => {

  // Process each file
  for (const file of files) {

    const startTime = performance.now();

    // Check if the file has a .md extension
    if (file.endsWith('.md')) {
      let filePath = `${directory}/${file}`;
      let json = convertJson(filePath);

      // console.log(JSON.stringify(!json.head.tags.includes('featured'), null, 2));

      const isDebugMode = false // for when the jsons have been dumped

      if (json.head.tags.includes('blog')) {
        let conversation = ''
        let casualMarkdown = json.content.sections.map((section) => {
          const title = section.title === '' ? '' : `## ${section.title}`
          return '\n' + title + '\n' + (section.paragraphs.join('\n')).replace(/\n/g, '\n\n');
        }).join('\n')

        // Music critic
        let music = null
        if (!isDebugMode) {
          conversation = [
            { role: 'system', content: 'You are an experienced musician who writes positive critics.' },
            { role: 'user', content: promptMusic + `${json.head.track} by ${json.head.versions[0].artist}` },
            // { role: 'assistant', content:  },
          ]
          music = await sendToChatGPT(conversation, false)
          writeJsonToFile(music, `./src/processed/${file}.music.json`)
        } else {
          music = readJsonFromFile(`./src/processed/${file}.music.json`)
        }
        console.log(JSON.stringify(music.content))

        // Front matter
        let rest = null
        if (!isDebugMode) {
          conversation = [
            { role: 'system', content: 'You are an experienced copy writer who knows how to grab attention.' },
            { role: 'user', content: promptRest },
            { role: 'assistant', content: casualMarkdown },
          ]
          rest = await sendToChatGPT(conversation)
          writeJsonToFile(rest, `./src/processed/${file}.rest.json`)
        } else {
          rest = readJsonFromFile(`./src/processed/${file}.rest.json`)
        }
        console.log(JSON.stringify(JSON.parse(rest.content), null, 2))

        // Markdown content
        let article = null
        if (!isDebugMode) {
          conversation = [
            { role: 'system', content: 'You are an experienced editor who takes text input and rewrites for a more formal tone.' },
            { role: 'user', content: promptArticle },
            { role: 'assistant', content: casualMarkdown },
          ]
          article = await sendToChatGPT(conversation)
          writeJsonToFile(article, `./src/processed/${file}.article.json`)
        } else {
          article = readJsonFromFile(`./src/processed/${file}.article.json`)
        }
        console.log(JSON.stringify(JSON.parse(article.content), null, 2))

        const numVariations = 1
        let finalContent = []
        for (let index = 0; index < numVariations; index++) { // no variations for unsplash

          finalContent[index] = await Promise.all(JSON.parse(article.content).sections.map(async (section, index) => {
            const title = `## ${section.title}`

            let markdown = ''
            // if (index !== 0) { // skip introduction

            const photo = await getRandomUnsplashImage(section.keywords)
            // const photo = await extractUnplashMetadata(json.asides[index - 1])
            // console.log(photo);

            if (index % 2 === 0) { // right aside
              markdown += '\n' + title + '\n' + `
<aside class="md:-mr-56 md:float-right w-full md:w-2/3 md:px-8">
  <figure>
    <img x-intersect.once="$el.src = !isMobile() ? $el.dataset.src + '&w=800&h=600' : $el.dataset.src + '&w=480&h=320'" class="rounded-lg" alt="${photo.alt_description}" data-prompt="${section.prompt}" data-keyword="${section.keywords.join(', ')}" data-src="${photo.urls.raw}&auto=format&fit=crop&q=80">
    <figcaption class="text-center">
    Photo by <a href="https://unsplash.com/@${photo.user.username}?utm_source=crackingdacode&utm_medium=referral">${photo.user.name}</a> on <a href="https://unsplash.com/?utm_source=crackingdacode&utm_medium=referral">Unsplash</a>
    </figcaption>
  </figure>
</aside>
        `
            } else { // left aside
              markdown += '\n' + title + '\n' + `
<aside class="md:-ml-56 md:float-left w-full md:w-2/3 md:px-8">
  <figure>
    <img x-intersect.once="$el.src = !isMobile() ? $el.dataset.src + '&w=800&h=600' : $el.dataset.src + '&w=480&h=320'" class="rounded-lg" alt="${photo.alt_description}" data-prompt="${section.prompt}" data-keyword="${section.keywords.join(', ')}" data-src="${photo.urls.raw}&auto=format&fit=crop&q=80">
    <figcaption class="text-center">
    Photo by <a href="https://unsplash.com/@${photo.user.username}?utm_source=crackingdacode&utm_medium=referral">${photo.user.name}</a> on <a href="https://unsplash.com/?utm_source=crackingdacode&utm_medium=referral">Unsplash</a>
    </figcaption>
  </figure>
</aside>
        `
            }
            // }
            markdown += '\n' + (section.content.join('\n')).replace(/\n/g, '\n\n');
            return markdown;
          }))

          const markdownMusic = JSON.stringify(music.content)
            .replace(/\\"/g, '"')          // Replace \" with "
            .replace(/\\n\\n/g, '\n\n')    // Replace \n\n with new line
            .replace(/\\n/g, '  \n');       // Replace \n with two spaces and new line
          finalContent[index].unshift(markdownMusic.substring(1, markdownMusic.length - 1))

          // create md file
          const splitTitle = splitHeadlineBalanced(JSON.parse(rest.content).metadata.title);
          // const photo = await extractUnplashMetadata(json.head.featured, true)
          const photo = await getRandomUnsplashImage(JSON.parse(rest.content).keywords)
          // const photo = await getDallEImage(JSON.parse(rest.content).metadata.prompt + ', digital art', true)

          const yamlMusic = {
            track: json.head.track,
            versions: json.head.versions
          }

          let frontmatter =
            `---
title: "${splitTitle[0]}"
title2: "${splitTitle[1]}"
description: "${JSON.parse(rest.content).metadata.description.replace(/"/g, '')}"
${yaml.dump(JSON.parse(rest.content).metadata.variations)}
author: Nicolas Sursock
date: ${new Date(json.head.date).toISOString().slice(0, -5) + 'Z'}
featured: ${photo.urls.raw}&auto=format&fit=crop&q=80
alt: ${photo.alt_description}
name: ${photo.user.name}
handle: ${photo.user.username}
keywords: ${JSON.parse(article.content).keyword}
original: ${file}
tags: [${JSON.parse(rest.content).categories},blog,formal,featured,processed]
layout: layouts/post.njk
${yaml.dump(yamlMusic)}
${yaml.dump(JSON.parse(rest.content).metadata.misc)}
---
`
          try {
            // const filePath = `./src/formal/${file.slug}.md`
            const filePath = `./src/featured/${createSlug(JSON.parse(article.content).keyword)}.md`
            // const filePath = `./src/featured/${JSON.parse(rest.content).keywords.map(createSlug).join('-')}-${index + 1}.md`
            fs.writeFileSync(filePath, frontmatter + finalContent[index].join('\n'), 'utf-8');
            console.log(`Content has been successfully written to ${filePath}`);

            const sourceDirectory = directory;
            const destinationDirectory = './src/processed';
            const fileName = file;

            const sourcePath = path.join(sourceDirectory, fileName);
            const destinationPath = path.join(destinationDirectory, fileName);

            // Move the file
            fs.rename(sourcePath, destinationPath, (err) => {
              if (err) {
                console.error(`Error moving file: ${err}`);
              } else {
                console.log('File moved successfully!');
              }
            })

          } catch (err) {
            console.error('Error writing to the file:', err);
          }
        }

        const endTime = performance.now();
        console.log(`Elapsed time: ${convertMillis(endTime - startTime)}`);

        // return
      }
    }
  }
})();

// ----------------------------------------------------------------

function writeJsonToFile(jsonObj, filePath) {
  try {
    // Convert the JSON object to a string
    const jsonString = JSON.stringify(jsonObj, null, 2);

    // Write the string to a file synchronously
    fs.writeFileSync(filePath, jsonString, 'utf-8');

    console.log(`JSON object has been written to ${filePath}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

function readJsonFromFile(filePath) {
  try {
    // Read the file synchronously
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse the JSON content
    const jsonObj = JSON.parse(fileContent);

    return jsonObj;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

function removeAccents(str) {
  // Use the normalize method to convert accented characters to their non-accented equivalents
  const normalizedStr = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Use a regular expression to remove any remaining non-alphanumeric characters
  const removedAccentsStr = normalizedStr.replace(/[^a-zA-Z0-9]/g, " ");

  return removedAccentsStr;
}

async function getRandomUnsplashImage(query) {

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?client_id=${process.env.UNSPLASH_ACCESS_KEY}&query=${query}&orientation=landscape`);
    if (!response.ok) {
      throw new Error(`Failed to fetch random image: ${response.statusText}`);
    }

    const data = await response.json();
    return data
  } catch (error) {
    console.error('Error fetching random image:', error);
    return null;
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

function createSlug(input) {
  const minusAccents = removeAccents(input)
  return minusAccents
    .toLowerCase()                // Convert to lowercase
    .replace(/[^\w\s-]/g, '')     // Remove special characters
    .replace(/[\s]+/g, '-')      // Replace spaces with hyphens
    .trim();                     // Trim any leading/trailing spaces
}

function convertMillis(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Convert to mm:ss format
  const formattedTime = `${minutes.toString().padStart(2, '0')}m${seconds.toString().padStart(2, '0')}s`;

  return formattedTime;
}

function convertJson(filePath) {
  // Read the Markdown file
  const markdownContent = fs.readFileSync(filePath, 'utf8');

  // Extract front matter using Gray Matter
  const { data: frontMatter, content: markdownBody } = matter(markdownContent);

  // Load the content without front matter into Cheerio
  const $ = cheerio.load(markdownBody);

  // Initialize an array to store HTML content from asides
  const htmlContainers = [];

  // Iterate over each 'aside' element
  $('aside').each((index, element) => {
    // Extract HTML content within each 'aside' element
    const htmlContent = $(element).html();

    // Store HTML content in the array
    htmlContainers.push(htmlContent);

    // Remove the 'aside' element from the main body
    $(element).remove();
  });

  // Extract content without front matter and the three dashes
  const contentWithoutFrontMatter = $('body').html().replace(/^---\n/, '');

  // Split the content into sections based on '##' tags
  const sections = contentWithoutFrontMatter.split(/\n(?=##)/);

  // Check if the last section ends with a code block
  const lastSectionIndex = sections.length - 1;
  const lastSectionContent = sections[lastSectionIndex];

  if (lastSectionContent.trim().endsWith('```')) {
    // Remove the last code block
    sections[lastSectionIndex] = lastSectionContent.replace(/```[\s\S]*$/, '');
  }

  // Organize sections into the desired JSON format
  const organizedSections = {
    sections: sections.map((section) => {
      const titleMatch = section.match(/^##\s+(.*)/);
      const title = titleMatch ? titleMatch[1] : '';
      const paragraphs = section.split('\n').slice(1).filter(paragraph => paragraph.trim() !== '');
      return { title, paragraphs };
    }),
  };

  // Pretty print the JSON
  // const prettyPrintedJSON = JSON.stringify(organizedSections, null, 2);

  // console.log('Front Matter:', frontMatter);
  // console.log('HTML Containers:', htmlContainers);
  // console.log('Organized Sections:', prettyPrintedJSON);

  return {
    head: frontMatter, asides: htmlContainers, content: organizedSections
  }
}

async function sendToChatGPT(convo, json = true) {
  const start = performance.now();

  // Prepare the request payload
  const payload = {
    messages: convo,
    temperature: 0.7,
    model: "gpt-4-1106-preview",
    // model: "gpt-3.5-turbo",
  }
  if (json)
    payload.response_format = { type: "json_object" }

  // Define the API endpoint
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const end = performance.now();
    console.log(`Total time taken: ${convertMillis(end - start)}`);
    return response.data.choices[0].message

  } catch (e) {
    console.error(e.message)
  }
}

async function extractUnplashMetadata(htmlString, featured = false) {

  // Regular expression to match the data-src attribute
  const dataSrcRegex = /data-src="([^"]+)"/;

  // Extract the data-src value using the regular expression
  let match = htmlString.match(dataSrcRegex);

  if (match && match[1]) {
    const unsplashUrl = !featured ? match[1] : htmlString;
    console.log('url:', unsplashUrl);


    // Regular expression to match Unsplash photo URLs
    const unsplashRegex = /photo-([^?]+)/;

    // Extract the photo ID using the regular expression
    match = unsplashUrl.match(unsplashRegex);

    async function getPhotoDetails(photoId) {
      try {
        const apiUrl = `https://api.unsplash.com/search/photos?query=photo-${photoId}`
        console.log(apiUrl);
        const response = await axios.get(apiUrl, {
          headers: {
            'Authorization': `Client-ID ${unsplashAPIKey}`,
          },
        });

        console.log(response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching photo details:', error.response.data);
      }
    }

    if (match && match[1]) {
      const photoId = match[1];
      console.log('id:', photoId);
      // Call the function to get photo details using async/await
      return await getPhotoDetails(photoId);
    } else {
      console.log('Unable to extract photo ID from the URL.');
    }
  } else {
    console.log('Unable to extract data-src from the HTML string.');
  }
}

