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

async function csvToJson(csv) {
    const rows = csv.split('\n').map(row => row.split(','));

    // Ensure there is data in the rows
    if (rows.length <= 1) return {}; // If no data exists, return an empty object

    const headers = rows[0]; // First row contains headers
    const flatData = rows.slice(1).reduce((acc, row) => {
        const obj = {};
        row.forEach((value, index) => {
            obj[headers[index]] = value;
        });
        const key = obj['Key']; // Get the key from 'Key' column
        const value = obj['Value']; // Get the value from 'Value' column

        if (key && value) {
            acc[key] = value; // Flatten the data as key-value pairs
        }
        return acc;
    }, {});

    // Unflatten the CSV data into a nested structure
    const result = await unflattenJson(flatData);
    return result;
}

// Process File Upload
async function handleFileUpload(event, conversionType) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async function (e) {
        const fileContent = e.target.result;

        let result;
        let outputFileName;
        if (conversionType === 'jsonToCsv') {
            const jsonData = JSON.parse(fileContent);
            result = jsonToCsv(jsonData);
            outputFileName = `${file.name.split('.')[0]}_converted.csv`;
        } else if (conversionType === 'csvToJson') {
            result = await csvToJson(fileContent);
            outputFileName = `${file.name.split('.')[0]}_converted.json`;
        }

        // Download the result
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = outputFileName;
        link.click();
    };

    reader.readAsText(file);
}
