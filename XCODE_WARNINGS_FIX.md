# Xcode Warnings Fix

## Hva er gjort

Jeg har oppdatert `ios/Podfile` for å redusere warnings fra dependencies. Dette skjuler de vanligste deprecation warnings fra tredjeparts-pakker, men beholder viktige warnings som kan indikere ekte problemer.

## Neste steg

### 1. Reinstaller pods
```bash
cd ios
pod install
cd ..
```

### 2. Clean build i Xcode
1. I Xcode: Product → Clean Build Folder (`Cmd + Shift + K`)
2. Prøv å bygge på nytt (`Cmd + B`)

### 3. Hvis det fortsatt er mange warnings

**Alternativ: Skjul alle warnings fra pods (ikke anbefalt)**
Hvis du fortsatt har for mange warnings, kan du legge til denne linjen i Podfile post_install:

```ruby
config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
```

**Merk:** Dette skjuler ALLE warnings fra dependencies, inkludert potensielt viktige. Bruk kun hvis nødvendig.

## Hva er skjult

Følgende warnings er skjult fra dependencies (ikke fra din egen kode):
- Deprecation warnings
- Documentation comment warnings
- Unused variable/function warnings
- Type conversion warnings
- Autoreleasing warnings

## Hva er beholdt

Følgende viktige warnings er fortsatt aktive:
- Unreachable code warnings
- Strict prototype warnings
- Warnings fra din egen app-kode (ikke pods)

## Resultat

Etter denne endringen bør du se betydelig færre warnings (fra ~800 til kanskje 50-100), og de fleste vil være fra din egen kode hvor de faktisk er nyttige.

