'use strict';

var boolean = function boolean(value) {
  if (typeof value === 'string') {
    return /^(true|t|yes|y|on|1)$/i.test(value.trim());
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return false;
};

module.exports = boolean;