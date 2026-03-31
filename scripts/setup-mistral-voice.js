/**
 * Script de setup — Créer la voix Oscar sur Mistral Voxtral TTS
 *
 * Usage :
 *   1. Place un fichier audio (MP3/WAV, 2-3 secondes) dans ce dossier
 *   2. Lance : node setup-mistral-voice.js <fichier-audio>
 *   3. Copie le VOICE_ID retourné dans les secrets Supabase
 *
 * Exemple :
 *   node setup-mistral-voice.js oscar-sample.mp3
 */

const fs = require("fs");
const path = require("path");

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "P9juxFaaGZnEk6VWkY8iGiGbYD7pH5jv";

async function createVoice(audioFilePath) {
  if (!fs.existsSync(audioFilePath)) {
    console.error(`❌ Fichier introuvable : ${audioFilePath}`);
    console.log("\n📌 Usage : node setup-mistral-voice.js <fichier-audio.mp3>");
    console.log("   Le fichier audio doit durer 2-3 secondes minimum.");
    process.exit(1);
  }

  console.log("🎙️  Création de la voix Oscar sur Mistral...\n");

  // Lire et encoder en base64
  const audioBuffer = fs.readFileSync(audioFilePath);
  const audioBase64 = audioBuffer.toString("base64");
  const fileName = path.basename(audioFilePath);

  console.log(`📁 Fichier : ${fileName} (${(audioBuffer.length / 1024).toFixed(1)} KB)`);

  // Appel API Mistral Voices
  const response = await fetch("https://api.mistral.ai/v1/audio/voices", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "oscar-voice",
      sample_audio: audioBase64,
      sample_filename: fileName,
      languages: ["fr"],
      gender: "male",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`❌ Erreur Mistral (${response.status}) :`, err);
    process.exit(1);
  }

  const voice = await response.json();

  console.log("\n✅ Voix créée avec succès !");
  console.log("━".repeat(50));
  console.log(`🆔 VOICE_ID : ${voice.voice_id || voice.id}`);
  console.log(`📛 Nom      : ${voice.name}`);
  console.log("━".repeat(50));

  console.log("\n📋 Prochaines étapes :");
  console.log("   1. Copie le VOICE_ID ci-dessus");
  console.log("   2. Va dans Supabase Dashboard > Edge Functions > Secrets");
  console.log(`   3. Ajoute : MISTRAL_VOICE_ID = ${voice.voice_id || voice.id}`);
  console.log("   4. Ajoute aussi : MISTRAL_API_KEY = <ta-clé-mistral>");
  console.log("   5. Redéploie les edge functions");
  console.log("\n🎉 C'est tout ! La voix d'Oscar est prête.");

  // Sauvegarder l'ID dans un fichier pour référence
  fs.writeFileSync(
    path.join(__dirname, "voice-id.txt"),
    `MISTRAL_VOICE_ID=${voice.voice_id || voice.id}\n`
  );
  console.log(`\n💾 ID sauvegardé dans scripts/voice-id.txt`);
}

// Test rapide de la voix
async function testVoice(voiceId) {
  console.log("\n🔊 Test de la voix...");

  const response = await fetch("https://api.mistral.ai/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "voxtral-mini-tts-2603",
      input: "Bonjour ! Je suis Oscar, votre compagnon numérique. Comment allez-vous aujourd'hui ?",
      voice_id: voiceId,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    console.log("⚠️  Test échoué, mais la voix a été créée. Vous pouvez tester plus tard.");
    return;
  }

  const result = await response.json();
  const audioBytes = Buffer.from(result.audio_data, "base64");
  const testFile = path.join(__dirname, "oscar-test-output.mp3");
  fs.writeFileSync(testFile, audioBytes);
  console.log(`✅ Audio de test sauvegardé : ${testFile}`);
  console.log("   Ouvrez ce fichier pour écouter la voix d'Oscar !");
}

// Main
async function main() {
  const audioFile = process.argv[2];

  if (!audioFile) {
    console.log("🎙️  Setup de la voix Oscar — Mistral Voxtral TTS\n");
    console.log("Usage : node setup-mistral-voice.js <fichier-audio>");
    console.log("\nExemple :");
    console.log("  node setup-mistral-voice.js oscar-sample.mp3");
    console.log("\n💡 Le fichier audio doit contenir 2-3 secondes");
    console.log("   de la voix souhaitée pour Oscar (homme, français).");
    console.log("   Vous pouvez enregistrer un échantillon avec votre micro");
    console.log("   ou utiliser un fichier existant.");
    process.exit(0);
  }

  const fullPath = path.resolve(audioFile);
  await createVoice(fullPath);

  // Lire le voice ID sauvegardé et tester
  const voiceIdFile = path.join(__dirname, "voice-id.txt");
  if (fs.existsSync(voiceIdFile)) {
    const content = fs.readFileSync(voiceIdFile, "utf-8");
    const match = content.match(/MISTRAL_VOICE_ID=(.+)/);
    if (match) {
      await testVoice(match[1].trim());
    }
  }
}

main().catch((err) => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
