import path from 'path';
import fs from 'fs';
const csv = require('csv-parser');
const enJSON = require('../merge/en-US/translation.json')
const frJSON = require('../merge/fr-FR/translation.json')

const enJSONnew = require('../new/en-US/translation.json')
const frJSONnew = require('../new/fr-FR/translation.json')
const xl = require('excel4node');

const csvFile = path.join(__dirname, 'file.csv');


const parseToTSfile = () => {
  let enObj = 'const en = {';
  let ukObj = 'const uk = {';
  let ruObj = 'const ru = {';
  let esObj = 'const es = {';

  fs.createReadStream(csvFile)
    .pipe(csv())
    .on('data', (row) => {
      const {key, en, uk, ru, es} = row;
      console.log({key, en, uk, ru, es});
      enObj += `${key}:\`${en}\`,`
      ukObj += `${key}:\`${uk}\`,`
      ruObj += `${key}:\`${ru}\`,`
      esObj += `${key}:\`${es}\`,`
    })
    .on('end', () => {
      enObj += '}; export default en;'
      ukObj += `};
      export type ITranslate = keyof typeof uk;
      
      export default uk;`
      ruObj += '}; export default ru;'
      esObj += '}; export default es;'

      fs.writeFileSync('en.ts', enObj);
      fs.writeFileSync('uk.ts', ukObj);
      fs.writeFileSync('ru.ts', ruObj);
      fs.writeFileSync('es.ts', esObj);
      console.log('CSV file successfully processed');
    });
}


const parseToJSON = () => {
  let enObj = '{';
  let frObj = '{';

  fs.createReadStream(csvFile)
    .pipe(csv())
    .on('data', (row) => {
      const {KEY, EN, FR} = row;

      enObj += `"${KEY.trim()}":\"${EN.trim()}\",`
      frObj += `"${KEY.trim()}":\"${FR.trim()}\",`
    })
    .on('end', () => {
      enObj += '}'
      frObj += `}`

      fs.writeFileSync('en-US/translation.json', enObj);
      fs.writeFileSync('fr-FR/translation.json', frObj);
      console.log('CSV file successfully processed');
    });
}

interface IFolderItem {
 [name: string]: {
  locale: string,
  str: string,
  path: string;
 }
}
const parseToIOS = () => {
  const namesFolders = {
    en: 'en.lproj', ru: 'ru.lproj', uk: 'uk.lproj', es: 'es-ES.lproj'
  };
  const pathsFolders: IFolderItem = {};

  const pathIOS = path.join(__dirname, '..', 'ios');
  if(!fs.existsSync(pathIOS)) {
    fs.mkdirSync(pathIOS)
  }
  for(let key of Object.keys(namesFolders)) {
    const p = namesFolders[key];
    const pathToFolder = path.join(__dirname, '..', 'ios', p);
    if(!fs.existsSync(pathToFolder)) {
      fs.mkdirSync(pathToFolder)
    }
    pathsFolders[key] = {
      locale: key,
      str: '',
      path: path.join(pathToFolder, 'Localizable.strings'),
    }
  }
  
  fs.createReadStream(csvFile)
  .pipe(csv())
  .on('data', (row) => {
    const {key, ...locales} = row;
   
    for(let l of Object.keys(locales)) {
      pathsFolders[l].str += `${key} = "${locales[l]}";\n`
    }
    
   
  })
  .on('end', () => {

    for(let item of Object.values(pathsFolders)) {
      fs.writeFileSync(item.path, item.str);
    }
    console.log('CSV file successfully processed');
  });
 
}

const parseToCSV = () => {
  const enObj = enJSON
  const frObj = frJSON

  let str = `key,en,fr,\n`;

  Object.keys(enObj)
  .forEach((key, index) => {
   // str += `${index + 1},"""${key}"": ""${enObj[key].trim()}"",",${key}, ${enObj[key].trim()}, ${enObj[key].trim()}, ${frObj[key].trim()},\n`
    str += `${key},${enObj[key]},${frObj[key]},\n`
  });


  fs.writeFileSync(path.join(__dirname, '../merge/', 'parse.csv'), str);
};


const parseToExcel = () => {
  var wb = new xl.Workbook();

  var ws = wb.addWorksheet('Sheet 1');

  const enObj = enJSON
  const frObj = frJSON



  ws.cell(1, 1)
    .string('ID')

  ws.cell(1, 2)
    .string('CODE')

  ws.cell(1, 3)
      .string('KEY')

  ws.cell(1, 4)
  .string('EN')

  ws.cell(1, 5)
      .string('FR')

  Object.keys(enObj)
  .forEach((key, index) => {

    const number = index + 2;
  ws.cell(number, 1)
  .string((index + 1).toString())

  ws.cell(number, 2)
    .string(`"${key}": "${enObj[key]}",`)

  ws.cell(number, 3)
    .formula(`REGEXREPLACE(LEFT(B${number};LEN(B${number})-(LEN(B${number})-SEARCH(":";B${number};1)+1));"[;,""]";"")`)

   ws.cell(number, 4)
      .formula(`REGEXREPLACE(RIGHT(B${number};LEN(B${number})-SEARCH(":";B${number};1));"[.;,""]";"")`)


  ws.cell(number, 5)
  .string(frObj[key])
  });

  wb.write('Excel.xlsx');
};


const mergeFiles = () => {
  const mergeEn = {};
  const mergeFR = {};

  fs.createReadStream(path.join(__dirname, '../old/', 'file.csv'))
  .pipe(csv())
  .on('data', (row) => {
    const {key, en, fr} = row;
    mergeEn[key] = en;
    mergeFR[key] = fr;
    console.log(key);
    
  })
  .on('end', () => {
    console.log('end');
    
    Object.keys(enJSONnew)
    .forEach(key => {
      mergeEn[key] = enJSONnew[key];
      mergeFR[key] = frJSONnew[key] ?? '?????';
    });

    fs.writeFileSync(path.join(__dirname, '../merge/en-US', 'translation.json'), JSON.stringify(mergeEn));
    fs.writeFileSync(path.join(__dirname, '../merge/fr-FR', 'translation.json'), JSON.stringify(mergeFR));
  });
}

const parseCardinal = () => {
  const arr = [];
  fs.createReadStream(csvFile)
    .pipe(csv())
    .on('data', (row) => {
      const {aptCode,buildingBlock,aptNo,floor,type,noOfRooms,netSurface,balconySurface,totalSurface,price,parkingSlot} = row;
      row.status = 'available'
      arr.push(row);
    })
    .on('end', () => {
     
      fs.writeFileSync('cardinal.json', JSON.stringify(arr));
      console.log('CSV file successfully processed');
    });
}
//parseToIOS();
parseToJSON();