require('dotenv').config();
const path = require('path');
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
2. For each section except the introduction:
   - Formalize h2 headings.
   - Identify 1 long tail keyword (at least 4 words long) for the section.
   - Provide an image prompt for dall-e to illustrate this section with a photorealistic picture.

Please note:
- Titles should use title capitalization.
- Titles should be presented as questions and contain 7 to 8 words.
- Titles should include a mix of common, uncommon, powerful, and emotional words.
- Sections should contain 4 or 5 paragraphs.
- Paragraphs should consist of 3 or 4 sentences.

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
Find one song and 2 or 3 covers for the article in the jazz, blues, soul, pop, rock, funk, or electronic genres.

## title
Find a formal title for the article with the following characteristics:
- The title should use title capitalization.
- It should be a question and contain 10 to 12 words.
- The title should incorporate a mixture of common, uncommon, powerful, and emotional words, with the mix consisting of 20-30% common words, 10-20% uncommon words, 10-15% emotional words, and at least 1 power word.

## description
Compose a formal meta description for search engines that:
- Identifies a challenge in the article and hints at a solution.
- Response should be without explicitly mentioning 'challenge' and 'solution.'
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

// ----------------------------------------------------------------

const directory = './src/blog/';
const files = fs.readdirSync(directory);

(async () => {

  // Process each file
  for (const file of files.slice(0, 1)) {

    const startTime = performance.now();

    // Check if the file has a .md extension
    if (file.endsWith('.md')) {
      let filePath = `${directory}/${file}`;
      let json = convertJson(filePath);
      // console.log(JSON.stringify(article.content, null, 2));

      let conversation = ''
      let casualMarkdown = json.content.sections.map((section) => {
        const title = section.title === '' ? '' : `## ${section.title}`
        return '\n' + title + '\n' + (section.paragraphs.join('\n')).replace(/\n/g, '\n\n');
      }).join('\n')

      // // Front matter
      // conversation = [
      //   { role: 'system', content: 'You are an experienced music critic who has a huge record library.' },
      //   { role: 'user', content: promptRest },
      //   { role: 'assistant', content: casualMarkdown },
      // ]
      // let rest = await sendToChatGPT(conversation)
      // console.log(rest.content)

      let rest = `{
        "content": {
          "categories": ["Art", "Culture", "Entertainment", "History", "Society"],
          "keywords": ["influence of American music on global culture"],
          "music": {
            "track": "Living in America",
            "artist": "James Brown",
            "covers": ["Joe Cocker", "Green Day", "The Sounds of Blackness"]
          },
          "metadata": {
            "title": "How Has American Music Sculpted the Soundscape of the World?",
            "description": "Unveiling the profound impact of American music on global culture and its potential to address historical wounds.",
            "prompt": "a vinyl record with a blend of American flags and musical notes, symbolizing the influence of American music"
          }
        }
      }`
      console.log(rest.content)

      //   // Markdown content
      //   conversation = [
      //     { role: 'system', content: 'You are an experienced editor who takes text input and rewrites for a more formal tone.' },
      //     { role: 'user', content: promptArticle },
      //     { role: 'assistant', content: casualMarkdown },
      //   ]
      //   let article = await sendToChatGPT(conversation)
      //   console.log(article.content)


      let article = `{
        "content": {
          "sections": [
            {
              "title": "How Does America's Influence Resemble the European Renaissance?",
              "content": [
                "Recently, I perused a French publication that posited an intriguing perspective: the United States of America, much akin to an empire, has been instrumental in ushering in unparalleled progress globally. The author went so far as to suggest that America's more controversial actions would soon be eclipsed by its contributions to advancement.",
                "The Renaissance, a pivotal era in European history spanning from the 14th to the 17th century, marked a significant transition from the Middle Ages to modernity. Historically viewed as a radical departure from previous eras, contemporary historians often regard the Renaissance as a continuation of medieval traditions.",
                "Central to the Renaissance was the philosophy of humanism, grounded in Roman ideals and the revival of classical Greek thought. Such intellectual movements found expression across various fields, including the arts, architecture, politics, science, and literature, profoundly shaping the cultural landscape.",
                "The resemblance between America's impact on contemporary culture and the European Renaissance is striking, suggesting a modern iteration of this transformative period."
              ],
              "keywords": [],
              "prompt": ""
            },
            {
              "title": "How Might Mapping Empires Reveal America's Expansive Role?",
              "content": [
                "Delving into publications on civilizations and history, one's thoughts may drift to the expansive realms of the Byzantine and Persian empires. Contemplating their vast territories, parallels can be drawn to the European Union's current reach, which some may liken to that of an empire.",
                "The concept of empire, it appears, perpetually entices nations, beckoning with the promise of extensive influence and power. Yet, America's distinction lies not in territorial conquests, but rather in its cultural contributions, particularly through music.",
                "The United States has leveraged the universal language of music as a means of fostering societal harmony, in contrast to more aggressive forms of discipline. One wonders if music might possess the power to heal the wounds of past atrocities, provided there is a collective desire for reconciliation.",
                "Music's transformative power is intriguing, positing that perhaps, through its rhythms and melodies, it can offer a path to overcome historical grievances and foster a more peaceful society."
              ],
              "keywords": ["Transformative Power of American Music"],
              "prompt": "Create a photorealistic picture of a diverse group of people united by American music."
            },
            {
              "title": "Can American Innovation Pave the Way to Personal Discovery?",
              "content": [
                "A song by James Brown poignantly highlights how America has shrunk distances, with technological advancements in aviation making intercity travel effortless. This phenomenon is reminiscent of smaller nations, such as Lebanon, known for its compact geography and significant historical contributions.",
                "Lebanon, often credited with giving rise to Europe and potentially influencing America, boasts a rich legacy through the Phoenicians, who pioneered an alphabet and excelled in nautical exploration. As humanity aspires to conquer space, these historical feats of navigation and communication gain renewed relevance.",
                "Vocabulary and precision in language are essential for the next frontier: space. The passing of musical legends like Ginger Baker and Jimi Hendrix reminds us of how they expanded the lexicon of rock music, enabling a more nuanced expression of the human experience.",
                "In essence, as we strive to make strides in space exploration, we must draw upon our collective heritage of innovation and precision, much like the musical pioneers who enriched our cultural vocabulary through their artistry."
              ],
              "keywords": ["American Innovation in Space Exploration"],
              "prompt": "Create a photorealistic picture of an astronaut with a backdrop of the American flag on the moon."
            },
            {
              "title": "What Unseen Wonders Might America Unveil for the Future?",
              "content": [
                "President Kennedy's vision for America was to achieve a seemingly impossible feat: to safely land a man on the moon and bring him back to Earth. This ambition transcended mere space exploration, embodying humanity's desire for a venture free from peril.",
                "Envision a future where American ingenuity enables humanity to traverse the cosmos without suffering losses, a testament to overcoming the formidable challenges of escaping Earth's gravity and atmosphere.",
                "However, the quest for a safer world extends beyond the technicalities of space travel. It is about fostering a space-friendly environment on Earth, intertwining the concepts of space and love within the discourse of this platform.",
                "Ultimately, the dream is for space travel to resonate with the tranquility of a leisurely stroll down Main Street, transforming the voyage into a serene ballad that allows us the time to unravel the mysteries of the universe."
              ],
              "keywords": ["Fostering a Space-Friendly Environment on Earth"],
              "prompt": "Create a photorealistic picture of a peaceful town with futuristic space travel elements integrated seamlessly."
            },
            {
              "title": "Why Might America's Cultural Melange Inspire Global Renewal?",
              "content": [
                "In conclusion, America's belief in science and progress is matched by its faith in the power of music, which has captivated my affinity for the country, despite the absence of citizenship. My French and Lebanese heritage notwithstanding, I am drawn to the potentiality within America.",
                "France and Lebanon, while intriguing in their own rights, often appear to lack the pragmatic approach of America, where the artistry in music is coupled with the astuteness of production, striking a balance that avoids the discordance of a cacophonous mishap.",
                "Pledging allegiance anew to America, one cannot help but contrast the climates of Paris and Lebanon with the pragmatic ethos of America, where limited vacation time paradoxically seems conducive to breaking free from the constraints of terrestrial existence.",
                "The creation of the alphabet was a linchpin in establishing a stable society, and musicians are cognizant of the need to expand the vocabulary of their craft. America's cultural tapestry, rich with innovation and realism, invites a reimagining of the world."
              ],
              "keywords": ["America's Cultural Influence on Global Renewal"],
              "prompt": "Create a photorealistic picture of an artist painting a vibrant mural that reflects America's diverse cultural influence."
            }
          ]
        }
      }`
      console.log(article.content)

      let finalContent = await Promise.all(JSON.parse(article).content.sections.map(async (section, index) => {
        const title = index === 0 ? '' : `## ${section.title}`

        let markdown = ''
        if (index !== 0) { // skip introduction

          // const photo = await getRandomUnsplashImage(section.keywords)
          const photo = await extractUnplashMetadata(json.asides[index - 1])
          console.log(photo);

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
      const photo = await extractUnplashMetadata(json.head.featured, true)
      // const feat = await getRandomUnsplashImage(JSON.parse(rest.content).keywords)
      // const photo = await getDallEImage(JSON.parse(rest.content).metadata.prompt + ', digital art', true)
      let frontmatter = `---
    title: "${splitTitle[0]}"
    title2: "${splitTitle[1]}"
    description: "${JSON.parse(rest.content).metadata.description.replace(/"/g, '')}"
    author: Nicolas Sursock
    date: ${new Date(json.head.date).toISOString().slice(0, -5) + 'Z'}`
        // featured: ${feat.url}&auto=format&fit=crop
        // alt: ${feat.alt}
        // photographer: ${feat.user}
        + `
    featured: ${photo?.url}
    alt: ${photo?.alt}
    tags: [${JSON.parse(rest.content).categories},featured]
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

      try {
        // const filePath = `./src/formal/${file.slug}.md`
        const filePath = `./src/formal/${JSON.parse(rest.content).keywords.map(createSlug).join('-')}.md`
        fs.writeFileSync(filePath, frontmatter + finalContent.join('\n'), 'utf-8');
        console.log(`Content has been successfully written to ${filePath}`);
      } catch (err) {
        console.error('Error writing to the file:', err);
      }

      const endTime = performance.now();
      console.log(`Elapsed time: ${convertMillis(endTime - startTime)}`);
    }
  }
})();

// ----------------------------------------------------------------

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
  return input
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

