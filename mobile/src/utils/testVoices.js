const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// usable voices
// Daniel en_GB
// Eddy
// 

// Function to get all available voices from the system
async function getAllAvailableVoices() {
  try {
    const { stdout } = await execAsync('say -v "?"');
    const voices = stdout.split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Parse the voice line format: "VoiceName language # description"
        const match = line.match(/^(\S+)\s+(.+?)\s+#\s+(.+)$/);
        if (match) {
          return {
            name: match[1],
            language: match[2].trim(),
            description: match[3].trim()
          };
        }
        return null;
      })
      .filter(voice => voice !== null);
    
    return voices;
  } catch (error) {
    console.log('Error getting voices:', error.message);
    return [];
  }
}

// Function to test a voice using macOS 'say' command
async function testVoice(voiceName, message = null) {
  const testMessage = message || `Hello, this is ${voiceName}`;
  
  try {
    console.log(`🎤 Testing voice: ${voiceName}`);
    await execAsync(`say -v "${voiceName}" "${testMessage}"`);
    console.log(`✅ Voice ${voiceName} works!`);
  } catch (error) {
    console.log(`❌ Voice ${voiceName} not available: ${error.message}`);
  }
}

// Function to list all available voices
async function listAllVoices() {
  try {
    console.log('📋 Listing all available voices...\n');
    const voices = await getAllAvailableVoices();
    
    voices.forEach((voice, index) => {
      console.log(`${index + 1}. ${voice.name} (${voice.language})`);
      console.log(`   Description: ${voice.description}`);
      console.log('');
    });
    
    console.log(`Total voices found: ${voices.length}`);
  } catch (error) {
    console.log('Error listing voices:', error.message);
  }
}

// Function to test ALL available voices on the system
async function testAllVoices() {
  console.log('🧪 Getting all available voices...\n');
  
  const voices = await getAllAvailableVoices();
  console.log(`Found ${voices.length} voices. Starting tests...\n`);
  
  for (let i = 0; i < voices.length; i++) {
    const voice = voices[i];
    console.log(`\n--- Testing ${i + 1}/${voices.length} ---`);
    console.log(`Voice: ${voice.name} (${voice.language})`);
    console.log(`Description: ${voice.description}`);
    
    await testVoice(voice.name);
    
    // Wait 3 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n✅ All voice testing completed!');
}

// Function to test a specific voice
async function testSpecificVoice(voiceId, customMessage = null) {
  await testVoice(voiceId, customMessage);
}

// Function to test only English voices
async function testEnglishVoices() {
  console.log('🇺🇸 Testing English voices only...\n');
  
  const voices = await getAllAvailableVoices();
  const englishVoices = voices.filter(voice => 
    voice.language.toLowerCase().includes('en') || 
    voice.language.toLowerCase().includes('english')
  );
  
  console.log(`Found ${englishVoices.length} English voices. Starting tests...\n`);
  
  for (let i = 0; i < englishVoices.length; i++) {
    const voice = englishVoices[i];
    console.log(`\n--- Testing English Voice ${i + 1}/${englishVoices.length} ---`);
    console.log(`Voice: ${voice.name} (${voice.language})`);
    
    await testVoice(voice.name);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n✅ English voice testing completed!');
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🎵 TTS Voice Tester');
    console.log('==================\n');
    console.log('Usage:');
    console.log('  node testVoices.js list                    - List all available voices');
    console.log('  node testVoices.js test-all               - Test ALL available voices');
    console.log('  node testVoices.js test-english           - Test only English voices');
    console.log('  node testVoices.js test <voice-name>      - Test specific voice');
    console.log('  node testVoices.js test <voice-name> "msg" - Test with custom message\n');
    
    console.log('Examples:');
    console.log('  node testVoices.js test Alex');
    console.log('  node testVoices.js test Samantha "Hello world"');
    console.log('  node testVoices.js test-english');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'list':
      await listAllVoices();
      break;
      
    case 'test-all':
      await testAllVoices();
      break;
      
    case 'test-english':
      await testEnglishVoices();
      break;
      
    case 'test':
      if (args[1]) {
        const voiceId = args[1];
        const message = args[2] || null;
        await testSpecificVoice(voiceId, message);
      } else {
        console.log('❌ Please provide a voice name to test');
      }
      break;
      
    default:
      console.log('❌ Unknown command. Use: list, test-all, test-english, or test <voice-name>');
  }
}

// Run the main function
main().catch(console.error);