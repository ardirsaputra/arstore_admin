const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('c:/Project/flutter/arstore_admin');

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;

    // Fix the broken replacement
    content = content.replace(/Date\(, \{ timeZone: "Asia\/Jakarta" \}\)\.toLocaleString\(/g, 'Date().toLocaleString(');
    content = content.replace(/Date\(.*?, \{ timeZone: "Asia\/Jakarta" \}\)\.toLocaleString\(/g, match => {
        // e.g. Date(r.created_at, { timeZone: "Asia/Jakarta" }).toLocaleString(
        return match.replace(', { timeZone: "Asia/Jakarta" }', '');
    });

    // Also fix any other messed up ones
    // We want Date(X).toLocaleString("id-ID") => Date(X).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
    
    // reset to original first for toLocaleString
    // Wait, the previous replacement only modified `)` which broke it. Let's just fix it manually using a better regex.
    content = content.replace(/toLocaleString\(\s*['"]id-ID['"]\s*\)/g, 'toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })');
    content = content.replace(/toLocaleString\(\s*['"]id-ID['"]\s*,\s*\{/g, 'toLocaleString("id-ID", { timeZone: "Asia/Jakarta", ');

    // But wait, the previous script might have already replaced toLocaleDateString correctly?
    // The previous script:
    // content = content.replace(/toLocaleDateString\(\s*['"]id-ID['"]\s*\)/g, 'toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })');
    // That one was safe!
    
    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log('Fixed', f);
    }
});
