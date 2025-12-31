# Xcode Export Checklist

## ✅ Forberedelser fullført

### Konfigurasjon
- [x] `app.json` er konfigurert med iOS-innstillinger
- [x] Bundle Identifier: `app.bilsjekken2`
- [x] Build Number: `1`
- [x] Version: `1.0.0`
- [x] Privacy-beskrivelser er på norsk
- [x] Encryption-deklarasjon er satt (`ITSAppUsesNonExemptEncryption: false`)

### Kode
- [x] Alle TypeScript-feil er fikset
- [x] Ingen linter-feil
- [x] Type-sikkerhet er forbedret
- [x] Native prosjekter er generert (`ios/` og `android/`)

### Assets
- [x] App-ikon: `assets/images/icon.png`
- [x] Splash screen: `assets/images/splash-icon.png`
- [x] Adaptive icon: `assets/images/adaptive-icon.png`

## 📋 Før du åpner i Xcode

### 1. Environment Variables
Opprett `.env`-fil (se `.env.example`):
```bash
EXPO_PUBLIC_VEGVESEN_API_KEY=din_api_nøkkel
EXPO_PUBLIC_RORK_API_BASE_URL=https://din-backend-url.com/api
```

### 2. Sjekk at CocoaPods er oppdatert
```bash
cd ios
pod install
```

## 🚀 Åpne i Xcode

```bash
cd ios
open BilSjekken.xcworkspace
```

**Viktig:** Bruk `.xcworkspace`, ikke `.xcodeproj`!

## ⚙️ Konfigurer i Xcode

### 1. Signing & Capabilities
- Velg prosjektet i venstre sidebar
- Velg "BilSjekken" target
- Gå til "Signing & Capabilities"
- Velg din **Team** (Apple Developer-konto)
- Sjekk at Bundle Identifier er `app.bilsjekken2`

### 2. Build Settings (valgfritt)
- **iOS Deployment Target:** 12.0 (satt i Info.plist)
- **Swift Version:** Sjekk at den matcher prosjektet

## 🏗️ Bygge i Xcode

### For Testing
1. Velg simulator eller fysisk enhet
2. Trykk ▶️ eller `Cmd + R`
3. Vent til build er ferdig

### For App Store
1. Velg "Any iOS Device" eller "Generic iOS Device"
2. Gå til **Product → Archive**
3. Når archive er ferdig, velg **Distribute App**
4. Følg guiden for App Store Connect

## ⚠️ Vanlige Problemer

### "No such module 'ExpoModulesCore'"
```bash
cd ios
pod install
```

### "Code signing error"
- Sjekk at du har valgt riktig Team
- Sjekk at Bundle Identifier er unikt og registrert

### "Backend not found"
- Sjekk at backend kjører eller at `EXPO_PUBLIC_RORK_API_BASE_URL` er satt
- For lokal testing: start backend i en annen terminal

## 📝 Notater

- **Backend:** Backend-koden i `backend/` mappen kjører ikke i native build. Den må kjøres separat eller deployes.
- **API Keys:** `EXPO_PUBLIC_*` variabler blir inkludert i build-en. Ikke legg sensitive data her.
- **Vegvesenet API:** Krever gyldig API-nøkkel for å fungere.

## ✅ Status

- ✅ TypeScript: Ingen feil
- ✅ Linter: Ingen feil  
- ✅ Native prosjekter: Generert
- ✅ Konfigurasjon: Komplett
- ✅ Permissions: Konfigurert
- ✅ Assets: På plass

**Klar for Xcode-eksport!** 🎉

