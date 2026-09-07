import re

path = r'C:\Users\28916\.config\superpowers\worktrees\modulo\mysql-account-backend\server\dist\modules\auth\authRepository.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# 1. Add bio to userColumns
if 'email_normalized, bio,' not in content:
    content = content.replace(
        'email_normalized,\n  password_hash',
        'email_normalized, bio,\n  password_hash'
    )
    changes += 1
    print('1. Added bio to userColumns')

# 2. Add bio to mapUserRow
if 'bio: row.bio' not in content:
    content = content.replace(
        "email_normalized: requiredString(row.email_normalized, 'normalized email'),",
        "email_normalized: requiredString(row.email_normalized, 'normalized email'),\n    bio: row.bio ?? null,"
    )
    changes += 1
    print('2. Added bio to mapUserRow')

# 3. Add bio to mapUserToPublicUser
if 'bio: user.bio' not in content:
    content = content.replace(
        'email: user.email, createdAt:',
        'email: user.email, bio: user.bio ?? null, createdAt:'
    )
    changes += 1
    print('3. Added bio to mapUserToPublicUser')

# 4. Add bio to publicSessionColumns
if 'u.bio,' not in content:
    content = content.replace(
        'u.email, u.created_at AS user_created_at',
        'u.email, u.bio, u.created_at AS user_created_at'
    )
    changes += 1
    print('4. Added bio to publicSessionColumns')

# 5. Add bio to mapAuthenticatedSession fallback
if "bio: row.bio ?? null, createdAt:" not in content:
    content = content.replace(
        "email: requiredString(row.email, 'authenticated email'), createdAt:",
        "email: requiredString(row.email, 'authenticated email'), bio: row.bio ?? null, createdAt:"
    )
    changes += 1
    print('5. Added bio to mapAuthenticatedSession fallback')

# 6. Add updateBio method
if 'updateBio' not in content:
    pattern = "return result.affectedRows > 0; }, async updatePassword"
    replacement = "return result.affectedRows > 0; }, async updateBio(userId, bio, connection) { const [result] = await connection.query(UPDATE users SET bio = ? WHERE id = ?, [bio, userId]); return result.affectedRows > 0; }, async updatePassword"
    content = content.replace(pattern, replacement)
    changes += 1
    print('6. Added updateBio method')

if changes == 0:
    print('No changes needed (already applied)')
else:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Total changes: {changes}')