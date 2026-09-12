# Fix quiz.ts - remove misplaced calcEnemyDamage function
import re

with open('c:/Nightasaur/apps/backend/src/services/quiz.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the calcEnemyDamage that's inside generateQuestions
# Pattern: right after "const symbols = ..." line
pattern = r'(const symbols = \["＋","\+","\+","＋"\];)\s*/\*\* Calculate enemy counter-attack damage \*/\s*export function calcEnemyDamage\(enemyLevel: number, playerDef: number\): number \{[^}]*\}\s*'
replacement = r'\1'
new_content = re.sub(pattern, replacement, content)

with open('c:/Nightasaur/apps/backend/src/services/quiz.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Fixed! Removed misplaced calcEnemyDamage from inside generateQuestions")