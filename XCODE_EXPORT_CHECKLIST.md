# Xcode Export Checklist - BilSjekken

## ✅ Konfigurasjon sjekket

### app.json
- ✅ Bundle Identifier: `app.bilsjekken2`
- ✅ Version: `1.0.0`
- ✅ Build Number: `1`
- ✅ App Name: `BilSjekken`
- ✅ Orientation: Portrait
- ✅ Privacy Descriptions: Norsk beskrivelser for kamera og foto
- ✅ Encryption: `ITSAppUsesNonExemptEncryption: false`

### iOS Info.plist
- ✅ Privacy descriptions er korrekt
- ✅ URL schemes konfigurert
- ✅ Minimum iOS version: 12.0
- ✅ New Architecture enabled

### Native Prosjekter
- ✅ iOS prosjekt generert (`ios/` mappe)
- ✅ CocoaPods installert
- ✅ AppDelegate.swift opprettet
- ✅ Entitlements fil opprettet

## ⚠️ Viktige notater før Xcode-eksport

### 1. Environment Variables
Appen bruker følgende environment variables som må settes:

**For produksjon:**
```bash
EXPO_PUBLIC_RORK_API_BASE_URL=https://din-produksjons-url.com
EXPO_PUBLIC_VEGVESEN_API_KEY=din-api-nøkkel
```

**For lokal utvikling:**
Appen faller tilbake til `http://127.0.0.1:3000` hvis ingen env vars er satt.

### 2. Bundle Identifier
- Sjekk at `app.bilsjekken2` er registrert i Apple Developer Portal
- Eller endre til ditt eget bundle ID i `app.json`

### 3. Signing & Certificates
Før du bygger i Xcode:
- [ ] Åpne Xcode
- [ ] Velg prosjektet i navigatoren
- [ ] Gå til "Signing & Capabilities"
- [ ] Velg ditt Team
- [ ] Sjekk at "Automatically manage signing" er aktivert
- [ ] Xcode vil automatisk generere provisioning profiles

### 4. Build Settings
- [ ] Sjekk at Deployment Target er iOS 12.0 eller høyere
- [ ] Sjekk at Swift version er kompatibel
- [ ] Sjekk at "New Build System" er aktivert

## 📋 Steg-for-steg Xcode-eksport

### Steg 1: Åpne prosjektet i Xcode
```bash
open ios/BilSjekken.xcworkspace
```
**VIKTIG:** Bruk `.xcworkspace`, ikke `.xcodeproj`!

### Steg 2: Velg scheme og device
1. Velg "BilSjekken" scheme i toppen
2. Velg en simulator eller fysisk enhet

### Steg 3: Bygg prosjektet
- Trykk `Cmd + B` for å bygge
- Eller: Product → Build

### Steg 4: Test på simulator
- Trykk `Cmd + R` for å kjøre
- Eller: Product → Run

### Steg 5: Archive for App Store
1. Velg "Any iOS Device" som target
2. Product → Archive
3. Vent til archive er ferdig
4. Window → Organizer åpnes automatisk
5. Velg archive og klikk "Distribute App"

## 🔧 Feilsøking

### Problem: "No such module 'Expo'"
**Løsning:**
```bash
cd ios
pod install
cd ..
```

### Problem: Build feiler med signing errors
**Løsning:**
1. Gå til Signing & Capabilities i Xcode
2. Velg riktig Team
3. La Xcode automatisk fikse provisioning

### Problem: Metro bundler starter ikke
**Løsning:**
```bash
npm start
# Eller
npx expo start
```

### Problem: Appen kan ikke koble til backend
**Løsning:**
- Sjekk at `EXPO_PUBLIC_RORK_API_BASE_URL` er satt
- For lokal testing, sørg for at backend kjører
- Sjekk at URL er tilgjengelig fra enheten/simulatoren

## 📝 Før produksjonsbuild

### 1. Oppdater versjonsnummer
I `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // Øk versjon
    "ios": {
      "buildNumber": "2"  // Øk build number
    }
  }
}
```

### 2. Sjekk environment variables
Sørg for at produksjons-URLs er satt:
- Backend API URL
- Vegvesenet API key (hvis nødvendig)

### 3. Test grundig
- [ ] Test alle funksjoner
- [ ] Test på fysisk enhet
- [ ] Test på ulike iOS-versjoner
- [ ] Test offline-scenarioer

### 4. App Store Connect
- [ ] Opprett app i App Store Connect
- [ ] Last opp skjermbilder
- [ ] Fyll ut app-beskrivelse
- [ ] Legg til Privacy Policy URL
- [ ] Velg kategorier

## 🚀 Rask start

```bash
# 1. Åpne i Xcode
open ios/BilSjekken.xcworkspace

# 2. I Xcode:
# - Velg scheme: BilSjekken
# - Velg target: iPhone 15 Pro (eller annen simulator)
# - Trykk Cmd + R for å kjøre
```

## 📚 Ressurser

- [Expo iOS Build Guide](https://docs.expo.dev/build/introduction/)
- [Xcode Signing Guide](https://developer.apple.com/documentation/xcode/managing-your-team-s-signing-assets)
- [App Store Connect](https://appstoreconnect.apple.com)

