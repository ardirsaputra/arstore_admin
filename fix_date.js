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
let changedCount = 0;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;

    content = content.replace(/toLocaleDateString\(\s*['"]id-ID['"]\s*\)/g, 'toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })');
    content = content.replace(/toLocaleDateString\(\s*['"]id-ID['"]\s*,\s*\{/g, 'toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", ');
    
    // For toLocaleString on dates:
    content = content.replace(/Date\([^)]*\)\.toLocaleString\(\s*['"]id-ID['"]\s*\)/g, match => {
        return match.replace(/\)/, ', { timeZone: "Asia/Jakarta" })');
    });

    content = content.replace(/Date\([^)]*\)\.toLocaleString\(\s*['"]id-ID['"]\s*,\s*\{/g, match => {
        return match.replace(/\{/, '{ timeZone: "Asia/Jakarta", ');
    });

    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log('Updated', f);
        changedCount++;
    }
});
console.log('Total files changed:', changedCount);
