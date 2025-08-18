// Test ARCH-01: Mixaj de branduri
// Acest fișier ar trebui să genereze violări ARCH-01

// Violare 1: Mixaj direct de branduri
const brand = process.env.NEXT_PUBLIC_BRAND;
if (brand === 'AI_PROMPTS' && process.env.VULTUS_BRAND) {
  console.log('Mixed brands detected');
}

// Violare 2: Import cross-brand
import { VultusComponent } from '@8vultus/components';
import { AIPromptsComponent } from '@ai-prompts/components';

// Violare 3: Configurație mixtă
const config = {
  brand: process.env.NEXT_PUBLIC_BRAND,
  vultus: process.env.VULTUS_API_KEY,
  aiPrompts: process.env.AI_PROMPTS_API_KEY
};

// Violare 4: Component mixt
function MixedBrandComponent() {
  const brand = process.env.NEXT_PUBLIC_BRAND;
  if (brand === 'AI_PROMPTS') {
    return <VultusComponent />;
  }
  return <AIPromptsComponent />;
}

// Violare 5: Logică mixtă
const getBrandConfig = () => {
  if (process.env.NEXT_PUBLIC_BRAND === 'AI_PROMPTS') {
    return {
      api: process.env.AI_PROMPTS_API,
      theme: 'ai-prompts'
    };
  } else if (process.env.VULTUS_BRAND) {
    return {
      api: process.env.VULTUS_API,
      theme: 'vultus'
    };
  }
};
