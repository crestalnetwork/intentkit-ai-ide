import React, { useState } from "react";

// Dice image mapping for casino dice rolls
const DICE_IMAGES = [
  "/images/dice-six-faces-one.png",
  "/images/dice-six-faces-two.png", 
  "/images/dice-six-faces-three.png",
  "/images/dice-six-faces-four.png",
  "/images/dice-six-faces-five.png",
  "/images/dice-six-faces-six.png",
];

interface SkillCallsSectionProps {
  skillCalls: any[];
}

const SkillCallsSection: React.FC<SkillCallsSectionProps> = ({ skillCalls }) => {
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);

  const renderSkillImages = (skill: any) => {
    let images: string[] = [];
    
    console.log('Processing skill for images:', {
      skillName: skill.name,
      hasResponse: !!skill.response,
      responseType: typeof skill.response,
      responseLength: skill.response?.length,
      responsePreview: skill.response?.substring(0, 100)
    });
    
    try {
      // Handle cases where response might be truncated with "..."
      let responseStr = skill.response || "";
      let lastValidJson = "";

      if (responseStr.includes('...')) {
        const truncationIndex = responseStr.indexOf('...');
        lastValidJson = responseStr.substring(0, truncationIndex);
        
        // Try to find the last complete JSON object
        let braceCount = 0;
        let lastCompleteIndex = -1;
        
        for (let i = 0; i < lastValidJson.length; i++) {
          if (lastValidJson[i] === '{') {
            braceCount++;
          } else if (lastValidJson[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              lastCompleteIndex = i;
            }
          }
        }
        
        if (lastCompleteIndex > -1) {
          lastValidJson = lastValidJson.substring(0, lastCompleteIndex + 1);
        }
        
        // Remove any trailing incomplete JSON
        lastValidJson = lastValidJson.replace(/,\s*$/, '');
        
        responseStr = lastValidJson;
      }

      // Try to parse the response as JSON first
      if (responseStr) {
        try {
          const parsedResponse = JSON.parse(responseStr);
          
          // Extract dice values from parsed JSON - check multiple possible formats
          const diceArrays = [
            parsedResponse.dice_values,
            parsedResponse.dice_results, // New format
            parsedResponse.result?.dice_values,
            parsedResponse.result?.dice_results
          ].filter(Boolean);
          
          diceArrays.forEach(diceArray => {
            if (Array.isArray(diceArray)) {
              console.log('Found dice array:', diceArray);
              diceArray.forEach((value: number) => {
                if (value >= 1 && value <= 6) {
                  const imagePath = DICE_IMAGES[value - 1];
                  console.log(`Adding dice image for value ${value}: ${imagePath}`);
                  images.push(imagePath);
                }
              });
            }
          });
        } catch (parseError) {
          // If JSON parsing fails, try regex extraction as fallback
          const diceMatches = responseStr.match(/"dice_(?:values|results)":\s*\[([^\]]+)\]/g);
          if (diceMatches) {
            diceMatches.forEach((match: string) => {
              const numbersMatch = match.match(/\d+/g);
              if (numbersMatch) {
                numbersMatch.forEach((num: string) => {
                  const value = parseInt(num);
                  if (value >= 1 && value <= 6) {
                    images.push(DICE_IMAGES[value - 1]);
                  }
                });
              }
            });
          }
        }
      }

      // Also check for card games or other visual elements
      if (responseStr.includes('card') || responseStr.includes('suit')) {
        // Extract playing card information if present
        try {
          const parsedResponse = JSON.parse(responseStr);
          if (parsedResponse.cards && Array.isArray(parsedResponse.cards)) {
            parsedResponse.cards.forEach((card: any) => {
              if (card.rank && card.suit) {
                // Map card to image path (if card images exist)
                const cardImage = `/images/cards/${card.rank.toLowerCase()}_of_${card.suit.toLowerCase()}.png`;
                images.push(cardImage);
              }
            });
          }
        } catch (e) {
          // Fallback for card detection in plain text
          const cardMatches = responseStr.match(/(ace|king|queen|jack|\d+)\s+of\s+(hearts|diamonds|clubs|spades)/gi);
          if (cardMatches) {
            cardMatches.forEach((cardStr: string) => {
              const [rank, , , suit] = cardStr.toLowerCase().split(' ');
              const cardImage = `/images/cards/${rank}_of_${suit}.png`;
              images.push(cardImage);
            });
          }
        }
      }
      
    } catch (error) {
      console.warn("Error processing skill response for images:", error);
    }
    
    console.log(`Skill ${skill.name} extracted images:`, images);
    return images;
  };

  // Always show images even when collapsed
  const allImages = skillCalls.flatMap(renderSkillImages);
  
  // Debug logging
  if (skillCalls.length > 0) {
    console.log('SkillCallsSection: Processing skills for images', {
      skillCallsCount: skillCalls.length,
      extractedImages: allImages,
      skillResponses: skillCalls.map(skill => ({
        name: skill.name,
        response: skill.response?.substring(0, 200) + '...' // First 200 chars
      }))
    });
  }

  return (
    <div className="mt-2 p-2 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-secondary)]">
      {/* Images - Always visible */}
      {allImages.length > 0 && (
        <div className="mb-3 p-2 bg-[var(--color-bg-primary)] rounded border border-[var(--color-neon-cyan)]">
          <div className="text-xs text-[var(--color-neon-cyan)] mb-2">🎲 Dice Roll Results:</div>
          <div className="flex flex-wrap gap-2">
            {allImages.map((imageSrc, index) => (
            <img
              key={index}
              src={imageSrc}
              alt={`Game element ${index + 1}`}
              className="w-12 h-12 rounded border-2 border-[var(--color-neon-lime)] bg-white p-1"
              onError={(e) => {
                console.warn(`Failed to load game image: ${imageSrc}`);
                e.currentTarget.style.display = 'none';
              }}
            />
            ))}
          </div>
        </div>
      )}

      {/* Skills section header with toggle */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
      >
        <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
          Skills used: {skillCalls.length}
        </span>
        <svg 
          className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform ${
            isSkillsExpanded ? 'rotate-180' : ''
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded skills details */}
      {isSkillsExpanded && (
        <div className="mt-2 space-y-2">
          {skillCalls.map((skill, index) => (
            <div key={index} className="border-l-2 border-[var(--color-neon-cyan)] pl-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-text-primary)]">
                  {skill.name}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  skill.success 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {skill.success ? 'Success' : 'Failed'}
                </span>
              </div>
              
              {skill.parameters && Object.keys(skill.parameters).length > 0 && (
                <details className="mt-1">
                  <summary className="text-xs text-[var(--color-text-tertiary)] cursor-pointer hover:text-[var(--color-text-secondary)]">
                    Parameters
                  </summary>
                  <pre className="text-xs text-[var(--color-text-secondary)] mt-1 bg-[var(--color-bg-primary)] p-2 rounded overflow-x-auto">
                    {JSON.stringify(skill.parameters, null, 2)}
                  </pre>
                </details>
              )}
              
              {skill.response && (
                <details className="mt-1">
                  <summary className="text-xs text-[var(--color-text-tertiary)] cursor-pointer hover:text-[var(--color-text-secondary)]">
                    Response
                  </summary>
                  <pre className="text-xs text-[var(--color-text-secondary)] mt-1 bg-[var(--color-bg-primary)] p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                    {skill.response}
                  </pre>
                </details>
              )}
              
              {skill.error_message && (
                <div className="mt-1">
                  <span className="text-xs text-red-400">Error: {skill.error_message}</span>
                </div>
              )}
              
              {skill.credit_cost && (
                <div className="mt-1">
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    Cost: {skill.credit_cost} credits
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillCallsSection;