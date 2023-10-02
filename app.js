const express = require("express");
const multer = require("multer");
const { google } = require("googleapis");
const path = require("path");

const app = express();
const upload = multer();

const sheets = google.sheets("v4");
const auth = new google.auth.GoogleAuth({
  keyFile: "piro-service-key-file.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/" + "home.html"));
});
function parseCSVData(csvData) {
  const lines = csvData.split("\n");
  const headers = lines[0].split(",");

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j];
    }
    data.push(row);
  }
  return data;
}
app.post("/upload-csv", upload.single("csvFile"), (req, res) => {
  const csvData = req.file.buffer.toString("utf-8");
  let selectedColumns = JSON.parse(req.body.selectedColumns);

  const sheetId = JSON.parse(req.body.sheetId);
  auth
    .getClient()
    .then((client) => {
      sheets.spreadsheets.values.get(
        {
          auth: client,
          spreadsheetId: sheetId,
          range: "A1:Z1000", // Adjust the range as per your needs
        },
        (err, response) => {
          if (err) {
            console.error("The API returned an error: " + err);
            return;
          }
          const rows = response.data.values;

          // Process the CSV data and update the Google Sheet
          const parsedData = parseCSVData(csvData);

          const deselectedRows = JSON.parse(req.body.deselectedRows);

          // Filter out deselected rows
          const filteredData = parsedData.filter((row, index) => {
            if (deselectedRows.includes(index + 1)) {
              // Rows are 1-based
              return false; // Skip deselected rows
            }

            return true; // Always include the row
          });
          // console.log(filteredData)
          // Find the first available column without data
          let firstEmptyColumn = 0;
          let headerRow = [];
          if (rows && rows.length > 0) {
            headerRow = rows[0];
            for (let i = 0; i <= 26; i++) {
              if (!headerRow[i]) {
                firstEmptyColumn = i;
                break;
              }
            }
          }
          // the headers before the updation of the sheet!
          let prevHeaders = new Set(headerRow);

          // Add the selected column headers as the first row which are not earlier present in the sheet
          selectedColumns = selectedColumns.filter(
            (col) => !prevHeaders.has(col)
          );
          const dataForGoogleSheets = [];
          dataForGoogleSheets.push(selectedColumns);

          // Add the data from the CSV
          for (const row of filteredData) {
            const rowData = selectedColumns.map((col) => row[col]);
            dataForGoogleSheets.push(rowData);
          }

          // Continue with updating Google Sheet code...
          sheets.spreadsheets.values.update(
            {
              auth: client,
              spreadsheetId: sheetId,
              range: String.fromCharCode(65 + firstEmptyColumn) + "1", // Convert column index to letter and use as range (e.g., 'B1' for second column)
              valueInputOption: "RAW", // Use RAW for basic value input
              resource: {
                values: dataForGoogleSheets,
              },
            },
            (err, response) => {
              if (err) {
                console.error("The API returned an error: " + err);
                return;
              }
            }
          );

          res.json({ success: true });
        }
      );
    })
    .catch((err) => console.error("Error:", err));
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
