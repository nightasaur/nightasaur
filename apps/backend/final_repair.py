# Squad Encoding Repair Script
import os
import re

print("SQUAD ENCODING CONTRACT REPAIR")
print("=" * 60)

# Read the backup file
backup_path = 'prisma/schema.prisma.backup'
output_path = 'prisma/schema.prisma.new'

with open(backup_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("1. Original Squad model:")
print("-" * 40)

# Find Squad model
squad_pattern = r'model Squad\s*{[^}]+}'
match = re.search(squad_pattern, content, re.DOTALL)

if match:
    original_squad = match.group(0)
    print(original_squad)
else:
    print("ERROR: Squad model not found")
    exit(1)

# Check the name field
name_pattern = r'name\s+String\s+@default\("[^"]+"\)'
name_match = re.search(name_pattern, original_squad)

if name_match:
    original_name = name_match.group(0)
    print(f"\n2. Original name default: {original_name}")
    
    # Check for encoding corruption
    if '????' in original_name:
        encoding_corruption = True
        print("✓ Encoding corruption confirmed: YES")
    else:
        encoding_corruption = False
        print("Encoding corruption: NO")
else:
    print("ERROR: name field not found")
    exit(1)

# Perform the replacement
print(f"\n3. Performing encoding repair...")
print("-" * 40)

# The exact string to replace
old_text = 'name      String        @default("????蹎抆??")'
new_text = 'name      String        @default("我的小隊")'

if old_text in content:
    content = content.replace(old_text, new_text)
    print(f"✓ Replaced: {old_text}")
    print(f"  With: {new_text}")
    repaired = True
else:
    print("✗ Old text not found in content")
    repaired = False

# Write the repaired content
if repaired:
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"\n4. Repaired file saved to: {output_path}")
    
    # Verify the repair
    with open(output_path, 'r', encoding='utf-8') as f:
        new_content = f.read()
    
    match = re.search(squad_pattern, new_content, re.DOTALL)
    if match:
        repaired_squad = match.group(0)
        print("\n5. Repaired Squad model:")
        print("-" * 40)
        print(repaired_squad)
        
        # Check the name field in repaired model
        name_match = re.search(name_pattern, repaired_squad)
        if name_match:
            repaired_name = name_match.group(0)
            print(f"\n6. Repaired name default: {repaired_name}")
            
            if '我的小隊' in repaired_name:
                print("✓ Squad.name repaired: YES")
                print("\n" + "=" * 60)
                print("SQUAD ENCODING CONTRACT REPAIR COMPLETED")
            else:
                print("✗ Squad.name repaired: NO")
        else:
            print("✗ Could not find name field in repaired model")
    else:
        print("✗ Could not find Squad model in repaired file")
else:
    print("\n✗ REPAIR FAILED")

print("\n" + "=" * 60)
print("Next steps:")
print("1. Manually replace prisma/schema.prisma with prisma/schema.prisma.new")
print("2. Run prisma format, validate, generate")
print("3. Verify the repair")