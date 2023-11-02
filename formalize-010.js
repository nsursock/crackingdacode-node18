// Import the dotenv package
require('dotenv').config();
const path = require('path');

// Set your OpenAI API key
const apiKey = process.env.OPENAI_API_KEY

// Define the prompt and article content
// const prompt = "Please make the following paragraph more formal in tone and style:";


const fs = require('fs');
const matter = require('gray-matter');

const directory = './src/blog/';

// Read the list of files in the directory
const files = fs.readdirSync(directory);

// const cheerio = require('cheerio');

function convertMillis(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Convert to mm:ss format
  const formattedTime = `${minutes.toString().padStart(2, '0')}m${seconds.toString().padStart(2, '0')}s`;

  return formattedTime;
}

async function formatSections(markdown) {
  const sectionPattern = /(## .+?\n)(.*?)(<\/aside>|<\/code>|## .+?\n|$)/gs;
  const titlePattern = /## (.+?)\n/g;
  const asidePattern = /<aside[\s\S]*?<\/aside>/g;
  const codePattern = /```[\s\S]*?```/g;
  const paragraphPattern = /(?:^|\n)(?!\n)(.*)/gm;

  const sections = markdown.match(sectionPattern);
  if (!sections) {
    return markdown;
  }

  sections.forEach(async (section) => {
    const titleMatch = section.match(titlePattern);
    if (!titleMatch) {
      return;
    }

    // formalize section title ##
    const sectionTitle = titleMatch[0] //.replace('## ', '').trim();
    const prompt = `Formalize ${sectionTitle} in approx 6 or 7 words and use headline capitalization`;
    let conversation = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt },
      { role: 'assistant', content: sectionTitle },
    ];
    const formalTitle = await sendToChatGPT(conversation)
    console.log(formalTitle);

    // get aside element
    const asideElement = section.match(asidePattern) || [];

    // // formalize paragraphs
    // const paragraphPattern = /(?:\n{2}|\b\n)(.+?)(?=\n{2}|\b\n|$)/gs;
    // const paragraphs = section.match(paragraphPattern) || [];
    // console.log(paragraphs.map((paragraph) => paragraph.trim()))

    // markdown = markdown.replace(titleMatch[0], formalTitle);
  });

  return markdown;
}

async function sendToChatGPT(convo) {
  // Prepare the request payload
  const payload = {
    messages: convo,
    //  max_tokens: 1000,  // Adjust the token limit as needed
    model: "gpt-3.5-turbo",
  };

  // Define the API endpoint
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  // Send a POST request to the GPT-3 API
  const response = await fetch(apiUrl, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })


  const data = await response.json()
  // console.log(data)
  // Extract the revised article
  // const revisedArticle = data.choices[0].text;
  // console.log(data.choices[0].message);
  return data.choices[0].message


}

(async () => {
  // Process each file
  for (const file of files.slice(0, 1)) {

    const startTime = performance.now();

    // Check if the file has a .md extension
    if (file.endsWith('.md')) {
      let filePath = `${directory}/${file}`;

      // Read the MD file's content
      const mdFileContent = fs.readFileSync(filePath, 'utf8');

      // Extract front matter and content using gray-matter
      const { data, content } = matter(mdFileContent);

      // const $ = cheerio.load(content);
      // let array = []

      // // Identify and keep aside elements
      // $('aside').each((index, element) => {
      //   // You can add any logic here to store, skip, or mark the aside elements.
      //   array.push(element)
      // });

      // // Updated content without aside elements
      // const contentWithoutAside = $.html();

      const promptContent = `Formalize the following text (keep approx the number of words).
In your response only include the formalized content so I can put it into a markdown file.
    `;

      const promptTags = `here are categories:
"Art
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
World". here's an article: ${content}. 
find 5 for this article (categories should start with an uppercase letter) 
and show them in a json format only using the name 'categories' with a lowercase c letter`

      // let conversation = [
      //   { role: 'system', content: 'You are a helpful assistant.' },
      //   { role: 'user', content: promptContent },
      //   { role: 'assistant', content: content },
      //   // { role: 'user', content: promptTags },
      //   // { role: 'assistant', content: content },
      // ];

      // console.log('>> formalizing article...');
      // const articleFormal = await sendToChatGPT(conversation)
      // // console.log(articleFormal)

      const formalContent = await formatSections(content)
      return

      conversation = [
        { role: 'user', content: promptTags },
        { role: 'assistant', content: formalContent },
      ];

      console.log('>> determining tags...')
      const articleTags = await sendToChatGPT(conversation)
      console.log(articleTags)

      let tags = JSON.parse(articleTags.content).categories
      tags.push('blog')
      tags.push('featured')




      const promptFrontMatter = `Formalize "${data.title} ${data.title2}" as a title for the article 
      (7 or 8 words, include emotional and uncommon words in this title, title should be a question). 
      Formalize the ${data.description} (150 characters). 
      Modify the front matter of the MD file as follows (don't remove the 3 dashes at the start and end): 
      ---
      title: title you generated 
      description: description you generated without the last punctuation character
      author: ${data.author}
      date: ${new Date(data.date).toISOString().slice(0, -5) + 'Z'}
      featured: ${data.featured}
      tags: ${tags} should be an array
      layout: ${data.layout}
      track: ${data.track}
      versions: ${JSON.stringify(data.versions)} should be a list of artist and link in yaml
      ---
      `

      conversation = [
        { role: 'user', content: promptFrontMatter },
        // { role: 'assistant', content: content },
      ];

      console.log('>> modifying frontmatter...')
      const articleFM = await sendToChatGPT(conversation)
      // console.log(articleFM)

      filePath = './src/formal/' + path.basename(filePath); // Replace with the actual file path
      const contentToWrite = articleFM.content + '\n' + articleFormal.content
      // console.log(filePath)

      try {
        fs.writeFileSync(filePath, contentToWrite, 'utf-8');
        console.log(`Content has been successfully written to ${filePath}`);
      } catch (err) {
        console.error('Error writing to the file:', err);
      }

      const endTime = performance.now();

      const elapsedTime = endTime - startTime;
      console.log(`Elapsed time: ${convertMillis(elapsedTime)}`);

    }
  }

})();