const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('route.ts') || file.endsWith('route.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const routes = walkDir(path.join(__dirname, 'app', 'api'));
for (const file of routes) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('force-dynamic')) {
        content += "\nexport const dynamic = 'force-dynamic';\n";
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}
console.log('All API routes marked as force-dynamic.');
