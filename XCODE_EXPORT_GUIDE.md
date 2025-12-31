# Guide for Xcode Export

## Forberedelser

### 1. Sjekk at alt er konfigurert

✅ **app.json** - iOS-konfigurasjon er komplett
✅ **Info.plist** - Permissions er satt opp
✅ **Native prosjekter** - Generert med `npx expo prebuild`

### 2. Environment Variables

Opprett en `.env`-fil i prosjektets rot med:

```bash
# Vegvesenet API Key (påkrevd)
EXPO_PUBLIC_VEGVESEN_API_KEY=din_api_nøkkel

# Backend URL (hvis backend kjører separat)
EXPO_PUBLIC_RORK_API_BASE_URL=https://din-backend-url.com/api
```

**Viktig:** `EXPO_PUBLIC_*` variabler blir inkludert i build-en, så ikke legg sensitive data her.

### 3. Sjekk Assets

Sjekk at alle nødvendige bilder finnes:
- `assets/images/icon.png` - App-ikon (1024x1024)
- `assets/images/splash-icon.png` - Splash screen
- `assets/images/adaptive-icon.png` - Android adaptive icon

## Åpne i Xcode

### Metode 1: Fra Terminal
```bash
cd ios
open BilSjekken.xcworkspace
```

**Viktig:** Bruk `.xcworkspace`, ikke `.xcodeproj`!

### Metode 2: Fra Finder
1. Naviger til `ios/` mappen
2. Dobbelklikk på `BilSjekken.xcworkspace`

## Konfigurer Signing i Xcode

### 1. Velg prosjektet
- I venstre sidebar, klikk på "BilSjekken" (øverst)
- Velg "BilSjekken" target

### 2. Gå til "Signing & Capabilities"
- Velg din **Team** (Apple Developer-konto)
- Xcode vil automatisk generere en Provisioning Profile
- Sjekk at **Bundle Identifier** er `app.bilsjekken2`

### 3. Hvis du får feil
- Sjekk at du er logget inn med din Apple ID i Xcode
- Gå til Xcode → Settings → Accounts
- Legg til din Apple Developer-konto hvis nødvendig

## Bygge i Xcode

### For Testing (Simulator)
1. Velg en simulator øverst (f.eks. "iPhone 15 Pro")
2. Klikk på ▶️ (Play) eller trykk `Cmd + R`
3. Vent til appen bygges og starter

### For Device Testing
1. Koble til iPhone/iPad via USB
2. Velg enheten øverst i Xcode
3. Klikk på ▶️ (Play) eller trykk `Cmd + R`
4. Du må kanskje godkjenne enheten på telefonen

### For App Store Build
1. Velg "Any iOS Device" eller "Generic iOS Device"
2. Gå til **Product → Archive**
3. Vent til archive er ferdig
4. **Distribute App** vil åpne seg automatisk
5. Følg guiden for å laste opp til App Store Connect

## Vanlige Problemer

### "No such module 'ExpoModulesCore'"
```bash
cd ios
pod install
```

### "Command PhaseScriptExecution failed"
- Sjekk at Node.js er installert
- Prøv å rydde build: `Product → Clean Build Folder` (Shift + Cmd + K)

### "Code signing error"
- Sjekk at du har valgt riktig Team i Signing & Capabilities
- Sjekk at Bundle Identifier er unikt og registrert

### "Backend not found"
- Sjekk at backend kjører eller at `EXPO_PUBLIC_RORK_API_BASE_URL` er satt
- For lokal testing, start backend med `npm start` i en annen terminal

## Build Configuration

### Debug Build
- Brukes for testing og utvikling
- Inkluderer debugging-informasjon
- Raskere build-tid

### Release Build
- Optimalisert for produksjon
- Mindre filstørrelse
- Raskere ytelse
- Brukes for App Store

## Neste Steg

Etter at du har testet i Xcode:

1. **Test på fysisk enhet** - Sjekk at alt fungerer
2. **Bygg Archive** - Forbered for App Store
3. **Distribute** - Last opp til App Store Connect
4. **TestFlight** - Test med beta-testere
5. **Submit for Review** - Send inn til App Store

## Ressurser

- [Expo Native Builds](https://docs.expo.dev/build/introduction/)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [App Store Connect](https://appstoreconnect.apple.com)

