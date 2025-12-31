# Xcode Quick Start Guide

## 🚀 Rask start for Xcode-eksport

### 1. Åpne prosjektet i Xcode
```bash
open ios/BilSjekken.xcworkspace
```
**VIKTIG:** Bruk alltid `.xcworkspace`, aldri `.xcodeproj`!

### 2. Første gang setup

#### A. Installer CocoaPods (hvis ikke allerede gjort)
```bash
cd ios
pod install
cd ..
```

#### B. Konfigurer Signing i Xcode
1. Åpne Xcode
2. Velg "BilSjekken" prosjektet i venstre sidebar
3. Velg "BilSjekken" target
4. Gå til "Signing & Capabilities" tab
5. Huk av "Automatically manage signing"
6. Velg ditt Apple Developer Team
7. Xcode vil automatisk generere provisioning profile

### 3. Bygg og kjør

#### For Simulator:
1. Velg en simulator (f.eks. "iPhone 15 Pro") i toppen
2. Trykk `Cmd + R` eller klikk Play-knappen
3. Vent til appen bygges og starter

#### For Fysisk Enhet:
1. Koble til iPhone/iPad via USB
2. Velg enheten i Xcode
3. Tillat utvikler-tilgang på enheten (første gang)
4. Trykk `Cmd + R` for å bygge og installere

### 4. Archive for App Store

1. Velg "Any iOS Device" som target (ikke simulator)
2. Product → Archive
3. Vent til archive er ferdig
4. Window → Organizer åpnes automatisk
5. Velg archive og klikk "Distribute App"
6. Følg guiden for å laste opp til App Store Connect

## ⚙️ Viktige innstillinger

### Bundle Identifier
- Nåværende: `app.bilsjekken2`
- Endre i: Xcode → Target → General → Bundle Identifier
- Eller i: `app.json` → `ios.bundleIdentifier`

### Versjonsnummer
- Version: `1.0.0` (i `app.json`)
- Build: `1` (i `app.json`)
- Øk build number for hver ny build

### Environment Variables
For produksjon, sett disse i Xcode:
- `EXPO_PUBLIC_RORK_API_BASE_URL` - Backend URL
- `EXPO_PUBLIC_VEGVESEN_API_KEY` - Vegvesenet API key (hvis nødvendig)

## 🔧 Vanlige problemer og løsninger

### "No such module 'Expo'"
```bash
cd ios
pod install
cd ..
```

### Build feiler med "Command PhaseScriptExecution failed"
1. Clean build folder: Product → Clean Build Folder (`Cmd + Shift + K`)
2. Prøv igjen

### Signing errors
1. Gå til Signing & Capabilities
2. Velg riktig Team
3. La Xcode automatisk fikse provisioning

### Metro bundler starter ikke
I en separat terminal:
```bash
npm start
# Eller
npx expo start
```

## 📝 Sjekkliste før produksjon

- [ ] Bundle Identifier er registrert i Apple Developer
- [ ] Versjonsnummer er oppdatert
- [ ] Environment variables er satt for produksjon
- [ ] Testet på fysisk enhet
- [ ] Alle funksjoner fungerer
- [ ] App Store Connect er konfigurert
- [ ] Skjermbilder er klare
- [ ] Privacy Policy URL er satt

## 📚 Mer informasjon

Se `XCODE_EXPORT_CHECKLIST.md` for detaljert guide.

