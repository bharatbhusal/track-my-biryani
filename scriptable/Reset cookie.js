// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
const keys = ["tmb_username", "tmb_password", "tmb_auth"];

for (const key of keys) {
  if (Keychain.contains(key)) {
    Keychain.remove(key);
    console.log(`Removed: ${key}`);
  }
}

console.log("✅ Keychain reset complete.");
