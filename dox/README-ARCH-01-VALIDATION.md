# Validare Arhitectură ARCH-01 - Separare Dual-Brand

## Descriere

Validarea **ARCH-01** asigură separarea completă a brandurilor în arhitectura dual-brand:
- **Interzice mixajul de branduri** într-un singur app
- **Separă aplicațiile** `ai-prompt-templates/` și `8vultus/`
- **Previne importurile cross-brand** și dependențele circulare
- **Asigură utilizarea corectă** a `BrandProvider` și configurației de brand

## Obiectiv

- **Securitate arhitecturală**: Previne contaminarea între branduri
- **Separare clară**: Fiecare aplicație folosește doar resursele sale și cele shared
- **Conformitate**: Asigură că arhitectura respectă principiile de separare
- **Mentenanță**: Facilitează dezvoltarea independentă a fiecărui brand

## Arhitectura Implementată

### 1. Structura Packages

```
packages/
├── ai-prompt-templates/     # Aplicația AI Prompt Templates
├── 8vultus/                # Aplicația 8Vultus
└── shared/                 # Resurse comune (BrandContext, types, etc.)
```

### 2. Separarea Brandurilor

| Aspect | ai-prompt-templates | 8vultus | shared |
|--------|---------------------|---------|---------|
| **Brand ID** | `ai-prompt-templates` | `8vultus` | N/A |
| **Temă** | Albastru (#3B82F6) | Violet (#8B5CF6) | Configurabil |
| **Features** | cognitive_frameworks, meaning_engineering | consciousness_mapping, expert_tier | Comune |
| **Audiență** | AI researchers, cognitive architects | Consciousness researchers, experts | N/A |

### 3. Reguli de Separare

#### ❌ **INTERZIS**
- Importuri din `ai-prompt-templates` în `8vultus`
- Importuri din `8vultus` în `ai-prompt-templates`
- Dependențe cross-brand în `package.json`
- Utilizarea directă a componentelor specifice unui brand

#### ✅ **PERMIS**
- Importuri din `shared` în ambele aplicații
- Utilizarea `BrandProvider` cu `initialBrandId` corect
- Componente comune din `shared/components`
- Hook-uri comune din `shared/hooks`

## Implementare

### Pasul 1: Validare Arhitecturală

```bash
# Validare completă
./scripts/validate-architecture.sh

# Validare rapidă
./scripts/validate-architecture.sh --quick

# Validare + corectare automată
./scripts/validate-architecture.sh --fix

# Validare + raport detaliat
./scripts/validate-architecture.sh --report --verbose
```

### Pasul 2: Validare Manuală

```bash
# Rulare directă script Node.js
node scripts/arch-01-architecture-validation.js
```

### Pasul 3: Verificare Post-Implementare

```bash
# Verifică că validarea trece
./scripts/validate-architecture.sh --quick

# Generează raport final
./scripts/validate-architecture.sh --report
```

## Reguli de Validare

### 1. Structura Packages

- ✅ Doar 3 package-uri: `ai-prompt-templates`, `8vultus`, `shared`
- ✅ Package-ul `shared` trebuie să existe și să fie configurat corect
- ❌ Nu sunt permise package-uri suplimentare

### 2. Package.json

- ✅ Numele package-ului trebuie să corespundă cu directorul
- ✅ Dependențele nu pot fi cross-brand
- ✅ Package-ul `shared` nu poate avea dependențe specifice unui brand

### 3. Importuri

- ❌ `ai-prompt-templates` nu poate importa din `8vultus`
- ❌ `8vultus` nu poate importa din `ai-prompt-templates`
- ✅ Ambele pot importa din `shared`
- ✅ Importuri locale în cadrul propriului package

### 4. BrandProvider

- ✅ Fiecare aplicație trebuie să folosească `BrandProvider`
- ✅ `initialBrandId` trebuie setat corect pentru fiecare brand
- ✅ Layout-ul trebuie să includă `data-brand` attribute

## Exemple de Implementare Corectă

### 1. Layout ai-prompt-templates

```tsx
import { BrandProvider } from '@/shared/contexts/BrandContext'
import { BRAND_IDS } from '@/shared/types/brand'

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-brand="ai-prompt-templates">
      <body>
        <BrandProvider initialBrandId={BRAND_IDS.AI_PROMPT_TEMPLATES}>
          {children}
        </BrandProvider>
      </body>
    </html>
  )
}
```

### 2. Layout 8vultus

```tsx
import { BrandProvider } from '@/shared/contexts/BrandContext'
import { BRAND_IDS } from '@/shared/types/brand'

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-brand="8vultus">
      <body>
        <BrandProvider initialBrandId={BRAND_IDS.EIGHT_VULTUS}>
          {children}
        </BrandProvider>
      </body>
    </html>
  )
}
```

### 3. Componente Shared

```tsx
// shared/components/NeuronCard.tsx
import { useBrand } from '@/shared/contexts/BrandContext'

export function NeuronCard({ neuron }) {
  const { currentBrand } = useBrand()
  
  return (
    <div className={`neuron-card ${currentBrand.id}`}>
      <h3>{neuron.title}</h3>
      <p>{neuron.summary}</p>
    </div>
  )
}
```

## Violări Comune și Soluții

### 1. BrandProvider Lipsește

**Problema**: Aplicația nu folosește `BrandProvider`
**Soluție**: Adaugă `BrandProvider` în layout cu `initialBrandId` corect

### 2. Importuri Cross-Brand

**Problema**: Import din alt brand
```tsx
// ❌ GREȘIT
import { Component } from '@/8vultus/components/Component'
```
**Soluție**: Mută componenta în `shared` sau creează o versiune locală

### 3. Dependențe Cross-Brand

**Problema**: Dependință în `package.json`
```json
// ❌ GREȘIT
{
  "dependencies": {
    "@8vultus/components": "^1.0.0"
  }
}
```
**Soluție**: Elimină dependința și folosește `shared`

### 4. Utilizare Incorectă a BrandContext

**Problema**: Nu se verifică brand-ul curent
```tsx
// ❌ GREȘIT
function Component() {
  return <div>Always show this</div>
}
```
**Soluție**: Folosește `useBrand()` pentru logică condițională

## Testare

### 1. Teste Automate

```bash
# Test complet
./scripts/validate-architecture.sh

# Test rapid
./scripts/validate-architecture.sh --quick
```

### 2. Teste Manuale

```bash
# Verifică structura
ls packages/

# Verifică BrandProvider
grep -r "BrandProvider" packages/*/app/layout.tsx
grep -r "BrandProvider" packages/*/src/app/layout.tsx

# Verifică importuri cross-brand
grep -r "8vultus" packages/ai-prompt-templates/
grep -r "ai-prompt-templates" packages/8vultus/
```

### 3. Teste de Funcționalitate

```bash
# Build ambele aplicații
cd packages/ai-prompt-templates && npm run build
cd ../8vultus && npm run build

# Verifică că nu există erori de import
npm run type-check
```

## Monitorizare și CI/CD

### 1. Hook Pre-commit

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Validare arhitectură ARCH-01..."
if ! ./scripts/validate-architecture.sh --quick; then
  echo "❌ Validarea arhitecturală a eșuat"
  echo "Rezolvă violările înainte de commit"
  exit 1
fi
echo "✅ Arhitectura validă"
```

### 2. GitHub Actions

```yaml
name: Architecture Validation
on: [push, pull_request]

jobs:
  validate-architecture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: ./scripts/validate-architecture.sh --report
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: architecture-report
          path: ARCH-01-ARCHITECTURE-REPORT-*.md
```

### 3. Script de Monitorizare

```bash
#!/bin/bash
# scripts/monitor-architecture.sh

# Verificare periodică
while true; do
  echo "$(date): Verificare arhitectură..."
  if ! ./scripts/validate-architecture.sh --quick; then
    echo "ALERTĂ: Violări arhitecturale detectate!"
    # Trimite notificare
  fi
  sleep 3600  # Verifică la fiecare oră
done
```

## Troubleshooting

### Problema 1: Validarea eșuează

```bash
# Verifică erorile
./scripts/validate-architecture.sh --verbose

# Corectează automat
./scripts/validate-architecture.sh --fix

# Verifică din nou
./scripts/validate-architecture.sh --quick
```

### Problema 2: BrandProvider nu funcționează

```bash
# Verifică că este importat corect
grep -r "BrandProvider" packages/*/app/layout.tsx

# Verifică că initialBrandId este setat
grep -r "BRAND_IDS" packages/*/app/layout.tsx
```

### Problema 3: Importuri cross-brand persistă

```bash
# Caută toate importurile cross-brand
find packages -name "*.ts" -o -name "*.tsx" | xargs grep -l "8vultus\|ai-prompt-templates"

# Corectează manual sau folosește --fix
./scripts/validate-architecture.sh --fix
```

## Conformitate și Audit

### 1. Verificare Schema

```bash
# Verifică structura completă
tree packages -I 'node_modules|.next|.git'

# Verifică package.json-urile
cat packages/*/package.json | grep -E '"name"|"dependencies"'
```

### 2. Verificare Importuri

```bash
# Scanează toate fișierele pentru importuri cross-brand
./scripts/arch-01-architecture-validation.js
```

### 3. Verificare BrandProvider

```bash
# Verifică că toate aplicațiile folosesc BrandProvider
grep -r "BrandProvider" packages/*/app/layout.tsx packages/*/src/app/layout.tsx
```

## Următorii Pași

1. **Implementare**: Rulare validare arhitecturală
2. **Corectare**: Rezolvarea violărilor detectate
3. **Testare**: Verificarea funcționalității post-corectare
4. **Monitorizare**: Implementarea validării automate în CI/CD
5. **Documentație**: Actualizarea ghidurilor de dezvoltare

## Contact și Suport

Pentru probleme sau întrebări legate de validarea arhitecturală ARCH-01:

- **Documentație**: Acest fișier README
- **Script validare**: `scripts/arch-01-architecture-validation.js`
- **Script bash**: `scripts/validate-architecture.sh`
- **Rapoarte**: Generare automată cu `--report`

---

**Notă**: Această validare asigură conformitatea cu principiile de separare a brandurilor și previne contaminarea arhitecturală între aplicații.
