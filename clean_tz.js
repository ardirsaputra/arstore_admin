const fs = require('fs');
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
walk('c:/Project/flutter/arstore_admin').forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;
    // Replace duplicate timeZone
    content = content.replace(/,\s*timeZone:\s*"Asia\/Jakarta"/g, '');
    
    // Wait, the original was: { timeZone: "Asia/Jakarta",  timeZone: "Asia/Jakarta" }
    // If I replace `, timeZone: "Asia/Jakarta"`, it becomes `{ timeZone: "Asia/Jakarta" }`.
    // Let's be very specific:
    content = content.replace(/\{ timeZone: "Asia\/Jakarta",\s*timeZone: "Asia\/Jakarta"\s*\}/g, '{ timeZone: "Asia/Jakarta" }');

    // For dates that had options before, like { dateStyle: "medium", timeZone: "Asia/Jakarta" } my script might have done:
    // { timeZone: "Asia/Jakarta", dateStyle: "medium", timeZone: "Asia/Jakarta" }
    // Let's just remove any `timeZone: "Asia/Jakarta"` that appears after another one in the same object.
    
    // Simplest fix: Just run a regex to clean up duplicate exact strings:
    content = content.replace(/timeZone: "Asia\/Jakarta",\s*timeZone: "Asia\/Jakarta"/g, 'timeZone: "Asia/Jakarta"');
    
    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log('Cleaned duplicates in', f);
    }
});
