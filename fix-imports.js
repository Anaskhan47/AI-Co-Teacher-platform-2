const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(filePath));
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = walkDir('./backend/src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    const regex = /(import|export)\s+([\w\s{},*]+)\s+from\s+['"](\.[^'"]+)['"]/g;
    
    let modified = false;
    content = content.replace(regex, (match, p1, p2, p3) => {
        if (!p3.endsWith('.js') && !p3.endsWith('.json')) {
            modified = true;
            return `${p1} ${p2} from '${p3}.js'`;
        }
        return match;
    });

    const sideEffectRegex = /import\s+['"](\.[^'"]+)['"]/g;
    content = content.replace(sideEffectRegex, (match, p1) => {
        if (!p1.endsWith('.js') && !p1.endsWith('.json')) {
            modified = true;
            return `import '${p1}.js'`;
        }
        return match;
    });

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated imports in ${file}`);
    }
});
