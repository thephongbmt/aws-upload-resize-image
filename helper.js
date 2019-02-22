

module.exports = {
  removeUnicode: (str) => {
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\:|\;|\'|\"|\&|\#|\[|\]|~|$|_/g, '');

    let strArr = str.split('');
    let safeArr = [];
    for (let x = 0; x < strArr.length; ++x) {
      if (['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' ', '-', '_', '.'].indexOf(strArr[x]) >= 0) {
        safeArr.push(strArr[x]);
      }
    }
    return safeArr.join('');
  },
  removeSpecialCharacters: (str) => {
    str = str.toLowerCase();
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\-|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|$|_|“|”|‘|’|…|–/g, '');
    /* tìm và thay thế các kí tự đặc biệt trong chuỗi sang kí tự - */
    // str= str.replace(/-+-/g,"-"); //thay thế 2- thành 1-
    // str = str.replace(/^\-+|\-+$/g, "");
    // cắt bỏ ký tự - ở đầu và cuối chuỗi
    return str;
  },
  getFileName: fileName => {
    if (!fileName) {
      return [];
    }
    let path = fileName.split('.');
    path = path.slice(0, path.length - 1).join('');
    return path;
  },
  getCurrentDate: (format) => {
    let array = format.split('/');
    let current = new Date();
    // month +1 because in new Date of javascript, month start at zero
    let objDate = {
      YYYY: current.getFullYear(),
      MM: current.getMonth() + 1,
      DD: current.getDate(),
    }
    //handle format date
    let stringFormat = [];
    for (let i of array) {
      stringFormat.push(objDate[i]);
    }
    return stringFormat.join('/');
  },
  titleToUrlString: function (str) {
    str = this.removeUnicode(this.removeSpecialCharacters(str)).trim().replace(/\ /g, '-');
    let x = false;
    for (let i = 0; i < str.length; i++) {
      if (str[i] == '-' && x == true) {
        str = str.replace(/\--/g, '-');
        i--;
      } else if (str[i] == '-') {
        x = true;
      } else {
        x = false;
      }
    }
    return str;
  },

  generateFileNameDestination: function (file) {
    let fileName = this.getFileName(file.originalname);
    let covertName = this.titleToUrlString(fileName);
    let destFileName = `${this.getCurrentDate('YYYY/MM/DD')}/${covertName}-${(new Date()).getTime()}.${file.extension}`;
    return destFileName;
  },
  message404: () => ({
    code: 404,
    error: {
      status: false,
      message: 'Image not found',
    }
  }),
  message500: (err) => ({
    code: 500,
    error: {
      status: false,
      message: 'Server have some thing wrong'
    }
  })
}