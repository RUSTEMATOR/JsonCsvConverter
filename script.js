// Function to flatten JSON
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

// Function to unflatten JSON
function unflattenJson(data) {
    const result = {};
    for (const flatKey in data) {
        const keys = flatKey.split('.');
        keys.reduce((acc, key, idx) => {
            if (idx === keys.length - 1) {
                acc[key] = data[flatKey];
            } else {
                acc[key] = acc[key] || {};
            }
            return acc[key];
        }, result);
    }
    return result;
}

// Convert JSON to CSV
function jsonToCsv(json) {
    const flattened = flattenJson(json);
    const rows = [['Key', 'Value']];
    for (const [key, value] of Object.entries(flattened)) {
        rows.push([key, value]);
    }
    return rows.map(row => row.join(',')).join('\n');
}

// Convert CSV to JSON
function csvToJson(csv) {
    const rows = csv.split('\n').map(row => row.split(','));

    // Ensure there is data in the rows
    if (rows.length <= 1) return {}; // If no data exists, return an empty object

    const headers = rows[0]; // First row contains headers
    const jsonData = rows.slice(1).map(row => {
        const obj = {};
        row.forEach((value, index) => {
            obj[headers[index]] = value;
        });
        return obj;
    });

    return jsonData;
}


// Process File Upload
function handleFileUpload(event, conversionType) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const fileContent = e.target.result;

        let result;
        if (conversionType === 'jsonToCsv') {
            const jsonData = JSON.parse(fileContent);
            result = jsonToCsv(jsonData);
        } else if (conversionType === 'csvToJson') {
            result = csvToJson(fileContent);
        }

        // Download the result
        const blob = new Blob([result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = conversionType === 'jsonToCsv' ? 'output.csv' : 'output.json';
        link.click();
    };

    reader.readAsText(file);
}
