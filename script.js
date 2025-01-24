// Function to flatten JSON (like the Python version)
function flattenJson(data, parentKey = '', result = {}) {
    for (const key in data) {
        const newKey = parentKey ? `${parentKey}.${key}` : key;
        if (typeof data[key] === 'object' && data[key] !== null) {
            flattenJson(data[key], newKey, result);
        } else {
            result[newKey] = data[key];
        }
    }
    return result;
}

// Function to unflatten JSON (Nested structure from flattened keys)
async function unflattenJson(data) {
    const result = {};
    for (const flatKey in data) {
        const keys = flatKey.split('.');  // Split the key by dots
        keys.reduce((acc, key, idx) => {
            if (idx === keys.length - 1) {
                acc[key] = data[flatKey];  // Set the final value at the key
            } else {
                acc[key] = acc[key] || {};  // Create nested objects if they don't exist
            }
            return acc[key];
        }, result);
    }
    return result;
}

// Function to convert flattened JSON to CSV (like Python pandas version)
function jsonToCsv(json) {
    const flattened = flattenJson(json);

    // Convert flattened JSON to an array of objects
    const rows = Object.entries(flattened).map(([key, value]) => ({
        Key: key,
        Value: value
    }));

    // Escape commas and newlines in data by wrapping values in quotes
    const csvHeader = ['Key', 'Value'];
    const csvRows = rows.map(row => {
        const value = row.Value;
        // Wrap value in quotes if it contains commas or newlines
        const escapedValue = (typeof value === 'string' && /[,\n]/.test(value))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        return `${row.Key},${escapedValue}`;
    });

    const csvContent = [csvHeader.join(',')].concat(csvRows).join('\n');
    return csvContent;
}

function csvToJson(csv) {
    // Helper function to parse CSV rows with quoted values
    const parseCsvRow = (row) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    // Split CSV into lines and process
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return {}; // No data

    const headers = parseCsvRow(lines[0]);
    const result = {};

    for (let i = 1; i < lines.length; i++) {
        const currentLine = parseCsvRow(lines[i]);
        if (currentLine.length !== headers.length) continue;

        const key = currentLine[0];
        const value = currentLine[1].replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes
        const keys = key.split('.');
        
        // Build nested structure
        keys.reduce((acc, currentKey, index) => {
            if (index === keys.length - 1) {
                acc[currentKey] = value;
            } else {
                acc[currentKey] = acc[currentKey] || {};
            }
            return acc[currentKey];
        }, result);
    }

    return result;
}

async function handleFileUpload(event, conversionType) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async function (e) {
        const fileContent = e.target.result;
        let outputData;
        let outputFileName;
        let mimeType;

        try {
             if (conversionType === 'csvToJson') {
            const jsonData = csvToJson(fileContent);
            const outputFileName = `${file.name.split('.')[0]}_converted.json`;
            
            // Create and download JSON file
            const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = outputFileName;
            link.click();
        } else if (conversionType === 'jsonToCsv') {
                // JSON to CSV conversion
                const jsonData = JSON.parse(fileContent);
                outputData = jsonToCsv(jsonData);
                outputFileName = `${file.name.split('.')[0]}_converted.csv`;
                mimeType = 'text/csv;charset=utf-8;';
                             // Create and download file
            const blob = new Blob([outputData], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = outputFileName;
            link.click();
            URL.revokeObjectURL(url);
            }


            
        } catch (error) {
            console.error('Conversion error:', error);
            alert(`Conversion failed: ${error.message}`);
        }
    };

    reader.readAsText(file);
}
