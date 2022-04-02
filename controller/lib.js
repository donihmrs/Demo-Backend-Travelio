const lib = {}
const fs = require('fs');
const util = require('util');
const writeFileAsync = util.promisify(fs.writeFile);

lib.range = (start,stop) => {
    const result=[];
    for (var idx=start.charCodeAt(0),end=stop.charCodeAt(0); idx <=end; ++idx){
      result.push(String.fromCharCode(idx));
    }
    return result;
};

lib.firstUppercase = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

lib.decrypDoni = (id) => {
  let dec = id
  dec = Buffer.from(dec, 'base64').toString('utf-8');
  dec = Buffer.from(dec.replace("d0N1","",dec), 'base64').toString('utf-8');
  dec = Buffer.from(dec, 'base64').toString('utf-8');
  return dec
}

lib.encrypDoni = (id) => {
  id = id.toString();
  let enc = Buffer.from(id).toString('base64');
  enc = Buffer.from(enc).toString('base64');
  enc = Buffer.from("d0N1"+enc).toString('base64');
  return enc
}

lib.writeFile = async (path,file,text) => {
  try {
    if (text == "") {
      return false
    }

    if (fs.existsSync(path+file)) {
      await fs.createReadStream(path+file).pipe(fs.createWriteStream(path+file+".backup"))
      await fs.unlinkSync(path+file);
    }

    await writeFileAsync(path+file, text); 
    return true;
  } catch(err) {
    return false;
  }
}

lib.restoreFile = async (path,file) => {
  try {
    if (path == "") {
      return false
    }

    if (fs.existsSync(path+file+".backup")) {
      if (fs.existsSync(path+file)) {
        await fs.unlinkSync(path+file);
      }
      await fs.createReadStream(path+file+".backup").pipe(fs.createWriteStream(path+file))
      await fs.unlinkSync(path+file+".backup");

      return true;
    } else {
      return false;
    }
  } catch(err) {
    return false;
  }
}

lib.responseSuccess = (data={},message) => {
  let objRes = {}
  objRes['status'] = 200
  objRes['data'] = data
  objRes['message'] = message

  return objRes
}

lib.responseError = (status,message) => {
  let objRes = {}
  objRes['status'] = status
  objRes['data'] = {}
  objRes['message'] = message

  return objRes
}

lib.dateMonth = (month) => {
  if (month.length == 1) {
    return "0"+month
  } else {
    return month
  }
}

lib.dateDay = (day) => {
  if (day.length == 1) {
    return "0"+day
  } else {
    return day
  }
}

lib.convertBahasaToId = (name) => {
  switch (name) {
    case "Baik Sekali":
      return 4;
      break;
    case "Baik":
      return 3;
      break;
    case "Cukup":
      return 2;
      break;
    case "Kurang":
      return 1;
      break;
    default:
      return 2
      break;
  }
}

lib.capitalFirstText = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = lib;