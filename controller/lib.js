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

lib.convertGmtToTimezone = (tz) => {
  let timezone = ""
  switch (tz) {
      case "ETC/GMT+0":
          timezone = "Africa/Abidjan"
          break;
      case "ETC/GMT+1":
          timezone = "Europe/Paris"
          break;
      case "ETC/GMT+2":
          timezone = "Europe/Athens"
          break;
      case "ETC/GMT+3":
          timezone = "Europe/Istanbul"
          break;
      case "ETC/GMT+4":
          timezone = "Asia/Dubai"
          break;
      case "ETC/GMT+5":
          timezone = "Asia/Samarkand"
          break;
      case "ETC/GMT+6":
          timezone = "Asia/Dhaka"
          break;
      case "ETC/GMT+7":
          timezone = "Asia/Jakarta"
          break;
      case "ETC/GMT+8":
          timezone = "Asia/Singapore"
          break;
      case "ETC/GMT+9":
          timezone = "Asia/Tokyo"
          break;
      case "ETC/GMT+10":
          timezone = "Asia/Vladivostok"
          break;
      case "ETC/GMT+11":
          timezone = "Australia/Sydney"
          break;
      case "ETC/GMT+12":
          timezone = "Pacific/Majuro"
          break;
      case "ETC/GMT-0":
          timezone = "Africa/Abidjan"
          break;
      case "ETC/GMT-1":
          timezone = "Atlantic/Azores"
          break;
      case "ETC/GMT-2":
          timezone = "America/Noronha"
          break;
      case "ETC/GMT-3":
          timezone = "America/Santiago"
          break;
      case "ETC/GMT-4":
          timezone = "America/Caracas"
          break;
      case "ETC/GMT-5":
          timezone = "America/New_York"
          break;
      case "ETC/GMT-6":
          timezone = "America/Chicago"
          break;
      case "ETC/GMT-7":
          timezone = "America/Boise"
          break;
      case "ETC/GMT-8":
          timezone = "America/Los_Angeles"
          break;
      case "ETC/GMT-9":
          timezone = "America/Anchorage"
          break;
      case "ETC/GMT-10":
          timezone = "America/Adak"
          break;
      case "ETC/GMT-11":
          timezone = "Pacific/Pago_Pago"
          break;
      case "ETC/GMT-12":
          timezone = "Pacific/Pago_Pago"
          break;
      default:
          timezone = "Asia/Jakarta"
          break;
  }

  return timezone;
}

lib.getTimezonSet = () => {
  var hour = -(new Date().getTimezoneOffset() / 60)
  var convertString = String(hour);

  var strTimezone = "ETC/GMT+"+hour;
  if (convertString.match(/-/ig)) {
      strTimezone = "ETC/GMT"+hour;
  }

  return strTimezone;
}

lib.convertUtc0 = (datetime) => {
  return new Date(datetime).toISOString().replace(/T/, ' ').replace(/\..+/, '')
}

lib.daysWork = (libur = 4) => {
  const dt = new Date();
  const month = dt.getMonth();
  const year = dt.getFullYear();
  const daysInMonth = new Date(year, month, 0).getDate();

  let daysWork = 0

  switch (daysInMonth) {
    case 31:
      const add31 = libur + 1
      daysWork = daysInMonth - add31
      break;
    case 30:
      daysWork = daysInMonth - libur
      break;
    case 29:
      daysWork = daysInMonth - libur
      break;
    case 28:
      daysWork = daysInMonth - libur
      break;
    default:
      daysWork = 26
      break;
  }

  return daysWork;
}

lib.formatDateDb = (date) => {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;

  return [year, month, day].join('-');
}

lib.timeFormat = (date) => {
  var d = new Date(date),
      hours = d.getHours(),
      minutes =  d.getMinutes(),
      seconds = d.getSeconds();

  if (hours < 10) 
    hours = '0' + hours;

  if (minutes < 10) 
    minutes = '0' + minutes;

  if (seconds < 10) 
    seconds = '0' + seconds;

  return [hours, minutes, seconds].join(':');
}

lib.convertMonthToNameIndo = (month) => {
  let result = ""
  switch (month) {
    case '01':
      result = "Januari"
      break;
    case '02':
      result = "Febuari"
      break;
    case '03':
      result = "Maret"
      break;
    case '04':
      result = "April"
      break;
    case '05':
      result = "Mei"
      break;
    case '06':
      result = "Juni"
      break;
    case '07':
      result = "Juli"
      break;
    case '08':
      result = "Agustus"
      break;
    case '09':
      result = "Agustus"
      break;
    case '10':
      result = "Agustus"
      break;
    case '11':
      result = "Agustus"
      break;
    case '12':
      result = "Agustus"
      break;
  
    default:
      result = month
      break;
  }

  return result;
} 

lib.convertTimezone = (date, tzString) => {
  return new Date(date).toLocaleString('en-US', { timeZone: tzString });
}

module.exports = lib;