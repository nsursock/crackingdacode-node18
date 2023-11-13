/**
 * Audiostack Hello World Example
 *
 * Add your API key on line 12 and run
 * node example.js
 */

// Import the library
const { Audiostack } = require('@aflr/audiostack');

// Provide your api key from the Audiostack Platform
const apiKey = process.env.AUDIOSTACK_API_KEY;

/**
 * This example demonstrates how to produce and download a file using the Audiostack API.
 */
const example = async () => {
  // Create a new instance of Audiostack
  const AS = new Audiostack(apiKey);

  // Create a script asset with our hello text
  const script = await AS.Content.Script.create({
    scriptText:
      'Congratulations on creating your first ever generated audio file with the AudioStack Javascript SDK.',
  });

  // Create a speech asset using our script and the voice "sara"
  const tts = await AS.Speech.Tts.create({
    scriptId: script.scriptId,
    voice: 'sara',
  });

  // Create a mix with our speech asset
  const mix = await AS.Production.Mix.create({
    speechId: tts.speechId,
  });

  // Encode the file to high quality mp3
  const encode = await AS.Delivery.Encoder.encodeMix({
    productionId: mix.productionId,
    preset: 'mp3_high',
  });

  // Download the file to the project directory
  const path = await encode.download();

  // Print the path to the file
  console.log(`File downloaded to: ${path}`);
};

// Run the example
example();