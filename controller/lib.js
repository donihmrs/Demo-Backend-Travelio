const lib = {}

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
  
module.exports = lib;