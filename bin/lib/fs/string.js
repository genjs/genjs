// defaults function for string
module.exports = function() {
    String.prototype.capitalize = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };
    String.prototype.uncapitalize = function () {
        return this.charAt(0).toLowerCase() + this.slice(1);
    };
    String.prototype.a = function () {
        return this.uncapitalize();
    };
    String.prototype.A = function () {
        return this.capitalize();
    };
    String.prototype.l = function () {
        return this.toLowerCase();
    };
    String.prototype.U = function () {
        return this.toUpperCase();
    };
    String.prototype.removeUnderscore = function () {
      if(this.indexOf('_') == -1) {
        return this;
      }
      var splitted = this.split('_');
      var str = '';
      for(var i=0; i<splitted.length; i++) {
        if(str === '') {
          str = splitted[i];
        } else {
          str += splitted[i].A();
        }
      }
      return str;
    };
    String.prototype.removeUnderscores = function () {
      this.removeUnderscore();
    };
    String.prototype.replaceAll = function (find, replace) {
        var str = this;
        return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
    };
    String.prototype.replaceAllRegExp = function (find, replace) {
        var str = this;
        return str.replace(new RegExp(find, 'g'), replace);
    };
};
