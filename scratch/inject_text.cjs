const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        try {
            filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
        } catch (err) { }
    });
    return filelist;
};

const files = walkSync('d:/laragon/www/Sistem-Informasi-Asesmen/resources/js').filter(f => f.endsWith('.jsx'));

let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Split into lines for easier manipulation
    const lines = content.split('\n');
    let newLines = [];
    let modified = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        if (line.includes('overflow-x-auto') && !line.includes('Geser tabel') && !lines[i-1]?.includes('Geser tabel')) {
            // Check if there is a table tag in the next 10 lines
            let hasTable = false;
            for(let j=0; j < 10 && (i+j) < lines.length; j++) {
                if(lines[i+j].includes('<table')) {
                    hasTable = true;
                    break;
                }
            }
            
            if (hasTable) {
                const match = line.match(/^(\s*)/);
                const indent = match ? match[1] : '';
                
                newLines.push(indent + '<p className="text-[11px] sm:text-xs text-slate-500 mb-2 italic flex items-center">');
                newLines.push(indent + '    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>');
                newLines.push(indent + '    Geser tabel ke kanan/kiri untuk melihat detail selengkapnya');
                newLines.push(indent + '</p>');
                modified = true;
            }
        }
        
        newLines.push(line);
    }
    
    if (modified) {
        fs.writeFileSync(file, newLines.join('\n'));
        modifiedCount++;
        console.log('Modified: ' + file);
    }
});
console.log('Total files modified: ' + modifiedCount);
