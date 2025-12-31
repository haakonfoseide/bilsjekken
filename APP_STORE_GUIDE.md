# Guide for App Store-eksport

## Forberedelser

### 1. Installer EAS CLI
```bash
npm install -g eas-cli
```

### 2. Logg inn på Expo
```bash
eas login
```

### 3. Konfigurer prosjektet
```bash
eas build:configure
```

## Bygge for iOS App Store

### 1. Bygg produksjonsversjon
```bash
npm run build:ios
```

Eller for lokal bygging (krever Xcode):
```bash
npm run build:ios:local
```

### 2. Følg build-prosessen
- Build vil kjøre på Expo's server (eller lokalt hvis du bruker `--local`)
- Du vil få en QR-kode og link til build-status
- Vent til build er ferdig (kan ta 10-30 minutter)

### 3. Last opp til App Store
Når build er ferdig:
```bash
npm run submit:ios
```

Dette vil:
- Spørre om Apple ID og app-specific password
- Eller bruke App Store Connect API-nøkkel hvis konfigurert
- Laste opp build til App Store Connect

## Alternativ: Manuell opplasting

Hvis du foretrekker å laste opp manuelt:

1. Last ned `.ipa`-filen fra EAS build-siden
2. Åpne **Transporter** (fra Mac App Store) eller **Xcode**
3. Logg inn med din Apple Developer-konto
4. Last opp `.ipa`-filen

## Før du sender inn til App Store

### 1. Sjekk at alt er riktig i App Store Connect
- [ ] App-navn og beskrivelse
- [ ] Skjermbilder (kreves for App Store)
- [ ] App Store-ikon
- [ ] Privacy Policy URL (hvis appen samler inn data)
- [ ] Kategorier og nøkkelord

### 2. Test build lokalt først (anbefalt)
```bash
# Bygg preview-versjon
eas build --platform ios --profile preview

# Installer på simulator eller fysisk enhet
```

### 3. Versjonsnummer
Oppdater versjonsnummer i `app.json`:
```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1"
    }
  }
}
```

## Viktige notater

- **Bundle Identifier**: `app.bilsjekken2` (sjekk at dette er unikt og registrert i Apple Developer)
- **Versjonsnummer**: Må økes for hver ny build
- **Build Number**: Må økes for hver ny versjon
- **Privacy**: Appen bruker kamera og foto-bibliotek, så du må fylle ut Privacy Policy i App Store Connect

## Feilsøking

### Build feiler
- Sjekk at alle dependencies er installert
- Sjekk at `app.json` er gyldig JSON
- Se build-loggene på EAS dashboard

### Submit feiler
- Sjekk at du har riktig tilgang i App Store Connect
- Sjekk at appen er opprettet i App Store Connect
- Verifiser at bundle identifier matcher

## Neste steg etter opplasting

1. Gå til [App Store Connect](https://appstoreconnect.apple.com)
2. Velg appen din
3. Gå til "TestFlight" for å teste før lansering
4. Eller gå til "App Store" for å sende inn til review

## Ressurser

- [EAS Build dokumentasjon](https://docs.expo.dev/build/introduction/)
- [EAS Submit dokumentasjon](https://docs.expo.dev/submit/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com)

