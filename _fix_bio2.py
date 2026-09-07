path = r'C:\Users\28916\.config\superpowers\worktrees\modulo\mysql-account-backend\server\dist\modules\auth\authRepository.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the broken updateBio (the one without backticks around SQL)
bad = ", async updateBio(userId, bio, connection) { const [result] = await connection.query(UPDATE users SET bio = ? WHERE id = ?, [bio, userId]); return result.affectedRows > 0; }"
if bad in content:
    content = content.replace(bad, "")
    print("Removed bad updateBio")
else:
    print("Bad updateBio not found")

# Verify only one updateBio remains
count = content.count("updateBio")
print(f"updateBio count: {count}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)