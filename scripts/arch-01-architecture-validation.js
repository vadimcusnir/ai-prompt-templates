#!/usr/bin/env node

/**
 * ARCH-01 ARCHITECTURE VALIDATION
 * 
 * Acest script validează arhitectura dual-brand:
 * - Interzice mixajul de branduri într-un singur app
 * - Separă aplicațiile ai-prompt-templates/ și 8vultus/
 * - Detectează încălcări de separare
 * - Generează raport de conformitate
 */

const fs = require('fs');
const path = require('path');

// === CONFIGURARE VALIDARE ===

const BRAND_CONFIGS = {
  'ai-prompt-templates': {
    name: 'AI Prompt Templates',
    allowedFeatures: ['cognitive_frameworks', 'meaning_engineering', 'deep_analysis'],
    forbiddenFeatures: ['expert_tier', 'consciousness_mapping'],
    allowedDependencies: ['@ai-dual-brand/shared'],
    forbiddenDependencies: ['8vultus-specific', 'ai-prompt-templates-specific'],
    allowedImports: ['@/shared', '@/components', '@/lib'],
    forbiddenImports: ['@/8vultus', '@/ai-prompt-templates']
  },
  '8vultus': {
    name: '8Vultus',
    allowedFeatures: ['consciousness_mapping', 'advanced_systems', 'expert_tier'],
    forbiddenFeatures: ['cognitive_frameworks', 'meaning_engineering'],
    allowedDependencies: ['@ai-dual-brand/shared'],
    forbiddenDependencies: ['8vultus-specific', 'ai-prompt-templates-specific'],
    allowedImports: ['@/shared', '@/components', '@/lib'],
    forbiddenImports: ['@/8vultus', '@/ai-prompt-templates']
  }
};

const SHARED_PACKAGE = 'packages/shared';
const PACKAGES_DIR = 'packages';

// === FUNCȚII UTILITARE ===

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logWarning(message) {
  console.log(`⚠️  ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
}

function logHeader(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}`);
}

// === VALIDARE ARHITECTURĂ ===

class ArchitectureValidator {
  constructor() {
    this.violations = [];
    this.warnings = [];
    this.passed = [];
  }

  // Validează structura directorului packages
  validatePackageStructure() {
    logInfo('Validare structură packages...');
    
    const packages = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Verifică că există doar cele 3 package-uri permise
    const allowedPackages = ['ai-prompt-templates', '8vultus', 'shared'];
    const unexpectedPackages = packages.filter(pkg => !allowedPackages.includes(pkg));
    
    if (unexpectedPackages.length > 0) {
      this.violations.push({
        type: 'STRUCTURE',
        message: `Package-uri neașteptate găsite: ${unexpectedPackages.join(', ')}`,
        severity: 'HIGH'
      });
    } else {
      this.passed.push('Structura packages validă');
    }

    // Verifică că shared este un package comun
    if (!packages.includes('shared')) {
      this.violations.push({
        type: 'STRUCTURE',
        message: 'Package-ul shared lipsește',
        severity: 'CRITICAL'
      });
    }

    return packages;
  }

  // Validează package.json pentru fiecare aplicație
  validatePackageJson(packageName) {
    const packagePath = path.join(PACKAGES_DIR, packageName);
    const packageJsonPath = path.join(packagePath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.violations.push({
        type: 'PACKAGE_JSON',
        message: `package.json lipsește pentru ${packageName}`,
        severity: 'HIGH'
      });
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const brandConfig = BRAND_CONFIGS[packageName];
      
      if (!brandConfig) {
        // Este package-ul shared
        this.validateSharedPackage(packageJson);
        return;
      }

      // Validează numele package-ului
      if (packageJson.name !== packageName) {
        this.violations.push({
          type: 'PACKAGE_JSON',
          message: `Numele package-ului ${packageName} nu corespunde cu numele din package.json: ${packageJson.name}`,
          severity: 'MEDIUM'
        });
      }

      // Verifică dependențele
      this.validateDependencies(packageName, packageJson.dependencies || {}, brandConfig);
      this.validateDependencies(packageName, packageJson.devDependencies || {}, brandConfig);

    } catch (error) {
      this.violations.push({
        type: 'PACKAGE_JSON',
        message: `Eroare la parsarea package.json pentru ${packageName}: ${error.message}`,
        severity: 'HIGH'
      });
    }
  }

  // Validează package-ul shared
  validateSharedPackage(packageJson) {
    if (packageJson.name !== '@ai-dual-brand/shared') {
      this.violations.push({
        type: 'SHARED_PACKAGE',
        message: `Package-ul shared trebuie să aibă numele '@ai-dual-brand/shared', găsit: ${packageJson.name}`,
        severity: 'HIGH'
      });
    }

    // Verifică că shared nu are dependențe specifice unui brand
    const allDependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {})
    };

    Object.keys(allDependencies).forEach(dep => {
      if (dep.includes('8vultus') || dep.includes('ai-prompt-templates')) {
        this.violations.push({
          type: 'SHARED_PACKAGE',
          message: `Package-ul shared nu poate avea dependențe specifice unui brand: ${dep}`,
          severity: 'CRITICAL'
        });
      }
    });
  }

  // Validează dependențele
  validateDependencies(packageName, dependencies, brandConfig) {
    Object.keys(dependencies).forEach(dep => {
      // Verifică dependențe interzise
      brandConfig.forbiddenDependencies.forEach(forbidden => {
        if (dep.includes(forbidden)) {
          this.violations.push({
            type: 'DEPENDENCIES',
            message: `Package-ul ${packageName} nu poate avea dependința interzisă: ${dep}`,
            severity: 'HIGH'
          });
        }
      });

      // Verifică dependențe cross-brand
      if (dep.includes('8vultus') && packageName === 'ai-prompt-templates') {
        this.violations.push({
          type: 'CROSS_BRAND',
          message: `Package-ul ai-prompt-templates nu poate avea dependințe 8vultus: ${dep}`,
          severity: 'CRITICAL'
        });
      }

      if (dep.includes('ai-prompt-templates') && packageName === '8vultus') {
        this.violations.push({
          type: 'CROSS_BRAND',
          message: `Package-ul 8vultus nu poate avea dependințe ai-prompt-templates: ${dep}`,
          severity: 'CRITICAL'
        });
      }
    });
  }

  // Validează importurile din cod
  validateImports(packageName) {
    const packagePath = path.join(PACKAGES_DIR, packageName);
    const brandConfig = BRAND_CONFIGS[packageName];
    
    if (!brandConfig) return; // Skip shared package

    logInfo(`Validare importuri pentru ${packageName}...`);
    
    this.scanDirectoryForImports(packagePath, packageName, brandConfig);
  }

  // Scanează directorul pentru importuri
  scanDirectoryForImports(dirPath, packageName, brandConfig) {
    if (!fs.existsSync(dirPath)) return;

    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        this.scanDirectoryForImports(fullPath, packageName, brandConfig);
      } else if (item.isFile() && this.isCodeFile(item.name)) {
        this.validateFileImports(fullPath, packageName, brandConfig);
      }
    });
  }

  // Verifică dacă fișierul este de cod
  isCodeFile(filename) {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'];
    return codeExtensions.some(ext => filename.endsWith(ext));
  }

  // Validează importurile dintr-un fișier
  validateFileImports(filePath, packageName, brandConfig) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        
        // Verifică importuri interzise
        brandConfig.forbiddenImports.forEach(forbidden => {
          if (importPath.includes(forbidden)) {
            this.violations.push({
              type: 'IMPORTS',
              message: `Fișierul ${filePath} conține import interzis: ${importPath}`,
              severity: 'HIGH',
              package: packageName
            });
          }
        });

        // Verifică importuri cross-brand
        if (importPath.includes('8vultus') && packageName === 'ai-prompt-templates') {
          this.violations.push({
            type: 'CROSS_BRAND_IMPORT',
            message: `ai-prompt-templates nu poate importa din 8vultus: ${importPath}`,
            severity: 'CRITICAL',
            file: filePath
          });
        }

        if (importPath.includes('ai-prompt-templates') && packageName === '8vultus') {
          this.violations.push({
            type: 'CROSS_BRAND_IMPORT',
            message: `8vultus nu poate importa din ai-prompt-templates: ${importPath}`,
            severity: 'CRITICAL',
            file: filePath
          });
        }
      }
    } catch (error) {
      this.warnings.push({
        type: 'FILE_READ',
        message: `Nu s-a putut citi fișierul ${filePath}: ${error.message}`,
        severity: 'LOW'
      });
    }
  }

  // Validează BrandContext și configurația
  validateBrandConfiguration() {
    logInfo('Validare configurație brand...');
    
    const sharedTypesPath = path.join(SHARED_PACKAGE, 'types/brand.ts');
    const sharedConfigsPath = path.join(SHARED_PACKAGE, 'lib/brand-configs.ts');
    
    if (!fs.existsSync(sharedTypesPath)) {
      this.violations.push({
        type: 'BRAND_CONFIG',
        message: 'Fișierul types/brand.ts lipsește din shared package',
        severity: 'CRITICAL'
      });
    }

    if (!fs.existsSync(sharedConfigsPath)) {
      this.violations.push({
        type: 'BRAND_CONFIG',
        message: 'Fișierul lib/brand-configs.ts lipsește din shared package',
        severity: 'CRITICAL'
      });
    }

    // Verifică că fiecare aplicație folosește BrandProvider corect
    this.validateBrandProviderUsage();
  }

  // Validează utilizarea BrandProvider
  validateBrandProviderUsage() {
    const packages = ['ai-prompt-templates', '8vultus'];
    
    packages.forEach(packageName => {
      const layoutPath = path.join(PACKAGES_DIR, packageName, 'src/app/layout.tsx');
      const altLayoutPath = path.join(PACKAGES_DIR, packageName, 'app/layout.tsx');
      
      const layoutFile = fs.existsSync(layoutPath) ? layoutPath : altLayoutPath;
      
      if (fs.existsSync(layoutFile)) {
        const content = fs.readFileSync(layoutFile, 'utf8');
        
        // Verifică că BrandProvider este folosit
        if (!content.includes('BrandProvider')) {
          this.warnings.push({
            type: 'BRAND_PROVIDER',
            message: `Package-ul ${packageName} nu folosește BrandProvider în layout`,
            severity: 'MEDIUM',
            file: layoutFile
          });
        }

        // Verifică că initialBrandId este setat corect
        const expectedBrandId = packageName === '8vultus' ? 'BRAND_IDS.EIGHT_VULTUS' : 'BRAND_IDS.AI_PROMPT_TEMPLATES';
        if (!content.includes(expectedBrandId)) {
          this.warnings.push({
            type: 'BRAND_PROVIDER',
            message: `Package-ul ${packageName} nu setează initialBrandId corect`,
            severity: 'MEDIUM',
            file: layoutFile
          });
        }
      }
    });
  }

  // Rulează toate validările
  runValidation() {
    logHeader('ARCH-01 ARCHITECTURE VALIDATION');
    
    // 1. Validare structură
    const packages = this.validatePackageStructure();
    
    // 2. Validare package.json pentru fiecare package
    packages.forEach(pkg => {
      this.validatePackageJson(pkg);
    });
    
    // 3. Validare importuri
    packages.forEach(pkg => {
      if (pkg !== 'shared') {
        this.validateImports(pkg);
      }
    });
    
    // 4. Validare configurație brand
    this.validateBrandConfiguration();
    
    // 5. Generează raport
    this.generateReport();
  }

  // Generează raportul final
  generateReport() {
    logHeader('RAPORT VALIDARE ARCH-01');
    
    const totalViolations = this.violations.length;
    const totalWarnings = this.warnings.length;
    const totalPassed = this.passed.length;
    
    console.log(`📊 STATISTICI VALIDARE:`);
    console.log(`   ✅ Teste trecute: ${totalPassed}`);
    console.log(`   ❌ Violări: ${totalViolations}`);
    console.log(`   ⚠️  Avertismente: ${totalWarnings}`);
    
    if (totalViolations === 0 && totalWarnings === 0) {
      logSuccess('🎉 ARHITECTURA ARCH-01 ESTE COMPLET VALIDĂ!');
      console.log('   Toate regulile de separare a brandurilor sunt respectate.');
    } else if (totalViolations === 0) {
      logWarning('⚠️  ARHITECTURA ARCH-01 ESTE VALIDĂ CU AVERTISMENTE');
      console.log('   Separarea brandurilor este implementată, dar există probleme minore.');
    } else {
      logError('❌ ARHITECTURA ARCH-01 ARE VIOLĂRI CRITICE');
      console.log('   Există probleme de separare a brandurilor care trebuie rezolvate.');
    }
    
    // Afișează violările
    if (totalViolations > 0) {
      console.log(`\n❌ VIOLĂRI DETECTATE (${totalViolations}):`);
      this.violations.forEach((violation, index) => {
        console.log(`   ${index + 1}. [${violation.severity}] ${violation.type}: ${violation.message}`);
        if (violation.file) {
          console.log(`      Fișier: ${violation.file}`);
        }
        if (violation.package) {
          console.log(`      Package: ${violation.package}`);
        }
      });
    }
    
    // Afișează avertismentele
    if (totalWarnings > 0) {
      console.log(`\n⚠️  AVERTISMENTE (${totalWarnings}):`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. [${warning.severity}] ${warning.type}: ${warning.message}`);
        if (warning.file) {
          console.log(`      Fișier: ${warning.file}`);
        }
      });
    }
    
    // Afișează testele trecute
    if (totalPassed > 0) {
      console.log(`\n✅ TESTE TRECUTE (${totalPassed}):`);
      this.passed.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test}`);
      });
    }
    
    // Recomandări
    console.log(`\n🔧 RECOMANDĂRI:`);
    if (totalViolations > 0) {
      console.log(`   1. Rezolvă toate violările critice înainte de deployment`);
      console.log(`   2. Verifică că nu există importuri cross-brand`);
      console.log(`   3. Asigură-te că fiecare aplicație folosește doar dependențele permise`);
    } else if (totalWarnings > 0) {
      console.log(`   1. Rezolvă avertismentele pentru o implementare completă`);
      console.log(`   2. Verifică că BrandProvider este folosit corect`);
    } else {
      console.log(`   1. Arhitectura este validă - poți proceda cu deployment`);
      console.log(`   2. Monitorizează pentru încălcări viitoare`);
    }
    
    console.log(`\n📚 DOCUMENTAȚIE:`);
    console.log(`   • Reguli arhitecturale: README-ARCH-01-VALIDATION.md`);
    console.log(`   • Script validare: scripts/arch-01-architecture-validation.js`);
    
    // Returnează statusul
    return {
      isValid: totalViolations === 0,
      violations: totalViolations,
      warnings: totalWarnings,
      passed: totalPassed
    };
  }
}

// === EXECUȚIE ===

if (require.main === module) {
  const validator = new ArchitectureValidator();
  const result = validator.runValidation();
  
  // Exit code bazat pe rezultat
  process.exit(result.isValid ? 0 : 1);
}

module.exports = ArchitectureValidator;
