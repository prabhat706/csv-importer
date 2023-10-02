function parseCSVData(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j];
        }
        data.push(row);
    }

    return data;
}

document.getElementById('csvFile').addEventListener('change', function () {

    const file = this.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const content = e.target.result;
        const lines = content.split('\n');

        const selectColumnsDiv = document.getElementById('selectedColumns');
        document.getElementById('wrap').style.display = "block"
        selectColumnsDiv.innerHTML = '';

        // Populate the checkboxes
        const headers = lines[0].split(',');
        for (let i = 0; i < headers.length; i++) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `column${i}`;
            checkbox.checked = false;

            const label = document.createElement('label');
            label.htmlFor = `column${i}`;
            label.appendChild(document.createTextNode(headers[i]));

            selectColumnsDiv.appendChild(checkbox);
            selectColumnsDiv.appendChild(label);
        }
    }
    reader.readAsText(file);
})

function filterandprocessCSV() {

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = ''; // Clear previous results

    const selectedColumns = [];
    const checkboxes = document.querySelectorAll('#selectedColumns input[type="checkbox"]');
    checkboxes.forEach((checkbox, index) => {
        if (checkbox.checked) {
            const label = document.querySelector(`label[for="column${index}"]`);
            selectedColumns.push(label.textContent);
        }
    });
    if (!selectedColumns.length) {

        resultDiv.style.display = 'block'
        resultDiv.style.color = 'Red'
        resultDiv.innerHTML = 'Please select at least one column.';
        return;
    }
    const csvFile = document.getElementById('csvFile').files[0];
    const sheetId = document.getElementById('sheetId').value;
    const formData = new FormData();
    formData.append('csvFile', csvFile);
    formData.append('selectedColumns', JSON.stringify(selectedColumns));
    formData.append('sheetId', JSON.stringify(sheetId));

    const deselectedRowsInput = document.getElementById('deselectRows');
    const deselectedRows = deselectedRowsInput.value.split(',').map(row => Number(row.trim()));

    formData.append('deselectedRows', JSON.stringify(deselectedRows));

    resultDiv.style.display = 'block'
    resultDiv.style.color = 'Black'
    resultDiv.innerHTML = 'Processing...';

    // Disable the process button during processing
    document.getElementById('processButton').disabled = true;

    fetch('/upload-csv', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            resultDiv.style.color = 'Green'
            resultDiv.innerHTML = `Data imported successfully!`;
        })
        .catch(error => {

            resultDiv.style.color = 'Red'
            resultDiv.innerHTML = `Error: ${error.message}`;
        })
        .finally(() => {
            // Enable the process button after processing is complete
            document.getElementById('processButton').disabled = false;

            resultDiv.style.display = 'block'
        });
}
