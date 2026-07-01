const XLSX = require("xlsx");

// ─── Paths ───────────────────────────────────────────────────────────────────
const INPUT_FILE  = "C:/Users/HP/Downloads/hapams-complete/2025_CSE.xlsx";
const OUTPUT_FILE = "C:/Users/HP/Downloads/hapams-complete/Cleaned_Result.xlsx";

// ─── Read Excel file ──────────────────────────────────────────────────────────
console.log(`Reading file: ${INPUT_FILE}`);
const workbook = XLSX.readFile(INPUT_FILE);

// ─── Process each sheet ───────────────────────────────────────────────────────
workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to 2D array (header: 1 = raw array mode)
    const data = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
    });

    if (data.length === 0) {
        console.log(`Sheet "${sheetName}" is empty, skipping.`);
        return;
    }

    const header = data[0];
    console.log(`Sheet "${sheetName}": ${data.length - 1} data rows before cleaning.`);

    // Remove rows where BOTH S.No (col 0) and Register No (col 1) are empty
    const cleanedData = [
        header,
        ...data.slice(1).filter((row) => {
            const sno     = String(row[0]).trim();
            const regNo   = String(row[1]).trim();
            return !(sno === "" && regNo === "");
        }),
    ];

    console.log(`Sheet "${sheetName}": ${cleanedData.length - 1} rows after cleaning.`);

    // Replace the sheet with the cleaned version
    workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(cleanedData);
});

// ─── Save cleaned workbook ────────────────────────────────────────────────────
XLSX.writeFile(workbook, OUTPUT_FILE);
console.log(`\n✅ Cleaning complete! Saved to: ${OUTPUT_FILE}`);