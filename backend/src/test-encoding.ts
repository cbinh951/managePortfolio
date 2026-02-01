
import dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const FILES = {
    PORTFOLIOS: 'portfolios.csv',
};
const DATA_DIR = path.resolve(__dirname, '../data');

function testEncoding() {
    const filename = FILES.PORTFOLIOS;
    const filePath = path.join(DATA_DIR, filename);

    if (!fs.existsSync(filePath)) {
        console.log('File not found');
        return;
    }

    console.log('--- Reading with XLSX.readFile (Old Method) ---');
    const workbookOld = XLSX.readFile(filePath, { type: 'file', raw: true });
    const sheetNameOld = workbookOld.SheetNames[0];
    const dataOld: any[] = XLSX.utils.sheet_to_json(workbookOld.Sheets[sheetNameOld], { raw: false });
    const brokenItem = dataOld.find(p => p.name.includes('VÃNG'));
    if (brokenItem) {
        console.log('Found broken item (Old):', brokenItem.name);
    } else {
        console.log('No obviously broken item found with old method (or name changed).');
        // Print entries with VANG-like names
        console.log('Entries containing "V":', dataOld.filter(p => p.name.includes('V')).map(p => p.name));
    }


    console.log('\n--- Reading with fs.readFileSync + XLSX.read (New Method) ---');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const workbookNew = XLSX.read(fileContent, { type: 'string', raw: true });
    const sheetNameNew = workbookNew.SheetNames[0];
    const dataNew: any[] = XLSX.utils.sheet_to_json(workbookNew.Sheets[sheetNameNew], { raw: false });

    // Check for correct Vietnamese characters
    // VÃNG -> VÀNG
    // HÃNG -> HÀNG
    // THÃNG -> THÁNG
    const fixedItem = dataNew.find(p => p.name.includes('VÀNG') || p.name.includes('Vang'));
    if (fixedItem) {
        console.log('Found fixed item (New):', fixedItem.name);
    } else {
        console.log('Entries containing "V":', dataNew.filter(p => p.name.includes('V')).map(p => p.name));
    }
}

testEncoding();
