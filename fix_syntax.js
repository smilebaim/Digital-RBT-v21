const fs = require('fs');

let content = fs.readFileSync('app/DashboardClient.tsx', 'utf8');

// I just want to escape double quotes ONLY inside the IDM Addon part!
// The HTML_CONTENT starts at `const HTML_CONTENT = "\n` and ends at `\n";\n`

// Let's find the start of the IDM Addon section, which starts at '<!-- Charts Row -->\n      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">'
const markerIndex = content.indexOf('<!-- Charts Row -->\\n      <div class="grid grid-cols-1');

if (markerIndex !== -1) {
    const before = content.substring(0, markerIndex);
    let after = content.substring(markerIndex);
    
    // We want to replace all " with \\" in `after`.
    // BUT we need to be careful not to escape `";` at the very end.
    
    const endMarkerIndex = after.lastIndexOf('";\n');
    if (endMarkerIndex !== -1) {
        let addonString = after.substring(0, endMarkerIndex);
        const remainder = after.substring(endMarkerIndex);
        
        // Escape all unescaped quotes. Note that some might be escaped already.
        // Actually, since I appended them literally in the last script, NONE are escaped!
        // We will just replace all `"` with `\\"`
        addonString = addonString.replace(/"/g, '\\"');
        
        content = before + addonString + remainder;
        fs.writeFileSync('app/DashboardClient.tsx', content);
        console.log("Successfully escaped quotes!");
    } else {
        console.log("Could not find end marker");
    }
} else {
    console.log("Could not find start marker");
}
